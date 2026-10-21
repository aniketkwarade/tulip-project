import assert from 'node:assert/strict';

export const METHANE_GWP_STAR_METHOD = Object.freeze({
  g: 1.13,
  s: 0.25,
  changePeriodYears: 20,
  fossilMethaneGwp100: 29.8,
  biogenicMethaneGwp100: 27.2,
  tcreBestCPerPgCO2we: 1.65 / 1000 / 3.664,
  tcreLowerCPerPgCO2we: 0.27 / 1000,
  tcreUpperCPerPgCO2we: 0.63 / 1000,
  sourceCodeCommit: '1a16ce60e0e3cc74086c28a53386ac95bc9007fd',
  sourceCodePath: 'Scripts/TRUNK/TR.2_calculate_CO2e_emissions_GWPstar.R',
});

const round = (value, digits = 12) => Number(value.toFixed(digits));

export function calculateMethaneGwpStar({
  annualEmissions,
  referenceYear,
  gwp100,
  method = METHANE_GWP_STAR_METHOD,
}) {
  assert(Array.isArray(annualEmissions) && annualEmissions.length, 'annual methane history is required');
  assert(Number.isInteger(referenceYear), 'reference year must be an integer');
  assert(Number.isFinite(gwp100) && gwp100 > 0, 'GWP100 must be positive');
  const rows = annualEmissions
    .map(row => ({ year: Number(row.year), annualTgCH4: Number(row.annualTgCH4) }))
    .sort((left, right) => left.year - right.year);
  assert(rows.every(row => Number.isInteger(row.year) && Number.isFinite(row.annualTgCH4)), 'invalid annual methane row');
  assert.equal(new Set(rows.map(row => row.year)).size, rows.length, 'duplicate methane years');
  for (let index = 1; index < rows.length; index += 1) {
    assert.equal(rows[index].year, rows[index - 1].year + 1, 'methane history must be contiguous');
  }
  assert(rows[0].year <= referenceYear - method.changePeriodYears,
    `methane history must begin by ${referenceYear - method.changePeriodYears}`);
  assert(rows.at(-1).year > referenceYear, 'methane history must extend beyond the reference year');

  const cumulativeByYear = new Map();
  let cumulativeTgCH4 = 0;
  for (const row of rows) {
    cumulativeTgCH4 += row.annualTgCH4;
    cumulativeByYear.set(row.year, cumulativeTgCH4);
  }
  const rawPgCO2we = year => {
    const cumulative = cumulativeByYear.get(year);
    const prior = cumulativeByYear.get(year - method.changePeriodYears);
    assert(Number.isFinite(cumulative) && Number.isFinite(prior), `${year}: missing twenty-year GWP* input`);
    const twentyYearEmissionsTgCH4 = cumulative - prior;
    const sustainedTermTgCO2we = method.g * method.s * cumulative * gwp100;
    const rateChangeTermTgCO2we = method.g * (1 - method.s) * 100
      * twentyYearEmissionsTgCH4 * gwp100 / method.changePeriodYears;
    return {
      cumulativeTgCH4: cumulative,
      twentyYearEmissionsTgCH4,
      sustainedTermTgCO2we,
      rateChangeTermTgCO2we,
      rawPgCO2we: (sustainedTermTgCO2we + rateChangeTermTgCO2we) / 1000,
    };
  };
  const baseline = rawPgCO2we(referenceYear).rawPgCO2we;
  const records = rows.filter(row => row.year > referenceYear).map(row => {
    const raw = rawPgCO2we(row.year);
    const cumulativePgCO2weSinceReference = raw.rawPgCO2we - baseline;
    const best = cumulativePgCO2weSinceReference * method.tcreBestCPerPgCO2we;
    const boundA = cumulativePgCO2weSinceReference * method.tcreLowerCPerPgCO2we;
    const boundB = cumulativePgCO2weSinceReference * method.tcreUpperCPerPgCO2we;
    return {
      year: row.year,
      annualTgCH4: round(row.annualTgCH4),
      cumulativeTgCH4FromInputStart: round(raw.cumulativeTgCH4),
      twentyYearEmissionsTgCH4: round(raw.twentyYearEmissionsTgCH4),
      sustainedTermTgCO2we: round(raw.sustainedTermTgCO2we),
      rateChangeTermTgCO2we: round(raw.rateChangeTermTgCO2we),
      cumulativePgCO2weSinceReference: round(cumulativePgCO2weSinceReference),
      gmstResponseC: {
        lower: round(Math.min(boundA, boundB)),
        best: round(best),
        upper: round(Math.max(boundA, boundB)),
      },
    };
  });
  return {
    method: {
      g: method.g,
      s: method.s,
      changePeriodYears: method.changePeriodYears,
      gwp100,
      referenceYear,
      tcreBestCPerPgCO2we: method.tcreBestCPerPgCO2we,
      tcreLowerCPerPgCO2we: method.tcreLowerCPerPgCO2we,
      tcreUpperCPerPgCO2we: method.tcreUpperCPerPgCO2we,
    },
    inputPeriod: { start: rows[0].year, end: rows.at(-1).year },
    outputPeriod: { start: records[0].year, end: records.at(-1).year },
    baselineRawPgCO2we: round(baseline),
    records,
  };
}
