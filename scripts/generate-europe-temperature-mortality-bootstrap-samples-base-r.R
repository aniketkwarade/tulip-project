#!/usr/bin/env Rscript

args <- commandArgs(trailingOnly = TRUE)
if (length(args) != 3L) stop("usage: generate-europe-temperature-mortality-bootstrap-samples-base-r.R REGIONS ITERATIONS OUTPUT")
regions <- as.integer(args[[1L]])
iterations <- as.integer(args[[2L]])
output_path <- args[[3L]]
if (!is.finite(regions) || regions <= 0L || !is.finite(iterations) || iterations <= 0L) stop("invalid bootstrap dimensions")

set.seed(12)
connection <- file(output_path, "wb")
on.exit(close(connection))
for (iteration in seq_len(iterations)) {
  sampled_units <- sample.int(regions, regions, replace = TRUE)
  counts <- tabulate(sampled_units, nbins = regions)
  if (sum(counts) != regions) stop("bootstrap sample size mismatch")
  writeBin(as.integer(counts), connection, size = 4L, endian = "little")
}

