// Source-method diagnostic only. Water withdrawal pressure is not a TULIP
// consequence quantity, a count of people harmed, or an approved score input.
export function auditAnnualWaterScarcity(months) {
  const reasons = [];
  if (!Array.isArray(months) || months.length !== 12) reasons.push('twelve_months_required');
  const rows = Array.isArray(months) ? months : [];
  const periods = rows.map(row => row?.month);
  if (new Set(periods).size !== 12 || periods.some(month => !Number.isInteger(month) || month < 1 || month > 12)) {
    reasons.push('unique_calendar_months_required');
  }
  const scope = rows[0];
  for (const field of ['year', 'catchmentId', 'scenarioId']) {
    if (scope?.[field] == null || scope[field] === '' || rows.some(row => row?.[field] !== scope[field])) {
      reasons.push(`${field}_missing_or_incompatible`);
    }
  }
  if (!Number.isInteger(scope?.year)) reasons.push('calendar_year_required');
  if (rows.some(row => row?.unit !== 'm3' && row?.unit !== 'litre')) reasons.push('compatible_volume_units_required');
  if (rows.some(row => !Number.isFinite(row?.withdrawal) || row.withdrawal < 0
    || !Number.isFinite(row?.availability) || row.availability < 0)) reasons.push('complete_nonnegative_volumes_required');
  if (reasons.length) return { status: 'needs_source_inputs', category: null, reasons, score: null };

  const normalized = [...rows].sort((a, b) => a.month - b.month).map(row => {
    const factor = row.unit === 'litre' ? 0.001 : 1;
    return { withdrawal: row.withdrawal * factor, availability: row.availability * factor };
  });
  const withdrawals = normalized.reduce((sum, row) => sum + row.withdrawal, 0);
  const availability = normalized.reduce((sum, row) => sum + row.availability, 0);
  if (!Number.isFinite(withdrawals) || !Number.isFinite(availability)) {
    return { status: 'needs_source_inputs', category: null, reasons: ['volume_sum_not_finite'], score: null };
  }
  // Comparisons are well-defined even when a month's available supply is zero.
  // Undefined ratios remain null; no epsilon or missing-value replacement is used.
  const perennial = withdrawals > availability;
  const monthlyDeficit = normalized.some(row => row.withdrawal > row.availability);
  const ratios = normalized.map(row => row.availability > 0 ? row.withdrawal / row.availability : null);
  const meanMonthlyRatio = ratios.every(value => value !== null && Number.isFinite(value))
    ? ratios.reduce((sum, value) => sum + value, 0) / 12 : null;
  return {
    status: 'source_method_diagnostic',
    category: perennial ? 'perennial' : monthlyDeficit ? 'seasonal_only' : 'no_withdrawal_deficit',
    annualVolumeRatio: availability > 0 ? withdrawals / availability : null,
    annualWithdrawalsM3: withdrawals, annualAvailabilityM3: availability,
    meanMonthlyRatioDiagnosticOnly: meanMonthlyRatio,
    zeroAvailabilityMonthCount: ratios.filter(value => value === null).length,
    scope: { year: scope.year, catchmentId: scope.catchmentId, scenarioId: scope.scenarioId },
    reasons: [], score: null, publicReady: false,
    limitation: 'This classifies modeled physical withdrawal pressure under a declared definition; it does not establish delivered water-service loss, health harm or its causal attribution.',
  };
}
