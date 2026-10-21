#!/usr/bin/env python3
"""Retrieve the declared ERA5-Land validation inputs after CDS licence acceptance.

The request definition is generated and audited by
prepare-europe-heat-regional-pattern-ingestion.mjs. This script deliberately
does not accept licences or alter CDS account settings.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import cdsapi


ROOT = Path(__file__).resolve().parents[1]
PLAN = ROOT / "artifacts/tulip-calibration-2026-09-22/internal-europe-heat-regional-pattern-ingestion.json"
DATASET = "derived-era5-land-daily-statistics"


def digest(path: Path) -> str:
    checksum = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            checksum.update(chunk)
    return checksum.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=("validation", "historical"), default="validation")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "tmp/tulip-regional-pattern/era5-land-daily")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    plan = json.loads(PLAN.read_text())
    key = "stage1ValidationRequests" if args.stage == "validation" else "stage2HistoricalRequests"
    requests = plan["era5LandRetrieval"][key]
    args.output_dir.mkdir(parents=True, exist_ok=True)
    client = cdsapi.Client()
    manifest = []

    for item in requests:
        target = args.output_dir / item["output"]
        if target.exists() and not args.overwrite:
            manifest.append({"path": str(target.relative_to(ROOT)), "bytes": target.stat().st_size, "sha256": digest(target), "status": "reused"})
            continue
        try:
            client.retrieve(DATASET, item["request"], str(target))
        except Exception as error:
            message = str(error)
            if "required licences not accepted" in message.lower():
                raise SystemExit(
                    "Copernicus has not accepted this account for the ERA5-Land daily dataset. "
                    "Accept the CC-BY terms at "
                    "https://cds.climate.copernicus.eu/datasets/derived-era5-land-daily-statistics"
                    "?tab=download#manage-licences and rerun this command."
                ) from None
            raise
        manifest.append({"path": str(target.relative_to(ROOT)), "bytes": target.stat().st_size, "sha256": digest(target), "status": "retrieved"})

    manifest_path = args.output_dir / f"{args.stage}-manifest.json"
    manifest_path.write_text(json.dumps({"dataset": DATASET, "stage": args.stage, "files": manifest}, indent=2) + "\n")
    print(json.dumps({"manifest": str(manifest_path.relative_to(ROOT)), "files": len(manifest)}, indent=2))


if __name__ == "__main__":
    main()
