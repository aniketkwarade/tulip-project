import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'staple-food-price-volatility-reference-snapshot.json');
const reportUrl = 'https://www.fao.org/agrifood-economics/publications/detail/en/c/1740904/';
const pdfUrl = 'https://www.fao.org/fileadmin/templates/cfs/CFS53/Plenary_documents/Inf.15_SOFI_Report/EN_compiled.pdf';
const pdfSha256 = 'e951247b1884aaddc983e2d1553b4754b10c852538613b3af99e82e3ac3d3c66';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const response = await fetch(pdfUrl, {
  headers: {
    accept: 'application/pdf',
    'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
  },
  signal: AbortSignal.timeout(180_000),
});
assert(response.ok, `Request failed (${response.status}) for ${pdfUrl}`);
const pdf = Buffer.from(await response.arrayBuffer());
assert.equal(sha256(pdf), pdfSha256, 'The official SOFI 2025 PDF changed');

const candidate = {
  previous: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'B' },
  revised: { value: 4.8, grade: 'C', lower: 4.0, upper: 7.8, confidence: 'B' },
  axes: {
    human: {
      severity: { lower: 2, central: 2, upper: 3 },
      reach: { lower: 1, central: 1, upper: 3 },
      persistence: { lower: 1, central: 2, upper: 3 },
    },
  },
  reason: 'FAO reports statistically adjusted associations between food-price increases and both food insecurity and child wasting. These outcomes establish material harm and remove a mild-inconvenience lower case. The report does not publish a current, deduplicated number of people harmed specifically by staple-price volatility, nor a source-native duration of the resulting harm. Central reach therefore remains conservative while a widespread upper case stays explicit.',
};

const payload = {
  version: 'tulip_staple_food_price_volatility_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_food_security_and_child_wasting_associations_ingested_current_attributable_population_and_duration_missing',
  productionRatingsEnabled: 0,
  nodeId: 'staple_food_price_volatility',
  source: {
    id: 'fao_sofi_2025_food_price_inflation_consequences',
    publishers: [
      'Food and Agriculture Organization of the United Nations',
      'International Fund for Agricultural Development',
      'United Nations Children’s Fund',
      'World Food Programme',
      'World Health Organization',
    ],
    title: 'The State of Food Security and Nutrition in the World 2025',
    publicationDate: '2025-07-28',
    doi: '10.4060/cd6008en',
    url: reportUrl,
    pdfUrl,
    pdfSha256,
    pageCount: 235,
  },
  currentWindow: {
    start: 2021,
    end: 2024,
    coverageStatus: 'multi_country_association_with_recent_inflation_context',
    summaryMethod: 'period_prevalence',
    coverageNote: 'The report assesses the recent global food-price surge and uses multi-country food-security and child-malnutrition models. It measures national food-price inflation, not a harmonized staple-only price index, and does not produce a current attributable-person total.',
  },
  evidence: {
    foodInsecurityAssociation: {
      foodPriceIncreasePercent: 10,
      moderateOrSevereFoodInsecurityIncreasePercent: 3.5,
      severeFoodInsecurityIncreasePercent: 1.8,
      modelInputs: ['Food Insecurity Experience Scale microdata', 'country fixed effects', 'time effects', 'regional trends', 'individual controls'],
      interpretation: 'These are adjusted associations with prevalence, not counts of unique people attributable to staple-price volatility.',
    },
    childWastingAssociation: {
      foodPriceIncreasePercent: 10,
      wastingPrevalenceIncreasePercentRange: { lower: 2.7, upper: 4.3 },
      severeWastingPrevalenceIncreasePercentRange: { lower: 4.8, upper: 6.1 },
      approximateCountries: 150,
      modelPeriod: { start: 1983, end: 2023 },
      observationsRange: { lower: 716, upper: 1_045 },
      modelInputs: ['WHO child-malnutrition data', 'macroeconomic controls', 'health-service controls', 'country-clustered or bootstrapped uncertainty'],
      interpretation: 'The model establishes a material nutritional consequence. It does not provide a current unique child count attributable to food-price change.',
    },
    recentInflationContextExcludedFromReach: {
      lowIncomeCountriesAboveTenPercentFoodInflationAtPeakPercent: 65,
      lowerMiddleIncomeCountriesAboveTenPercentFoodInflationAtPeakPercent: 61,
      populationLivingInThoseIncomeGroupsLowerBound: 1_500_000_000,
      interpretation: 'Country shares and resident population describe exposure to elevated food inflation. They are not a count of people who experienced food insecurity or wasting because of the price change.',
    },
    causalLimits: {
      sourceUsesAssociationLanguage: true,
      attributableCaseCountPublished: false,
      consequenceDurationPublished: false,
      stapleOnlyPriceMetricPublished: false,
      interpretation: 'Income, conflict, exchange rates, policy and other food-system pressures can affect prices and nutrition. The report adjusts for several covariates but does not identify a complete causal counterfactual for this TULIP node.',
    },
  },
  ratingDecision: {
    change: 'central_value_retained_lower_grade_bound_narrowed_with_direct_human_outcome_associations',
    candidate,
    admittedUses: [
      'Use the food-insecurity and child-wasting associations to set human severity lower and central bounds at level 2.',
      'Use the multi-country evidence and recent inflation footprint only to retain a widespread upper reach case.',
      'Use the source-model details to distinguish adjusted associations from causal attributable case counts.',
    ],
    excludedUses: [
      'Do not convert the 1.5 billion residents of low- and lower-middle-income countries into people harmed by staple-price volatility.',
      'Do not convert the percentage response in prevalence into attributable cases without a compatible baseline population, period and counterfactual.',
      'Do not describe a model association as a source-reported causal effect or add food insecurity and child wasting as separate reach counts.',
      'Do not treat national food-price inflation as a perfectly matched staple-only price metric.',
      'Do not use the 1983–2023 model period or the recent inflation window as consequence persistence.',
      'Do not add hunger driven by conflict, displacement, income loss or exchange-rate shocks unless a source attributes a non-overlapping share to this node.',
      'Do not infer ecosystem harm from a human food-price assessment.',
    ],
    exactRemainingGaps: [
      'A current, deduplicated count of people or children experiencing an adverse outcome attributable specifically to staple-food price volatility.',
      'A causal counterfactual separating the price pathway from income, conflict, exchange-rate, policy and other food-system shocks.',
      'Consequence duration and recovery time for affected households or children.',
      'A harmonized staple-only price measure linked to the same outcome model and geography.',
      'Current country-level baseline populations and prevalence estimates compatible with the reported response coefficients.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  source: payload.source,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, sourcePdfSha256: pdfSha256, candidate: candidate.revised }, null, 2));
