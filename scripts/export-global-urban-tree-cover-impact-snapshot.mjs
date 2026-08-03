import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'global_urban_tree_cover_impact_2012_2017_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'nowak_greenfield_global_urban_tree_cover_change_2020',
      name: 'The increase of impervious cover and decrease of tree cover within urban areas globally (2012–2017)',
      publisher: 'USDA Forest Service / Urban Forestry & Urban Greening',
      url: 'https://research.fs.usda.gov/treesearch/59488',
      doi: '10.1016/j.ufug.2020.126638',
      reviewed_pdf_sha256: 'a7058a7cd401166b844756d2857e732bba297372e819be611c1c14793a169d5b'
    },
    {
      id: 'nowak_greenfield_us_urban_tree_cover_benefit_loss_2018',
      name: 'Declining urban and community tree cover in the United States',
      publisher: 'USDA Forest Service / Urban Forestry & Urban Greening',
      url: 'https://research.fs.usda.gov/treesearch/55941',
      doi: '10.1016/j.ufug.2018.03.006'
    }
  ],
  assessment: {
    global_cover_change: {
      approximate_start_year: 2012,
      end_year: 2017,
      average_observation_interval_years: 5.1,
      paired_sample_points: 7341,
      urban_tree_cover_start_pct: 26.7,
      urban_tree_cover_end_pct: 26.5,
      net_change_percentage_points: -0.2,
      annualized_change_percentage_points: -0.04,
      annual_tree_cover_loss_hectares: 40000,
      approximate_study_period_loss_hectares: 200000,
      statistically_significant_global_decline: true
    },
    persistence_context: {
      tree_cover_loss_converted_to_impervious_pct: 32,
      global_annual_impervious_cover_gain_hectares: 326000,
      global_impervious_cover_start_pct: 24.3,
      global_impervious_cover_end_pct: 25.9,
      scoring_boundary: 'Use the observed share of lost tree cover converted to impervious cover as a persistence indicator; do not assume that all other tree-cover loss is irreversible.'
    },
    human_economic_burden: {
      bounded_geography: 'United States urban areas',
      annual_tree_loss_count: 36000000,
      annual_estimated_benefit_loss_usd_2018: 96000000,
      benefit_categories: ['air-pollution removal', 'building-energy effects', 'carbon sequestration', 'avoided pollutant emissions'],
      scoring_boundary: 'Use the independently quantified United States benefit loss as a bounded economic burden; do not scale it to the world.'
    },
    global_extent: {
      inhabited_continents_assessed: 6,
      continents_with_net_tree_cover_loss: 5,
      continents_with_net_tree_cover_gain: ['Europe'],
      continents_with_net_tree_cover_loss_names: ['Africa', 'Asia', 'North America', 'Oceania', 'South America']
    }
  },
  uncertainty: 'The global study uses paired high-resolution photo interpretation within a fixed circa-2010 urban boundary. Image dates vary around 2012 and 2017, and the global result is area-weighted from continental estimates. The measured decline is small but statistically significant. The economic burden is independently estimated for United States urban areas only and is retained as a bounded corroborating impact rather than extrapolated globally.'
};

await fs.writeFile(
  path.join(ROOT, 'public/global-urban-tree-cover-impact-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/global-urban-tree-cover-impact-snapshot.json',
  version: snapshot.version,
  source_count: snapshot.sources.length
}, null, 2));
