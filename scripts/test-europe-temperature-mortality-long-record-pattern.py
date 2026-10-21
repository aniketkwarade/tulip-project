#!/usr/bin/env python3
"""Offline tests for the predeclared long-record regional-pattern analysis."""

from __future__ import annotations

import importlib.util
import csv
import json
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts/analyze-europe-temperature-mortality-long-record-pattern.py"
SPEC = importlib.util.spec_from_file_location("tulip_long_record_pattern", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


points = [
    {"year": year, "gmst": float(year - 1950), "temperature": 10 + 2 * (year - 1950)}
    for year in range(1950, 1960)
]
result = MODULE.fit(points)
assert result["years"] == 10
assert result["firstYear"] == 1950
assert result["lastYear"] == 1959
assert abs(result["intercept"] - 10) < 1e-12
assert abs(result["slope"] - 2) < 1e-12
assert result["slopeStandardError"] < 1e-12
assert abs(result["rSquared"] - 1) < 1e-12

summary = MODULE.summarize([1, 2, 3, 4, 5])
assert summary["minimum"] == 1
assert summary["median"] == 3
assert summary["maximum"] == 5

partial_manifest = {
    "status": "partial_resumable_long_record_retrieval",
    "execution": {"completedYears": list(range(1950, 1960)), "completedYearCount": 10, "regionYearRows": 9710},
    "decision": {"axesAdmitted": 0, "scoresChanged": 0},
}
partial_manifest["digest"] = MODULE.canonical_digest(partial_manifest)
try:
    MODULE.verify_complete_manifest(partial_manifest)
except RuntimeError as error:
    assert "all 73 annual checkpoints" in str(error)
else:
    raise AssertionError("Partial long-record manifest was incorrectly accepted")

assert MODULE.FULL_YEARS == tuple(range(1950, 2023))
assert MODULE.EARLY_YEARS == tuple(range(1950, 1986))
assert MODULE.LATE_YEARS == tuple(range(1986, 2023))
assert len(MODULE.EARLY_YEARS) == 36
assert len(MODULE.LATE_YEARS) == 37

(ROOT / "tmp").mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(dir=ROOT / "tmp") as directory:
    csv_path = Path(directory) / "synthetic-complete.csv"
    region_ids = [f"region-{index:03d}" for index in range(MODULE.EXPECTED_REGIONS)]
    gmst_rows = [
        {"year": year, "anomalyC": (year - 1950) / 72}
        for year in MODULE.FULL_YEARS
    ]
    with csv_path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["region_id", "year", "summer_mean_c"])
        writer.writeheader()
        for region_index, region_id in enumerate(region_ids):
            offset = region_index / 1000
            for row in gmst_rows:
                writer.writerow({
                    "region_id": region_id,
                    "year": row["year"],
                    "summer_mean_c": 10 + offset + 1.5 * row["anomalyC"],
                })
    manifest = {
        "version": "synthetic-complete-retrieval",
        "status": "complete_all_70883_region_year_summer_means_execution_validation_pending",
        "execution": {
            "completedYears": list(MODULE.FULL_YEARS),
            "completedYearCount": 73,
            "regionYearRows": MODULE.EXPECTED_ROWS,
            "remainingYears": [],
        },
        "output": {
            "path": str(csv_path.relative_to(ROOT)),
            "rows": MODULE.EXPECTED_ROWS,
            "sha256": MODULE.file_sha256(csv_path),
        },
        "decision": {"axesAdmitted": 0, "scoresChanged": 0},
    }
    manifest["digest"] = MODULE.canonical_digest(manifest)
    regional_plan = {
        "version": "synthetic-regional-plan",
        "inputAudit": {"hadcrut5": {
            "trailingSeries1950To2022": gmst_rows,
            "warming2022CRelativeTo1850To1900": 1.2,
        }},
    }
    coverage = {
        "version": "synthetic-coverage",
        "files": {"fullPanel": {"regionIds": region_ids}},
    }
    payload = MODULE.analyze(manifest, regional_plan, coverage)
    diagnostics = payload["diagnostics"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    assert diagnostics["responseRegions"] == 971
    assert diagnostics["responseRegionYears"] == 70_883
    assert diagnostics["negativeFullPeriodSlopes"] == 0
    assert diagnostics["rSquaredBelowPointTwo"] == 0
    assert diagnostics["splitOppositeSigns"] == 0
    assert abs(diagnostics["slope"]["median"] - 1.5) < 1e-12
    without_digest = dict(payload)
    digest = without_digest.pop("digest")
    assert MODULE.canonical_digest(without_digest) == digest

print("European temperature–mortality long-record pattern analysis passed: fixed periods, regression arithmetic, summaries, partial refusal and a complete 70,883-row synthetic run are verified offline.")
