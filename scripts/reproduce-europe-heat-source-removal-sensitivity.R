#!/usr/bin/env Rscript

suppressMessages(library(lubridate))
suppressMessages(library(ISOweek))
suppressMessages(library(dlnm))
suppressMessages(library(splines))
suppressMessages(library(mixmeta))
suppressMessages(library(tsModel))
suppressMessages(library(jsonlite))

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 4) stop('Usage: reproduce-europe-heat-source-removal-sensitivity.R DATA.csv METADATA.csv SHIFTS.csv OUTPUT.json')
data_path <- args[[1]]
metadata_path <- args[[2]]
shifts_path <- args[[3]]
output_path <- args[[4]]

date1_cali <- as.Date('2015-01-01')
date2_cali <- as.Date('2019-12-26')
date1_pred <- as.Date('2015-01-01')
date2_pred <- as.Date('2022-11-03')
date1_summer <- as.Date('2022-06-02')
date2_summer <- as.Date('2022-09-01')
var_fun <- 'ns'
var_prc <- c(10, 50, 90) / 100
min_lag <- 0
max_lag <- 3
df_seas <- 8
pred_prc <- sort(unique(c(seq(0, 1, 0.1), seq(1.5, 5, 0.5), seq(6, 94, 1), seq(95, 98.5, 0.5), seq(99, 100, 0.1)) / 100))
min_pmmt <- 5 / 100
max_pmmt <- 100 / 100

datatable <- read.csv(data_path)
datatable$date <- ISOweek2date(paste0(datatable$year, '-W', sprintf('%02d', datatable$woy), '-4'))
metatable <- read.csv(metadata_path)
shifts <- read.csv(shifts_path, check.names = FALSE)
required_shift_columns <- c('node_id', 'name', 'source_gas', 'response_basis', 'gmst_shift_c_2022')
if (!all(required_shift_columns %in% names(shifts))) stop('Missing required shift columns')

regions <- metatable$location
n_regions <- length(regions)
if (n_regions != 103) stop(sprintf('Expected the 103-region public sample, found %d', n_regions))

calibration <- datatable[date1_cali <= datatable$date & datatable$date <= date2_cali + 7 * max_lag, ]
prediction <- datatable[date1_pred <= datatable$date & datatable$date <= date2_pred + 7 * max_lag, ]
calibration_list <- lapply(regions, function(region) calibration[calibration$location == region, ])
prediction_list <- lapply(regions, function(region) prediction[prediction$location == region, ])
names(calibration_list) <- names(prediction_list) <- regions
for (index in seq_len(n_regions)) calibration_list[[index]]$wop <- seq_len(nrow(calibration_list[[index]]))

coef_model <- matrix(NA, n_regions, length(var_prc) + 1, dimnames = list(regions))
vcov_model <- vector('list', n_regions)
names(vcov_model) <- regions

for (index in seq_len(n_regions)) {
  regional <- calibration_list[[index]]
  cross_basis <- crossbasis(
    regional$temp,
    c(min_lag, max_lag),
    argvar = list(fun = var_fun, knots = quantile(regional$temp, var_prc, na.rm = TRUE), Boundary.knots = range(regional$temp, na.rm = TRUE)),
    arglag = list(fun = 'integer')
  )
  model <- glm(
    mort ~ ns(wop, df = round(df_seas * length(wop) * 7 / 365.25)) + cross_basis,
    regional,
    family = quasipoisson,
    na.action = 'na.exclude'
  )
  suppressMessages(prediction_no_meta <- crosspred(cross_basis, model, at = quantile(regional$temp, pred_prc, na.rm = TRUE)))
  mmt <- prediction_no_meta$predvar[which(pred_prc == min_pmmt) - 1 + which.min(prediction_no_meta$allRRfit[which(pred_prc == min_pmmt):which(pred_prc == max_pmmt)])]
  reduced <- crossreduce(cross_basis, model, cen = mmt)
  coef_model[index, ] <- coef(reduced)
  vcov_model[[index]] <- vcov(reduced)
}

