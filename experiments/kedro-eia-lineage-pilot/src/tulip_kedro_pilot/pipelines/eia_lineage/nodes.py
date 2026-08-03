"""Pure transformation nodes for the EIA lineage pilot."""

from __future__ import annotations

from statistics import fmean
from typing import Any


def validate_contract_snapshot(
    snapshot: dict[str, Any],
    required_fields: list[str],
    adoption_gate: dict[str, Any],
) -> dict[str, Any]:
    """Validate the existing snapshot without changing or repairing it."""
    records = snapshot.get("records")
    failures: list[dict[str, Any]] = []
    if not isinstance(records, list):
        failures.append({"code": "records_missing_or_not_array"})
        records = []

    if snapshot.get("ingestion_job_id") != adoption_gate["expected_ingestion_job_id"]:
        failures.append(
            {
                "code": "unexpected_ingestion_job",
                "expected": adoption_gate["expected_ingestion_job_id"],
                "actual": snapshot.get("ingestion_job_id"),
            }
        )
    if snapshot.get("snapshot_family") != adoption_gate["expected_snapshot_family"]:
        failures.append(
            {
                "code": "unexpected_snapshot_family",
                "expected": adoption_gate["expected_snapshot_family"],
                "actual": snapshot.get("snapshot_family"),
            }
        )
    if len(records) < int(adoption_gate["minimum_records"]):
        failures.append(
            {
                "code": "insufficient_records",
                "minimum": adoption_gate["minimum_records"],
                "actual": len(records),
            }
        )

    for index, record in enumerate(records):
        missing = [field for field in required_fields if record.get(field) is None]
        if missing:
            failures.append(
                {"code": "record_fields_missing", "record_index": index, "fields": missing}
            )
        completeness = record.get("demand_completeness_pct")
        if isinstance(completeness, (int, float)) and completeness < float(
            adoption_gate["minimum_completeness_pct"]
        ):
            failures.append(
                {
                    "code": "record_below_completeness_gate",
                    "record_id": record.get("record_id"),
                    "minimum": adoption_gate["minimum_completeness_pct"],
                    "actual": completeness,
                }
            )

    return {
        "status": "passed" if not failures else "failed",
        "record_count": len(records),
        "required_fields": required_fields,
        "failures": failures,
    }


def summarize_grid_snapshot(
    snapshot: dict[str, Any], validation: dict[str, Any]
) -> dict[str, Any]:
    """Build a bounded descriptive summary only after contract validation."""
    if validation["status"] != "passed":
        raise ValueError(f"EIA snapshot failed validation: {validation['failures']}")

    records = snapshot["records"]
    completeness = [float(record["demand_completeness_pct"]) for record in records]
    peak_demand = [float(record["peak_demand_mwh_per_hour"]) for record in records]
    gas_share = [float(record["gas_generation_share_pct"]) for record in records]
    return {
        "respondent_count": len(records),
        "respondent_ids": sorted(record["respondent_id"] for record in records),
        "window_start_utc": min(record["window_start_utc"] for record in records),
        "window_end_utc": max(record["window_end_utc"] for record in records),
        "minimum_demand_completeness_pct": min(completeness),
        "maximum_peak_demand_mwh_per_hour": max(peak_demand),
        "mean_gas_generation_share_pct": round(fmean(gas_share), 2),
        "interpretation_boundary": (
            "Descriptive summary of the retained EIA-930 balancing-authority panel; "
            "not a national causal estimate or forecast."
        ),
    }


def build_adoption_evaluation(
    snapshot: dict[str, Any],
    validation: dict[str, Any],
    summary: dict[str, Any],
) -> dict[str, Any]:
    """Produce the pilot artifact used to compare Kedro with the Node workflow."""
    return {
        "pilot": "tulip_kedro_eia_lineage_v1",
        "status": validation["status"],
        "source_snapshot": {
            "ingestion_job_id": snapshot.get("ingestion_job_id"),
            "snapshot_family": snapshot.get("snapshot_family"),
            "version": snapshot.get("version"),
            "captured_at": snapshot.get("captured_at"),
            "updated_at": snapshot.get("updated_at"),
            "record_count": snapshot.get("record_count"),
        },
        "validation": validation,
        "summary": summary,
        "adoption_boundary": (
            "This pilot evaluates pipeline orchestration and lineage only. "
            "The production Node job remains authoritative."
        ),
    }
