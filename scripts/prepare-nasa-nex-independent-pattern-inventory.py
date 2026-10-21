#!/usr/bin/env python3
"""Inventory NASA NEX daily tas files for the independent pattern challenge."""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import requests


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
REPORT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-inventory-report.md"
CATALOG_ROOT = "https://ds.nccs.nasa.gov/thredds/catalog/AMES/NEX/GDDP-CMIP6"
NAMESPACE = {
    "t": "http://www.unidata.ucar.edu/namespaces/thredds/InvCatalog/v1.0",
    "x": "http://www.w3.org/1999/xlink",
}
YEAR = re.compile(r"_(\d{4})_v[^/]+\.nc$")
HISTORICAL_YEARS = tuple(range(1950, 2015))
SSP245_YEARS = tuple(range(2015, 2023))
MODEL_VOTE_ALIASES = {
    # NASA publishes the second GFDL-CM4 target grid as a separate catalogue
    # root. It remains the same source model and cannot receive a second vote.
    "GFDL-CM4_gr2": "GFDL-CM4",
}


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def parse_catalog(url: str) -> ET.Element:
    response = requests.get(url, timeout=60, headers={"User-Agent": "TULIP-NEX-inventory/1.0"})
    response.raise_for_status()
    return ET.fromstring(response.content)


def refs(path: str) -> list[str]:
    root = parse_catalog(f"{CATALOG_ROOT}/{path}/catalog.xml")
    return sorted({
        item.attrib[f"{{{NAMESPACE['x']}}}title"]
        for item in root.findall(".//t:catalogRef", NAMESPACE)
    })


def tas_files(model: str, experiment: str, member: str, expected_years: tuple[int, ...]) -> dict:
    path = f"{model}/{experiment}/{member}/tas"
    root = parse_catalog(f"{CATALOG_ROOT}/{path}/catalog.xml")
    rows = []
    duplicates: dict[int, list[str]] = {}
    by_year: dict[int, list[dict]] = {}
    for item in root.findall(".//t:dataset", NAMESPACE):
        url_path = item.attrib.get("urlPath")
        if not url_path:
            continue
        match = YEAR.search(url_path)
        if not match:
            continue
        year = int(match.group(1))
        if year not in expected_years:
            continue
        size_element = item.find("t:dataSize", NAMESPACE)
        date_element = item.find("t:date[@type='modified']", NAMESPACE)
        row = {
            "year": year,
            "name": item.attrib.get("name"),
            "urlPath": url_path,
            "catalogueSize": float(size_element.text) if size_element is not None else None,
            "catalogueSizeUnits": size_element.attrib.get("units") if size_element is not None else None,
            "modified": date_element.text if date_element is not None else None,
        }
        by_year.setdefault(year, []).append(row)
    for year, values in by_year.items():
        if len(values) == 1:
            rows.append(values[0])
        else:
            duplicates[year] = [value["urlPath"] for value in values]
    present = {row["year"] for row in rows}
    missing = sorted(set(expected_years) - present)
    return {
        "experiment": experiment,
        "requiredYears": [expected_years[0], expected_years[-1]],
        "requiredYearCount": len(expected_years),
        "presentYearCount": len(rows),
        "missingYears": missing,
        "duplicateYears": duplicates,
        "files": sorted(rows, key=lambda row: row["year"]),
    }


def audit_model(model: str) -> dict:
    canonical_model = MODEL_VOTE_ALIASES.get(model, model)
    experiments = refs(model)
    if "historical" not in experiments or "ssp245" not in experiments:
        return {
            "model": model,
            "canonicalModel": canonical_model,
            "eligible": False,
            "experiments": experiments,
            "sharedMembers": [],
            "eligibleMembers": [],
            "members": [],
            "reason": "historical_or_ssp245_experiment_missing",
        }
    historical_members = refs(f"{model}/historical")
    ssp245_members = refs(f"{model}/ssp245")
    shared = sorted(set(historical_members) & set(ssp245_members))
    members = []
    for member in shared:
        historical_variables = refs(f"{model}/historical/{member}")
        ssp245_variables = refs(f"{model}/ssp245/{member}")
        if "tas" not in historical_variables or "tas" not in ssp245_variables:
            members.append({
                "member": member,
                "eligible": False,
                "historicalVariables": historical_variables,
                "ssp245Variables": ssp245_variables,
                "reason": "tas_missing_from_historical_or_ssp245",
            })
            continue
        historical = tas_files(model, "historical", member, HISTORICAL_YEARS)
        ssp245 = tas_files(model, "ssp245", member, SSP245_YEARS)
        eligible = not historical["missingYears"] and not historical["duplicateYears"] \
            and not ssp245["missingYears"] and not ssp245["duplicateYears"]
        members.append({
            "member": member,
            "eligible": eligible,
            "historical": historical,
            "ssp245": ssp245,
            "reason": None if eligible else "required_year_missing_or_duplicated",
        })
    eligible_members = [row["member"] for row in members if row["eligible"]]
    return {
        "model": model,
        "canonicalModel": canonical_model,
        "eligible": bool(eligible_members),
        "experiments": experiments,
        "historicalMembers": historical_members,
        "ssp245Members": ssp245_members,
        "sharedMembers": shared,
        "eligibleMembers": eligible_members,
        "members": members,
        "reason": None if eligible_members else "no_shared_member_with_complete_required_tas_years",
    }


