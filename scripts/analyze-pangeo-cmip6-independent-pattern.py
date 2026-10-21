#!/usr/bin/env python3
"""Analyze the complete monthly CMIP6 independent regional pattern ensemble."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import math
import os
import time
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
EXECUTION_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-regional-temperature-execution.json"
PREDICTORS_PATH = CALIBRATION_DIR / "independent-pattern-global-predictor-ensemble.json"
ERA5_PATTERN_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-pattern-analysis.json"
EXECUTOR_PATH = ROOT / "scripts/execute-pangeo-cmip6-independent-pattern-regional-temperatures.py"
OUTPUT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-analysis.json"
REPORT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-analysis-report.md"
ARRAY_PATH = ROOT / "tmp/tulip-independent-pattern/pangeo-independent-pattern-analysis.npz"

VERSION = "tulip_pangeo_cmip6_independent_pattern_analysis_2026_09_26_v1"
YEARS = np.arange(1950, 2023, dtype=np.int16)
EARLY_MASK = YEARS <= 1985
LATE_MASK = YEARS >= 1986
SEASONS = ("jja", "isoWeek2235MonthlyApproximation")
EXPECTED_MODELS = 22
EXPECTED_REGIONS = 971


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    without_digest = dict(payload)
    digest = without_digest.pop("digest", None)
    if not digest or canonical_digest(without_digest) != digest:
        raise RuntimeError(f"Digest failed for {path.relative_to(ROOT)}")
    return payload


def load_executor():
    spec = importlib.util.spec_from_file_location("regional_executor", EXECUTOR_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def fit_matrix(predictor: np.ndarray, outcomes: np.ndarray) -> dict[str, np.ndarray]:
    if predictor.ndim != 1 or outcomes.ndim != 2 or len(predictor) != outcomes.shape[0]:
        raise RuntimeError("Regression predictor/outcome shape mismatch")
    if len(predictor) < 8 or not np.all(np.isfinite(predictor)) or not np.all(np.isfinite(outcomes)):
        raise RuntimeError("Regression requires at least eight complete finite years")
    centered_x = predictor - predictor.mean()
    centered_y = outcomes - outcomes.mean(axis=0)
    sum_xx = float(np.sum(centered_x ** 2))
    if sum_xx <= 0:
        raise RuntimeError("Regression predictor has no variation")
    slope = np.sum(centered_x[:, None] * centered_y, axis=0) / sum_xx
    intercept = outcomes.mean(axis=0) - slope * predictor.mean()
    residual = outcomes - (intercept[None, :] + predictor[:, None] * slope[None, :])
    residual_sum_squares = np.sum(residual ** 2, axis=0)
    total_sum_squares = np.sum(centered_y ** 2, axis=0)
    if np.any(total_sum_squares <= 0):
        raise RuntimeError("A regional series has no temperature variation")
    return {
        "intercept": intercept,
        "slope": slope,
        "slopeStandardError": np.sqrt(residual_sum_squares / (len(predictor) - 2) / sum_xx),
        "rSquared": 1.0 - residual_sum_squares / total_sum_squares,
    }


def average_ranks(values: np.ndarray) -> np.ndarray:
    if values.ndim != 1 or not np.all(np.isfinite(values)):
        raise RuntimeError("Ranks require one finite vector")
    order = np.argsort(values, kind="mergesort")
    sorted_values = values[order]
    ranks = np.empty(len(values), dtype=np.float64)
    start = 0
    while start < len(values):
        stop = start + 1
        while stop < len(values) and sorted_values[stop] == sorted_values[start]:
            stop += 1
        ranks[order[start:stop]] = (start + stop - 1) / 2.0 + 1.0
        start = stop
    return ranks


def spearman(first: np.ndarray, second: np.ndarray) -> float:
    return float(np.corrcoef(average_ranks(first), average_ranks(second))[0, 1])


def summarize_distribution(values: np.ndarray) -> dict:
    if not np.all(np.isfinite(values)):
        raise RuntimeError("Distribution summary contains non-finite values")
    return {
        "minimum": float(np.min(values)),
        "q05": float(np.quantile(values, 0.05, method="linear")),
        "q25": float(np.quantile(values, 0.25, method="linear")),
        "median": float(np.quantile(values, 0.50, method="linear")),
        "q75": float(np.quantile(values, 0.75, method="linear")),
        "q95": float(np.quantile(values, 0.95, method="linear")),
        "maximum": float(np.max(values)),
    }


def ensemble_summary(model_slopes: np.ndarray, institutions: np.ndarray) -> dict[str, np.ndarray]:
    unique_institutions = np.unique(institutions)
    institution_votes = np.stack([
        model_slopes[institutions == institution].mean(axis=0)
        for institution in unique_institutions
    ])
    return {
        "modelMedian": np.quantile(model_slopes, 0.50, axis=0, method="linear"),
        "modelQ05": np.quantile(model_slopes, 0.05, axis=0, method="linear"),
        "modelQ95": np.quantile(model_slopes, 0.95, axis=0, method="linear"),
        "institutionMedian": np.quantile(institution_votes, 0.50, axis=0, method="linear"),
        "institutionQ05": np.quantile(institution_votes, 0.05, axis=0, method="linear"),
        "institutionQ95": np.quantile(institution_votes, 0.95, axis=0, method="linear"),
        "institutionVotes": institution_votes,
        "uniqueInstitutions": unique_institutions,
    }


def load_model_series(record: dict, executor) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    checkpoint = verified_json(ROOT / record["checkpoint"])
    if checkpoint["digest"] != record["checkpointDigest"] or not executor.validate_series_output(checkpoint):
        raise RuntimeError(f"Regional checkpoint failed for {record['canonicalModel']}")
    with np.load(ROOT / checkpoint["seriesOutput"]["path"]) as arrays:
        years = arrays["years"].copy()
        region_ids = arrays["region_ids"].astype("U16", copy=True)
        jja = arrays["jja_mean_kelvin"].astype(np.float64, copy=True)
        approximation = arrays["iso_week_22_35_monthly_approximation_mean_kelvin"].astype(np.float64, copy=True)
    if years.tolist() != YEARS.tolist() or jja.shape != (len(YEARS), EXPECTED_REGIONS) or approximation.shape != jja.shape:
        raise RuntimeError(f"Regional series dimensions failed for {record['canonicalModel']}")
    return region_ids, jja, approximation


def comparison_tests(era_slopes: np.ndarray, median: np.ndarray, q05: np.ndarray,
                     q95: np.ndarray, eligible_votes: int) -> dict:
    sign_agreement = float(np.mean(np.sign(era_slopes) == np.sign(median)))
    correlation = spearman(era_slopes, median)
    interval_coverage = float(np.mean((era_slopes >= q05) & (era_slopes <= q95)))
    median_absolute_difference = float(np.median(np.abs(era_slopes - median)))
    tests = {
        "sameSlopeSignFraction": {"value": sign_agreement, "threshold": 0.90, "passed": sign_agreement >= 0.90},
        "spatialSpearmanCorrelation": {"value": correlation, "threshold": 0.80, "passed": correlation >= 0.80},
        "era5SlopeInsideQ05Q95Fraction": {"value": interval_coverage, "threshold": 0.80, "passed": interval_coverage >= 0.80},
        "medianAbsoluteSlopeDifference": {"value": median_absolute_difference, "threshold": 0.25, "passed": median_absolute_difference <= 0.25},
        "eligibleVotesPerRegion": {"value": eligible_votes, "threshold": 10, "passed": eligible_votes >= 10},
    }
    return {"passed": all(item["passed"] for item in tests.values()), "tests": tests}


def atomic_npz(path: Path, arrays: dict[str, np.ndarray]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.{time.time_ns()}.tmp.npz")
    try:
        np.savez_compressed(temporary, **arrays)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def analysis_logical_digest(arrays: dict[str, np.ndarray]) -> str:
    digest = hashlib.sha256()
    for name in sorted(arrays):
        value = arrays[name]
        digest.update(name.encode())
        if value.dtype.kind in {"U", "S"}:
            digest.update("\n".join(value.astype(str).ravel().tolist()).encode())
        else:
            digest.update(np.ascontiguousarray(value).tobytes())
    return digest.hexdigest()


def analyze(execution: dict, predictors: dict, executor) -> tuple[dict, dict[str, np.ndarray]]:
    if execution["status"] != "complete_all_admitted_regional_temperature_series":
        raise RuntimeError("Independent-pattern analysis requires all 22 regional-temperature checkpoints")
    records = execution["records"]
    if len(records) != EXPECTED_MODELS or any(row["status"] != "complete_exact_member_regional_temperature_series" for row in records):
        raise RuntimeError("Independent-pattern execution is not complete for exactly 22 models")
    predictor_by_model = {row["canonicalModel"]: row for row in predictors["records"]}
    models = np.asarray([row["canonicalModel"] for row in records], dtype="U32")
    institutions = np.asarray([row["institutionId"] for row in records], dtype="U48")
    region_ids = None
    seasonal_series = []
    predictor_matrix = []
    for record in records:
        ids, jja, approximation = load_model_series(record, executor)
        if region_ids is None:
            region_ids = ids
        elif not np.array_equal(region_ids, ids):
            raise RuntimeError("Regional identifier ordering differs across models")
        seasonal_series.append(np.stack([jja, approximation]))
        predictor = predictor_by_model[record["canonicalModel"]]
        if predictor["member"] != record["member"]:
            raise RuntimeError(f"Predictor member mismatch for {record['canonicalModel']}")
        predictor_matrix.append(np.asarray([
            float(row["fourYearTrailingGlobalAnomalyC"]) for row in predictor["predictors"]
        ]))
    assert region_ids is not None
    series = np.stack(seasonal_series)  # model, season, year, region
    predictor_values = np.stack(predictor_matrix)
    full_slopes = np.empty((len(SEASONS), EXPECTED_MODELS, EXPECTED_REGIONS))
    full_r2 = np.empty_like(full_slopes)
    full_standard_error = np.empty_like(full_slopes)
    early_slopes = np.empty_like(full_slopes)
    late_slopes = np.empty_like(full_slopes)
    for model_index in range(EXPECTED_MODELS):
        for season_index in range(len(SEASONS)):
            outcome = series[model_index, season_index]
            full = fit_matrix(predictor_values[model_index], outcome)
            early = fit_matrix(predictor_values[model_index, EARLY_MASK], outcome[EARLY_MASK])
            late = fit_matrix(predictor_values[model_index, LATE_MASK], outcome[LATE_MASK])
            full_slopes[season_index, model_index] = full["slope"]
            full_r2[season_index, model_index] = full["rSquared"]
            full_standard_error[season_index, model_index] = full["slopeStandardError"]
            early_slopes[season_index, model_index] = early["slope"]
            late_slopes[season_index, model_index] = late["slope"]

    arrays: dict[str, np.ndarray] = {
        "models": models,
        "institutions": institutions,
        "seasons": np.asarray(SEASONS, dtype="U48"),
        "years": YEARS,
        "region_ids": region_ids,
        "full_slopes": full_slopes,
        "full_r_squared": full_r2,
        "full_slope_standard_error": full_standard_error,
        "early_slopes": early_slopes,
        "late_slopes": late_slopes,
        "split_absolute_slope_difference": np.abs(early_slopes - late_slopes),
        "split_opposite_signs": (np.sign(early_slopes) != np.sign(late_slopes)).astype(np.uint8),
    }
    ensemble_by_season = {}
    unique_institutions = None
    for season_index, season in enumerate(SEASONS):
        ensemble = ensemble_summary(full_slopes[season_index], institutions)
        unique_institutions = ensemble["uniqueInstitutions"]
        for key in ("modelMedian", "modelQ05", "modelQ95", "institutionMedian", "institutionQ05", "institutionQ95"):
            arrays[f"{season}_{key}"] = ensemble[key]
        ensemble_by_season[season] = {
            "modelSlope": summarize_distribution(full_slopes[season_index].ravel()),
            "modelMedianRegionalSlope": summarize_distribution(ensemble["modelMedian"]),
            "institutionMedianRegionalSlope": summarize_distribution(ensemble["institutionMedian"]),
            "negativeModelRegionSlopes": int(np.sum(full_slopes[season_index] < 0)),
            "rSquaredBelowPointTwo": int(np.sum(full_r2[season_index] < 0.2)),
            "splitOppositeSigns": int(np.sum(arrays["split_opposite_signs"][season_index])),
            "splitAbsoluteSlopeDifference": summarize_distribution(arrays["split_absolute_slope_difference"][season_index].ravel()),
        }

    comparison = {
        "status": "complete_era5_pattern_pending",
        "monthlyTestsPassed": None,
        "nasaExactWeekChallengePending": True,
        "views": None,
    }
    if ERA5_PATTERN_PATH.exists():
        era = verified_json(ERA5_PATTERN_PATH)
        if era["status"] == "complete_long_record_pattern_stability_challenge_independent_comparison_pending":
            era_by_region = {row["region"]: float(row["full"]["slope"]) for row in era["regions"]}
            if set(era_by_region) != set(region_ids.tolist()):
                raise RuntimeError("Complete ERA5-Land pattern uses a different region universe")
            era_slopes = np.asarray([era_by_region[region] for region in region_ids])
            views = {}
            for season in SEASONS:
                views[season] = {
                    "oneModelOneVote": comparison_tests(
                        era_slopes, arrays[f"{season}_modelMedian"], arrays[f"{season}_modelQ05"],
                        arrays[f"{season}_modelQ95"], EXPECTED_MODELS,
                    ),
                    "oneInstitutionOneVote": comparison_tests(
                        era_slopes, arrays[f"{season}_institutionMedian"], arrays[f"{season}_institutionQ05"],
                        arrays[f"{season}_institutionQ95"], len(unique_institutions),
                    ),
                }
            comparison = {
                "status": "monthly_independent_pattern_tests_complete_exact_week_challenge_pending",
                "monthlyTestsPassed": all(
                    view[weighting]["passed"]
                    for view in views.values()
                    for weighting in ("oneModelOneVote", "oneInstitutionOneVote")
                ),
                "nasaExactWeekChallengePending": True,
                "era5PatternDigest": era["digest"],
                "views": views,
            }

    logical = analysis_logical_digest(arrays)
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_monthly_independent_pattern_ensemble",
        "productionRatingsEnabled": 0,
        "purpose": "Fit the predeclared full and split-period regional temperature-to-global-warming patterns for every admitted model and both monthly seasonal definitions.",
        "inputs": {
            "regionalTemperatureExecutionDigest": execution["digest"],
            "globalPredictorEnsembleDigest": predictors["digest"],
        },
        "method": {
            "fullPeriod": [1950, 2022],
            "earlyPeriod": [1950, 1985],
            "latePeriod": [1986, 2022],
            "fit": "Separate ordinary least-squares fits for every exact model/member, region and seasonal definition, using that model's own four-year trailing global anomaly.",
            "oneModelOneVote": "Each of the 22 admitted exact model/member identities contributes one vote.",
            "oneInstitutionOneVote": "Average model slopes within each institution first, then give every institution one equally weighted vote.",
            "ensembleInterval": "Type-7 linear 5th–95th percentile interval across the relevant votes.",
        },
        "counts": {
            "models": EXPECTED_MODELS,
            "institutions": int(len(unique_institutions)),
            "regions": EXPECTED_REGIONS,
            "years": len(YEARS),
            "seasonDefinitions": len(SEASONS),
            "modelRegionFits": EXPECTED_MODELS * EXPECTED_REGIONS * len(SEASONS),
        },
        "diagnostics": ensemble_by_season,
        "comparison": comparison,
        "arrayOutput": {
            "path": str(ARRAY_PATH.relative_to(ROOT)),
            "logicalSha256": logical,
        },
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Complete ERA5-Land and the exact-week NASA challenge, apply every predeclared comparison test, then propagate only a compatible pattern through the complete mortality endpoint and all 100 bootstrap fits.",
        },
    }
    return payload, arrays


def write(payload: dict, arrays: dict[str, np.ndarray]) -> dict:
    atomic_npz(ARRAY_PATH, arrays)
    payload["arrayOutput"].update({"bytes": ARRAY_PATH.stat().st_size, "sha256": file_sha256(ARRAY_PATH)})
    payload["digest"] = canonical_digest(payload)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# Pangeo CMIP6 independent-pattern analysis\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The analysis contains {counts['modelRegionFits']:,} full-period model-region-season fits across "
        f"{counts['models']} models, {counts['institutions']} institutions, {counts['regions']} regions and two seasonal definitions.\n\n"
        f"Comparison status: **{payload['comparison']['status'].replace('_', ' ')}**.\n\n"
        "This analysis changes zero TULIP axes and zero scores.\n"
    )
    return payload


def main() -> None:
    execution = verified_json(EXECUTION_PATH)
    predictors = verified_json(PREDICTORS_PATH)
    executor = load_executor()
    payload, arrays = analyze(execution, predictors, executor)
    payload = write(payload, arrays)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "comparison": payload["comparison"]["status"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
