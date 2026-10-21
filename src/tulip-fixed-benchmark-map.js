// Numerical mapping only. Evidence, endpoint scope and anchor meanings must be
// established by the caller's separately versioned calibration protocol.
export const BENCHMARK_SCORE_POINTS = Object.freeze([1, 3, 5, 7, 9, 10]);

export function validateFixedBenchmarkPoints(points) {
  if (!Array.isArray(points) || points.length !== BENCHMARK_SCORE_POINTS.length
    || points.some((point, index) => point?.score !== BENCHMARK_SCORE_POINTS[index]
      || typeof point?.burden !== 'number' || !Number.isFinite(point.burden)
      || point.burden < 0
      || (index > 0 && point.burden <= points[index - 1]?.burden))
    || points[0]?.burden !== 0) return ['anchor_order_or_values_invalid'];
  return [];
}

// Offset is expressed in the SAME canonical unit as value and the anchors.
// This makes log1p(value / offset) dimensionless. Never infer it from a node
// distribution. Convert source units before invoking this function.
export function mapFixedBenchmarkMagnitude(value, points, offset = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0
    || typeof offset !== 'number' || !Number.isFinite(offset) || offset <= 0
    || validateFixedBenchmarkPoints(points).length) return null;
  if (value >= points.at(-1).burden) return 10;
  // log1p(value / offset) can overflow for a finite value and tiny offset.
  // log(value + offset) differs only by a constant, which cancels below.
  const logQuantity = quantity => {
    const high = Math.max(quantity, offset);
    const low = Math.min(quantity, offset);
    return Math.log(high) + Math.log1p(low / high);
  };
  for (let index = 1; index < points.length; index++) {
    const high = points[index];
    if (value > high.burden) continue;
    const low = points[index - 1];
    const lowLog = logQuantity(low.burden);
    const highLog = logQuantity(high.burden);
    const denominator = highLog - lowLog;
    if (!Number.isFinite(denominator) || denominator <= 0) return null;
    const share = (logQuantity(value) - lowLog) / denominator;
    return low.score + share * (high.score - low.score);
  }
  return null;
}

export const roundBenchmarkDisplay = value => Math.round((value + 1e-9) * 10) / 10;
