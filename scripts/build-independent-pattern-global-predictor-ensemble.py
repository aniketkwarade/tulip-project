#!/usr/bin/env python3
"""Merge immutable-figure and executed Pangeo predictors without substitution."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
FIGURE_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-global-predictors.json"
PANGEO_PATH = CALIBRATION_DIR / "pangeo-cmip6-global-predictor-execution.json"
OUTPUT_PATH = CALIBRATION_DIR / "independent-pattern-global-predictor-ensemble.json"
REPORT_PATH = CALIBRATION_DIR / "independent-pattern-global-predictor-ensemble-report.md"
VERSION = "tulip_independent_pattern_global_predictor_ensemble_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_payload(path: Path) -> dict:
    payload = json.loads(path.read_text())
    without_digest = dict(payload)
    digest = without_digest.pop("digest", None)
    if not digest or canonical_digest(without_digest) != digest:
        raise RuntimeError(f"Input digest failed: {path}")
    return payload


def build(figure: dict, pangeo: dict) -> dict:
    if figure["counts"]["selectedIndependentIdentities"] != 32:
        raise RuntimeError("Frozen independent identity universe is not 32")
    pangeo_by_identity = {
        (row["identity"]["canonicalModel"], row["identity"]["member"]): row
        for row in pangeo["records"]
    }
    if len(pangeo_by_identity) != len(pangeo["records"]):
        raise RuntimeError("Duplicate Pangeo predictor identity")
    records = []
    missing = []
    for row in figure["records"]:
        identity = (row["canonicalModel"], row["member"])
        if row["status"] == "complete_exact_member_predictor":
            records.append({
                "canonicalModel": row["canonicalModel"],
                "member": row["member"],
                "nasaCatalogueEntries": row["nasaCatalogueEntries"],
                "source": "immutable_ipcc_ar6_figure_data_record",
                "baseline1850To1900Kelvin": row["baseline1850To1900Kelvin"],
                "predictors": row["predictors"],
                "sourceIdentity": {
                    "selectedPath": row["selectedPath"],
                    "contentSha256": row["candidates"][0]["contentSha256"],
                },
            })
            continue
        replacement = pangeo_by_identity.get(identity)
        if replacement is None:
            missing.append({
                "canonicalModel": row["canonicalModel"],
                "member": row["member"],
                "reason": "exact_member_pangeo_execution_incomplete",
            })
            continue
        if replacement["status"] != "complete_exact_member_pangeo_predictor":
            raise RuntimeError(f"Pangeo record is not complete for {identity}")
        records.append({
            "canonicalModel": row["canonicalModel"],
            "member": row["member"],
            "nasaCatalogueEntries": row["nasaCatalogueEntries"],
            "source": "frozen_pangeo_esgf_exact_member_execution",
            "baseline1850To1900Kelvin": replacement["baseline1850To1900Kelvin"],
            "predictors": replacement["predictors"],
            "sourceIdentity": {
                **replacement["identity"],
                "routeDigest": replacement["routeDigest"],
                "executionDigest": replacement["digest"],
                "areaCheck": replacement["areaCheck"],
                "figureDataCrosscheck": replacement["figureDataCrosscheck"],
                "scenarioFileCrosscheck": replacement.get("scenarioFileCrosscheck"),
            },
        })
    records.sort(key=lambda item: (item["canonicalModel"], item["member"]))
    identities = {(row["canonicalModel"], row["member"]) for row in records}
    if len(identities) != len(records):
        raise RuntimeError("Merged predictor ensemble contains duplicate identities")
    for row in records:
        if [item["year"] for item in row["predictors"]] != list(range(1950, 2023)):
            raise RuntimeError(f"Incomplete predictor years for {row['canonicalModel']}")
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_32_model_global_predictor_ensemble" if not missing else "partial_global_predictor_ensemble",
        "productionRatingsEnabled": 0,
        "purpose": "Provide one exact-member four-year global-temperature predictor per preselected independent model identity without choosing sources after viewing regional results.",
        "inputs": {
            "figureDataVersion": figure["version"],
            "figureDataDigest": figure["digest"],
            "pangeoExecutionVersion": pangeo["version"],
            "pangeoExecutionDigest": pangeo["digest"],
        },
        "selection": {
            "identityUniverse": "The 32 independent model/member votes frozen by the NASA NEX inventory.",
            "precedence": "Use the immutable IPCC AR6 figure-data exact-member predictor when complete; otherwise require the already-frozen exact historical and SSP2-4.5 Pangeo route for the same model and member.",
            "prohibitedSubstitutions": ["different ensemble member", "model average", "HadCRUT5", "related model family"],
        },
        "counts": {
            "expectedIndependentIdentities": 32,
            "completeIndependentPredictors": len(records),
            "remainingIndependentPredictors": len(missing),
            "immutableFigureDataPredictors": sum(row["source"] == "immutable_ipcc_ar6_figure_data_record" for row in records),
            "pangeoExecutedPredictors": sum(row["source"] == "frozen_pangeo_esgf_exact_member_execution" for row in records),
            "predictorYearRows": len(records) * 73,
        },
        "missing": missing,
        "records": records,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Require all 32 predictors, complete the independent regional-temperature calculation, and apply the predeclared comparison tests before any endpoint promotion.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# Independent-pattern global-predictor ensemble\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"{counts['completeIndependentPredictors']} of {counts['expectedIndependentIdentities']} exact model/member predictors are complete: "
        f"{counts['immutableFigureDataPredictors']} from the immutable IPCC figure-data record and "
        f"{counts['pangeoExecutedPredictors']} from the frozen raw CMIP6 routes.\n\n"
        "This merge changes zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build(verified_payload(FIGURE_PATH), verified_payload(PANGEO_PATH))
    write(payload)
    print(json.dumps({"output": str(OUTPUT_PATH.relative_to(ROOT)), "counts": payload["counts"], "digest": payload["digest"]}, indent=2))


if __name__ == "__main__":
    main()
