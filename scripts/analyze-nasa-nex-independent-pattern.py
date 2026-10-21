#!/usr/bin/env python3
"""Analyze the complete NASA NEX exact-week regional pattern ensemble."""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path
import time

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
EXECUTION_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-temperature-execution.json"
INVENTORY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
WEIGHTS_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-area-weights.json"
MASK_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-land-mask.json"
PLAN_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-retrieval-plan.json"
CALENDAR_COMPATIBILITY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-calendar-compatibility.json"
PREDICTORS_PATH = CALIBRATION_DIR / "independent-pattern-global-predictor-ensemble.json"
INSTITUTIONS_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-institution-groups.json"
MONTHLY_ANALYSIS_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-analysis.json"
ERA5_PATTERN_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-pattern-analysis.json"
EXECUTOR_PATH = ROOT / "scripts/execute-nasa-nex-independent-pattern-regional-temperatures.py"
MONTHLY_ANALYZER_PATH = ROOT / "scripts/analyze-pangeo-cmip6-independent-pattern.py"
OUTPUT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-analysis.json"
REPORT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-analysis-report.md"
ARRAY_PATH = ROOT / "tmp/tulip-independent-pattern/nasa-nex-independent-pattern-analysis.npz"
VERSION = "tulip_nasa_nex_gddp_cmip6_independent_pattern_analysis_2026_09_26_v1"

