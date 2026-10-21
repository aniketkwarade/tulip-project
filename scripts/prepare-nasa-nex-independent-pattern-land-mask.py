#!/usr/bin/env python3
"""Freeze the NASA NEX finite land mask used by the exact-week challenge."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

import numpy as np
import requests

from lib.netcdf3 import Dataset


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
INVENTORY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
WEIGHTS_MANIFEST_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-area-weights.json"
OUTPUT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-land-mask.json"
REPORT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-land-mask-report.md"
MASK_PATH = ROOT / "tmp/tulip-independent-pattern/nasa-nex-regional-land-mask.npz"
DOWNLOAD_PATH = ROOT / "tmp/tulip-independent-pattern/nasa-nex-land-mask-reference.nc"
NCSS_ROOT = "https://ds.nccs.nasa.gov/thredds/ncss/grid"
VERSION = "tulip_nasa_nex_gddp_cmip6_independent_pattern_land_mask_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest")
    if canonical_digest(content) != digest:
        raise RuntimeError(f"Digest changed for {path.relative_to(ROOT)}")
    return payload


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def reference_source(inventory: dict) -> dict:
    matches = [row for row in inventory["models"] if row["model"] == "ACCESS-CM2"]
    if len(matches) != 1 or matches[0]["eligibleMembers"] != ["r1i1p1f1"]:
        raise RuntimeError("Frozen ACCESS-CM2 reference identity changed")
    members = [row for row in matches[0]["members"] if row["eligible"]]
    files = [row for row in members[0]["historical"]["files"] if row["year"] == 1950]
    if len(files) != 1:
        raise RuntimeError("Frozen ACCESS-CM2 1950 reference file changed")
    return files[0]


def download_reference(source: dict) -> str:
    url = f"{NCSS_ROOT}/{source['urlPath']}"
    params = {
        "var": "tas",
        "north": "90",
        "south": "-60",
        "west": "-180",
        "east": "180",
        "horizStride": "1",
        "time": "1950-06-01T12:00:00Z",
        "accept": "netcdf3",
        "addLatLon": "true",
    }
    DOWNLOAD_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = DOWNLOAD_PATH.with_name(f".{DOWNLOAD_PATH.name}.{os.getpid()}.tmp")
    try:
        with requests.get(
            url,
            params=params,
            timeout=300,
            stream=True,
            headers={"User-Agent": "TULIP-NASA-land-mask/1.0"},
        ) as response:
            response.raise_for_status()
            with temporary.open("wb") as handle:
                for chunk in response.iter_content(1024 * 1024):
                    handle.write(chunk)
            final_url = response.url
        os.replace(temporary, DOWNLOAD_PATH)
    finally:
        temporary.unlink(missing_ok=True)
    return final_url


def build() -> dict:
    inventory = verified_json(INVENTORY_PATH)
    weights_manifest = verified_json(WEIGHTS_MANIFEST_PATH)
    source = reference_source(inventory)
    source_url = download_reference(source)
    with Dataset(DOWNLOAD_PATH) as dataset:
        latitude = dataset.read("lat")
        longitude = dataset.read("lon")
        time = dataset.read("time")
        temperature = dataset.read("tas")
    expected_latitude = -59.875 + 0.25 * np.arange(600)
    expected_longitude = 0.125 + 0.25 * np.arange(1440)
    if temperature.shape != (1, 600, 1440):
        raise RuntimeError(f"Unexpected NASA land-mask reference shape {temperature.shape}")
    if not np.array_equal(latitude, expected_latitude) or not np.array_equal(longitude, expected_longitude):
        raise RuntimeError("NASA land-mask reference coordinates changed")
    if len(time) != 1:
        raise RuntimeError("NASA land-mask reference did not return one day")

    with np.load(ROOT / weights_manifest["weightsOutput"]["path"]) as arrays:
        cell_indices = arrays["cell_indices"].copy()
        offsets = arrays["offsets"].copy()
        region_indices = arrays["region_indices"].copy()
        areas = arrays["areas_square_metres"].copy()
        region_ids = arrays["region_ids"].copy()
    finite_cells = np.isfinite(temperature.reshape(-1)[cell_indices])
    finite_intersections = np.repeat(finite_cells, np.diff(offsets))
    total_area = np.bincount(region_indices, weights=areas, minlength=len(region_ids))
    admitted_area = np.bincount(
        region_indices[finite_intersections],
        weights=areas[finite_intersections],
        minlength=len(region_ids),
    )
    coverage_fraction = np.divide(
        admitted_area,
        total_area,
        out=np.zeros_like(admitted_area),
        where=total_area > 0,
    )
    if np.any(admitted_area <= 0):
        missing = region_ids[admitted_area <= 0].tolist()
        raise RuntimeError(f"NASA source land mask leaves regions without finite cells: {missing}")

    logical_sha256 = hashlib.sha256(b"".join([
        cell_indices.tobytes(),
        finite_cells.tobytes(),
        admitted_area.tobytes(),
        "\n".join(region_ids.tolist()).encode(),
    ])).hexdigest()
    temporary = MASK_PATH.with_name(f".{MASK_PATH.name}.{os.getpid()}.tmp.npz")
    try:
        np.savez_compressed(
            temporary,
            cell_indices=cell_indices,
            finite_source_mask=finite_cells,
            admitted_area_square_metres=admitted_area,
            region_ids=region_ids,
        )
        os.replace(temporary, MASK_PATH)
    finally:
        temporary.unlink(missing_ok=True)

    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_frozen_finite_land_mask_for_all_response_regions",
        "productionRatingsEnabled": 0,
        "purpose": "Separate the stable NASA NEX land-domain mask from missing daily values before the exact-week regional execution.",
        "inputs": {
            "inventory": str(INVENTORY_PATH.relative_to(ROOT)),
            "inventoryDigest": inventory["digest"],
            "areaWeights": str(WEIGHTS_MANIFEST_PATH.relative_to(ROOT)),
            "areaWeightsDigest": weights_manifest["digest"],
            "referenceModel": "ACCESS-CM2",
            "referenceMember": "r1i1p1f1",
            "referenceExperiment": "historical",
            "referenceYear": 1950,
            "referenceDate": "1950-06-01",
            "referenceFile": source,
            "referenceRequest": source_url,
            "referenceLogicalTemperatureSha256": hashlib.sha256(temperature.tobytes(order="C")).hexdigest(),
        },
        "method": {
            "mask": "A weighted grid cell is admitted when the frozen reference day contains a finite daily temperature. Cells missing on that reference day remain outside the source land domain.",
            "executionCoverage": "Every later model day must retain at least 99% of each region's frozen admitted intersection area. Missing values inside that admitted mask are failures; stable ocean-only cells are not counted as expected data.",
            "modelCheck": "Every annual execution rechecks the admitted mask. A model with a materially different permanent mask fails its checkpoint instead of being silently renormalized.",
        },
        "counts": {
            "weightedGridCells": len(cell_indices),
            "finiteLandMaskCells": int(finite_cells.sum()),
            "excludedStableMissingCells": int((~finite_cells).sum()),
            "regions": len(region_ids),
            "regionsWithoutFiniteMaskArea": int((admitted_area <= 0).sum()),
            "regionsAtLeast99PercentOfPolygonGridArea": int((coverage_fraction >= 0.99).sum()),
            "minimumPolygonGridAreaCoverageFraction": float(coverage_fraction.min()),
            "medianPolygonGridAreaCoverageFraction": float(np.median(coverage_fraction)),
        },
        "maskOutput": {
            "path": str(MASK_PATH.relative_to(ROOT)),
            "bytes": MASK_PATH.stat().st_size,
            "sha256": file_sha256(MASK_PATH),
            "logicalSha256": logical_sha256,
            "arrays": {
                "cellIndices": len(cell_indices),
                "finiteSourceMask": len(finite_cells),
                "admittedAreaSquareMetres": len(admitted_area),
                "regionIds": len(region_ids),
            },
        },
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Execute every frozen exact-week annual route against this mask and reject any model-day with less than 99% of a region's admitted area.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# NASA NEX exact-week finite land mask\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The frozen reference day admits {counts['finiteLandMaskCells']:,} of {counts['weightedGridCells']:,} weighted NASA cells. "
        f"Every one of the {counts['regions']} regions retains finite source-mask area. "
        f"The lowest retained share of exact polygon-grid area is {counts['minimumPolygonGridAreaCoverageFraction']:.3%}; later executions must retain at least 99% of each region's frozen admitted area.\n\n"
        "This mask separates stable ocean-only missing cells from execution failures. It changes zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    DOWNLOAD_PATH.unlink(missing_ok=True)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
