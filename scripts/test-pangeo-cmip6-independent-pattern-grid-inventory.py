#!/usr/bin/env python3
"""Validate frozen CMIP6 grid-bound geometry inventory."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-grid-inventory.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    return digest


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    counts = payload["counts"]
    assert counts["identitiesExpected"] == len(payload["records"]) == 32
    assert counts["gridGeometriesReady"] + counts["gridGeometriesUnresolved"] == 32
    assert counts["uniquePublishedGrids"] == len(payload["geometries"])
    geometry_by_digest = {}
    for geometry in payload["geometries"]:
        assert geometry["digest"] not in geometry_by_digest
        geometry_by_digest[geometry["digest"]] = geometry
        path = ROOT / geometry["path"]
        assert path.stat().st_size == geometry["bytes"]
        assert file_sha256(path) == geometry["sha256"]
        with np.load(path) as arrays:
            assert arrays["lat"].ndim == arrays["lon"].ndim == 1
            assert arrays["lat_bounds"].shape == (len(arrays["lat"]), 2)
            assert arrays["lon_bounds"].shape == (len(arrays["lon"]), 2)
            logical = hashlib.sha256()
            for array in (arrays["lat"], arrays["lon"], arrays["lat_bounds"], arrays["lon_bounds"]):
                logical.update(np.asarray(array, dtype="<f8").tobytes())
            assert logical.hexdigest() == geometry["digest"]
    ready = 0
    for record in payload["records"]:
        if record["status"] != "exact_grid_geometry_ready":
            continue
        ready += 1
        assert record["gridGeometryDigest"] in geometry_by_digest
        assert abs(record["normalizedSphereArea"] - 4 * np.pi) < 1e-4
    assert ready == counts["gridGeometriesReady"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(f"Pangeo CMIP6 grid inventory passed: {ready} model routes map to {counts['uniquePublishedGrids']} checksum-pinned coordinate-bound grids with zero score effects.")


if __name__ == "__main__":
    main()
