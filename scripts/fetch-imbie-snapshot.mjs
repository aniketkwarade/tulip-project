import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchText, readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARTICLE_URL = 'https://essd.copernicus.org/articles/15/1597/2023/';
const DATASET_DOI = 'https://doi.org/10.5285/77B64C55-7166-4A06-9DEF-2E400398E452';
const ARTICLE_DOI = 'https://doi.org/10.5194/essd-15-1597-2023';
const PERIOD_YEARS = 29;

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&plusmn;|&#177;|±/g, '±')
    .replace(/&minus;|&#8722;/g, '−')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&ndash;|&#8211;/g, '–')
    .replace(/\s+/g, ' ')
    .trim();
}

const round = (value, digits = 3) => Number(value.toFixed(digits));

function requireMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match) throw new Error(`IMBIE source readback failed for ${label}`);
  return match.slice(1).map(Number);
}

function annualizedRecord({ id, region, cumulativeLoss, cumulativeUncertainty, seaLevel, seaLevelUncertainty, sourceLocator }) {
  const rate = -cumulativeLoss / PERIOD_YEARS;
  const rateUncertainty = cumulativeUncertainty / PERIOD_YEARS;
  return {
    record_id: id,
    region,
    period_start: 1992,
    period_end: 2020,
    period_years: PERIOD_YEARS,
    cumulative_mass_change_gt: -cumulativeLoss,
    cumulative_mass_change_uncertainty_gt: cumulativeUncertainty,
    mass_balance_rate_gtyr: round(rate),
    mass_balance_rate_lower_gtyr: round(rate - rateUncertainty),
    mass_balance_rate_upper_gtyr: round(rate + rateUncertainty),
    rate_basis: 'derived annualized rate from source-reported cumulative mass change divided by the declared 29-year assessment span',
    sea_level_equivalent_mm: seaLevel,
    sea_level_equivalent_uncertainty_mm: seaLevelUncertainty,
    source_locator: sourceLocator,
    source_reported_or_derived: 'annual_rate_derived_from_source_reported_cumulative_total'
  };
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const contract = contracts.ice_sheet_mass_loss;
  if (!contract) throw new Error('Missing node metric contract for ice_sheet_mass_loss');

  const html = await fetchText(ARTICLE_URL, { headers: { Accept: 'text/html,application/xhtml+xml' } });
  const text = stripHtml(html);
  const [antarcticLoss, antarcticUncertainty, antarcticSeaLevel, antarcticSeaLevelUncertainty] = requireMatch(
    text,
    /Antarctic Ice Sheet lost\s*([0-9.]+)±([0-9.]+)\s*Gt[^.]+global sea level by\s*([0-9.]+)±([0-9.]+)\s*mm/i,
    'Antarctic cumulative mass and sea-level contribution'
  );
  const [greenlandLoss, greenlandUncertainty, greenlandRate, greenlandRateUncertainty] = requireMatch(
    text,
    /Greenland[^.]+with\s*([0-9.]+)±([0-9.]+)\s*Gt in total at an average rate of\s*([0-9.]+)±([0-9.]+)\s*Gt\s*yr/i,
    'Greenland cumulative and annual mass loss'
  );
  const [combinedLoss, combinedUncertainty, combinedSeaLevel, combinedSeaLevelUncertainty] = requireMatch(
    text,
    /Combined, Antarctica and Greenland lost\s*([0-9.]+)±([0-9.]+)\s*Gt[^.]+global sea level by\s*([0-9.]+)±([0-9.]+)\s*mm/i,
    'combined cumulative mass and sea-level contribution'
  );

  const greenlandRateSigned = -greenlandRate;
  const records = [
    {
      record_id: 'imbie_greenland_1992_2020',
      region: 'Greenland Ice Sheet',
      period_start: 1992,
      period_end: 2020,
      period_years: PERIOD_YEARS,
      cumulative_mass_change_gt: -greenlandLoss,
      cumulative_mass_change_uncertainty_gt: greenlandUncertainty,
      mass_balance_rate_gtyr: greenlandRateSigned,
      mass_balance_rate_lower_gtyr: greenlandRateSigned - greenlandRateUncertainty,
      mass_balance_rate_upper_gtyr: greenlandRateSigned + greenlandRateUncertainty,
      rate_basis: 'source-reported 1992-2020 average rate',
      sea_level_equivalent_mm: null,
      sea_level_equivalent_uncertainty_mm: null,
      source_locator: 'Results, paragraph following Figure 4: Greenland cumulative and average mass loss',
      source_reported_or_derived: 'source_reported_rate_and_uncertainty'
    },
    annualizedRecord({
      id: 'imbie_antarctica_1992_2020',
      region: 'Antarctic Ice Sheet',
      cumulativeLoss: antarcticLoss,
      cumulativeUncertainty: antarcticUncertainty,
      seaLevel: antarcticSeaLevel,
      seaLevelUncertainty: antarcticSeaLevelUncertainty,
      sourceLocator: 'Results, paragraph following Figure 4: Antarctic cumulative mass loss and sea-level contribution'
    }),
    annualizedRecord({
      id: 'imbie_combined_1992_2020',
      region: 'Greenland and Antarctic ice sheets combined',
      cumulativeLoss: combinedLoss,
      cumulativeUncertainty: combinedUncertainty,
      seaLevel: combinedSeaLevel,
      seaLevelUncertainty: combinedSeaLevelUncertainty,
      sourceLocator: 'Results, paragraph following Figure 4: combined cumulative mass loss and sea-level contribution'
    })
  ];

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_imbie_mass_balance_assessment',
    source: {
      id: 'ice_sheet_mass_balance_inter_comparison_exercise',
      name: 'Ice Sheet Mass Balance Inter-comparison Exercise',
      publisher: 'IMBIE Team via Earth System Science Data and UK Polar Data Centre',
      article_url: ARTICLE_URL,
      article_doi: ARTICLE_DOI,
      dataset_doi: DATASET_DOI
    },
    request: {
      assessment_period: '1992-2020',
      source_section: 'Abstract and Results paragraphs following Figure 4',
      required_claims: ['Greenland cumulative and average mass loss', 'Antarctic cumulative mass loss and sea-level contribution', 'combined cumulative mass loss and sea-level contribution']
    },
    contractIds: [contract.metric_id],
    contractBindings: [{ node_id: 'ice_sheet_mass_loss', metric_id: contract.metric_id }],
    cadence: 'annual source check and refresh when IMBIE publishes a new reconciled assessment',
    provenance: 'Peer-reviewed IMBIE reconciliation combining 50 independent satellite-derived estimates from gravimetry, altimetry, and input-output methods over 1992-2020.',
    uncertainty: 'Source-reported uncertainties are retained. Annualized Antarctic and combined rates divide cumulative uncertainty by the same 29-year span and are labeled derived rather than source-reported annual rates.',
    records,
    sourceSummary: {
      assessment_span: '1992-2020',
      independent_estimates_reconciled: 50,
      regions: records.length,
      combined_cumulative_mass_change_gt: -combinedLoss,
      combined_cumulative_uncertainty_gt: combinedUncertainty,
      combined_sea_level_equivalent_mm: combinedSeaLevel,
      combined_sea_level_uncertainty_mm: combinedSeaLevelUncertainty,
      measurement_boundary: 'This assessment measures ice-sheet mass balance. It does not directly measure firn air content, grounding-line position, or surface-elevation change as separate operational contracts.'
    },
    caveats: [
      'The snapshot is assessment-grade rather than daily telemetry.',
      'Peripheral glacier inclusion differs across satellite methods and is an explicit limitation in the source.',
      'Negative values denote net ice-sheet mass loss; uncertainty intervals retain the same sign convention.',
      'Do not apply combined or ice-sheet-wide rates to individual drainage basins.'
    ],
    failureBehavior: 'Retain the last validated IMBIE assessment, mark it stale, expose source-text or schema failure, and never replace a missing uncertainty with zero or reuse values across a changed assessment period.'
  });

  const output = await writeSnapshot(ROOT, 'imbie-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: records.length, combined_loss_gt: combinedLoss, combined_uncertainty_gt: combinedUncertainty }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
