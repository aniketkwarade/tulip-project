#!/usr/bin/env python3
"""Validate NASA NEX exact cell-to-region area weights."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-area-weights.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["status"] == "complete_exact_nasa_grid_area_weights_for_all_response_regions"
    assert payload["grid"] == {
        "shape": [600, 1440],
        "spacingDegrees": 0.25,
        "latitudeFirstCenter": -59.875,
        "latitudeLastCenter": 89.875,
        "longitudeFirstCenter": 0.125,
        "longitudeLastCenter": 359.875,
        "coordinateEvidence": "Verified from a full-grid one-day NCCS NetCDF3 subset before weight construction.",
    }
    counts = payload["counts"]
    assert counts["independentModelVotes"] == 32
    assert counts["regions"] == 971
    assert counts["regionsWithoutWeights"] == 0
    assert counts["weightedGridCells"] > 0
    assert counts["cellRegionIntersections"] >= counts["weightedGridCells"]
    assert counts["regionCellCounts"]["minimum"] > 0

    output = payload["weightsOutput"]
    path = ROOT / output["path"]
    assert path.stat().st_size == output["bytes"]
    assert file_sha256(path) == output["sha256"]
    with np.load(path) as arrays:
        cell_indices = arrays["cell_indices"]
        offsets = arrays["offsets"]
        region_indices = arrays["region_indices"]
        areas = arrays["areas_square_metres"]
        region_ids = arrays["region_ids"]
        assert cell_indices.ndim == offsets.ndim == region_indices.ndim == areas.ndim == region_ids.ndim == 1
        assert len(offsets) == len(cell_indices) + 1
        assert offsets[0] == 0 and offsets[-1] == len(region_indices) == len(areas)
        assert np.all(np.diff(cell_indices) > 0)
        assert np.all(np.diff(offsets) > 0)
        assert np.all(cell_indices >= 0) and np.all(cell_indices < 600 * 1440)
        assert np.all(np.isfinite(areas)) and np.all(areas > 0)
        assert len(region_ids) == 971 and len(set(region_ids.tolist())) == 971
        assert set(region_indices.tolist()) == set(range(971))
        logical = hashlib.sha256(b"".join([
            cell_indices.tobytes(),
            offsets.tobytes(),
            region_indices.tobytes(),
            areas.tobytes(),
            "\n".join(region_ids.tolist()).encode(),
        ])).hexdigest()
        assert logical == output["logicalSha256"]
        assert output["arrays"] == {
            "cellIndices": len(cell_indices),
            "offsets": len(offsets),
            "regionIndices": len(region_indices),
            "areasSquareMetres": len(areas),
            "regionIds": len(region_ids),
        }
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(
        "NASA NEX regional weights passed: one exact 0.25-degree grid covers all "
        f"{counts['regions']} regions for {counts['independentModelVotes']} model votes with zero score effects."
    )


if __name__ == "__main__":
    main()
