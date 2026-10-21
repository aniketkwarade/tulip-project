#!/usr/bin/env python3
"""Validate and reconstruct the Europe heat regional warming pattern.

Run validation before historical reconstruction. Validation selects one spatial
aggregation and daily timezone against the pinned 103-region public sample. A
historical run is refused unless that validation passes its predeclared gates.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import tempfile
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import geopandas as gpd
import numpy as np
import pandas as pd
import xarray as xr
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
PLAN_PATH = CALIBRATION_DIR / "internal-europe-heat-regional-pattern-ingestion.json"
DEFAULT_DATA_DIR = ROOT / "tmp/tulip-regional-pattern/era5-land-daily"
DEFAULT_OUTPUT = CALIBRATION_DIR / "internal-europe-heat-regional-pattern-reconstruction.json"
METHODS = ("area_intersection", "cell_centre_coslat", "cell_centre_unweighted")


@dataclass(frozen=True)
class GridDefinition:
    latitudes: np.ndarray
    longitudes: np.ndarray


def sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def load_plan() -> dict:
    return json.loads(PLAN_PATH.read_text())


def source_path(plan: dict, source_id: str) -> Path:
    return ROOT / plan["sourceSummary"][source_id]["localPath"]


def prepare_regions(plan: dict) -> gpd.GeoDataFrame:
    source = plan["sourceSummary"]["nuts2010Boundaries"]
    boundary_path = ROOT / source["localPath"]
    if sha256(boundary_path) != source["sha256"]:
        raise RuntimeError("NUTS boundary checksum does not match the ingestion plan")

    metadata = pd.read_csv(source_path(plan, "publicRegionMetadata"), dtype=str)
    requested = set(metadata["location"])
    boundaries = gpd.read_file(boundary_path)
    italy = boundaries[(boundaries["CNTR_CODE"] == "IT") & (boundaries["LEVL_CODE"].astype(int) == 3)].copy()
    italy = italy.rename(columns={"NUTS_ID": "location"})[["location", "geometry"]]
    direct = italy[italy["location"].isin(requested)].copy()

    aggregate = plan["inputAudit"]["regionJoin"]["documentedAggregate"]
    components = italy[italy["location"].isin(aggregate["componentCodes"])]
    if len(components) != len(aggregate["componentCodes"]):
        raise RuntimeError("Sardinia component geometry is incomplete")
    sardinia = gpd.GeoDataFrame(
        {"location": [aggregate["outputCode"]]},
        geometry=[components.geometry.union_all()],
        crs=italy.crs,
    )
    regions = pd.concat([direct, sardinia], ignore_index=True)
    regions = gpd.GeoDataFrame(regions, geometry="geometry", crs=italy.crs).sort_values("location").reset_index(drop=True)
    if len(regions) != 103 or set(regions["location"]) != requested:
        raise RuntimeError("The declared region crosswalk does not resolve all 103 public regions")
    if not regions.geometry.is_valid.all() or regions.geometry.is_empty.any():
        raise RuntimeError("Resolved region geometry is invalid or empty")
    return regions


def coordinate_name(dataset: xr.Dataset, candidates: Iterable[str]) -> str:
    for candidate in candidates:
        if candidate in dataset.coords or candidate in dataset.dims:
            return candidate
    raise RuntimeError(f"Missing coordinate; tried {tuple(candidates)}")


def select_temperature(dataset: xr.Dataset) -> tuple[xr.DataArray, str, str, str]:
    lat_name = coordinate_name(dataset, ("latitude", "lat"))
    lon_name = coordinate_name(dataset, ("longitude", "lon"))
    time_name = coordinate_name(dataset, ("valid_time", "time", "date"))
    preferred = ("t2m", "2m_temperature", "tas")
    variable = next((name for name in preferred if name in dataset.data_vars), None)
    if variable is None:
        variable = next((name for name, data in dataset.data_vars.items() if lat_name in data.dims and lon_name in data.dims), None)
    if variable is None:
        raise RuntimeError("No gridded temperature variable found")
    data = dataset[variable].squeeze(drop=True)
    extras = [dimension for dimension in data.dims if dimension not in {time_name, lat_name, lon_name}]
    if extras:
        raise RuntimeError(f"Unexpected non-singleton temperature dimensions: {extras}")
    return data.transpose(time_name, lat_name, lon_name), time_name, lat_name, lon_name


def netcdf_members(path: Path):
    if path.suffix.lower() != ".zip":
        yield path
        return
    with tempfile.TemporaryDirectory(prefix="tulip-era5-") as directory:
        with zipfile.ZipFile(path) as archive:
            members = [member for member in archive.namelist() if member.lower().endswith((".nc", ".netcdf"))]
            if not members:
                raise RuntimeError(f"No NetCDF member in {path}")
            for member in members:
                extracted = Path(archive.extract(member, directory))
                yield extracted


def inspect_grid(path: Path) -> GridDefinition:
    for member in netcdf_members(path):
        with xr.open_dataset(member) as dataset:
            data, _, lat_name, lon_name = select_temperature(dataset)
            return GridDefinition(np.asarray(data[lat_name].values, dtype=float), np.asarray(data[lon_name].values, dtype=float))
    raise RuntimeError(f"No readable NetCDF data in {path}")


def normalized_longitudes(longitudes: np.ndarray) -> np.ndarray:
    return np.where(longitudes > 180, longitudes - 360, longitudes)


def cell_edges(values: np.ndarray) -> np.ndarray:
    ordered = np.asarray(values, dtype=float)
    differences = np.diff(ordered)
    if not len(differences) or np.any(np.isclose(differences, 0)):
        raise RuntimeError("Grid coordinates are not one-dimensional and unique")
    edges = np.empty(len(ordered) + 1)
    edges[1:-1] = (ordered[:-1] + ordered[1:]) / 2
    edges[0] = ordered[0] - differences[0] / 2
    edges[-1] = ordered[-1] + differences[-1] / 2
    return edges


def build_weight_matrices(grid: GridDefinition, regions: gpd.GeoDataFrame) -> dict[str, np.ndarray]:
    latitudes = grid.latitudes
    longitudes = normalized_longitudes(grid.longitudes)
    lon_mesh, lat_mesh = np.meshgrid(longitudes, latitudes)
    flat_lat = lat_mesh.ravel()
    flat_lon = lon_mesh.ravel()
    points = gpd.GeoDataFrame(
        {"cell": np.arange(flat_lat.size), "latitude": flat_lat},
        geometry=gpd.points_from_xy(flat_lon, flat_lat),
        crs="EPSG:4326",
    )
    joined = gpd.sjoin(points, regions[["location", "geometry"]], how="inner", predicate="within")
    region_index = {location: index for index, location in enumerate(regions["location"])}
    matrices = {}
    for method in ("cell_centre_unweighted", "cell_centre_coslat"):
        weights = np.zeros((len(regions), flat_lat.size), dtype=np.float64)
        for row in joined.itertuples():
            weight = 1.0 if method == "cell_centre_unweighted" else math.cos(math.radians(row.latitude))
            weights[region_index[row.location], row.cell] = weight
        if np.any(weights.sum(axis=1) == 0):
            raise RuntimeError(f"{method} leaves at least one region without a grid-cell centre")
        matrices[method] = weights

    latitude_edges = cell_edges(latitudes)
    longitude_edges = cell_edges(longitudes)
    cells = []
    cell_ids = []
    for lat_index in range(len(latitudes)):
        south, north = sorted((latitude_edges[lat_index], latitude_edges[lat_index + 1]))
        for lon_index in range(len(longitudes)):
            west, east = sorted((longitude_edges[lon_index], longitude_edges[lon_index + 1]))
            cells.append(box(west, south, east, north))
            cell_ids.append(lat_index * len(longitudes) + lon_index)
    cell_frame = gpd.GeoDataFrame({"cell": cell_ids}, geometry=cells, crs="EPSG:4326")
    intersections = gpd.overlay(cell_frame, regions[["location", "geometry"]], how="intersection", keep_geom_type=False)
    intersections = intersections[~intersections.geometry.is_empty].to_crs("EPSG:3035")
    intersections["area"] = intersections.geometry.area
    area_weights = np.zeros((len(regions), flat_lat.size), dtype=np.float64)
    for row in intersections.itertuples():
        area_weights[region_index[row.location], row.cell] += row.area
    if np.any(area_weights.sum(axis=1) == 0):
        raise RuntimeError("Area-intersection weighting leaves at least one region without grid coverage")
    matrices["area_intersection"] = area_weights
    return matrices


def apply_weights(values: np.ndarray, weights: np.ndarray) -> np.ndarray:
    finite = np.isfinite(values)
    numerator = np.where(finite, values, 0.0) @ weights.T
    denominator = finite.astype(float) @ weights.T
    return np.divide(numerator, denominator, out=np.full_like(numerator, np.nan), where=denominator > 0)


def regional_daily(path: Path, matrices: dict[str, np.ndarray], regions: list[str]) -> dict[str, pd.DataFrame]:
    frames = {method: [] for method in matrices}
    for member in netcdf_members(path):
        with xr.open_dataset(member) as dataset:
            data, time_name, _, _ = select_temperature(dataset)
            values = np.asarray(data.values, dtype=float).reshape(data.sizes[time_name], -1)
            if np.nanmedian(values) > 100:
                values = values - 273.15
            dates = pd.to_datetime(np.asarray(data[time_name].values)).normalize()
            for method, weights in matrices.items():
                regional = apply_weights(values, weights)
                frame = pd.DataFrame(regional, columns=regions)
                frame.insert(0, "date", dates)
                frames[method].append(frame.melt(id_vars="date", var_name="location", value_name="temp"))
    return {method: pd.concat(parts, ignore_index=True) for method, parts in frames.items()}


def weekly_means(daily: pd.DataFrame) -> pd.DataFrame:
    iso = daily["date"].dt.isocalendar()
    with_weeks = daily.assign(year=iso.year.astype(int), woy=iso.week.astype(int))
    return with_weeks.groupby(["location", "year", "woy"], as_index=False)["temp"].mean()


def comparison_metrics(observed: pd.DataFrame, reconstructed: pd.DataFrame) -> dict:
    merged = observed.merge(reconstructed, on=["location", "year", "woy"], suffixes=("_observed", "_reconstructed"), how="inner")
    if merged.empty:
        raise RuntimeError("No comparable public and reconstructed weekly temperatures")
    errors = merged["temp_reconstructed"] - merged["temp_observed"]
    correlation = np.corrcoef(merged["temp_observed"], merged["temp_reconstructed"])[0, 1]
    expected_rows = len(observed)
    return {
        "matchedRows": len(merged),
        "expectedRows": expected_rows,
        "matchedFraction": float(len(merged) / expected_rows),
        "matchedRegions": int(merged["location"].nunique()),
        "overallBiasC": float(errors.mean()),
        "medianAbsoluteErrorC": float(errors.abs().median()),
        "p95AbsoluteErrorC": float(errors.abs().quantile(0.95)),
        "maximumAbsoluteErrorC": float(errors.abs().max()),
        "pearsonCorrelation": float(correlation),
    }


def criteria_pass(metrics: dict, criteria: dict) -> bool:
    return (
        metrics["matchedRegions"] >= criteria["minimumMatchedRegions"]
        and metrics["matchedFraction"] >= criteria["minimumMatchedRegionWeeksFraction"]
        and abs(metrics["overallBiasC"]) <= criteria["maximumAbsoluteOverallBiasC"]
        and metrics["medianAbsoluteErrorC"] <= criteria["maximumMedianAbsoluteErrorC"]
        and metrics["p95AbsoluteErrorC"] <= criteria["maximumP95AbsoluteErrorC"]
        and metrics["pearsonCorrelation"] >= criteria["minimumPearsonCorrelation"]
    )


def ols(x: np.ndarray, y: np.ndarray) -> dict:
    mask = np.isfinite(x) & np.isfinite(y)
    x = x[mask]
    y = y[mask]
    if len(x) < 3:
        raise RuntimeError("At least three paired years are required for regression")
    centered = x - x.mean()
    slope = float(np.sum(centered * (y - y.mean())) / np.sum(centered**2))
    intercept = float(y.mean() - slope * x.mean())
    residuals = y - (intercept + slope * x)
    standard_error = float(np.sqrt(np.sum(residuals**2) / (len(x) - 2) / np.sum(centered**2)))
    return {"n": len(x), "intercept": intercept, "slope": slope, "slopeStandardError": standard_error}


def rounded_metrics(metrics: dict) -> dict:
    return {key: round(value, 7) if isinstance(value, float) else value for key, value in metrics.items()}


def validate(plan: dict, data_dir: Path, output_path: Path) -> dict:
    requests = plan["era5LandRetrieval"]["stage1ValidationRequests"]
    missing = [item["output"] for item in requests if not (data_dir / item["output"]).exists()]
    if missing:
        raise RuntimeError(f"Missing {len(missing)} validation files; first missing file: {missing[0]}")

    regions = prepare_regions(plan)
    first = data_dir / requests[0]["output"]
    grid = inspect_grid(first)
    matrices = build_weight_matrices(grid, regions)
    region_ids = regions["location"].tolist()
    public = pd.read_csv(source_path(plan, "publicWeeklyTemperatures"))
    public = public[(public["woy"] >= 22) & (public["woy"] <= 35)][["location", "year", "woy", "temp"]]
    results = []

    for timezone_label in ("utcplus0000", "utcplus0100"):
        files = [data_dir / item["output"] for item in requests if timezone_label in item["output"]]
        method_parts = {method: [] for method in METHODS}
        for file_path in files:
            daily = regional_daily(file_path, matrices, region_ids)
            for method in METHODS:
                method_parts[method].append(weekly_means(daily[method]))
        for method in METHODS:
            reconstructed = pd.concat(method_parts[method], ignore_index=True)
            metrics = comparison_metrics(public, reconstructed)
            results.append({
                "timeZone": timezone_label.replace("utcplus", "UTC+"),
                "spatialMethod": method,
                "metrics": rounded_metrics(metrics),
                "passes": criteria_pass(metrics, plan["acceptanceCriteria"]["publicSampleComparison"]),
            })

    passing = [result for result in results if result["passes"]]
    passing.sort(key=lambda result: (result["metrics"]["medianAbsoluteErrorC"], result["metrics"]["p95AbsoluteErrorC"]))
    selected = passing[0] if passing else None
    payload = {
        "version": "tulip_europe_heat_regional_pattern_reconstruction_2026_09_23_v1",
        "generatedOn": plan["generatedOn"],
        "stage": "public_sample_validation",
        "status": "validation_passed" if selected else "method_not_validated",
        "productionRatingsEnabled": 0,
        "planVersion": plan["version"],
        "rawFiles": [{"path": str((data_dir / item["output"]).relative_to(ROOT)), "bytes": (data_dir / item["output"]).stat().st_size, "sha256": sha256(data_dir / item["output"])} for item in requests],
        "criteria": plan["acceptanceCriteria"]["publicSampleComparison"],
        "candidateResults": results,
        "selectedConfiguration": selected,
        "promotionBoundary": plan["acceptanceCriteria"]["promotion"],
    }
    output_path.write_text(json.dumps(payload, indent=2) + "\n")
    return payload


def self_test() -> None:
    x = np.arange(1, 11, dtype=float)
    regression = ols(x, 3.0 + 2.0 * x)
    assert abs(regression["slope"] - 2.0) < 1e-12
    values = np.array([[1.0, 3.0, np.nan], [2.0, 4.0, 8.0]])
    weights = np.array([[1.0, 1.0, 0.0], [0.0, 1.0, 1.0]])
    aggregate = apply_weights(values, weights)
    assert np.allclose(aggregate, np.array([[2.0, 3.0], [3.0, 6.0]]), equal_nan=True)
    observed = pd.DataFrame({"location": ["A", "A", "B", "B"], "year": [2022] * 4, "woy": [22, 23, 22, 23], "temp": [20.0, 21.0, 19.0, 20.0]})
    reconstructed = observed.copy()
    reconstructed["temp"] += 0.05
    metrics = comparison_metrics(observed, reconstructed)
    assert abs(metrics["overallBiasC"] - 0.05) < 1e-12
    assert metrics["pearsonCorrelation"] > 0.999
    print("Europe heat regional-pattern reconstruction self-test passed.")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--stage", choices=("validation",), default="validation")
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        self_test()
        return
    plan = load_plan()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    result = validate(plan, args.data_dir, args.output)
    print(json.dumps({"output": str(args.output.relative_to(ROOT)), "status": result["status"], "selectedConfiguration": result["selectedConfiguration"]}, indent=2))
    if result["status"] != "validation_passed":
        raise SystemExit(2)


if __name__ == "__main__":
    main()
