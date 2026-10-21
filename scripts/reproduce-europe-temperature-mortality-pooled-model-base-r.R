#!/usr/bin/env Rscript

# Base-R cross-check for the central pooled EU temperature–mortality model.
# This intentionally uses no contributed R packages. The companion Node script
# supplies transient little-endian binary columns and compares this fit against
# the NumPy implementation before deleting those columns.

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 2L) stop("usage: reproduce-europe-temperature-mortality-pooled-model-base-r.R INPUT_DIR OUTPUT_TSV")
input_dir <- args[[1L]]
output_path <- args[[2L]]
rows <- 679602L

read_i32 <- function(name) {
  connection <- file(file.path(input_dir, paste0(name, ".i32")), "rb")
  on.exit(close(connection))
  values <- readBin(connection, integer(), n = rows, size = 4L, endian = "little", signed = TRUE)
  if (length(values) != rows) stop(paste(name, "row count mismatch"))
  values
}

read_f64 <- function(name) {
  connection <- file(file.path(input_dir, paste0(name, ".f64")), "rb")
  on.exit(close(connection))
  values <- readBin(connection, numeric(), n = rows, size = 8L, endian = "little")
  if (length(values) != rows) stop(paste(name, "row count mismatch"))
  values
}

region <- read_i32("adm_id")
year <- read_i32("year")
week <- read_f64("week")
outcome <- read_f64("rate_all")
weather_names <- c(
  "temp_d1_l0", "temp_d2_l0", "temp_d3_l0", "temp_d4_l0",
  "precip_d1_l0", "precip_d2_l0"
)
weather <- lapply(weather_names, read_f64)
if (any(!is.finite(c(week, outcome))) || any(vapply(weather, function(x) any(!is.finite(x)), logical(1L)))) {
  stop("model inputs contain non-finite values")
}

ordering <- order(region, year, week, method = "radix")
region <- region[ordering]
year <- year[ordering]
week <- as.integer(week[ordering])
outcome <- outcome[ordering]
weather <- lapply(weather, function(values) values[ordering])
panel_key <- region * 1e7 + year * 100 + week
duplicate_region_year_week_rows <- sum(duplicated(panel_key))
if (duplicate_region_year_week_rows != 0L) stop("panel contains duplicate region-year-week rows")

winsor_threshold <- as.numeric(quantile(outcome, probs = 0.99, type = 7L, names = FALSE))
winsorized_rows <- sum(outcome > winsor_threshold)
outcome <- pmin(outcome, winsor_threshold)

indexes <- seq_len(rows)
valid <- indexes > 3L
valid[4L:rows] <- valid[4L:rows] & region[4L:rows] == region[1L:(rows - 3L)]
current <- indexes[valid]

coefficient_names <- character(length(weather_names) * 4L)
design <- matrix(NA_real_, nrow = length(current), ncol = length(coefficient_names))
for (weather_index in seq_along(weather_names)) {
  base_name <- sub("_l0$", "", weather_names[[weather_index]])
  for (lag in 0L:3L) {
    destination <- (weather_index - 1L) * 4L + lag + 1L
    design[, destination] <- weather[[weather_index]][current - lag]
    coefficient_names[[destination]] <- if (lag == 0L) weather_names[[weather_index]] else paste0(base_name, "_t", lag)
  }
}

response <- outcome[current]
model_region <- region[current]
model_year <- year[current]
model_week <- week[current]
region_year_key <- model_region * 10000L + model_year
region_week_key <- model_region * 100L + model_week
fixed_region_year <- match(region_year_key, unique(region_year_key))
fixed_region_week <- match(region_week_key, unique(region_week_key))
region_year_counts <- tabulate(fixed_region_year)
region_week_counts <- tabulate(fixed_region_week)

model_matrix <- cbind(response, design)
scales <- sqrt(colMeans(model_matrix ^ 2))
if (any(!is.finite(scales)) || any(scales == 0)) stop("model columns have invalid scales")
model_matrix <- sweep(model_matrix, 2L, scales, "/")

demean <- function(matrix, groups, counts) {
  group_means <- rowsum(matrix, groups, reorder = FALSE) / counts
  list(matrix = matrix - group_means[groups, , drop = FALSE], correction = max(abs(group_means)))
}

tolerance <- 1e-11
converged <- FALSE
last_correction <- NA_real_
iterations <- 0L
for (iteration in seq_len(500L)) {
  first <- demean(model_matrix, fixed_region_year, region_year_counts)
  second <- demean(first$matrix, fixed_region_week, region_week_counts)
  model_matrix <- second$matrix
  last_correction <- max(first$correction, second$correction)
  iterations <- iteration
  if (last_correction <= tolerance) {
    converged <- TRUE
    break
  }
}
if (!converged) stop("fixed-effect residualization did not converge")

fit <- lm.fit(model_matrix[, -1L, drop = FALSE], model_matrix[, 1L])
if (fit$rank != ncol(design)) stop("model design is rank deficient")
coefficients <- unname(fit$coefficients * scales[[1L]] / scales[-1L])
cumulative <- vapply(0L:3L, function(index) sum(coefficients[(index * 4L + 1L):(index * 4L + 4L)]), numeric(1L))
temperatures <- -50L:50L
temperature_terms <- cbind(temperatures, temperatures ^ 2L, temperatures ^ 3L, temperatures ^ 4L)
minimum_mortality_temperature <- temperatures[[which.min(as.numeric(temperature_terms %*% cumulative))]]

