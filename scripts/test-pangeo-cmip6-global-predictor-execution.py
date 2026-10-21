#!/usr/bin/env python3
"""Offline tests for the exact-member Pangeo predictor executor."""

from __future__ import annotations

import importlib.util
import json
import tempfile
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/execute-pangeo-cmip6-global-predictors.py"
ARTIFACT = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-global-predictor-execution.json"


def load_module():
    spec = importlib.util.spec_from_file_location("pangeo_predictor_execution", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class SyntheticArray:
    def __init__(self, values, dimensions, attrs=None, chunks=None, fill_value=None, path="synthetic"):
        self.values = np.asarray(values)
        self.shape = self.values.shape
        self.ndim = self.values.ndim
        self.attrs = {"_ARRAY_DIMENSIONS": dimensions, **(attrs or {})}
        self.chunks = chunks or self.shape
        self.fill_value = fill_value
        self.path = path

    def __getitem__(self, selection):
        return self.values[selection]


def unit_checks(module) -> None:
    lat_bounds = SyntheticArray([[-90, 0], [0, 90]], ["lat", "bnds"])
    lon_bounds = SyntheticArray([[-180, -90], [-90, 0], [0, 90], [90, 180]], ["lon", "bnds"])
    lat = SyntheticArray([-45, 45], ["lat"], {"bounds": "lat_bnds"})
    lon = SyntheticArray([-135, -45, 45, 135], ["lon"], {"bounds": "lon_bnds"})
    group = {"lat": lat, "lon": lon, "lat_bnds": lat_bounds, "lon_bnds": lon_bounds}
    weights, check = module.spherical_areas_from_bounds(group, ["lat", "lon"], (2, 4))
    assert weights.shape == (2, 4)
    assert abs(weights.sum() - 4 * np.pi) < 1e-12
    assert check["method"] == "spherical_area_from_coordinate_bounds"

    annual = {year: 285.0 + 0.01 * (year - 1850) for year in module.REQUIRED_YEARS}
    baseline, predictors = module.build_predictors(annual)
    expected_baseline = np.mean([annual[year] for year in module.BASELINE_YEARS])
    expected_1950 = np.mean([annual[year] for year in range(1947, 1951)]) - expected_baseline
    assert abs(baseline - expected_baseline) < 1e-12
    assert len(predictors) == 73
    assert predictors[0]["year"] == 1950
    assert abs(predictors[0]["fourYearTrailingGlobalAnomalyC"] - expected_1950) < 1e-9

    raw = SyntheticArray(
        [[1, -9999], [3, 5]],
        ["lat", "lon"],
        {"_FillValue": -9999, "scale_factor": 2, "add_offset": 1},
    )
    decoded = module.decode_cf_values(raw)
    np.testing.assert_allclose(decoded[[0, 1, 1], [0, 0, 1]], [3, 7, 11])
    assert np.isnan(decoded[0, 1])


def artifact_checks(module) -> None:
    if not ARTIFACT.exists():
        return
    payload = json.loads(ARTIFACT.read_text())
    digest = payload.pop("digest")
    assert module.canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["counts"]["routesExpected"] == 15
    assert payload["counts"]["pangeoPredictorsComplete"] + payload["counts"]["pangeoPredictorsRemaining"] == 15
    assert payload["counts"]["combinedIndependentPredictorsComplete"] == 17 + payload["counts"]["pangeoPredictorsComplete"]
    assert payload["counts"]["predictorYearRows"] == 73 * payload["counts"]["pangeoPredictorsComplete"]
    identities = set()
    routes = json.loads(module.ROUTES_PATH.read_text())
    route_by_model = {route["canonicalModel"]: route for route in routes["routes"]}
    for record in payload["records"]:
        model = record["identity"]["canonicalModel"]
        assert model not in identities
        identities.add(model)
        assert record["routeDigest"] == module.route_digest(route_by_model[model])
        assert len(record["annualGlobalMeanKelvin"]) == 173
        assert [row["year"] for row in record["predictors"]] == list(range(1950, 2023))
        assert record["decision"] == {"axesAdmitted": 0, "scoresChanged": 0}
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0


def checkpoint_guard(module) -> None:
    routes = json.loads(module.ROUTES_PATH.read_text())
    route = routes["routes"][0]
    with tempfile.TemporaryDirectory() as directory:
        original_root = module.CHECKPOINT_ROOT
        module.CHECKPOINT_ROOT = Path(directory)
        try:
            payload = {
                "version": module.VERSION,
                "routesDigest": routes["digest"],
                "routeDigest": module.route_digest(route),
                "identity": module.route_identity(route),
                "annualGlobalMeanKelvin": [{"year": year, "globalMeanKelvin": 285.0} for year in module.REQUIRED_YEARS],
                "predictors": [{"year": year, "fourYearTrailingGlobalAnomalyC": 0.0} for year in module.ANALYSIS_YEARS],
            }
            payload["digest"] = module.canonical_digest(payload)
            module.atomic_json(module.checkpoint_path(route["canonicalModel"]), payload)
            assert module.load_checkpoint(route, routes["digest"]) is not None
            tampered = json.loads(module.checkpoint_path(route["canonicalModel"]).read_text())
            tampered["predictors"][0]["fourYearTrailingGlobalAnomalyC"] = 99
            module.atomic_json(module.checkpoint_path(route["canonicalModel"]), tampered)
            assert module.load_checkpoint(route, routes["digest"]) is None
        finally:
            module.CHECKPOINT_ROOT = original_root


def main() -> None:
    module = load_module()
    unit_checks(module)
    checkpoint_guard(module)
    artifact_checks(module)
    print("Pangeo CMIP6 global-predictor executor passed: spherical-area arithmetic, CF decoding, trailing-anomaly calculation, atomic checkpoint integrity and zero-score boundary verified offline.")


if __name__ == "__main__":
    main()
