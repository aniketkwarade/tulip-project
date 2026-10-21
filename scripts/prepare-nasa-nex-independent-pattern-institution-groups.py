#!/usr/bin/env python3
"""Freeze one-institution-one-vote groups for the NASA exact-week ensemble."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
INVENTORY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
ROUTES_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-routes.json"
PREDICTORS_PATH = CALIBRATION_DIR / "independent-pattern-global-predictor-ensemble.json"
OUTPUT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-institution-groups.json"
REPORT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-institution-groups-report.md"
VERSION = "tulip_nasa_nex_gddp_cmip6_independent_pattern_institution_groups_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest", None)
    if not digest or canonical_digest(content) != digest:
        raise RuntimeError(f"Digest failed for {path.relative_to(ROOT)}")
    return payload


def build() -> dict:
    inventory = verified_json(INVENTORY_PATH)
    routes = verified_json(ROUTES_PATH)
    predictors = verified_json(PREDICTORS_PATH)
    eligible_models = {
        row["canonicalModel"]: row
        for row in inventory["models"]
        if row["eligible"]
    }
    route_by_model = {row["canonicalModel"]: row for row in routes["routes"]}
    predictor_by_model = {row["canonicalModel"]: row for row in predictors["records"]}
    expected = set(eligible_models)
    if len(expected) != 32 or set(route_by_model) != expected or set(predictor_by_model) != expected:
        raise RuntimeError("NASA model, route and predictor universes are not the same 32 identities")

    records = []
    for model in sorted(expected):
        inventory_rows = [
            row for row in inventory["models"]
            if row["eligible"] and row["canonicalModel"] == model
        ]
        route = route_by_model[model]
        member = predictor_by_model[model]["member"]
        members = sorted({member_id for row in inventory_rows for member_id in row["eligibleMembers"]})
        if members != [member] or route["member"] != member:
            raise RuntimeError(f"Member identity differs across frozen sources for {model}")
        institution = route["historical"]["institutionId"]
        if not institution or route["historical"]["sourceId"] != model:
            raise RuntimeError(f"Historical institution route is incomplete for {model}")
        records.append({
            "canonicalModel": model,
            "member": member,
            "institutionId": institution,
            "nasaCatalogueEntries": sorted(row["model"] for row in inventory_rows),
        })

    grouped: dict[str, list[str]] = {}
    for record in records:
        grouped.setdefault(record["institutionId"], []).append(record["canonicalModel"])
    groups = [
        {"institutionId": institution, "canonicalModels": sorted(models), "modelCount": len(models)}
        for institution, models in sorted(grouped.items())
    ]
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_frozen_one_institution_one_vote_groups",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze the institution grouping for the NASA exact-week sensitivity before the complete regional ensemble is visible.",
        "inputs": {
            "inventory": str(INVENTORY_PATH.relative_to(ROOT)),
            "inventoryDigest": inventory["digest"],
            "monthlyRoutes": str(ROUTES_PATH.relative_to(ROOT)),
            "monthlyRoutesDigest": routes["digest"],
            "globalPredictors": str(PREDICTORS_PATH.relative_to(ROOT)),
            "globalPredictorsDigest": predictors["digest"],
        },
        "method": {
            "institutionIdentity": "Use the institution_id on the exact historical CMIP6 route frozen for the same canonical model and member before regional results were calculated.",
            "oneModelOneVote": "Average NASA catalogue grid variants and eligible members within each canonical model first; each of the 32 canonical models then receives one vote.",
            "oneInstitutionOneVote": "Average the canonical-model slopes listed in each frozen institution group first; each of the 23 institutions then receives one vote.",
            "prohibited": "Do not regroup models after inspecting ERA5 agreement or exact-week slopes.",
        },
        "counts": {
            "canonicalModels": len(records),
            "institutions": len(groups),
            "singleModelInstitutions": sum(group["modelCount"] == 1 for group in groups),
            "multiModelInstitutions": sum(group["modelCount"] > 1 for group in groups),
            "maximumModelsPerInstitution": max(group["modelCount"] for group in groups),
        },
        "records": records,
        "groups": groups,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Complete the exact-week regional execution and report every frozen one-model and one-institution ensemble diagnostic.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# NASA NEX exact-week institution groups\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The 32 frozen canonical model votes map to {counts['institutions']} fixed CMIP6 institutions. "
        f"{counts['multiModelInstitutions']} institutions contain more than one model; their model slopes will be averaged before each institution receives one vote.\n\n"
        "This grouping was fixed before the complete exact-week result and changes zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
