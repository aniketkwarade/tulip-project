#!/usr/bin/env python3
"""Freeze exact CMIP6 cloud routes for unresolved NASA global predictors."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import time

import pandas as pd
import requests


ROOT = Path(__file__).resolve().parents[1]
GLOBAL_PREDICTORS = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-global-predictors.json"
CATALOG = ROOT / "tmp/tulip-independent-pattern/pangeo-cmip6.csv"
OUTPUT = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-global-predictor-routes.json"
REPORT = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-global-predictor-routes-report.md"
CATALOG_URL = "https://cmip6-pds.s3.amazonaws.com/pangeo-cmip6.csv"
CATALOG_BYTES = 83_974_211
CATALOG_SHA256 = "81521cd1ff7572d3d8caada5062bde2e223f735b202002d9ed62777a327547c7"
PANGEO_DOCS = "https://pangeo-data.github.io/pangeo-cmip6-cloud/accessing_data.html"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate_catalog(path: Path) -> dict:
    if path.stat().st_size != CATALOG_BYTES:
        raise ValueError(f"Pangeo catalog byte count changed: {path.stat().st_size}")
    digest = file_sha256(path)
    if digest != CATALOG_SHA256:
        raise ValueError(f"Pangeo catalog SHA-256 changed: {digest}")
    return {"path": str(path), "bytes": CATALOG_BYTES, "sha256": digest, "download": CATALOG_URL}


def https_store(zstore: str) -> str:
    prefix = "s3://cmip6-pds/"
    if not zstore.startswith(prefix):
        raise ValueError(f"Unexpected cloud store: {zstore}")
    return "https://cmip6-pds.s3.amazonaws.com/" + zstore.removeprefix(prefix).rstrip("/")


def fetch_zmetadata(zstore: str) -> dict:
    url = https_store(zstore) + "/.zmetadata"
    failures = []
    for attempt in range(1, 6):
        try:
            response = requests.get(url, timeout=(30, 90), headers={"User-Agent": "TULIP-CMIP6-route-inventory/1.0"})
            response.raise_for_status()
            payload = response.json()
            return {
                "url": url,
                "bytes": len(response.content),
                "sha256": hashlib.sha256(response.content).hexdigest(),
                "metadata": payload["metadata"],
            }
        except Exception as error:
            failures.append(f"attempt {attempt}: {type(error).__name__}: {error}")
            time.sleep(2)
    raise RuntimeError("Zarr metadata unavailable: " + " | ".join(failures))


def one_row(frame: pd.DataFrame, model: str, member: str, experiment: str) -> dict | None:
    selected = frame[
        (frame.source_id == model)
        & (frame.member_id == member)
        & (frame.experiment_id == experiment)
        & (frame.table_id == "Amon")
        & (frame.variable_id == "tas")
    ]
    if len(selected) != 1:
        return None
    row = selected.iloc[0]
    return {
        "activityId": row.activity_id,
        "institutionId": row.institution_id,
        "sourceId": row.source_id,
        "experimentId": row.experiment_id,
        "memberId": row.member_id,
        "tableId": row.table_id,
        "variableId": row.variable_id,
        "gridLabel": row.grid_label,
        "version": int(row.version),
        "zstore": row.zstore,
    }


def area_row(frame: pd.DataFrame, model: str, member: str, grid: str) -> dict | None:
    selected = frame[
        (frame.source_id == model)
        & (frame.member_id == member)
        & (frame.grid_label == grid)
        & (frame.table_id == "fx")
        & (frame.variable_id == "areacella")
        & (frame.experiment_id == "historical")
    ].sort_values(["version", "zstore"], ascending=[False, True])
    if selected.empty:
        return None
    row = selected.iloc[0]
    return {
        "experimentId": row.experiment_id,
        "memberId": row.member_id,
        "gridLabel": row.grid_label,
        "version": int(row.version),
        "zstore": row.zstore,
    }


def inspect_route(route: dict) -> dict:
    historical_metadata = fetch_zmetadata(route["historical"]["zstore"])
    scenario_metadata = fetch_zmetadata(route["ssp245"]["zstore"])
    tas = historical_metadata["metadata"].get("tas/.zarray")
    tas_attributes = historical_metadata["metadata"].get("tas/.zattrs", {})
    if tas is None or tas_attributes.get("_ARRAY_DIMENSIONS", [None])[0] != "time":
        raise ValueError(f"{route['canonicalModel']}: historical tas is absent or not time-first")
    scenario_tas = scenario_metadata["metadata"].get("tas/.zarray")
    scenario_attributes = scenario_metadata["metadata"].get("tas/.zattrs", {})
    if scenario_tas is None or scenario_attributes.get("_ARRAY_DIMENSIONS") != tas_attributes.get("_ARRAY_DIMENSIONS"):
        raise ValueError(f"{route['canonicalModel']}: historical/scenario tas dimensions differ")
    dimensions = tas_attributes["_ARRAY_DIMENSIONS"]
    lat = historical_metadata["metadata"].get("lat/.zarray")
    lon = historical_metadata["metadata"].get("lon/.zarray")
    has_one_dimensional_lat_lon = bool(lat and lon and len(lat["shape"]) == len(lon["shape"]) == 1)
    has_bounds = all(
        key in historical_metadata["metadata"]
        for key in ("lat_bnds/.zarray", "lon_bnds/.zarray")
    )
    if route["areacella"] is not None:
        area_metadata = fetch_zmetadata(route["areacella"]["zstore"])
        if "areacella/.zarray" not in area_metadata["metadata"]:
            raise ValueError(f"{route['canonicalModel']}: selected areacella store lacks areacella")
        area_method = "exact_areacella"
        area_evidence = {key: value for key, value in area_metadata.items() if key != "metadata"}
    elif has_one_dimensional_lat_lon and has_bounds:
        area_method = "spherical_area_from_coordinate_bounds"
        area_evidence = {
            "historicalMetadata": historical_metadata["url"],
            "latBounds": True,
            "lonBounds": True,
        }
    else:
        area_method = "unresolved"
        area_evidence = None
    return {
        **route,
        "status": "exact_historical_and_ssp245_routes_ready" if area_method != "unresolved" else "temperature_routes_ready_area_route_unresolved",
        "tasDimensions": dimensions,
        "historicalTasShape": tas["shape"],
        "historicalTasChunks": tas["chunks"],
        "ssp245TasShape": scenario_tas["shape"],
        "ssp245TasChunks": scenario_tas["chunks"],
        "areaMethod": area_method,
        "areaEvidence": area_evidence,
        "historicalMetadata": {key: value for key, value in historical_metadata.items() if key != "metadata"},
        "ssp245Metadata": {key: value for key, value in scenario_metadata.items() if key != "metadata"},
    }


def main() -> None:
    catalog_identity = validate_catalog(CATALOG)
    predictors = json.loads(GLOBAL_PREDICTORS.read_text())
    unresolved = [row for row in predictors["records"] if row["status"] != "complete_exact_member_predictor"]
    frame = pd.read_csv(CATALOG)
    routes = []
    for row in unresolved:
        model = row["canonicalModel"]
        member = row["member"]
        historical = one_row(frame, model, member, "historical")
        scenario = one_row(frame, model, member, "ssp245")
        if historical is None or scenario is None or historical["gridLabel"] != scenario["gridLabel"]:
            routes.append({
                "canonicalModel": model,
                "member": member,
                "status": "unique_compatible_pair_absent",
                "historical": historical,
                "ssp245": scenario,
                "areacella": None,
            })
            continue
        routes.append({
            "canonicalModel": model,
            "member": member,
            "historical": historical,
            "ssp245": scenario,
            "areacella": area_row(frame, model, member, historical["gridLabel"]),
        })
    inspected = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(inspect_route, route): route
            for route in routes if "status" not in route
        }
        inspected.extend(route for route in routes if "status" in route)
        for future in as_completed(futures):
            inspected.append(future.result())
    inspected.sort(key=lambda row: row["canonicalModel"])
    ready = [row for row in inspected if row["status"] == "exact_historical_and_ssp245_routes_ready"]
    payload = {
        "version": "tulip_pangeo_cmip6_global_predictor_routes_2026_09_26_v1",
        "preparedOn": "2026-09-26",
        "status": "exact_cmip6_global_predictor_routes_frozen_execution_pending",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze exact historical and SSP2-4.5 CMIP6 cloud stores for every global predictor unresolved by the IPCC figure-data record.",
        "sources": {
            "pangeoDocumentation": PANGEO_DOCS,
            "catalog": catalog_identity,
            "upstreamGlobalPredictors": str(GLOBAL_PREDICTORS.relative_to(ROOT)),
            "upstreamGlobalPredictorsDigest": predictors["digest"],
        },
        "selection": {
            "experiments": ["historical", "ssp245"],
            "table": "Amon",
            "variable": "tas",
            "rule": "Require one exact canonical model/member/grid store for each experiment. Prefer exact-member historical-grid areacella; otherwise admit spherical cell areas only from one-dimensional latitude/longitude bounds in the same temperature store.",
        },
        "counts": {
            "unresolvedUpstreamIdentities": len(unresolved),
            "routesInspected": len(inspected),
            "routesReady": len(ready),
            "routesUnresolved": len(inspected) - len(ready),
            "exactAreacellaRoutes": sum(row.get("areaMethod") == "exact_areacella" for row in inspected),
            "coordinateBoundsAreaRoutes": sum(row.get("areaMethod") == "spherical_area_from_coordinate_bounds" for row in inspected),
        },
        "routes": inspected,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Execute each frozen route, compute month-length-weighted global annual means, cross-check overlap against the IPCC figure data, and merge only exact-member histories into the fixed predictor inventory.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    REPORT.write_text(
        "# Pangeo CMIP6 global-predictor routes\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"All {payload['counts']['unresolvedUpstreamIdentities']} exact model/member identities unresolved by the frozen IPCC figure-data record were checked against the pinned Pangeo/ESGF cloud catalog. "
        f"{payload['counts']['routesReady']} now have a unique historical and SSP2-4.5 temperature route plus a declared area-weight route; {payload['counts']['routesUnresolved']} remain unresolved. "
        f"{payload['counts']['exactAreacellaRoutes']} use published `areacella`; {payload['counts']['coordinateBoundsAreaRoutes']} use spherical areas derived from same-store coordinate bounds.\n\n"
        "No route has yet been converted into a TULIP input. This inventory changes zero axes and zero scores.\n"
    )
    print(json.dumps({"output": str(OUTPUT.relative_to(ROOT)), "status": payload["status"], "counts": payload["counts"], "digest": payload["digest"]}, indent=2))


if __name__ == "__main__":
    main()