temperature_average <- sapply(calibration_list, function(value) mean(value$temp, na.rm = TRUE))
temperature_iqr <- sapply(calibration_list, function(value) IQR(value$temp, na.rm = TRUE))
multivar <- mixmeta(
  coef_model ~ temperature_average + temperature_iqr,
  vcov_model,
  data = data.frame(region = regions),
  control = list(showiter = FALSE, igls.inititer = 10),
  method = 'reml'
)
blup_values <- blup(multivar, vcov = TRUE)

mmt_region <- array(NA, dim = n_regions, dimnames = list(regions))
for (index in seq_len(n_regions)) {
  regional <- calibration_list[[index]]
  percentile_temperatures <- quantile(regional$temp, pred_prc, na.rm = TRUE)
  basis <- onebasis(
    percentile_temperatures,
    fun = var_fun,
    knots = quantile(regional$temp, var_prc, na.rm = TRUE),
    Boundary.knots = range(regional$temp, na.rm = TRUE)
  )
  suppressMessages(prediction_meta <- crosspred(
    basis,
    coef = blup_values[[index]]$blup,
    vcov = blup_values[[index]]$vcov,
    model.link = 'log',
    at = percentile_temperatures
  ))
  mmt_region[index] <- percentile_temperatures[which(pred_prc == min_pmmt) - 1 + which.min(prediction_meta$allRRfit[which(pred_prc == min_pmmt):which(pred_prc == max_pmmt)])]
}

regional_inputs <- lapply(seq_len(n_regions), function(index) {
  regional <- prediction_list[[index]]
  summer_rows <- which(date1_summer <= regional$date & regional$date <= date2_summer)
  lagged_mortality_matrix <- Lag(regional$mort, -min_lag:-max_lag)
  lagged_mortality <- rowMeans(lagged_mortality_matrix)
  correction <- sum(rowMeans(lagged_mortality_matrix[summer_rows, , drop = FALSE], na.rm = TRUE), na.rm = TRUE) /
    sum(lagged_mortality[summer_rows], na.rm = TRUE)
  list(
    temp = regional$temp,
    summer_rows = summer_rows,
    lagged_mortality = lagged_mortality,
    correction = correction,
    knots = quantile(calibration_list[[index]]$temp, var_prc, na.rm = TRUE),
    boundaries = range(calibration_list[[index]]$temp, na.rm = TRUE),
    mmt = mmt_region[index],
    coefficient = blup_values[[index]]$blup,
    population = mean(regional$popu[summer_rows], na.rm = TRUE)
  )
})

heat_deaths_for_uniform_shift <- function(shift_c) {
  total <- 0
  population <- 0
  regions_with_heat <- 0
  for (index in seq_len(n_regions)) {
    input <- regional_inputs[[index]]
    shifted_temperature <- input$temp - shift_c
    basis <- onebasis(
      shifted_temperature,
      fun = var_fun,
      knots = input$knots,
      Boundary.knots = input$boundaries
    )
    mmt_basis <- onebasis(input$mmt, fun = var_fun, knots = input$knots, Boundary.knots = input$boundaries)
    centred <- scale(basis, center = mmt_basis, scale = FALSE)
    attributable <- as.vector((1 - exp(-centred %*% input$coefficient)) * input$lagged_mortality)
    eligible <- input$summer_rows[shifted_temperature[input$summer_rows] > input$mmt]
    if (length(eligible) > 0 && sum(input$lagged_mortality[input$summer_rows], na.rm = TRUE) > 0) {
      total <- total + sum(attributable[eligible], na.rm = TRUE) * input$correction
      regions_with_heat <- regions_with_heat + 1
    }
    population <- population + input$population
  }
  list(heat_deaths = as.numeric(total), represented_population = as.numeric(population), regions_with_heat = regions_with_heat)
}

