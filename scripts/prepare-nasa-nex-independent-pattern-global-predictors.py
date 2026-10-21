#!/usr/bin/env python3
"""Inventory exact-member global temperature predictors for the NASA challenge.

The source record contains annual global and IPCC-region temperatures processed
for the IPCC AR6 figure-data release.  This script admits a predictor only when
one exact NASA-selected model/member file contains every year needed for the
1850–1900 baseline and the fixed 1950–2022 analysis.  It never substitutes a
different member, model mean, or observational series.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import tempfile
import time

import requests


ROOT = Path(__file__).resolve().parents[1]
INVENTORY = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
OUTPUT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-global-predictors.json"
REPORT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-global-predictors-report.md"
DEFAULT_METADATA = ROOT / "tmp/tulip-independent-pattern/zenodo-record-6386979.json"
DEFAULT_CACHE = ROOT / "tmp/tulip-independent-pattern/global-predictor-files"
RECORD_API = "https://zenodo.org/api/records/6386979"
RECORD_URL = "https://zenodo.org/records/6386979"
EXPECTED_BUNDLE_KEY = "data/raw/cmip6-science-unimelb/figure_y_ssp245_cmip_data.zip"
EXPECTED_BUNDLE_SIZE = 12_827_001
EXPECTED_BUNDLE_MD5 = "1fdcb0049708aef0310e909d22028621"
BASELINE_YEARS = tuple(range(1850, 1901))
ANALYSIS_YEARS = tuple(range(1950, 2023))
TRAILING_YEARS = 4
SPECIFICATION = re.compile(r"^\s*THISFILE_(\w+)\s*=\s*(.+?)\s*$")


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_digest(path: Path, algorithm: str) -> str:
    digest = hashlib.new(algorithm)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def download_bytes(url: str, destination: Path, expected_size: int | None = None, expected_md5: str | None = None) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    failures = []
    for attempt in range(1, 6):
        with tempfile.NamedTemporaryFile(prefix=destination.name + ".", suffix=".part", dir=destination.parent, delete=False) as temporary:
            temp_path = Path(temporary.name)
            try:
                with requests.get(
                    url,
                    stream=True,
                    timeout=(30, 180),
                    headers={"User-Agent": "TULIP-global-predictor-inventory/1.0"},
                ) as response:
                    response.raise_for_status()
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            temporary.write(chunk)
                temporary.flush()
                if expected_size is not None and temp_path.stat().st_size != expected_size:
                    raise ValueError(f"expected {expected_size} bytes, received {temp_path.stat().st_size}")
                if expected_md5 is not None and file_digest(temp_path, "md5") != expected_md5:
                    raise ValueError("downloaded file MD5 does not match the immutable Zenodo record")
                temp_path.replace(destination)
                return
            except Exception as error:  # a retry always starts from byte zero
                failures.append(f"attempt {attempt}: {type(error).__name__}: {error}")
            finally:
                temp_path.unlink(missing_ok=True)
        time.sleep(2)
    raise RuntimeError("Checksum-pinned source could not be retrieved cleanly; " + " | ".join(failures))


def load_record_metadata(path: Path, download_if_missing: bool) -> tuple[dict, dict]:
    if not path.exists():
        if not download_if_missing:
            raise FileNotFoundError(f"Record metadata missing: {path}")
        download_bytes(RECORD_API, path)
    raw = path.read_bytes()
    metadata = json.loads(raw)
    if metadata.get("id") != 6_386_979:
        raise ValueError(f"Unexpected Zenodo record id: {metadata.get('id')}")
    files = metadata.get("files", [])
    if len(files) < 1_000:
        raise ValueError(f"Zenodo record file inventory is unexpectedly short: {len(files)}")
    bundle = next((entry for entry in files if entry.get("key") == EXPECTED_BUNDLE_KEY), None)
    if bundle is None:
        raise ValueError("Expected SSP2-4.5 source bundle is absent from the Zenodo record")
    if bundle.get("size") != EXPECTED_BUNDLE_SIZE or bundle.get("checksum") != f"md5:{EXPECTED_BUNDLE_MD5}":
        raise ValueError("Zenodo record's SSP2-4.5 source-bundle identity changed")
    return metadata, {
        "path": str(path),
        "bytes": len(raw),
        "sha256": hashlib.sha256(raw).hexdigest(),
        "recordId": metadata["id"],
        "fileEntries": len(files),
        "expectedBundle": {
            "key": EXPECTED_BUNDLE_KEY,
            "bytes": EXPECTED_BUNDLE_SIZE,
            "md5": EXPECTED_BUNDLE_MD5,
        },
    }


def materialize_record_file(entry: dict, cache_dir: Path, download_if_missing: bool) -> Path:
    checksum = entry.get("checksum", "")
    if not checksum.startswith("md5:"):
        raise ValueError(f"Unsupported or missing checksum for {entry.get('key')}")
    expected_md5 = checksum.removeprefix("md5:")
    expected_size = int(entry["size"])
    cache_path = cache_dir / f"{hashlib.sha256(entry['key'].encode()).hexdigest()}.MAG"
    valid = cache_path.exists() and cache_path.stat().st_size == expected_size and file_digest(cache_path, "md5") == expected_md5
    if not valid:
        if cache_path.exists():
            cache_path.unlink()
        if not download_if_missing:
            raise FileNotFoundError(f"Checksum-pinned predictor file missing from cache: {entry['key']}")
        download_bytes(entry["links"]["self"], cache_path, expected_size, expected_md5)
    return cache_path


def path_identity(name: str) -> tuple[str, str] | None:
    parts = name.split("/")
    try:
        experiment_index = parts.index("ssp245")
    except ValueError:
        return None
    if experiment_index < 1 or experiment_index + 1 >= len(parts) or not name.endswith(".MAG"):
        return None
    return parts[experiment_index - 1], parts[experiment_index + 1]


def parse_mag(content: bytes, source_name: str) -> dict:
    text = content.decode("utf-8")
    lines = text.splitlines()
    specifications: dict[str, str | int] = {}
    columns: list[str] | None = None
    column_line = None
    for index, line in enumerate(lines):
        match = SPECIFICATION.match(line.rstrip(","))
        if match:
            raw = match.group(2).strip().strip("'")
            specifications[match.group(1)] = int(raw) if raw.isdigit() else raw
        if line.lstrip().startswith("YEARS "):
            columns = line.split()
            column_line = index
            break
    if columns is None or column_line is None:
        raise ValueError(f"{source_name}: YEARS header missing")
    if "WORLD" not in columns:
        raise ValueError(f"{source_name}: WORLD column missing")
    world_index = columns.index("WORLD")
    series: dict[int, float] = {}
    for line in lines[column_line + 1:]:
        values = line.split()
        if not values:
            continue
        try:
            year = int(values[0])
        except ValueError:
            continue
        if len(values) != len(columns):
            raise ValueError(f"{source_name}: {year} has {len(values)} columns, expected {len(columns)}")
        world = float(values[world_index])
        if not math.isfinite(world) or not 180.0 <= world <= 330.0:
            raise ValueError(f"{source_name}: implausible WORLD value {world} for {year}")
        if year in series:
            raise ValueError(f"{source_name}: duplicate year {year}")
        series[year] = world
    if not series:
        raise ValueError(f"{source_name}: no annual data rows")
    expected_rows = specifications.get("DATAROWS")
    if expected_rows is not None and expected_rows != len(series):
        raise ValueError(f"{source_name}: DATAROWS={expected_rows}, parsed={len(series)}")
    expected_columns = specifications.get("DATACOLUMNS")
    if expected_columns is not None and expected_columns != len(columns) - 1:
        raise ValueError(f"{source_name}: DATACOLUMNS={expected_columns}, parsed={len(columns) - 1}")
    ordered_years = sorted(series)
    if ordered_years != list(range(ordered_years[0], ordered_years[-1] + 1)):
        raise ValueError(f"{source_name}: annual series has internal gaps")
    return {
        "firstYear": ordered_years[0],
        "lastYear": ordered_years[-1],
        "yearCount": len(ordered_years),
        "columns": columns,
        "worldKelvinByYear": series,
    }


def predictor_from_mag(parsed: dict) -> dict:
    series = parsed["worldKelvinByYear"]
    required = set(BASELINE_YEARS)
    for year in ANALYSIS_YEARS:
        required.update(range(year - TRAILING_YEARS + 1, year + 1))
    missing = sorted(required - set(series))
    if missing:
        return {
            "eligible": False,
            "reason": "required_baseline_or_analysis_years_missing",
            "missingYears": missing,
        }
    baseline = sum(series[year] for year in BASELINE_YEARS) / len(BASELINE_YEARS)
    predictors = []
    for year in ANALYSIS_YEARS:
        trailing = sum(series[value] for value in range(year - TRAILING_YEARS + 1, year + 1)) / TRAILING_YEARS
        predictors.append({
            "year": year,
            "fourYearTrailingGlobalAnomalyC": round(trailing - baseline, 9),
        })
    return {
        "eligible": True,
        "reason": None,
        "missingYears": [],
        "baseline1850To1900Kelvin": round(baseline, 9),
        "analysisYearCount": len(predictors),
        "predictors": predictors,
    }


def selected_identities(inventory: dict) -> list[dict]:
    identities: dict[tuple[str, str], dict] = {}
    for model in inventory["models"]:
        if not model["eligible"]:
            continue
        for member in model["eligibleMembers"]:
            key = (model["canonicalModel"], member)
            row = identities.setdefault(key, {
                "canonicalModel": model["canonicalModel"],
                "member": member,
                "nasaCatalogueEntries": [],
            })
            row["nasaCatalogueEntries"].append(model["model"])
    for row in identities.values():
        row["nasaCatalogueEntries"].sort()
    return [identities[key] for key in sorted(identities)]


def build_payload(inventory: dict, metadata: dict, metadata_identity: dict, cache_dir: Path, download_if_missing: bool) -> dict:
    identities = selected_identities(inventory)
    by_identity: dict[tuple[str, str], list[dict]] = {}
    for entry in metadata["files"]:
        name = entry.get("key", "")
        if "/extracted/" not in name:
            continue
        identity = path_identity(name)
        if identity is not None:
            by_identity.setdefault(identity, []).append(entry)
    records = []
    for selected in identities:
        key = (selected["canonicalModel"], selected["member"])
        entries = sorted(by_identity.get(key, []), key=lambda entry: entry["key"])
        candidates = []
        for entry in entries:
            file_path = materialize_record_file(entry, cache_dir, download_if_missing)
            content = file_path.read_bytes()
            parsed = parse_mag(content, entry["key"])
            predictor = predictor_from_mag(parsed)
            candidates.append({
                "path": entry["key"],
                "bytes": entry["size"],
                "sourceMd5": entry["checksum"].removeprefix("md5:"),
                "firstYear": parsed["firstYear"],
                "lastYear": parsed["lastYear"],
                "yearCount": parsed["yearCount"],
                "eligible": predictor["eligible"],
                "reason": predictor["reason"],
                "missingYears": predictor["missingYears"],
                "contentSha256": hashlib.sha256(content).hexdigest(),
                "predictor": predictor if predictor["eligible"] else None,
            })
        eligible_candidates = [candidate for candidate in candidates if candidate["eligible"]]
        if not entries:
            status = "exact_model_member_absent_from_frozen_record"
        elif not eligible_candidates:
            status = "exact_model_member_present_but_required_years_missing"
        elif len(eligible_candidates) > 1:
            status = "multiple_complete_exact_files_ambiguous"
        else:
            status = "complete_exact_member_predictor"
        selected_candidate = eligible_candidates[0] if len(eligible_candidates) == 1 else None
        records.append({
            **selected,
            "status": status,
            "candidateCount": len(candidates),
            "eligibleCandidateCount": len(eligible_candidates),
            "selectedPath": selected_candidate["path"] if selected_candidate else None,
            "baseline1850To1900Kelvin": selected_candidate["predictor"]["baseline1850To1900Kelvin"] if selected_candidate else None,
            "predictors": selected_candidate["predictor"]["predictors"] if selected_candidate else [],
            "candidates": [{candidate_key: value for candidate_key, value in candidate.items() if candidate_key != "predictor"} for candidate in candidates],
        })
    complete = [record for record in records if record["status"] == "complete_exact_member_predictor"]
    payload = {
        "version": "tulip_nasa_nex_independent_pattern_global_predictors_2026_09_26_v1",
        "preparedOn": "2026-09-26",
        "status": "exact_member_global_predictor_inventory_complete_regional_execution_pending",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze and validate exact-member global temperature predictors before the NASA regional-pattern result is visible.",
        "sources": {
            "zenodoRecord": RECORD_URL,
            "zenodoRecordApi": RECORD_API,
            "recordMetadata": metadata_identity,
            "nasaSelectionInventory": str(INVENTORY.relative_to(ROOT)),
            "nasaSelectionInventoryDigest": inventory["digest"],
        },
        "method": {
            "scenario": "ssp245",
            "baselineYears": [BASELINE_YEARS[0], BASELINE_YEARS[-1]],
            "analysisYears": [ANALYSIS_YEARS[0], ANALYSIS_YEARS[-1]],
            "predictor": "Each model/member's four-year trailing annual global near-surface temperature anomaly relative to its own 1850–1900 WORLD mean.",
            "admissionRule": "Admit exactly one file for the preselected canonical model and member only when it contains every required baseline and analysis year. Do not substitute another member, ensemble mean, model, or observed series.",
            "gridVariantRule": "NASA GFDL-CM4 and GFDL-CM4_gr2 catalogue entries share one canonical GFDL-CM4 r1i1p1f1 predictor and one eventual model vote.",
        },
        "counts": {
            "selectedCatalogueEntries": inventory["counts"]["eligibleModels"],
            "selectedIndependentIdentities": len(records),
            "completeExactMemberPredictors": len(complete),
            "incompleteExactMemberPredictors": len(records) - len(complete),
            "predictorYearRows": sum(len(record["predictors"]) for record in complete),
        },
        "records": records,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Retrieve traceable exact-member global histories for incomplete identities, build independent 0.25-degree regional weights, and execute the fixed comparison only after the ERA5-Land record is complete.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write_outputs(payload: dict) -> None:
    OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
    unresolved = [record for record in payload["records"] if record["status"] != "complete_exact_member_predictor"]
    REPORT.write_text(
        "# NASA NEX independent-pattern global predictors\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The frozen NASA selection contains {payload['counts']['selectedCatalogueEntries']} eligible catalogue entries and "
        f"{payload['counts']['selectedIndependentIdentities']} unique canonical model/member identities. The immutable IPCC AR6 figure-data "
        f"record supplies a complete, exact-member 1850–2022 global predictor for "
        f"{payload['counts']['completeExactMemberPredictors']}; {payload['counts']['incompleteExactMemberPredictors']} remain "
        "explicitly unresolved and receive no substituted predictor.\n\n"
        "Each admitted series is the four-year trailing WORLD temperature anomaly relative to that same member's 1850–1900 mean. "
        "Every selected source file is checked against its immutable Zenodo byte count and MD5 before parsing. The record also retains the published bundle identity as a provenance cross-check.\n\n"
        + ("Unresolved identities:\n\n" + "\n".join(
            f"- {row['canonicalModel']} {row['member']}: {row['status']}" for row in unresolved
        ) + "\n\n" if unresolved else "")
        + "This inventory changes zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--metadata", type=Path, default=DEFAULT_METADATA)
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE)
    parser.add_argument("--download-if-missing", action="store_true")
    args = parser.parse_args()
    metadata, metadata_identity = load_record_metadata(args.metadata, args.download_if_missing)
    inventory = json.loads(INVENTORY.read_text())
    payload = build_payload(inventory, metadata, metadata_identity, args.cache_dir, args.download_if_missing)
    write_outputs(payload)
    print(json.dumps({
        "output": str(OUTPUT.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
