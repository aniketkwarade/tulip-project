import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const peakTrends = [
  { taxon: 'oak', annual_peak_concentration_change_pct: 4.9 },
  { taxon: 'juniper', annual_peak_concentration_change_pct: 5.8 },
  { taxon: 'sycamore', annual_peak_concentration_change_pct: 7.9 },
  { taxon: 'birch', annual_peak_concentration_change_pct: 6.7 },
  { taxon: 'mulberry', annual_peak_concentration_change_pct: 12.8 },
  { taxon: 'willow', annual_peak_concentration_change_pct: 5.6 }
];
const sortedPeakTrends = peakTrends.map(row => row.annual_peak_concentration_change_pct).sort((a, b) => a - b);
const medianPeakTrend = (sortedPeakTrends[2] + sortedPeakTrends[3]) / 2;

const snapshot = {
  version: 'cdc_atlanta_allergenic_pollen_1992_2018_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'cdc_atlanta_allergenic_pollen_trends_1992_2018',
      name: 'Long-term Pollen Trends and Seasonal Climate in Atlanta, 1992-2018',
      publisher: 'Annals of Allergy, Asthma & Immunology / CDC Stacks',
      url: 'https://stacks.cdc.gov/view/cdc/124827',
      download_url: 'https://stacks.cdc.gov/view/cdc/124827/cdc_124827_DS1.pdf',
      report_sha256: 'eea0b6053d1929c3fc2329f42b9217f319b7bdf5403b8099c488b297ffcaffbf',
      doi: '10.1016/j.anai.2021.07.012',
      publication_year: 2021
    }
  ],
  metric_contract: {
    node_id: 'pollen_allergen_spikes',
    metric_id: 'airborne_allergenic_pollen_exposure',
    unit: 'grains per cubic metre with annual percent change in seasonal peak concentration',
    geography: 'one National Allergy Bureau-certified station serving metropolitan Atlanta, Georgia',
    period: '1992-2018',
    boundary: 'Peak concentration trends are taxon-specific and use one station. The receipt does not compare unmatched samplers, infer local plant sources, convert season length into exposure intensity, or attribute all U.S. allergic-rhinitis burden to Atlanta pollen trends.'
  },
  accumulated_impact: {
    start_year: 1992,
    end_year: 2018,
    observation_years: 27,
    sampled_taxa: 13,
    taxa_with_significant_increasing_peak_concentration: peakTrends.length,
    significant_peak_concentration_trends: peakTrends,
    median_significant_annual_peak_concentration_change_pct: medianPeakTrend,
    spring_grouped_tree_average_daily_concentration_change_pct_per_year: 3.9,
    fall_grouped_tree_average_daily_concentration_change_pct_per_year: 10.4,
    adult_allergic_rhinitis_cases_us_context_only: 19800000,
    child_allergic_rhinitis_cases_us_context_only: 5600000,
    combined_allergic_rhinitis_cases_us_context_only: 25400000,
    historical_annual_treatment_cost_usd_context_only: 11200000000,
    monitored_metro_areas: 1,
    stated_station_representativeness_radius_miles: 25
  },
  reviewed_normalization_anchors: {
    annual_peak_concentration_change_pct: [0, 1, 5, 15],
    associated_allergic_rhinitis_cases: [0, 100000, 10000000, 50000000],
    observation_years: [0, 1, 10, 30],
    monitored_metro_areas: [0, 1, 10, 100]
  },
  uncertainty: 'The concentration series represents one Atlanta-area station and cannot establish national or global pollen conditions. Sampling was typically five days per week, later expanding during peak periods; the station moved within a nine-mile radius, though the study found no significant discontinuity. Peak trends differ by taxon, and only statistically significant increasing peak trends are summarized. The national allergic-rhinitis total includes causes beyond outdoor pollen and is retained as bounded associated health burden rather than an Atlanta-attributable case count.'
};

await fs.writeFile(path.join(ROOT, 'public/cdc-atlanta-pollen-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/cdc-atlanta-pollen-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
