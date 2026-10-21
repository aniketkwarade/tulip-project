#!/usr/bin/env python3
"""Validate exact CMIP6 cell-to-region area weights."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-area-weights.json"


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
    assert payload["status"] == "all_admitted_grid_area_weights_complete"

    counts = payload["counts"]
    assert counts == {
        "identitiesExpected": 32,
        "modelWeightsReady": 22,
        "modelWeightsUnavailable": 10,
        "uniqueGridWeightSets": 17,
        "regionsPerWeightSet": 971,
        "regionsWithoutWeights": 0,
    }
    assert len(payload["records"]) == counts["identitiesExpected"]
    assert len(payload["weights"]) == counts["uniqueGridWeightSets"]

    weights_by_grid = {}
    for record in payload["weights"]:
        grid_digest = record["gridGeometryDigest"]
        assert grid_digest not in weights_by_grid
        weights_by_grid[grid_digest] = record
        assert record["regions"] == counts["regionsPerWeightSet"]
        assert record["regionsWithoutWeights"] == 0
        output = record["output"]
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
            assert np.all(np.isfinite(areas)) and np.all(areas > 0)
            assert len(region_ids) == counts["regionsPerWeightSet"]
            assert len(set(region_ids.tolist())) == counts["regionsPerWeightSet"]
            assert set(region_indices.tolist()) == set(range(counts["regionsPerWeightSet"]))
            logical = hashlib.sha256(b"".join([
                grid_digest.encode(),
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

    ready = 0
    unavailable = 0
    identities = set()
    for record in payload["records"]:
        identity = (record["canonicalModel"], record["member"])
        assert identity not in identities
        identities.add(identity)
        if record["status"] == "exact_971_region_area_weights_ready":
            ready += 1
            weights = weights_by_grid[record["gridGeometryDigest"]]
            assert record["weightsLogicalSha256"] == weights["output"]["logicalSha256"]
        else:
            unavailable += 1
            assert record["status"] == "regional_weights_unavailable"
            assert record["reason"]
    assert ready == counts["modelWeightsReady"]
    assert unavailable == counts["modelWeightsUnavailable"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(
        "Pangeo CMIP6 regional weights passed: "
        f"{counts['uniqueGridWeightSets']} exact grid weight sets cover all "
        f"{counts['regionsPerWeightSet']} regions for {ready} model votes with zero score effects."
    )


if __name__ == "__main__":
    main()