YEARS = np.arange(1950, 2023, dtype=np.int16)
EARLY_MASK = YEARS <= 1985
LATE_MASK = YEARS >= 1986
EXPECTED_CHECKPOINTS = 2190
EXPECTED_MODELS = 29
EXPECTED_INSTITUTIONS = 21
EXPECTED_REGIONS = 971


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest", None)
    if not digest or canonical_digest(content) != digest:
        raise RuntimeError(f"Digest failed for {path.relative_to(ROOT)}")
    return payload


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_module(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


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


def resolution_comparison(
    exact_median: np.ndarray,
    exact_q05: np.ndarray,
    exact_q95: np.ndarray,
    monthly_median: np.ndarray,
    monthly_q05: np.ndarray,
    monthly_q95: np.ndarray,
    helper,
) -> dict:
    return {
        "sameSlopeSignFraction": float(np.mean(np.sign(exact_median) == np.sign(monthly_median))),
        "spatialSpearmanCorrelation": helper.spearman(exact_median, monthly_median),
        "exactWeekMedianInsideMonthlyQ05Q95Fraction": float(
            np.mean((exact_median >= monthly_q05) & (exact_median <= monthly_q95))
        ),
        "monthlyMedianInsideExactWeekQ05Q95Fraction": float(
            np.mean((monthly_median >= exact_q05) & (monthly_median <= exact_q95))
        ),
        "medianAbsoluteSlopeDifference": float(np.median(np.abs(exact_median - monthly_median))),
        "boundary": "Continuous temporal-resolution diagnostic only; the predeclared promotion tests compare each ensemble with ERA5-Land.",
    }


def load_complete_series(executor, execution_inputs: dict, records: list[dict], model: str) -> tuple[np.ndarray, np.ndarray, dict]:
    selected = [record for record in records if record["canonicalModel"] == model]
    by_year: dict[int, list[dict]] = {}
    for record in selected:
        by_year.setdefault(record["year"], []).append(record)
    if sorted(by_year) != YEARS.tolist():
        raise RuntimeError(f"Exact-week checkpoints do not cover 1950–2022 for {model}")
    region_ids = None
    annual = []
    contributors = set()
    for year in YEARS.tolist():
        variants = []
        for record in by_year[year]:
            checkpoint = executor.checkpoint_is_valid(record, execution_inputs)
            if checkpoint is None:
                raise RuntimeError(f"Missing exact-week checkpoint for {model} {year}")
            with np.load(ROOT / checkpoint["output"]["path"]) as arrays:
                ids = arrays["region_ids"].astype("U16", copy=True)
                values = arrays["annual_exact_week_mean_c"].astype(np.float64, copy=True)
            if values.shape != (EXPECTED_REGIONS,) or len(ids) != EXPECTED_REGIONS:
                raise RuntimeError(f"Exact-week checkpoint shape failed for {model} {year}")
            if region_ids is None:
                region_ids = ids
            elif not np.array_equal(region_ids, ids):
                raise RuntimeError(f"Region order differs within {model}")
            variants.append(values)
            contributors.add((record["model"], record["member"]))
        annual.append(np.mean(np.stack(variants), axis=0))
    assert region_ids is not None
    return region_ids, np.stack(annual), {
        "catalogueMemberSeries": len(contributors),
        "contributors": [
            {"catalogueEntry": catalogue, "member": member}
            for catalogue, member in sorted(contributors)
        ],
    }


def load_monthly_arrays(monthly: dict) -> dict[str, np.ndarray]:
    output = monthly["arrayOutput"]
    path = ROOT / output["path"]
    if path.stat().st_size != output["bytes"] or file_sha256(path) != output["sha256"]:
        raise RuntimeError("Monthly independent-pattern analysis array failed validation")
    with np.load(path) as source:
        arrays = {name: source[name].copy() for name in source.files}
    if analysis_logical_digest(arrays) != output["logicalSha256"]:
        raise RuntimeError("Monthly independent-pattern analysis logical digest changed")
    return arrays


def analyze(inputs: dict, executor, helper) -> tuple[dict, dict[str, np.ndarray]]:
    execution = inputs["execution"]
    if execution["status"] != "complete_all_exact_week_regional_temperature_series":
        raise RuntimeError(f"Exact-week analysis requires all {EXPECTED_CHECKPOINTS:,} admitted annual checkpoints")
    if execution["counts"]["annualCheckpointsComplete"] != EXPECTED_CHECKPOINTS or execution["counts"]["independentModelVotesComplete"] != EXPECTED_MODELS:
        raise RuntimeError("Exact-week execution manifest is not complete")
    inventory = inputs["inventory"]
    records = executor.admitted_records(inventory, inputs["calendarCompatibility"])
    execution_inputs = {
        "inventory": inventory,
        "weights": inputs["weights"],
        "mask": inputs["mask"],
        "plan": inputs["plan"],
        "calendarCompatibility": inputs["calendarCompatibility"],
    }
    predictor_by_model = {row["canonicalModel"]: row for row in inputs["predictors"]["records"]}
    excluded_models = {
        row["canonicalModel"] for row in inputs["calendarCompatibility"]["exclusions"]
    }
    group_records = [
        row for row in inputs["institutions"]["records"]
        if row["canonicalModel"] not in excluded_models
    ]
    models = np.asarray([row["canonicalModel"] for row in group_records], dtype="U32")
    institutions = np.asarray([row["institutionId"] for row in group_records], dtype="U48")
    if len(models) != EXPECTED_MODELS or len(np.unique(institutions)) != EXPECTED_INSTITUTIONS:
        raise RuntimeError("Frozen exact-week model or institution universe changed")

    regional_series = []
    predictors = []
    contributor_summary = []
    region_ids = None
    for record in group_records:
        model = record["canonicalModel"]
        ids, values, contributors = load_complete_series(executor, execution_inputs, records, model)
        if region_ids is None:
            region_ids = ids
        elif not np.array_equal(region_ids, ids):
            raise RuntimeError("Region order differs across exact-week model votes")
        predictor = predictor_by_model[model]
        if predictor["member"] != record["member"]:
            raise RuntimeError(f"Global predictor member differs for {model}")
        predictor_years = [int(row["year"]) for row in predictor["predictors"]]
        if predictor_years != YEARS.tolist():
            raise RuntimeError(f"Global predictor years differ for {model}")
        predictors.append(np.asarray([
            float(row["fourYearTrailingGlobalAnomalyC"]) for row in predictor["predictors"]
        ]))
        regional_series.append(values)
        contributor_summary.append({"canonicalModel": model, **contributors})
    assert region_ids is not None
    series = np.stack(regional_series)
    predictor_matrix = np.stack(predictors)

    full_slopes = np.empty((EXPECTED_MODELS, EXPECTED_REGIONS), dtype=np.float64)
    full_r2 = np.empty_like(full_slopes)
    full_standard_error = np.empty_like(full_slopes)
    early_slopes = np.empty_like(full_slopes)
    late_slopes = np.empty_like(full_slopes)
    for model_index in range(EXPECTED_MODELS):
        full = helper.fit_matrix(predictor_matrix[model_index], series[model_index])
        early = helper.fit_matrix(predictor_matrix[model_index, EARLY_MASK], series[model_index, EARLY_MASK])
        late = helper.fit_matrix(predictor_matrix[model_index, LATE_MASK], series[model_index, LATE_MASK])
        full_slopes[model_index] = full["slope"]
        full_r2[model_index] = full["rSquared"]
        full_standard_error[model_index] = full["slopeStandardError"]
        early_slopes[model_index] = early["slope"]
        late_slopes[model_index] = late["slope"]

    ensemble = helper.ensemble_summary(full_slopes, institutions)
    split_difference = np.abs(early_slopes - late_slopes)
    split_opposite = (np.sign(early_slopes) != np.sign(late_slopes)).astype(np.uint8)
    arrays: dict[str, np.ndarray] = {
        "models": models,
        "institutions": institutions,
        "years": YEARS,
        "region_ids": region_ids,
        "full_slopes": full_slopes,
        "full_r_squared": full_r2,
        "full_slope_standard_error": full_standard_error,
        "early_slopes": early_slopes,
        "late_slopes": late_slopes,
        "split_absolute_slope_difference": split_difference,
        "split_opposite_signs": split_opposite,
    }
    for key in ("modelMedian", "modelQ05", "modelQ95", "institutionMedian", "institutionQ05", "institutionQ95"):
        arrays[key] = ensemble[key]

    monthly_arrays = load_monthly_arrays(inputs["monthly"])
    if not np.array_equal(monthly_arrays["region_ids"].astype("U16"), region_ids):
        raise RuntimeError("Monthly and exact-week analyses use different region order")
    prefix = "isoWeek2235MonthlyApproximation"
    resolution = {
        "oneModelOneVote": resolution_comparison(
            arrays["modelMedian"], arrays["modelQ05"], arrays["modelQ95"],
            monthly_arrays[f"{prefix}_modelMedian"], monthly_arrays[f"{prefix}_modelQ05"],
            monthly_arrays[f"{prefix}_modelQ95"], helper,
        ),
        "oneInstitutionOneVote": resolution_comparison(
            arrays["institutionMedian"], arrays["institutionQ05"], arrays["institutionQ95"],
            monthly_arrays[f"{prefix}_institutionMedian"], monthly_arrays[f"{prefix}_institutionQ05"],
            monthly_arrays[f"{prefix}_institutionQ95"], helper,
        ),
    }

    comparison = {
        "status": "exact_week_ensemble_complete_era5_pattern_pending",
        "exactWeekTestsPassed": None,
        "views": None,
    }
    if ERA5_PATTERN_PATH.exists():
        era = verified_json(ERA5_PATTERN_PATH)
        if era["status"] == "complete_long_record_pattern_stability_challenge_independent_comparison_pending":
            era_by_region = {row["region"]: float(row["full"]["slope"]) for row in era["regions"]}
            if set(era_by_region) != set(region_ids.tolist()):
                raise RuntimeError("Complete ERA5-Land pattern uses a different region universe")
            era_slopes = np.asarray([era_by_region[region] for region in region_ids])
            views = {
                "oneModelOneVote": helper.comparison_tests(
                    era_slopes, arrays["modelMedian"], arrays["modelQ05"], arrays["modelQ95"], EXPECTED_MODELS
                ),
                "oneInstitutionOneVote": helper.comparison_tests(
                    era_slopes, arrays["institutionMedian"], arrays["institutionQ05"], arrays["institutionQ95"], EXPECTED_INSTITUTIONS
                ),
            }
            comparison = {
                "status": "exact_week_independent_pattern_tests_complete",
                "exactWeekTestsPassed": all(view["passed"] for view in views.values()),
                "era5PatternDigest": era["digest"],
                "views": views,
            }

    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_exact_week_independent_pattern_ensemble",
        "productionRatingsEnabled": 0,
        "purpose": "Fit the frozen full and split-period exact-week regional temperature-to-global-warming patterns for all 29 calendar-compatible canonical NASA model votes.",
        "inputs": {
            "regionalTemperatureExecutionDigest": execution["digest"],
            "globalPredictorEnsembleDigest": inputs["predictors"]["digest"],
            "institutionGroupsDigest": inputs["institutions"]["digest"],
            "calendarCompatibilityDigest": inputs["calendarCompatibility"]["digest"],
            "monthlyAnalysisDigest": inputs["monthly"]["digest"],
        },
        "method": {
            "fullPeriod": [1950, 2022],
            "earlyPeriod": [1950, 1985],
            "latePeriod": [1986, 2022],
            "fit": "Separate ordinary least-squares fits for every canonical model and region using that model's own four-year trailing global anomaly.",
            "canonicalModel": "Average eligible NASA members and grid variants within each canonical model before fitting one model vote.",
            "oneModelOneVote": "Each of the 29 calendar-compatible canonical models contributes one vote.",
            "oneInstitutionOneVote": "Average canonical-model slopes within each of the 21 retained pre-frozen institution groups before each institution contributes one vote.",
            "ensembleInterval": "Type-7 linear 5th–95th percentile interval across the relevant votes.",
        },
        "counts": {
            "models": EXPECTED_MODELS,
            "institutions": EXPECTED_INSTITUTIONS,
            "regions": EXPECTED_REGIONS,
            "years": len(YEARS),
            "modelRegionFits": EXPECTED_MODELS * EXPECTED_REGIONS,
        },
        "contributors": contributor_summary,
        "diagnostics": {
            "modelSlope": helper.summarize_distribution(full_slopes.ravel()),
            "modelMedianRegionalSlope": helper.summarize_distribution(arrays["modelMedian"]),
            "institutionMedianRegionalSlope": helper.summarize_distribution(arrays["institutionMedian"]),
            "negativeModelRegionSlopes": int(np.sum(full_slopes < 0)),
            "rSquaredBelowPointTwo": int(np.sum(full_r2 < 0.2)),
            "splitOppositeSigns": int(np.sum(split_opposite)),
            "splitAbsoluteSlopeDifference": helper.summarize_distribution(split_difference.ravel()),
        },
        "monthlyResolutionComparison": resolution,
        "comparison": comparison,
        "arrayOutput": {
            "path": str(ARRAY_PATH.relative_to(ROOT)),
            "logicalSha256": analysis_logical_digest(arrays),
        },
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Complete ERA5-Land, apply both weighting views under every predeclared test, then propagate only a compatible pattern through the complete mortality endpoint and all 100 bootstrap fits.",
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
        "# NASA NEX exact-week independent-pattern analysis\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The analysis contains {counts['modelRegionFits']:,} full-period exact-week fits across "
        f"{counts['models']} canonical models, {counts['institutions']} institutions and {counts['regions']} regions.\n\n"
        f"Comparison status: **{payload['comparison']['status'].replace('_', ' ')}**.\n\n"
        "This analysis changes zero TULIP axes and zero scores.\n"
    )
    return payload


def main() -> None:
    inputs = {
        "execution": verified_json(EXECUTION_PATH),
        "inventory": verified_json(INVENTORY_PATH),
        "weights": verified_json(WEIGHTS_PATH),
        "mask": verified_json(MASK_PATH),
        "plan": verified_json(PLAN_PATH),
        "calendarCompatibility": verified_json(CALENDAR_COMPATIBILITY_PATH),
        "predictors": verified_json(PREDICTORS_PATH),
        "institutions": verified_json(INSTITUTIONS_PATH),
        "monthly": verified_json(MONTHLY_ANALYSIS_PATH),
    }
    executor = load_module(EXECUTOR_PATH, "nasa_exact_week_executor")
    helper = load_module(MONTHLY_ANALYZER_PATH, "monthly_pattern_analyzer")
    payload, arrays = analyze(inputs, executor, helper)
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
