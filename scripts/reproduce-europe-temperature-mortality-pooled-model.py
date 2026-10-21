#!/usr/bin/env python3
"""Reproduce the central pooled EU model with NumPy and no added packages.

The input directory is a transient column extract produced by the companion
Node script. This runner mirrors the pinned R specification: rate winsorized at
the type-7 99th percentile, four weekly observations per weather polynomial
(current plus three lags), and region×year plus region×week fixed effects.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import numpy as np


def read_array(root: Path, descriptor: dict) -> np.ndarray:
    dtype = np.dtype(descriptor["dtype"])
    values = np.fromfile(root / descriptor["file"], dtype=dtype)
    if values.size != descriptor["rows"]:
        raise ValueError(f"{descriptor['file']}: expected {descriptor['rows']} values, found {values.size}")
    return values


def group_codes(*columns: np.ndarray) -> tuple[np.ndarray, int]:
    matrix = np.column_stack(columns)
    _, inverse = np.unique(matrix, axis=0, return_inverse=True)
    return inverse.astype(np.int32, copy=False), int(inverse.max()) + 1


def demean_in_place(matrix: np.ndarray, groups: np.ndarray, group_count: int, counts: np.ndarray) -> float:
    largest_correction = 0.0
    for column_index in range(matrix.shape[1]):
        means = np.bincount(groups, weights=matrix[:, column_index], minlength=group_count) / counts
        largest_correction = max(largest_correction, float(np.max(np.abs(means))))
        matrix[:, column_index] -= means[groups]
    return largest_correction


def maximum_group_mean(matrix: np.ndarray, groups: np.ndarray, group_count: int, counts: np.ndarray) -> float:
    largest = 0.0
    for column_index in range(matrix.shape[1]):
        means = np.bincount(groups, weights=matrix[:, column_index], minlength=group_count) / counts
        largest = max(largest, float(np.max(np.abs(means))))
    return largest


def digest_numbers(values: list[float]) -> str:
    encoded = json.dumps(values, separators=(",", ":"), allow_nan=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: reproduce-europe-temperature-mortality-pooled-model.py INPUT_METADATA OUTPUT_JSON")

    metadata_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    metadata = json.loads(metadata_path.read_text())
    root = metadata_path.parent
    columns = metadata["columns"]

    region = read_array(root, columns["adm_id"])
    year = read_array(root, columns["year"])
    week = read_array(root, columns["week"])
    outcome = read_array(root, columns["rate_all"])
    weather_names = metadata["weatherColumns"]
    weather = [read_array(root, columns[name]) for name in weather_names]

    row_count = metadata["rows"]
    if any(values.size != row_count for values in [region, year, week, outcome, *weather]):
        raise ValueError("input columns have different row counts")
    if not all(np.all(np.isfinite(values)) for values in [week, outcome, *weather]):
        raise ValueError("model inputs contain non-finite values")
    if not np.all(week == np.floor(week)):
        raise ValueError("week column contains non-integer values")

    order = np.lexsort((week, year, region))
    region = region[order]
    year = year[order]
    week = week[order].astype(np.int16, copy=False)
    outcome = outcome[order]
    weather = [values[order] for values in weather]

    panel_keys = np.column_stack((region, year, week))
    _, panel_key_counts = np.unique(panel_keys, axis=0, return_counts=True)
    duplicate_region_year_week_rows = int(np.sum(panel_key_counts - 1))
    if duplicate_region_year_week_rows:
        raise ValueError(f"panel contains {duplicate_region_year_week_rows} duplicate region-year-week rows")

    # collapse::fnth(x, 0.99) defaults to the continuous type-7 quantile.
    winsor_threshold = float(np.quantile(outcome, 0.99, method="linear"))
    winsorized_outcome = np.minimum(outcome, winsor_threshold)
    winsorized_rows = int(np.count_nonzero(outcome > winsor_threshold))

    indexes = np.arange(row_count, dtype=np.int64)
    valid = indexes >= 3
    valid[3:] &= region[3:] == region[:-3]
    current = indexes[valid]
    dropped_for_lags = int(row_count - current.size)

    coefficient_names: list[str] = []
    design = np.empty((current.size, len(weather_names) * 4), dtype=np.float64)
    for weather_index, (name, values) in enumerate(zip(weather_names, weather, strict=True)):
        base = name.removesuffix("_l0")
        for lag in range(4):
            destination = weather_index * 4 + lag
            design[:, destination] = values[current - lag]
            coefficient_names.append(f"{name}" if lag == 0 else f"{base}_t{lag}")

    response = winsorized_outcome[current].astype(np.float64, copy=True)
    model_region = region[current]
    model_year = year[current]
    model_week = week[current]
    fixed_region_year, region_year_groups = group_codes(model_region, model_year)
    fixed_region_week, region_week_groups = group_codes(model_region, model_week)
    region_year_counts = np.bincount(fixed_region_year, minlength=region_year_groups).astype(np.float64)
    region_week_counts = np.bincount(fixed_region_week, minlength=region_week_groups).astype(np.float64)

    model_matrix = np.column_stack((response, design))
    scales = np.sqrt(np.mean(np.square(model_matrix), axis=0))
    if np.any(~np.isfinite(scales)) or np.any(scales == 0):
        raise ValueError("model columns have invalid scales")
    model_matrix /= scales

    tolerance = 1e-11
    max_iterations = 500
    corrections: list[float] = []
    converged = False
    for _ in range(max_iterations):
        correction_a = demean_in_place(model_matrix, fixed_region_year, region_year_groups, region_year_counts)
        correction_b = demean_in_place(model_matrix, fixed_region_week, region_week_groups, region_week_counts)
        correction = max(correction_a, correction_b)
        corrections.append(correction)
        if correction <= tolerance:
            converged = True
            break
    if not converged:
        raise RuntimeError(f"fixed-effect residualization did not converge in {max_iterations} iterations")

    maximum_region_year_mean = maximum_group_mean(
        model_matrix, fixed_region_year, region_year_groups, region_year_counts
    )
    maximum_region_week_mean = maximum_group_mean(
        model_matrix, fixed_region_week, region_week_groups, region_week_counts
    )

    residual_response = model_matrix[:, 0]
    residual_design = model_matrix[:, 1:]
    scaled_coefficients, residual_sum_squares, rank, singular_values = np.linalg.lstsq(
        residual_design, residual_response, rcond=None
    )
    coefficients = scaled_coefficients * scales[0] / scales[1:]
    fitted_residuals = residual_response - residual_design @ scaled_coefficients

    cumulative_temperature_coefficients = []
    for polynomial_index in range(4):
        start = polynomial_index * 4
        cumulative_temperature_coefficients.append(float(np.sum(coefficients[start : start + 4])))

    temperatures = np.arange(-50, 51, dtype=np.float64)
    temperature_terms = np.column_stack([temperatures ** degree for degree in range(1, 5)])
    response_curve = temperature_terms @ np.asarray(cumulative_temperature_coefficients)
    minimum_mortality_temperature = int(temperatures[int(np.argmin(response_curve))])

    bootstrap_descriptor = metadata["bootstrap"]
    bootstrap_counts = np.fromfile(root / bootstrap_descriptor["file"], dtype=np.dtype(bootstrap_descriptor["dtype"]))
    bootstrap_counts = bootstrap_counts.reshape(bootstrap_descriptor["iterations"], bootstrap_descriptor["regions"])
    if np.any(bootstrap_counts < 0):
        raise ValueError("bootstrap multiplicities contain negative values")
    if not np.all(np.sum(bootstrap_counts, axis=1) == bootstrap_descriptor["regions"]):
        raise ValueError("bootstrap samples do not preserve the spatial-unit sample size")
    if bootstrap_descriptor["regions"] != int(np.unique(model_region).size):
        raise ValueError("bootstrap region universe does not match the model panel")

    region_crossproducts = np.zeros((bootstrap_descriptor["regions"], design.shape[1], design.shape[1]), dtype=np.float64)
    region_crossresponses = np.zeros((bootstrap_descriptor["regions"], design.shape[1]), dtype=np.float64)
    for region_index in range(bootstrap_descriptor["regions"]):
        region_rows = model_region == region_index
        region_design = residual_design[region_rows]
        region_response = residual_response[region_rows]
        region_crossproducts[region_index] = region_design.T @ region_design
        region_crossresponses[region_index] = region_design.T @ region_response

    bootstrap_coefficients = np.empty((bootstrap_descriptor["iterations"], design.shape[1]), dtype=np.float64)
    bootstrap_ranks = []
    for iteration, multiplicities in enumerate(bootstrap_counts):
        crossproduct = np.tensordot(multiplicities, region_crossproducts, axes=(0, 0))
        crossresponse = np.tensordot(multiplicities, region_crossresponses, axes=(0, 0))
        bootstrap_ranks.append(int(np.linalg.matrix_rank(crossproduct)))
        scaled_bootstrap_coefficients = np.linalg.solve(crossproduct, crossresponse)
        bootstrap_coefficients[iteration] = scaled_bootstrap_coefficients * scales[0] / scales[1:]
    if any(rank != design.shape[1] for rank in bootstrap_ranks):
        raise ValueError("one or more bootstrap designs are rank deficient")

    bootstrap_cumulative_temperature_coefficients = bootstrap_coefficients[:, :16].reshape(
        bootstrap_descriptor["iterations"], 4, 4
    ).sum(axis=2)
    centered_temperature_terms = temperature_terms - np.asarray([
        minimum_mortality_temperature ** degree for degree in range(1, 5)
    ])
    bootstrap_response_curves = centered_temperature_terms @ bootstrap_cumulative_temperature_coefficients.T
    bootstrap_response_quantiles = np.quantile(bootstrap_response_curves, [0.025, 0.5, 0.975], axis=1, method="linear")
    bootstrap_response_mean = np.mean(bootstrap_response_curves, axis=1)

    coefficient_values = [float(value) for value in coefficients]
    payload = {
        "status": "central_pooled_model_internally_reproduced_not_independently_validated",
        "runtime": {
            "python": sys.version.split()[0],
            "numpy": np.__version__,
            "linearAlgebra": "numpy.linalg.lstsq",
        },
        "specification": {
            "outcome": "rate_all",
            "winsorization": "global type-7 99th percentile before lag-row removal",
            "weatherColumns": weather_names,
            "lags": [0, 1, 2, 3],
            "fixedEffects": ["adm_id^year", "adm_id^week"],
            "weights": None,
        },
        "panel": {
            "inputRows": row_count,
            "modelRows": int(current.size),
            "rowsDroppedForLags": dropped_for_lags,
            "regions": int(np.unique(model_region).size),
            "years": [int(model_year.min()), int(model_year.max())],
            "weeks": [int(model_week.min()), int(model_week.max())],
            "regionYearFixedEffectGroups": region_year_groups,
            "regionWeekFixedEffectGroups": region_week_groups,
            "duplicateRegionYearWeekRows": duplicate_region_year_week_rows,
        },
        "winsorization": {
            "threshold": winsor_threshold,
            "rowsCapped": winsorized_rows,
            "maximumBefore": float(outcome.max()),
            "maximumAfter": float(winsorized_outcome.max()),
        },
        "residualization": {
            "method": "alternating group demeaning after RMS scaling",
            "iterations": len(corrections),
            "tolerance": tolerance,
            "lastCorrection": corrections[-1],
            "maximumRegionYearMean": maximum_region_year_mean,
            "maximumRegionWeekMean": maximum_region_week_mean,
        },
        "fit": {
            "rank": int(rank),
            "columns": design.shape[1],
            "conditionNumberScaledResidualDesign": float(singular_values[0] / singular_values[-1]),
            "residualSumSquaresScaled": float(np.dot(fitted_residuals, fitted_residuals)),
            "lstsqResidualSumSquaresScaled": float(residual_sum_squares[0]) if residual_sum_squares.size else None,
            "coefficientNames": coefficient_names,
            "coefficients": coefficient_values,
            "coefficientDigest": digest_numbers(coefficient_values),
            "cumulativeTemperatureCoefficients": cumulative_temperature_coefficients,
            "minimumMortalityTemperatureOnIntegerMinus50To50Grid": minimum_mortality_temperature,
        },
        "bootstrap": {
            "seed": bootstrap_descriptor["seed"],
            "iterations": bootstrap_descriptor["iterations"],
            "spatialUnitsPerIteration": bootstrap_descriptor["regions"],
            "sampling": "R sample.int over the 971 sorted spatial units with replacement; duplicate units are algebraically equivalent to integer row weights because both fixed effects are nested within spatial unit.",
            "multiplicitySha256": hashlib.sha256(bootstrap_counts.astype("<i4", copy=False).tobytes()).hexdigest(),
            "minimumRank": min(bootstrap_ranks),
            "maximumRank": max(bootstrap_ranks),
            "coefficientNames": coefficient_names,
            "coefficients": bootstrap_coefficients.tolist(),
            "coefficientDigest": digest_numbers(bootstrap_coefficients.ravel().tolist()),
            "cumulativeTemperatureCoefficients": bootstrap_cumulative_temperature_coefficients.tolist(),
            "cumulativeTemperatureCoefficientDigest": digest_numbers(bootstrap_cumulative_temperature_coefficients.ravel().tolist()),
            "responseCurve": {
                "binsC": temperatures.astype(int).tolist(),
                "centeredAtC": minimum_mortality_temperature,
                "q025": bootstrap_response_quantiles[0].tolist(),
                "median": bootstrap_response_quantiles[1].tolist(),
                "q975": bootstrap_response_quantiles[2].tolist(),
                "mean": bootstrap_response_mean.tolist(),
            },
        },
        "boundaries": {
            "referenceOutputsAvailable": False,
            "authorDependencyVersionsPinned": False,
            "authorFixestCoefficientsCompared": False,
            "winsorizationCompatibility": "The pinned R script calls collapse::fnth without a ties override. This reproduction uses its documented q7 default, equivalent to NumPy and base-R type-7 quantiles; the author repository does not pin the collapse package version.",
            "claim": "Internal mathematical reproduction of the central pooled specification; not an exact comparison to author-published coefficients and not independent validation.",
            "notIncluded": [
                "temperature-bin mortality attribution",
                "source-removal climate input",
                "ecosystem endpoint",
            ],
        },
    }
    output_path.write_text(json.dumps(payload, indent=2, allow_nan=False) + "\n")


if __name__ == "__main__":
    main()
