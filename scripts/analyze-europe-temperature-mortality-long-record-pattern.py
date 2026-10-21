#!/usr/bin/env python3
"""Analyze the complete 1950–2022 regional temperature pattern.

The analysis is deliberately gated on all 70,883 region-year means. It records
the predeclared full and split-period diagnostics but cannot admit a TULIP axis
or score without an independent pattern comparison and matched endpoints.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
MANIFEST_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval.json"
REGIONAL_PLAN_PATH = CALIBRATION_DIR / "internal-europe-heat-regional-pattern-ingestion.json"
COVERAGE_PATH = CALIBRATION_DIR / "europe-temperature-mortality-coverage-enumeration.json"
OUTPUT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-pattern-analysis.json"
REPORT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-pattern-analysis-report.md"

VERSION = "tulip_europe_temperature_mortality_long_record_pattern_analysis_2026_09_26_v1"
FULL_YEARS = tuple(range(1950, 2023))
EARLY_YEARS = tuple(range(1950, 1986))
LATE_YEARS = tuple(range(1986, 2023))
EXPECTED_REGIONS = 971
EXPECTED_ROWS = 70_883


def canonical_digest(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def file_sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def type7_quantile(values: list[float], probability: float) -> float:
    if not values:
        raise ValueError("Cannot calculate a quantile of an empty collection")
    ordered = sorted(values)
    position = (len(ordered) - 1) * probability
    lower = math.floor(position)
    fraction = position - lower
    upper_value = ordered[min(lower + 1, len(ordered) - 1)]
    return ordered[lower] + (upper_value - ordered[lower]) * fraction


def summarize(values: list[float]) -> dict:
    finite = [value for value in values if math.isfinite(value)]
    if not finite:
        raise ValueError("No finite values to summarize")
    return {
        "minimum": min(finite),
        "q025": type7_quantile(finite, 0.025),
        "q25": type7_quantile(finite, 0.25),
        "median": type7_quantile(finite, 0.5),
        "q75": type7_quantile(finite, 0.75),
        "q975": type7_quantile(finite, 0.975),
        "maximum": max(finite),
    }


def fit(points: list[dict]) -> dict:
    if len(points) < 8:
        raise ValueError(f"At least eight paired years are required; received {len(points)}")
    ordered = sorted(points, key=lambda point: point["year"])
    mean_x = sum(point["gmst"] for point in ordered) / len(ordered)
    mean_y = sum(point["temperature"] for point in ordered) / len(ordered)
    sum_xx = sum((point["gmst"] - mean_x) ** 2 for point in ordered)
    if sum_xx <= 0:
        raise ValueError("Regional regression has no GMST variation")
    sum_xy = sum(
        (point["gmst"] - mean_x) * (point["temperature"] - mean_y)
        for point in ordered
    )
    slope = sum_xy / sum_xx
    intercept = mean_y - slope * mean_x
    residual_sum_squares = sum(
        (point["temperature"] - (intercept + slope * point["gmst"])) ** 2
        for point in ordered
    )
    total_sum_squares = sum((point["temperature"] - mean_y) ** 2 for point in ordered)
    return {
        "years": len(ordered),
        "firstYear": ordered[0]["year"],
        "lastYear": ordered[-1]["year"],
        "intercept": intercept,
        "slope": slope,
        "slopeStandardError": math.sqrt(residual_sum_squares / (len(ordered) - 2) / sum_xx),
        "rSquared": 1 - residual_sum_squares / total_sum_squares if total_sum_squares > 0 else None,
    }


def verify_complete_manifest(manifest: dict) -> Path:
    manifest_without_digest = dict(manifest)
    digest = manifest_without_digest.pop("digest", None)
    if not digest or canonical_digest(manifest_without_digest) != digest:
        raise RuntimeError("Long-record manifest digest failed")
    execution = manifest.get("execution", {})
    if manifest.get("status") != "complete_all_70883_region_year_summer_means_execution_validation_pending":
        raise RuntimeError("Long-record analysis requires all 73 annual checkpoints")
    if execution.get("completedYears") != list(FULL_YEARS):
        raise RuntimeError("Completed-year sequence is not exactly 1950–2022")
    if execution.get("completedYearCount") != 73 or execution.get("regionYearRows") != EXPECTED_ROWS:
        raise RuntimeError("Long-record manifest does not contain exactly 70,883 region-year means")
    if execution.get("remainingYears"):
        raise RuntimeError("Long-record manifest still has remaining years")
    if manifest.get("decision", {}).get("axesAdmitted") != 0 or manifest.get("decision", {}).get("scoresChanged") != 0:
        raise RuntimeError("Retrieval artifact unexpectedly changed a TULIP axis or score")
    csv_path = ROOT / manifest["output"]["path"]
    if manifest["output"].get("rows") != EXPECTED_ROWS or file_sha256(csv_path) != manifest["output"].get("sha256"):
        raise RuntimeError("Combined long-record CSV failed row-count or checksum validation")
    return csv_path


def analyze(manifest: dict, regional_plan: dict, coverage: dict) -> dict:
    csv_path = verify_complete_manifest(manifest)
    region_ids = coverage["files"]["fullPanel"]["regionIds"]
    if len(region_ids) != EXPECTED_REGIONS or len(set(region_ids)) != EXPECTED_REGIONS:
        raise RuntimeError("Mortality-panel region universe is not exactly 971 unique identifiers")
    gmst_rows = regional_plan["inputAudit"]["hadcrut5"]["trailingSeries1950To2022"]
    gmst_by_year = {int(row["year"]): float(row["anomalyC"]) for row in gmst_rows}
    if set(gmst_by_year) != set(FULL_YEARS):
        raise RuntimeError("HadCRUT5 predictor does not cover exactly 1950–2022")

    rows_by_region = {region_id: [] for region_id in region_ids}
    keys: set[tuple[str, int]] = set()
    with csv_path.open(newline="") as handle:
        for row in csv.DictReader(handle):
            region = row["region_id"]
            year = int(row["year"])
            temperature = float(row["summer_mean_c"])
            if region not in rows_by_region or year not in gmst_by_year or not math.isfinite(temperature):
                raise RuntimeError(f"Unexpected long-record row: {region}, {year}")
            key = (region, year)
            if key in keys:
                raise RuntimeError(f"Duplicate long-record row: {region}, {year}")
            keys.add(key)
            rows_by_region[region].append({
                "year": year,
                "temperature": temperature,
                "gmst": gmst_by_year[year],
            })
    if len(keys) != EXPECTED_ROWS:
        raise RuntimeError(f"Expected {EXPECTED_ROWS:,} unique region-years, received {len(keys):,}")

    warming_2022 = float(regional_plan["inputAudit"]["hadcrut5"]["warming2022CRelativeTo1850To1900"])
    regions = []
    for region in region_ids:
        points = rows_by_region[region]
        if {point["year"] for point in points} != set(FULL_YEARS):
            raise RuntimeError(f"Region {region} does not contain every year from 1950 through 2022")
        full = fit(points)
        early = fit([point for point in points if point["year"] in EARLY_YEARS])
        late = fit([point for point in points if point["year"] in LATE_YEARS])
        regions.append({
            "region": region,
            "full": full,
            "early": early,
            "late": late,
            "splitAbsoluteSlopeDifference": abs(early["slope"] - late["slope"]),
            "splitOppositeSigns": math.copysign(1, early["slope"]) != math.copysign(1, late["slope"]),
            "impliedLocalWarming2022C": full["slope"] * warming_2022,
        })

    diagnostics = {
        "responseRegions": EXPECTED_REGIONS,
        "responseRegionYears": EXPECTED_ROWS,
        "slope": summarize([row["full"]["slope"] for row in regions]),
        "slopeStandardError": summarize([row["full"]["slopeStandardError"] for row in regions]),
        "rSquared": summarize([row["full"]["rSquared"] for row in regions]),
        "splitAbsoluteSlopeDifference": summarize([row["splitAbsoluteSlopeDifference"] for row in regions]),
        "impliedLocalWarming2022C": summarize([row["impliedLocalWarming2022C"] for row in regions]),
        "negativeFullPeriodSlopes": sum(row["full"]["slope"] < 0 for row in regions),
        "rSquaredBelowPointTwo": sum(row["full"]["rSquared"] < 0.2 for row in regions),
        "splitOppositeSigns": sum(row["splitOppositeSigns"] for row in regions),
    }
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_long_record_pattern_stability_challenge_independent_comparison_pending",
        "productionRatingsEnabled": 0,
        "purpose": "Apply the predeclared full and split-period diagnostics to the complete 1950–2022 ERA5-Land regional record without admitting a TULIP axis or score.",
        "inputs": {
            "retrievalVersion": manifest["version"],
            "retrievalDigest": manifest["digest"],
            "regionalPlanVersion": regional_plan["version"],
            "coverageVersion": coverage["version"],
            "combinedCsvSha256": manifest["output"]["sha256"],
        },
        "method": {
            "fullPeriod": [1950, 2022],
            "earlyChallengePeriod": [1950, 1985],
            "lateChallengePeriod": [1986, 2022],
            "predictor": "HadCRUT5 four-year trailing global anomaly, inclusive of each assessment year",
            "outcome": "ERA5-Land regional mean temperature over ISO weeks 22–35",
            "fit": "Separate ordinary least-squares fit for every region; no missing-data imputation, score weighting or region-specific tuning.",
        },
        "diagnostics": diagnostics,
        "regions": regions,
        "decision": {
            "status": "independent_pattern_comparison_and_terminal_endpoints_pending",
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Compare the regional pattern with an independent model or author output, then propagate compatible source-removal temperatures through the complete mortality endpoint and all 100 bootstrap fits. A separate compatible ecosystem endpoint remains required.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write_outputs(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    diagnostics = payload["diagnostics"]
    REPORT_PATH.write_text(
        "# European temperature–mortality long-record pattern analysis\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The complete record contains {diagnostics['responseRegionYears']:,} region-year means across "
        f"{diagnostics['responseRegions']:,} regions. The predeclared full and split-period fits are complete. "
        f"{diagnostics['negativeFullPeriodSlopes']} full-period slopes are negative, "
        f"{diagnostics['rSquaredBelowPointTwo']} fits have R² below 0.2 and "
        f"{diagnostics['splitOppositeSigns']} regions reverse slope sign between the fixed split periods.\n\n"
        "This diagnostic changes zero TULIP axes and zero scores. Independent pattern comparison, the complete matched human endpoint and a compatible ecosystem endpoint remain required.\n"
    )


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text())
    regional_plan = json.loads(REGIONAL_PLAN_PATH.read_text())
    coverage = json.loads(COVERAGE_PATH.read_text())
    payload = analyze(manifest, regional_plan, coverage)
    write_outputs(payload)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "diagnostics": payload["diagnostics"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
