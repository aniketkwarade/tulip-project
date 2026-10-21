#!/usr/bin/env python3
"""Freeze coordinate-bound geometries for monthly CMIP6 regional routes."""

from __future__ import annotations

import gc
import hashlib
import importlib.util
import json
import os
from pathlib import Path

import numpy as np
import s3fs


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
ROUTES_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-routes.json"
EXECUTOR_PATH = ROOT / "scripts/execute-pangeo-cmip6-global-predictors.py"
OUTPUT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-grid-inventory.json"
REPORT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-grid-inventory-report.md"
GEOMETRY_ROOT = ROOT / "tmp/tulip-independent-pattern/cmip6-grid-geometries"
VERSION = "tulip_pangeo_cmip6_independent_pattern_grid_inventory_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_executor():
    spec = importlib.util.spec_from_file_location("pangeo_predictor_executor", EXECUTOR_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def coordinate_array(group, name: str, executor) -> np.ndarray:
    if name not in group:
        raise RuntimeError(f"Coordinate variable {name} is absent")
    values = executor.decode_cf_values(group[name])
    if not np.all(np.isfinite(values)):
        raise RuntimeError(f"Coordinate variable {name} contains missing values")
    return values


def inspect_store(group, executor) -> dict:
    tas = group["tas"]
    dimensions = executor.array_dimensions(tas)
    if dimensions != ["time", "lat", "lon"]:
        raise RuntimeError(f"Only one-dimensional latitude/longitude grids are admitted, got {dimensions}")
    lat = coordinate_array(group, "lat", executor)
    lon = coordinate_array(group, "lon", executor)
    if lat.ndim != 1 or lon.ndim != 1 or tas.shape[1:] != (len(lat), len(lon)):
        raise RuntimeError("Latitude/longitude coordinate shape does not match tas")
    lat_bounds_name = group["lat"].attrs.get("bounds")
    lon_bounds_name = group["lon"].attrs.get("bounds")
    if not lat_bounds_name or not lon_bounds_name:
        raise RuntimeError("Published latitude or longitude bounds attribute is absent")
    lat_bounds = coordinate_array(group, lat_bounds_name, executor)
    lon_bounds = coordinate_array(group, lon_bounds_name, executor)
    if lat_bounds.shape != (len(lat), 2) or lon_bounds.shape != (len(lon), 2):
        raise RuntimeError("Published coordinate bounds have incompatible shape")
    lat_low = np.minimum(lat_bounds[:, 0], lat_bounds[:, 1])
    lat_high = np.maximum(lat_bounds[:, 0], lat_bounds[:, 1])
    lon_width = np.abs(lon_bounds[:, 1] - lon_bounds[:, 0])
    lon_width = np.where(lon_width > 180.0, 360.0 - lon_width, lon_width)
    if np.any(lat_low < -90.000001) or np.any(lat_high > 90.000001) or np.any(lat_high <= lat_low):
        raise RuntimeError("Latitude bounds are not valid non-zero cells")
    if np.any(lon_width <= 0) or not np.isclose(float(lon_width.sum()), 360.0, rtol=0, atol=1e-5):
        raise RuntimeError("Longitude bounds do not form one global non-overlapping span")
    normalized_area = float(
        np.sum(np.abs(np.sin(np.deg2rad(lat_high)) - np.sin(np.deg2rad(lat_low))))
        * np.sum(np.deg2rad(lon_width))
    )
    if not np.isclose(normalized_area, 4 * np.pi, rtol=0, atol=1e-4):
        raise RuntimeError(f"Coordinate bounds do not cover the sphere: {normalized_area}")
    logical = hashlib.sha256()
    for array in (lat, lon, lat_bounds, lon_bounds):
        logical.update(np.asarray(array, dtype="<f8").tobytes())
    return {
        "lat": lat.astype(np.float64),
        "lon": lon.astype(np.float64),
        "latBounds": lat_bounds.astype(np.float64),
        "lonBounds": lon_bounds.astype(np.float64),
        "latBoundsVariable": lat_bounds_name,
        "lonBoundsVariable": lon_bounds_name,
        "normalizedSphereArea": normalized_area,
        "logicalSha256": logical.hexdigest(),
    }


def same_geometry(first: dict, second: dict) -> bool:
    return all(np.array_equal(first[key], second[key]) for key in ("lat", "lon", "latBounds", "lonBounds"))


def atomic_npz(path: Path, geometry: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp.npz")
    try:
        np.savez_compressed(
            temporary,
            lat=geometry["lat"],
            lon=geometry["lon"],
            lat_bounds=geometry["latBounds"],
            lon_bounds=geometry["lonBounds"],
        )
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def inspect_route(route: dict, executor) -> tuple[dict, dict | None]:
    fs = s3fs.S3FileSystem(
        anon=True,
        skip_instance_cache=True,
        config_kwargs={
            "connect_timeout": 30,
            "read_timeout": 90,
            "retries": {"max_attempts": 5, "mode": "standard"},
        },
    )
    historical = scenario = None
    try:
        historical = executor.open_group(fs, route["historical"]["zstore"])
        scenario = executor.open_group(fs, route["ssp245"]["zstore"])
        historical_geometry = inspect_store(historical, executor)
        scenario_geometry = inspect_store(scenario, executor)
        if not same_geometry(historical_geometry, scenario_geometry):
            raise RuntimeError("Historical and SSP2-4.5 coordinate bounds differ")
    except Exception as error:
        return ({
            "canonicalModel": route["canonicalModel"],
            "member": route["member"],
            "status": "grid_geometry_unresolved",
            "reason": f"{type(error).__name__}: {error}",
            "historicalZstore": route["historical"]["zstore"],
            "ssp245Zstore": route["ssp245"]["zstore"],
        }, None)
    finally:
        historical = scenario = None
        del fs
        gc.collect()
    digest = historical_geometry["logicalSha256"]
    path = GEOMETRY_ROOT / f"{digest}.npz"
    if not path.exists():
        atomic_npz(path, historical_geometry)
    with np.load(path) as arrays:
        persisted = {
            "lat": arrays["lat"].copy(),
            "lon": arrays["lon"].copy(),
            "latBounds": arrays["lat_bounds"].copy(),
            "lonBounds": arrays["lon_bounds"].copy(),
        }
    if not same_geometry(historical_geometry, persisted):
        raise RuntimeError(f"Persisted grid geometry does not match {route['canonicalModel']}")
    record = {
        "canonicalModel": route["canonicalModel"],
        "member": route["member"],
        "status": "exact_grid_geometry_ready",
        "gridGeometryDigest": digest,
        "gridShape": [len(historical_geometry["lat"]), len(historical_geometry["lon"])],
        "latBoundsVariable": historical_geometry["latBoundsVariable"],
        "lonBoundsVariable": historical_geometry["lonBoundsVariable"],
        "normalizedSphereArea": historical_geometry["normalizedSphereArea"],
        "historicalZstore": route["historical"]["zstore"],
        "ssp245Zstore": route["ssp245"]["zstore"],
    }
    geometry_output = {
        "digest": digest,
        "path": str(path.relative_to(ROOT)),
        "bytes": path.stat().st_size,
        "sha256": file_sha256(path),
        "shape": record["gridShape"],
    }
    return record, geometry_output


def build() -> dict:
    routes = json.loads(ROUTES_PATH.read_text())
    without_digest = dict(routes)
    digest = without_digest.pop("digest")
    if canonical_digest(without_digest) != digest:
        raise RuntimeError("Independent-pattern route inventory digest changed")
    executor = load_executor()
    records = []
    geometries = {}
    for route in routes["routes"]:
        if route["status"] != "exact_historical_and_ssp245_routes_ready":
            records.append({
                "canonicalModel": route["canonicalModel"],
                "member": route["member"],
                "status": "temperature_route_unresolved",
                "reason": route["status"],
            })
            continue
        print(f"{route['canonicalModel']}: inspecting published grid bounds", flush=True)
        record, geometry = inspect_route(route, executor)
        # Exception tracebacks can retain the final Zarr group until the caller
        # frame advances. Collect here so s3fs closes that model's session now.
        gc.collect()
        records.append(record)
        if geometry is not None:
            prior = geometries.get(geometry["digest"])
            if prior is not None and prior != geometry:
                raise RuntimeError(f"Conflicting persisted geometry identity: {geometry['digest']}")
            geometries[geometry["digest"]] = geometry
    ready = [row for row in records if row["status"] == "exact_grid_geometry_ready"]
    unresolved = [row for row in records if row["status"] != "exact_grid_geometry_ready"]
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "grid_geometry_inventory_complete",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze published cell bounds for every exact monthly CMIP6 route before building any regional area-intersection weights.",
        "inputs": {
            "routes": str(ROUTES_PATH.relative_to(ROOT)),
            "routesDigest": routes["digest"],
        },
        "method": {
            "admission": "Require one-dimensional latitude and longitude coordinates, published two-column bounds, identical historical/SSP2-4.5 geometry and full spherical coverage.",
            "prohibited": "Do not infer missing bounds, borrow a related member's grid or treat a model grid cell as a harmed-area denominator.",
        },
        "counts": {
            "identitiesExpected": len(records),
            "temperatureRoutesReady": routes["counts"]["routesReady"],
            "gridGeometriesReady": len(ready),
            "gridGeometriesUnresolved": len(unresolved),
            "uniquePublishedGrids": len(geometries),
        },
        "geometries": sorted(geometries.values(), key=lambda row: row["digest"]),
        "records": sorted(records, key=lambda row: (row["canonicalModel"], row["member"])),
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Build exact polygon-intersection weights for every admitted unique grid and all 971 fixed mortality-panel regions before reading regional temperatures.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# Pangeo CMIP6 independent-pattern grid inventory\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"Published coordinate-bound geometry is ready for {counts['gridGeometriesReady']} of {counts['identitiesExpected']} model votes, covering {counts['uniquePublishedGrids']} unique grids. "
        f"{counts['gridGeometriesUnresolved']} identities remain explicit exclusions.\n\n"
        "This inventory changes zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    print(json.dumps({"output": str(OUTPUT_PATH.relative_to(ROOT)), "status": payload["status"], "counts": payload["counts"], "digest": payload["digest"]}, indent=2))


if __name__ == "__main__":
    main()
