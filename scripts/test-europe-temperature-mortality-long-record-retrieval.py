#!/usr/bin/env python3
"""Offline unit tests for the resumable ERA5-Land long-record executor."""

from __future__ import annotations

import asyncio
import importlib.util
import contextlib
import csv
import hashlib
import json
import tempfile
from pathlib import Path
from unittest.mock import patch

import numpy as np
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "scripts/execute-europe-temperature-mortality-long-record-retrieval.py"
SPEC = importlib.util.spec_from_file_location("tulip_long_record", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(MODULE)


def test_summer_selection() -> None:
    for year in range(1950, 2022):
        source = MODULE.year_sources(year, "https://example.invalid")[0]
        start, stop, hours = MODULE.source_selected_slice(source, year)
        assert hours == MODULE.EXPECTED_SUMMER_HOURS
        assert stop - start == MODULE.EXPECTED_SUMMER_HOURS
    for boundary_year in (1976, 2004):
        start, stop = MODULE.summer_window(boundary_year)
        assert start.day == 24
        assert stop - start == pd.Timedelta(hours=MODULE.EXPECTED_SUMMER_HOURS)
    sources_2022 = MODULE.year_sources(2022, "https://example.invalid")
    assert len(sources_2022) >= 5
    assert sum(MODULE.source_selected_slice(source, 2022)[2] for source in sources_2022) == MODULE.EXPECTED_SUMMER_HOURS


def test_sparse_aggregation() -> None:
    weights = MODULE.SparseWeights(
        cell_indices=np.array([10, 11, 12], dtype=np.int64),
        offsets=np.array([0, 1, 3, 4], dtype=np.int64),
        region_indices=np.array([0, 0, 1, 1], dtype=np.int32),
        areas=np.array([1.0, 3.0, 1.0, 1.0], dtype=np.float64),
        region_ids=np.array(["A", "B"]),
    )
    regional, denominators = MODULE.aggregate_cell_means(
        np.array([10.0, 20.0, 30.0], dtype=np.float64), weights
    )
    np.testing.assert_allclose(regional, [17.5, 25.0])
    np.testing.assert_allclose(denominators, [4.0, 2.0])
    regional_missing, denominators_missing = MODULE.aggregate_cell_means(
        np.array([10.0, np.nan, 30.0], dtype=np.float64), weights
    )
    np.testing.assert_allclose(regional_missing, [10.0, 30.0])
    np.testing.assert_allclose(denominators_missing, [1.0, 1.0])


def test_public_s3_transport_mapping() -> None:
    source = (
        "http://openmeteo.s3.amazonaws.com/data/copernicus_era5_land/"
        "temperature_2m/year_1969.om"
    )
    with tempfile.TemporaryDirectory() as directory, patch.object(MODULE.fsspec, "open") as mocked:
        marker = object()
        mocked.return_value = marker
        result = MODULE.source_open_file(source, Path(directory))
    assert result is marker
    args, kwargs = mocked.call_args
    assert args[0] == (
        "blockcache::s3://openmeteo/data/copernicus_era5_land/"
        "temperature_2m/year_1969.om"
    )
    assert kwargs["block_size"] == MODULE.SOURCE_BLOCK_SIZE
    assert kwargs["s3"]["anon"] is True
    assert kwargs["s3"]["default_block_size"] == MODULE.SOURCE_BLOCK_SIZE
    assert kwargs["s3"]["config_kwargs"]["read_timeout"] == 90
    assert kwargs["s3"]["config_kwargs"]["retries"]["max_attempts"] == 5
    try:
        MODULE.source_open_file("https://example.invalid/source.om", Path(directory))
    except RuntimeError as error:
        assert "Unsupported long-record source host" in str(error)
    else:
        raise AssertionError("unsupported source host was admitted")


def test_direct_s3_transport_mapping() -> None:
    source = (
        "http://openmeteo.s3.amazonaws.com/data/copernicus_era5_land/"
        "temperature_2m/year_1969.om"
    )
    filesystem = object()
    marker = object()

    class FakeReader:
        @staticmethod
        def from_fsspec(received_filesystem, path):
            assert received_filesystem is filesystem
            assert path == (
                "openmeteo/data/copernicus_era5_land/"
                "temperature_2m/year_1969.om"
            )
            return contextlib.nullcontext(marker)

    with patch.object(MODULE, "OmFileReader", FakeReader):
        with MODULE.source_reader(
            source,
            Path("unused"),
            MODULE.TRANSPORT_DIRECT_S3,
            filesystem,
        ) as result:
            assert result is marker

    with patch.object(MODULE.fsspec, "filesystem") as mocked:
        mocked.return_value = filesystem
        assert MODULE.direct_s3_filesystem() is filesystem
    args, kwargs = mocked.call_args
    assert args == ("s3",)
    assert kwargs["anon"] is True
    assert kwargs["config_kwargs"]["read_timeout"] == 90
    assert kwargs["config_kwargs"]["retries"]["max_attempts"] == 5

    with patch.object(MODULE.fsspec, "filesystem") as mocked:
        mocked.return_value = filesystem
        assert MODULE.direct_s3_async_filesystem() is filesystem
    args, kwargs = mocked.call_args
    assert args == ("s3",)
    assert kwargs["anon"] is True
    assert kwargs["asynchronous"] is True
    assert kwargs["config_kwargs"]["read_timeout"] == 90


def test_bounded_async_direct_reader() -> None:
    cells = np.array([
        2 * MODULE.GRID_NLON + 6,
        2 * MODULE.GRID_NLON + 7,
        3 * MODULE.GRID_NLON + 30,
    ], dtype=np.int64)
    weights = MODULE.SparseWeights(
        cell_indices=cells,
        offsets=np.arange(4, dtype=np.int64),
        region_indices=np.arange(3, dtype=np.int32),
        areas=np.ones(3, dtype=np.float64),
        region_ids=np.array(["A", "B", "C"]),
    )
    runs = [(2, 6, 12), (3, 30, 36)]
    cell_sums = np.zeros(3, dtype=np.float64)
    cell_counts = np.zeros(3, dtype=np.int32)
    filesystem = object()
    max_active = 0
    active = 0
    closed = False

    class FakeSession:
        async def __aexit__(self, *_args):
            nonlocal closed
            closed = True

    class FakeFilesystem:
        _s3 = FakeSession()

    fake_filesystem = FakeFilesystem()

    class FakeReaderInstance:
        shape = (MODULE.GRID_NLAT, MODULE.GRID_NLON, 10)
        chunks = (1, 6, 4)
        scale_factor = 0.1

        async def read_array(self, selection):
            nonlocal active, max_active
            active += 1
            max_active = max(max_active, active)
            await asyncio.sleep(0)
            active -= 1
            latitude, longitude, time = selection
            values = np.empty((1, longitude.stop - longitude.start, time.stop - time.start))
            for index, lon in enumerate(range(longitude.start, longitude.stop)):
                values[0, index, :] = latitude.start * 100 + lon
            return values

        def close(self):
            pass

    class FakeReader:
        @staticmethod
        async def from_fsspec(received_filesystem, path):
            assert received_filesystem is fake_filesystem
            assert path == "openmeteo/data/example.om"
            return FakeReaderInstance()

    source = {
        "key": "year_test",
        "url": MODULE.OPENMETEO_HTTP_PREFIX + "data/example.om",
    }
    with (
        patch.object(MODULE, "direct_s3_async_filesystem", return_value=fake_filesystem),
        patch.object(MODULE, "OmFileReaderAsync", FakeReader),
    ):
        result = asyncio.run(MODULE.consume_direct_s3_source(
            source,
            1,
            3,
            runs,
            weights,
            cell_sums,
            cell_counts,
            2000,
            2,
        ))

    assert result["readConcurrency"] == 2
    assert result["readValues"] == 6
    assert result["finiteValues"] == 6
    assert max_active == 2
    assert closed
    np.testing.assert_array_equal(cell_counts, [2, 2, 2])
    np.testing.assert_allclose(cell_sums, [412.0, 414.0, 660.0])


def test_http_blockcache_transport_mapping() -> None:
    source = (
        "http://openmeteo.s3.amazonaws.com/data/copernicus_era5_land/"
        "temperature_2m/year_1969.om"
    )
    with tempfile.TemporaryDirectory() as directory, patch.object(MODULE.fsspec, "open") as mocked:
        marker = object()
        mocked.return_value = marker
        result = MODULE.source_open_http_file(source, Path(directory))
    assert result is marker
    args, kwargs = mocked.call_args
    assert args == (f"blockcache::{source}",)
    assert kwargs["block_size"] == MODULE.SOURCE_BLOCK_SIZE
    assert kwargs["blockcache"]["cache_storage"] == directory


def test_declared_run_subset() -> None:
    plan = {"sparsePlan": {"rowRuns": [
        {"latitudeIndex": 2, "longitudeChunkRuns": [[1, 4]]},
        {"latitudeIndex": 3, "longitudeChunkRuns": [[5, 6]]},
    ]}}
    cells = np.array([
        2 * MODULE.GRID_NLON + 6,
        2 * MODULE.GRID_NLON + 7,
        2 * MODULE.GRID_NLON + 18,
        3 * MODULE.GRID_NLON + 30,
    ], dtype=np.int64)
    assert MODULE.weighted_row_runs(plan, cells) == [(2, 6, 12), (2, 18, 24), (3, 30, 36)]
    columns, positions = MODULE.positions_for_run(cells, 2, 6, 12)
    np.testing.assert_array_equal(columns, [0, 1])
    np.testing.assert_array_equal(positions, [0, 1])


def test_parallel_write_guards() -> None:
    with tempfile.TemporaryDirectory() as directory:
        target = Path(directory) / "manifest.json"
        first = MODULE.unique_temporary_path(target)
        second = MODULE.unique_temporary_path(target)
        assert first != second
        assert first.parent == target.parent
        with MODULE.manifest_lock(Path(directory) / ".lock"):
            MODULE.atomic_text(target, '{"complete": true}\n')
        assert target.read_text() == '{"complete": true}\n'
        assert not list(target.parent.glob(".manifest.json.*.tmp"))


def test_checkpoint_validation_guards() -> None:
    (ROOT / "tmp").mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(dir=ROOT / "tmp") as directory:
        checkpoint_root = Path(directory)
        plan = {"version": "test-plan", "digest": "test-plan-digest"}
        area_weights = {
            "version": "test-weights",
            "digest": "test-weights-digest",
            "weightsOutput": {"arrays": {"cellIndices": 1}},
        }
        rows = [
            {"region_id": f"region-{index:03d}", "year": 1950, "summer_mean_c": 15.0}
            for index in range(971)
        ]
        check = {
            "year": 1950,
            "regions": 971,
            "selectedIsoWeeks": [22, 35],
            "selectedHours": MODULE.EXPECTED_SUMMER_HOURS,
            "finiteWeightedCells": 1,
            "allMissingWeightedCells": 0,
            "partiallyMissingWeightedCells": 0,
            "regionsWithoutFiniteValues": 0,
            "minimumRegionalSummerMeanC": 15.0,
            "maximumRegionalSummerMeanC": 16.0,
            "minimumFiniteRegionAreaSquareMetres": 1.0,
            "sourceObjects": [{"contentLength": 1, "etag": "test-etag"}],
            "sourceIdentityDigest": "test-source-digest",
            "cacheAllocatedBytesBeforeCleanup": 1,
        }
        written = MODULE.write_checkpoint(
            1950, rows, check, plan, area_weights, checkpoint_root
        )
        loaded = MODULE.load_checkpoint(1950, plan, area_weights, checkpoint_root)
        assert loaded is not None
        assert loaded["digest"] == written["digest"]

        _, json_path = MODULE.checkpoint_paths(1950, checkpoint_root)
        tampered = json.loads(json_path.read_text())
        tampered["check"]["selectedHours"] -= 1
        json_path.write_text(json.dumps(tampered))
        assert MODULE.load_checkpoint(1950, plan, area_weights, checkpoint_root) is None


def test_local_execution_artifact_if_present() -> None:
    manifest_path = MODULE.OUTPUT_PATH
    if not manifest_path.exists():
        return
    manifest = json.loads(manifest_path.read_text())
    assert manifest["version"] == MODULE.VERSION
    assert manifest["status"] in {
        "partial_resumable_long_record_retrieval",
        "complete_all_70883_region_year_summer_means_execution_validation_pending",
    }
    assert manifest["productionRatingsEnabled"] == 0
    assert manifest["decision"]["axesAdmitted"] == 0
    assert manifest["decision"]["scoresChanged"] == 0
    completed_years = manifest["execution"]["completedYears"]
    assert manifest["execution"]["regionYearRows"] == len(completed_years) * 971
    assert len(completed_years) + len(manifest["execution"]["remainingYears"]) == 73
    assert set(completed_years).isdisjoint(manifest["execution"]["remainingYears"])
    assert manifest["execution"]["hoursPerRegionYear"] == MODULE.EXPECTED_SUMMER_HOURS
    combined_path = ROOT / manifest["output"]["path"]
    assert hashlib.sha256(combined_path.read_bytes()).hexdigest() == manifest["output"]["sha256"]
    with combined_path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == manifest["output"]["rows"]
    assert len({(row["region_id"], int(row["year"])) for row in rows}) == len(rows)
    area_weights = json.loads(MODULE.AREA_WEIGHTS_PATH.read_text())
    weights = MODULE.load_weights(area_weights)
    expected_regions = set(weights.region_ids.tolist())
    for year in completed_years:
        checkpoint = MODULE.load_checkpoint(
            year,
            json.loads(MODULE.PLAN_PATH.read_text()),
            area_weights,
            MODULE.CHECKPOINT_ROOT,
        )
        assert checkpoint is not None
        checkpoint_without_digest = dict(checkpoint)
        checkpoint_digest = checkpoint_without_digest.pop("digest")
        assert MODULE.canonical_digest(checkpoint_without_digest) == checkpoint_digest
        check = checkpoint["check"]
        assert check["selectedHours"] == MODULE.EXPECTED_SUMMER_HOURS
        assert check["regions"] == 971
        assert check["finiteWeightedCells"] + check["allMissingWeightedCells"] == len(weights.cell_indices)
        assert check["partiallyMissingWeightedCells"] == 0
        assert check["regionsWithoutFiniteValues"] == 0
        assert -90 < check["minimumRegionalSummerMeanC"] < check["maximumRegionalSummerMeanC"] < 70
        assert check["sourceObjects"]
        assert all(source["contentLength"] > 0 and source["etag"] for source in check["sourceObjects"])
        assert checkpoint["decision"] == {"axesAdmitted": 0, "scoresChanged": 0}
        year_rows = [row for row in rows if int(row["year"]) == year]
        assert len(year_rows) == 971
        assert {row["region_id"] for row in year_rows} == expected_regions
        assert all(np.isfinite(float(row["summer_mean_c"])) for row in year_rows)
    for check in manifest["yearChecks"]:
        assert check["selectedHours"] == MODULE.EXPECTED_SUMMER_HOURS
        assert check["regions"] == 971
        assert check["partiallyMissingWeightedCells"] == 0
        assert check["regionsWithoutFiniteValues"] == 0


test_summer_selection()
test_sparse_aggregation()
test_public_s3_transport_mapping()
test_direct_s3_transport_mapping()
test_bounded_async_direct_reader()
test_http_blockcache_transport_mapping()
test_declared_run_subset()
test_parallel_write_guards()
test_checkpoint_validation_guards()
test_local_execution_artifact_if_present()
print("European temperature–mortality long-record executor passed: ISO summer selection, bounded async direct and cached transport mapping, sparse weights, declared-chunk boundaries, parallel write guards and every present checkpoint integrity invariant are verified without a network read.")