bootstrap_iterations <- 100L
bootstrap_regions <- length(unique(model_region))
bootstrap_connection <- file(file.path(input_dir, "bootstrap_counts.i32"), "rb")
bootstrap_counts <- readBin(
  bootstrap_connection,
  integer(),
  n = bootstrap_iterations * bootstrap_regions,
  size = 4L,
  endian = "little",
  signed = TRUE
)
close(bootstrap_connection)
if (length(bootstrap_counts) != bootstrap_iterations * bootstrap_regions) stop("bootstrap multiplicity row count mismatch")
bootstrap_counts <- matrix(bootstrap_counts, nrow = bootstrap_iterations, byrow = TRUE)
if (any(bootstrap_counts < 0L) || any(rowSums(bootstrap_counts) != bootstrap_regions)) stop("invalid bootstrap multiplicities")

residual_response <- model_matrix[, 1L]
residual_design <- model_matrix[, -1L, drop = FALSE]
region_crossproducts <- vector("list", bootstrap_regions)
region_crossresponses <- vector("list", bootstrap_regions)
for (region_index in 0L:(bootstrap_regions - 1L)) {
  region_rows <- model_region == region_index
  region_design <- residual_design[region_rows, , drop = FALSE]
  region_response <- residual_response[region_rows]
  region_crossproducts[[region_index + 1L]] <- crossprod(region_design)
  region_crossresponses[[region_index + 1L]] <- as.numeric(crossprod(region_design, region_response))
}

bootstrap_coefficients <- matrix(NA_real_, nrow = bootstrap_iterations, ncol = ncol(design))
for (iteration in seq_len(bootstrap_iterations)) {
  active_regions <- which(bootstrap_counts[iteration, ] > 0L)
  crossproduct <- Reduce(`+`, Map(
    function(region_index, multiplicity) region_crossproducts[[region_index]] * multiplicity,
    active_regions,
    bootstrap_counts[iteration, active_regions]
  ))
  crossresponse <- Reduce(`+`, Map(
    function(region_index, multiplicity) region_crossresponses[[region_index]] * multiplicity,
    active_regions,
    bootstrap_counts[iteration, active_regions]
  ))
  scaled_bootstrap_coefficients <- solve(crossproduct, crossresponse)
  bootstrap_coefficients[iteration, ] <- scaled_bootstrap_coefficients * scales[[1L]] / scales[-1L]
}
bootstrap_cumulative <- t(vapply(seq_len(bootstrap_iterations), function(iteration) {
  vapply(0L:3L, function(index) sum(bootstrap_coefficients[iteration, (index * 4L + 1L):(index * 4L + 4L)]), numeric(1L))
}, numeric(4L)))

options(digits = 17)
lines <- c(
  paste("metric", "input_rows", rows, sep = "\t"),
  paste("metric", "model_rows", length(current), sep = "\t"),
  paste("metric", "regions", length(unique(model_region)), sep = "\t"),
  paste("metric", "region_year_groups", length(region_year_counts), sep = "\t"),
  paste("metric", "region_week_groups", length(region_week_counts), sep = "\t"),
  paste("metric", "duplicate_region_year_week_rows", duplicate_region_year_week_rows, sep = "\t"),
  paste("metric", "winsor_threshold", format(winsor_threshold, scientific = TRUE), sep = "\t"),
  paste("metric", "winsorized_rows", winsorized_rows, sep = "\t"),
  paste("metric", "iterations", iterations, sep = "\t"),
  paste("metric", "last_correction", format(last_correction, scientific = TRUE), sep = "\t"),
  paste("metric", "rank", fit$rank, sep = "\t"),
  paste("metric", "minimum_mortality_temperature", minimum_mortality_temperature, sep = "\t"),
  vapply(seq_along(coefficients), function(index) {
    paste("coefficient", coefficient_names[[index]], format(coefficients[[index]], scientific = TRUE), sep = "\t")
  }, character(1L)),
  vapply(seq_along(cumulative), function(index) {
    paste("cumulative", index, format(cumulative[[index]], scientific = TRUE), sep = "\t")
  }, character(1L)),
  unlist(lapply(seq_len(bootstrap_iterations), function(iteration) {
    vapply(seq_along(coefficient_names), function(index) {
      paste("bootstrap_coefficient", iteration, coefficient_names[[index]], format(bootstrap_coefficients[iteration, index], scientific = TRUE), sep = "\t")
    }, character(1L))
  }), use.names = FALSE),
  unlist(lapply(seq_len(bootstrap_iterations), function(iteration) {
    vapply(seq_len(4L), function(index) {
      paste("bootstrap_cumulative", iteration, index, format(bootstrap_cumulative[iteration, index], scientific = TRUE), sep = "\t")
    }, character(1L))
  }), use.names = FALSE)
)
writeLines(lines, output_path)
