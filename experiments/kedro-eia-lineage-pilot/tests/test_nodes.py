"""Unit tests for the pilot's contract boundary."""

import unittest

from tulip_kedro_pilot.pipelines.eia_lineage.nodes import (
    summarize_grid_snapshot,
    validate_contract_snapshot,
)


class EiaLineageNodeTests(unittest.TestCase):
    required = [
        "record_id",
        "respondent_id",
        "window_start_utc",
        "window_end_utc",
        "observed_demand_intervals",
        "demand_completeness_pct",
        "peak_demand_mwh_per_hour",
        "gas_generation_share_pct",
    ]
    gate = {
        "minimum_records": 1,
        "minimum_completeness_pct": 95,
        "expected_ingestion_job_id": "fetch_eia_hourly_grid_metrics",
        "expected_snapshot_family": "northstar_contract_bound_ingestion",
    }

    def valid_snapshot(self):
        return {
            "ingestion_job_id": "fetch_eia_hourly_grid_metrics",
            "snapshot_family": "northstar_contract_bound_ingestion",
            "records": [
                {
                    "record_id": "eia930_TEST",
                    "respondent_id": "TEST",
                    "window_start_utc": "2026-01-01T00",
                    "window_end_utc": "2026-01-01T23",
                    "observed_demand_intervals": 24,
                    "demand_completeness_pct": 100,
                    "peak_demand_mwh_per_hour": 1000,
                    "gas_generation_share_pct": 40,
                }
            ],
        }

    def test_valid_snapshot_passes_and_summarizes(self):
        snapshot = self.valid_snapshot()
        validation = validate_contract_snapshot(snapshot, self.required, self.gate)
        self.assertEqual(validation["status"], "passed")
        summary = summarize_grid_snapshot(snapshot, validation)
        self.assertEqual(summary["respondent_count"], 1)
        self.assertEqual(summary["mean_gas_generation_share_pct"], 40)

    def test_missing_field_fails_closed(self):
        snapshot = self.valid_snapshot()
        del snapshot["records"][0]["gas_generation_share_pct"]
        validation = validate_contract_snapshot(snapshot, self.required, self.gate)
        self.assertEqual(validation["status"], "failed")
        self.assertEqual(validation["failures"][0]["code"], "record_fields_missing")


if __name__ == "__main__":
    unittest.main()