factual <- heat_deaths_for_uniform_shift(0)
pattern_scales <- c(0.5, 1.0, 1.5, 2.0)
results <- lapply(seq_len(nrow(shifts)), function(index) {
  row <- shifts[index, ]
  sensitivity <- lapply(pattern_scales, function(pattern_scale) {
    local_shift <- row$gmst_shift_c_2022 * pattern_scale
    counterfactual <- heat_deaths_for_uniform_shift(local_shift)
    attributable <- factual$heat_deaths - counterfactual$heat_deaths
    list(
      pattern_scale = pattern_scale,
      local_uniform_shift_c = as.numeric(local_shift),
      counterfactual_heat_deaths = counterfactual$heat_deaths,
      source_attributable_heat_deaths = as.numeric(attributable),
      attributable_deaths_per_million_represented_people = as.numeric(attributable / factual$represented_population * 1e6),
      regions_with_counterfactual_heat = counterfactual$regions_with_heat
    )
  })
  list(
    node_id = as.character(row$node_id),
    name = as.character(row$name),
    source_gas = as.character(row$source_gas),
    response_basis = as.character(row$response_basis),
    cumulative_gmst_screen_c_2022 = as.numeric(row$gmst_shift_c_2022),
    sensitivity = sensitivity
  )
})

zero_check <- heat_deaths_for_uniform_shift(0)
payload <- list(
  status = 'source_specific_nonlinear_human_endpoint_sensitivity_not_calibrated_attribution',
  runtime = list(
    r_version = R.version.string,
    platform = R.version$platform,
    package_versions = list(
      lubridate = as.character(packageVersion('lubridate')),
      ISOweek = as.character(packageVersion('ISOweek')),
      dlnm = as.character(packageVersion('dlnm')),
      mixmeta = as.character(packageVersion('mixmeta')),
      tsModel = as.character(packageVersion('tsModel')),
      jsonlite = as.character(packageVersion('jsonlite'))
    )
  ),
  method = list(
    factual = 'Authors simplified 103-region public sample of the weekly temperature-mortality model for summer 2022.',
    source_removal = 'Subtract each source cumulative GMST screen from every regional weekly mean using declared local-to-global pattern-scale sensitivities.',
    endpoint = 'Factual heat deaths minus deaths after the source-removal temperature shift, using the same exposure-response relationships and observed mortality baseline.',
    central_pattern_scale = 1.0,
    tested_pattern_scales = pattern_scales,
    interpretation = 'Pattern scales are deterministic sensitivity cases, not probabilities or confidence intervals.'
  ),
  input_counts = list(
    regions = n_regions,
    weekly_rows = nrow(datatable),
    source_nodes = nrow(shifts),
    co2_source_nodes = sum(shifts$source_gas == 'CO2'),
    methane_source_nodes = sum(shifts$source_gas == 'CH4'),
    calibration_period = '2015-2019',
    endpoint_period = 'summer 2022'
  ),
  factual = factual,
  zero_shift_check = list(
    repeated_factual_heat_deaths = zero_check$heat_deaths,
    absolute_difference = abs(factual$heat_deaths - zero_check$heat_deaths)
  ),
  results = results,
  limitations = c(
    'The source GMST histories begin in 1970 and omit earlier emissions.',
    'A uniform local temperature shift is a sensitivity assumption; it is not a validated regional source-removal climate pattern.',
    'The open mortality code is a simplified model and its authors state that results differ from the published article.',
    'The public repository contains 103 sample regions, not the published study full set of 823 regions.',
    'The endpoint covers one European summer, one human-health outcome and no ecosystem consequence.',
    'Point estimates omit exposure-response, climate-response and baseline uncertainty and cannot change a TULIP score or confidence grade.'
  )
)

write_json(payload, output_path, pretty = TRUE, auto_unbox = TRUE, digits = 15, na = 'null')
cat(sprintf('Wrote %s\n', normalizePath(output_path, mustWork = TRUE)))