def main() -> None:
    models = refs("")
    if len(models) != 35 or len(set(models)) != 35:
        raise RuntimeError(f"Expected 35 unique root models; received {len(models)}")
    audited = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(audit_model, model): model for model in models}
        for future in as_completed(futures):
            audited.append(future.result())
    audited.sort(key=lambda row: row["model"])
    eligible = [row for row in audited if row["eligible"]]
    model_votes = sorted({row["canonicalModel"] for row in eligible})
    selected_file_count = sum(
        member[experiment]["presentYearCount"]
        for model in eligible
        for member in model["members"] if member["eligible"]
        for experiment in ("historical", "ssp245")
    )
    payload = {
        "version": "tulip_nasa_nex_gddp_cmip6_independent_pattern_inventory_2026_09_26_v2",
        "preparedOn": "2026-09-26",
        "status": "complete_model_and_file_inventory_independent_pattern_execution_pending",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze the NASA NEX model/member/file universe before any model is compared with the ERA5-Land regional pattern.",
        "source": {
            "catalogue": f"{CATALOG_ROOT}/catalog.xml",
            "dataset": "https://www.nccs.nasa.gov/data-collections/nex-gddp-cmip6/",
            "paper": "https://doi.org/10.1038/s41597-022-01393-4",
        },
        "selection": {
            "historicalYears": [HISTORICAL_YEARS[0], HISTORICAL_YEARS[-1]],
            "ssp245Years": [SSP245_YEARS[0], SSP245_YEARS[-1]],
            "requiredYearsPerMember": len(HISTORICAL_YEARS) + len(SSP245_YEARS),
            "variable": "tas",
            "frequency": "daily",
            "rule": "Use every shared historical/ssp245 member with one and only one tas file for every required year. Average members and NASA grid variants within the canonical source model before the one-model-one-vote comparison.",
            "modelVoteAliases": MODEL_VOTE_ALIASES,
        },
        "counts": {
            "catalogueModels": len(audited),
            "eligibleModels": len(eligible),
            "independentModelVotes": len(model_votes),
            "excludedModels": len(audited) - len(eligible),
            "eligibleMembers": sum(len(row["eligibleMembers"]) for row in eligible),
            "selectedFiles": selected_file_count,
        },
        "models": audited,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Resolve the daily-tas metadata inconsistency, construct independent-grid area weights for all 971 regions, obtain compatible model-global temperature predictors, then execute the fixed full/split-period comparison after ERA5-Land completion.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    excluded = [f"{row['model']}: {row['reason']}" for row in audited if not row["eligible"]]
    REPORT.write_text(
        "# NASA NEX-GDDP-CMIP6 independent-pattern inventory\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The frozen catalogue contains {payload['counts']['catalogueModels']} models. "
        f"{payload['counts']['eligibleModels']} catalogue entries have at least one shared historical/SSP2-4.5 member "
        f"with all 73 required daily-tas files; {payload['counts']['excludedModels']} are excluded by "
        "the predeclared completeness rule. The usable entries represent "
        f"{payload['counts']['independentModelVotes']} independent model votes because GFDL-CM4 and "
        "its `_gr2` grid variant are combined before voting.\n\n"
        f"Selected members: {payload['counts']['eligibleMembers']}; selected annual files: "
        f"{payload['counts']['selectedFiles']:,}.\n\n"
        + ("Excluded models:\n\n" + "\n".join(f"- {value}" for value in excluded) + "\n\n" if excluded else "")
        + "This inventory changes zero TULIP axes and zero scores.\n"
    )
    print(json.dumps({
        "output": str(OUTPUT.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "excluded": excluded,
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
