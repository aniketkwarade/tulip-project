#!/usr/bin/env python3
"""Validate the frozen NASA NEX finite land mask."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-land-mask.json"


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
    assert payload["status"] == "complete_frozen_finite_land_mask_for_all_response_regions"
    counts = payload["counts"]
    assert counts["weightedGridCells"] == 11971
    assert counts["finiteLandMaskCells"] == 11842
    assert counts["excludedStableMissingCells"] == 129
    assert counts["regions"] == 971
    assert counts["regionsWithoutFiniteMaskArea"] == 0
    assert 0.90 < counts["minimumPolygonGridAreaCoverageFraction"] <= 1
    assert 0.99 < counts["medianPolygonGridAreaCoverageFraction"] <= 1

    output = payload["maskOutput"]
    path = ROOT / output["path"]
    assert path.stat().st_size == output["bytes"]
    assert file_sha256(path) == output["sha256"]
    with np.load(path) as arrays:
        cell_indices = arrays["cell_indices"]
        finite = arrays["finite_source_mask"]
        admitted_area = arrays["admitted_area_square_metres"]
        region_ids = arrays["region_ids"]
        assert len(cell_indices) == len(finite) == counts["weightedGridCells"]
        assert finite.dtype == np.bool_ and int(finite.sum()) == counts["finiteLandMaskCells"]
        assert len(admitted_area) == len(region_ids) == counts["regions"]
        assert np.all(np.isfinite(admitted_area)) and np.all(admitted_area > 0)
        assert len(set(region_ids.tolist())) == counts["regions"]
        logical = hashlib.sha256(b"".join([
            cell_indices.tobytes(),
            finite.tobytes(),
            admitted_area.tobytes(),
            "\n".join(region_ids.tolist()).encode(),
        ])).hexdigest()
        assert logical == output["logicalSha256"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(
        "NASA NEX land mask passed: "
        f"{counts['finiteLandMaskCells']:,} finite weighted cells retain all "
        f"{counts['regions']} regions with zero score effects."
    )


if __name__ == "__main__":
    main()
