import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/usfs-bark-beetle-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.mapped_acre_observations, anchors.mapped_acre_observations),
  human_economic_burden: n(impact.documented_southern_pine_beetle_timber_producer_loss_usd, anchors.documented_loss_usd),
  persistence: n(impact.documented_economic_loss_period_years, anchors.documented_economic_loss_period_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('bark_beetle_epidemics: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'bark_beetle_epidemics',
  method: 'impact_fallback',
  as_of: String(impact.end_year),
  components,
  raw_inputs: {
    biophysical_burden: { start_year: impact.start_year, end_year: impact.end_year, annual: snapshot.extraction.annual, mapped_acre_observations: impact.mapped_acre_observations, observation_records: impact.observation_records, normalization_anchors_acre_observations: anchors.mapped_acre_observations },
    human_economic_burden: { documented_southern_pine_beetle_timber_producer_loss_usd: impact.documented_southern_pine_beetle_timber_producer_loss_usd, normalization_anchors_usd: anchors.documented_loss_usd, boundary: 'Historical U.S. South subset; not attributed to the current IDS polygons.' },
    persistence: { documented_economic_loss_period_years: impact.documented_economic_loss_period_years, normalization_anchors_years: anchors.documented_economic_loss_period_years },
    extent: { represented_us_areas: snapshot.extraction.represented_us_areas, directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, annual_statistics_response_sha256: snapshot.sources[0].annual_statistics_response_sha256, agent_names_response_sha256: snapshot.sources[0].agent_names_response_sha256, economic_report_sha256: snapshot.sources[1].report_sha256 }
  },
  transformations: [
    { type: 'exact_agent_and_damage_filter', formula: "Select IDS area records with a mortality damage type and an agent common name containing beetle; exclude root disease and beetle complex because causation is mixed." },
    { type: 'annual_mapped_area_accounting', formula: 'Sum mapped acres by survey year and across years as annual acre-observations; do not deduplicate or label the result unique cumulative land.' },
    { type: 'economic_subset_boundary', formula: 'Normalize the published U.S. South timber-producer loss separately; do not transfer that value to current national polygons.' },
    { type: 'persistence_boundary', formula: 'Use the source-reported 28-year economic-loss interval without inventing annual loss observations.' },
    { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; CONUS and Alaska survey coverage does not become global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `IDS records through ${impact.end_year}; API queried ${snapshot.sources[0].queried_at}; economic study published ${snapshot.sources[1].publication_year}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Forest Service survey records quantify bark-beetle mortality-area observations, a published producer-loss burden, persistence and one-country extent under an explicit exact-agent filter.',
    higher_priority_failures: ['Aerial survey coverage and detection effort vary spatially and annually, preventing a defensible current national or global trend.', 'The service contains five annual survey years, below the 20-annual-observation historical-distribution gate.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('bark_beetle_epidemics: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_64_usfs_bark_beetle', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-64.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-64.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
