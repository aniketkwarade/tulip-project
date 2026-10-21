#!/usr/bin/env Rscript

# Reproduce the endpoint calculation in the public Vicedo-Cabrera et al.
# ten-city example without executing its plotting section. The example cities
# are hypothetical, so this validates the algorithm rather than the published
# 732-location burden estimate.

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 2) {
  stop("Usage: Rscript scripts/reproduce-vicedo-cabrera-ten-city.R <upstream-repository-directory> <output-json>")
}

source_dir <- normalizePath(args[[1]], mustWork = TRUE)
output_json <- args[[2]]
main_analysis <- file.path(source_dir, "MainAnalysis.R")
required_files <- c(
  "MainAnalysis.R", "10cities_data.RData", "TmeanModelled.RData",
  "fhempel_main.R", "fhempel_corr.R"
)
missing_files <- required_files[!file.exists(file.path(source_dir, required_files))]
if (length(missing_files) > 0) {
  stop(paste("Missing upstream files:", paste(missing_files, collapse = ", ")))
}

required_packages <- c("dlnm", "mixmeta", "lubridate", "jsonlite")
missing_packages <- required_packages[!vapply(required_packages, requireNamespace, logical(1), quietly = TRUE)]
if (length(missing_packages) > 0) {
  stop(paste(
    "Missing R packages:", paste(missing_packages, collapse = ", "),
    "Install them before running the reproduction."
  ))
}

old_working_directory <- getwd()
on.exit(setwd(old_working_directory), add = TRUE)
setwd(source_dir)

expressions <- parse(file = main_analysis)
plot_packages <- c("ggplot2", "patchwork", "RColorBrewer", "ggtext")
for (expression in expressions) {
  if (is.call(expression) && identical(as.character(expression[[1]]), "library")) {
    package_name <- gsub('^"|"$', '', deparse(expression[[2]]))
    if (package_name %in% plot_packages) next
  }
  if (is.call(expression) && identical(as.character(expression[[1]]), "rm")) break
  eval(expression, envir = .GlobalEnv)
}

ensemble_index <- dim(ancity)[2]
city_results <- data.frame(
  city = rownames(ancity),
  baseline_deaths_1991_2018 = as.numeric(deathbase),
  minimum_mortality_temperature_c = as.numeric(mintempcity),
  factual_heat_deaths = as.numeric(ancity[, ensemble_index, "est", "fct"]),
  counterfactual_heat_deaths = as.numeric(ancity[, ensemble_index, "est", "cnfact"]),
  anthropogenic_heat_deaths = as.numeric(ancity[, ensemble_index, "est", "dif"]),
  anthropogenic_heat_deaths_ci_low = as.numeric(ancity[, ensemble_index, "ci.l", "dif"]),
  anthropogenic_heat_deaths_ci_high = as.numeric(ancity[, ensemble_index, "ci.u", "dif"]),
  factual_heat_fraction_percent = as.numeric(afcity[, ensemble_index, "est", "fct"]),
  counterfactual_heat_fraction_percent = as.numeric(afcity[, ensemble_index, "est", "cnfact"]),
  anthropogenic_heat_fraction_percent = as.numeric(afcity[, ensemble_index, "est", "dif"]),
  anthropogenic_share_of_heat_deaths_percent = as.numeric(apcity)
)

result <- list(
  source = list(
    article_doi = "10.1038/s41558-021-01058-x",
    repository_url = "https://github.com/anavica/mcc_ccattr_NCC",
    repository_commit = "5f719165ec26fa7c8913736af9ffc2067660d516",
    sample_scope = "Ten hypothetical cities supplied by the article authors; not the study's full 732-location dataset",
    period = "1991-2018",
    factual_definition = "Historical climate simulations with human and natural forcings",
    counterfactual_definition = "Natural-forcing-only climate simulations",
    monte_carlo_iterations = nsim,
    climate_models = as.character(gcm)
  ),
  runtime = list(
    r_version = R.version.string,
    dlnm_version = as.character(packageVersion("dlnm")),
    mixmeta_version = as.character(packageVersion("mixmeta")),
    lubridate_version = as.character(packageVersion("lubridate"))
  ),
  input_counts = list(
    cities = nrow(metatable),
    observed_daily_rows = sum(vapply(listdata, nrow, integer(1))),
    factual_modelled_daily_rows = nrow(tmean_hist),
    counterfactual_modelled_daily_rows = nrow(tmean_nat)
  ),
  total = list(
    baseline_deaths_1991_2018 = as.numeric(sum(deathbase)),
    factual_heat_deaths = as.numeric(antotal[ensemble_index, "est", "fct"]),
    counterfactual_heat_deaths = as.numeric(antotal[ensemble_index, "est", "cnfact"]),
    anthropogenic_heat_deaths = as.numeric(antotal[ensemble_index, "est", "dif"]),
    anthropogenic_heat_deaths_ci_low = as.numeric(antotal[ensemble_index, "ci.l", "dif"]),
    anthropogenic_heat_deaths_ci_high = as.numeric(antotal[ensemble_index, "ci.u", "dif"]),
    factual_heat_fraction_percent = as.numeric(aftotal[ensemble_index, "est", "fct"]),
    counterfactual_heat_fraction_percent = as.numeric(aftotal[ensemble_index, "est", "cnfact"]),
    anthropogenic_heat_fraction_percent = as.numeric(aftotal[ensemble_index, "est", "dif"]),
    anthropogenic_share_of_heat_deaths_percent = as.numeric(aptotal)
  ),
  cities = city_results
)

jsonlite::write_json(result, output_json, pretty = TRUE, auto_unbox = TRUE, digits = 15, na = "null")
cat(sprintf("Wrote %s\n", normalizePath(output_json, mustWork = TRUE)))
