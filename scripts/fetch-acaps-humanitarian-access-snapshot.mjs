import path from 'node:path';
import process from 'node:process';
import { writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = process.cwd();
const OUTPUT_FILE = 'acaps-humanitarian-access-snapshot.json';
const SOURCE_ID = 'acaps_humanitarian_access';
const JOB_ID = 'fetch_acaps_humanitarian_access';
const METRIC_ID = 'acaps_humanitarian_access_severity_distribution';
const TOPIC_PAGE = 'https://www.acaps.org/en/thematics/all-topics/humanitarian-access-overview';
const DATA_PAGE = 'https://www.acaps.org/en/data';

const decodeHtml = value => String(value || '')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&ndash;|&#8211;/gi, '–')
  .replace(/&mdash;|&#8212;/gi, '—')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#0*39;/gi, "'")
  .replace(/&[a-z]+;|&#\d+;/gi, ' ');

const plainText = html => decodeHtml(html)
  .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const wordNumbers = Object.freeze({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 });
const numberToken = token => /^\d+$/.test(token) ? Number(token) : wordNumbers[token.toLowerCase()] ?? null;
const requireMatch = (text, regex, label) => {
  const match = text.match(regex);
  if (!match) throw new Error(`ACAPS assessment page no longer exposes ${label} in the expected wording.`);
  return match;
};

async function main() {
  console.log('ACAPS: fetching the published humanitarian-access assessment summary');
  const response = await fetch(TOPIC_PAGE, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound public assessment ingestion)'
    },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`ACAPS assessment request failed: ${response.status} ${response.statusText}`);
  const text = plainText(await response.text());

  const period = requireMatch(text, /Between\s+(June\s+\d{4})\s+and\s+(November\s+\d{4}),\s+crisis-affected populations in\s+(\d+)\s+countries experienced high to extreme humanitarian access constraints/i, 'assessment period and high-to-extreme country count');
  const distribution = requireMatch(text, /deterioration in\s+(\d+)%\s+of the crisis-affected countries\s+\((\d+)\s+countries\)\s+and an improvement in\s+(\d+)%\s+\((\w+)\s+countries\),\s+while the humanitarian access situation remained stable\s+for\s+(\d+)%\s+\((\d+)\s+countries\)/i, 'deterioration, improvement, and stable distribution');
  const severityShare = requireMatch(text, /high to extreme levels of humanitarian constraints\s+\(3[–-]5\)\s+in\s+(\d+)%\s+of crisis-affected countries/i, 'high-to-extreme severity share');
  const method = requireMatch(text, /methodology groups\s+(\d+)\s+indicators under\s+(\d+)\s+pillars.*?final score on a scale of\s+(\d+)[–-](\d+)/i, 'indicator, pillar, and score-scale definition');

  const highExtremeCountries = Number(period[3]);
  const deterioratedCountries = Number(distribution[2]);
  const improvedCountries = numberToken(distribution[4]);
  const stableCountries = Number(distribution[6]);
  const assessedCountries = deterioratedCountries + improvedCountries + stableCountries;
  if (![highExtremeCountries, improvedCountries, assessedCountries].every(Number.isFinite) || assessedCountries < 50) {
    throw new Error('ACAPS published counts could not be reconciled into a valid assessment panel.');
  }

  const record = {
    record_id: 'acaps_humanitarian_access_2025_h2_global_distribution',
    metric_id: METRIC_ID,
    measurement_role: 'global_country_access_severity_distribution_authoritative_assessment',
    geography: 'crisis-affected countries assessed by ACAPS',
    observation_period_start: '2025-06-01',
    observation_period_end: '2025-11-30',
    observation_date: '2025-11-30',
    assessed_country_count_derived_from_trend_categories: assessedCountries,
    source_reported_high_to_extreme_country_count: highExtremeCountries,
    source_reported_high_to_extreme_country_share_pct: Number(severityShare[1]),
    high_to_extreme_threshold: 'ACAPS overall access score 3-5',
    source_reported_deteriorated_country_count: deterioratedCountries,
    source_reported_deteriorated_country_share_pct: Number(distribution[1]),
    source_reported_improved_country_count: improvedCountries,
    source_reported_improved_country_share_pct: Number(distribution[3]),
    source_reported_stable_country_count: stableCountries,
    source_reported_stable_country_share_pct: Number(distribution[5]),
    methodology_indicator_count: Number(method[1]),
    methodology_pillar_count: Number(method[2]),
    source_score_scale_min: Number(method[3]),
    source_score_scale_max: Number(method[4]),
    source_locator: {
      url: TOPIC_PAGE,
      period_claim: period[0],
      distribution_claim: distribution[0],
      severity_share_claim: severityShare[0],
      methodology_claim: method[0]
    }
  };

  const snapshot = {
    version: 'acaps_humanitarian_access_assessment_summary_v1',
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'ACAPS Humanitarian Access',
      url: TOPIC_PAGE,
      data_url: DATA_PAGE,
      api_url: 'https://api.acaps.org/',
      access: 'open published assessment summary; country-level REST API requires free registration'
    },
    ingestion_job_id: JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'Twice-yearly assessment release with weekly page-change monitoring.',
    provenance: 'ACAPS published Humanitarian Access Overview. The operational record retains the assessment period, source-reported country counts and shares, score threshold, and the nine-indicator, three-pillar methodology.',
    uncertainty: 'The source synthesizes analyst-reviewed secondary information. Country aggregation can hide subnational variation; crisis definitions, information access, source availability, conflict dynamics and assessment revisions affect comparison. The assessed-country denominator is derived from the three source-reported trend-category counts because the page does not state that denominator directly.',
    failure_behavior: 'Retain the last validated assessment and mark stale; reject missing claims, changed method or unreconciled counts. Never infer people reached, access incidents, causal drivers, aid delivered, or country-specific severity from the global distribution.',
    measurement_boundary: 'This is a twice-yearly global distribution of assessed access severity, not a real-time incident feed, population estimate, country-specific score table, or causal effect estimate.',
    record_count: 1,
    records: [record]
  };
  const output = await writeSnapshot(ROOT, OUTPUT_FILE, snapshot);
  console.log(JSON.stringify({ output: path.resolve(output), high_extreme_countries: highExtremeCountries, high_extreme_share_pct: record.source_reported_high_to_extreme_country_share_pct, assessed_countries_derived: assessedCountries }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
