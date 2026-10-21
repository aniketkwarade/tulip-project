#!/usr/bin/env python3

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
artifact = json.loads((ROOT / "artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-regional-area-weights.json").read_text())
weights_path = ROOT / artifact["weightsOutput"]["path"]

assert artifact["version"] == "tulip_europe_temperature_mortality_regional_area_weights_2026_09_26_v1"
assert artifact["status"] == "complete_sparse_area_intersection_weights_for_all_response_regions"
assert artifact["productionRatingsEnabled"] == 0
assert artifact["coverage"]["regions"] == 971
assert artifact["coverage"]["regionsWithoutWeights"] == 0
assert artifact["coverage"]["weightedGridCells"] > 0
assert artifact["coverage"]["cellRegionIntersections"] >= artifact["coverage"]["weightedGridCells"]
assert artifact["decision"]["axesAdmitted"] == 0
assert artifact["decision"]["scoresChanged"] == 0
assert "1950–2022" in artifact["decision"]["nextGate"]
assert hashlib.sha256(weights_path.read_bytes()).hexdigest() == artifact["weightsOutput"]["sha256"]

with np.load(weights_path) as arrays:
    cell_indices = arrays["cell_indices"]
    offsets = arrays["offsets"]
    region_indices = arrays["region_indices"]
    areas = arrays["areas_square_metres"]
    region_ids = arrays["region_ids"]
    assert len(cell_indices) == artifact["weightsOutput"]["arrays"]["cellIndices"]
    assert len(offsets) == len(cell_indices) + 1
    assert offsets[0] == 0 and offsets[-1] == len(region_indices)
    assert len(region_indices) == len(areas) == artifact["coverage"]["cellRegionIntersections"]
    assert len(region_ids) == 971 and len(set(region_ids.tolist())) == 971
    assert np.all(np.diff(cell_indices) > 0)
    assert np.all(np.diff(offsets) > 0)
    assert np.all((region_indices >= 0) & (region_indices < 971))
    assert np.all(np.isfinite(areas) & (areas > 0))
    logical = hashlib.sha256(b"".join([
        cell_indices.tobytes(), offsets.tobytes(), region_indices.tobytes(), areas.tobytes(),
        "\n".join(region_ids.tolist()).encode(),
    ])).hexdigest()
    assert logical == artifact["weightsOutput"]["logicalSha256"]

print("European temperature–mortality regional area weights passed: all 971 regions have deterministic sparse weights, with no scoring effect.")
