import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'premium_standard_farms_missouri_lagoon_settlement_2001_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'epa_premium_standard_farms_multimedia_settlement_2001',
      name: 'EPA Premium Standard Farms and Continental Grain Multimedia Settlement',
      publisher: 'U.S. Environmental Protection Agency and U.S. Department of Justice',
      publication_date: '2001-11-20',
      url: 'https://www.epa.gov/archive/epapages/newsroom_archive/newsreleases/db8bd3f214a2406d85256b0a0079a7ee.html',
      source_locators: [
        'EPA reports 1.25 million pigs, more than 1,000 hog barns, 163 animal-waste lagoons and 21 large farms primarily located in five northwest Missouri counties.',
        'The companies agreed to a USD 350,000 federal civil penalty in addition to USD 650,000 previously paid to Missouri.',
        'The decree required at least a 50-percent nitrogen-content reduction before land application at larger Class 1A farms, lagoon leakage testing, emissions reporting and new management practices.'
      ]
    },
    {
      id: 'epa_premium_standard_farms_consent_decree_2001',
      name: 'EPA Premium Standard Farms Consent Decree',
      publisher: 'U.S. District Court for the Western District of Missouri',
      publication_date: '2001-11-19',
      url: 'https://www.epa.gov/sites/default/files/documents/psfcd.pdf',
      source_locators: [
        'The decree describes breeding, gestation, farrowing and grow-finish facilities, with each farm consisting of multiple sites and each site having its own lagoon system.',
        'Most lagoons treated and stored effluent in a single-stage anaerobic system before land application.',
        'Premium Standard Farms began operations in 1988; the receipt uses this to bound system persistence, not to assert that every alleged violation persisted for 13 years.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'anaerobic_manure_lagoon_operation',
    metric_id: 'manure_lagoon_loading_and_retention',
    unit: 'swine head, lagoon systems, farms, counties, operating years and paid civil penalties',
    geography: 'Premium Standard Farms and Continental Grain northwest Missouri CAFO portfolio',
    assessment_period: '1988-01-01 to 2001-11-20',
    boundary: 'The receipt preserves species, facility classes, lagoon technology and portfolio geography. It does not infer hydraulic retention time or nutrient mass from pig counts, treat future technology spending as realized loss, or assign all regional water-quality impacts to every lagoon.'
  },
  accumulated_impact: {
    confined_pig_head_approx: 1250000,
    hog_barns_more_than: 1000,
    anaerobic_animal_waste_lagoon_count: 163,
    large_farm_count: 21,
    county_count: 5,
    operation_start_year: 1988,
    settlement_year: 2001,
    operating_system_span_years: 13,
    federal_civil_penalty_usd: 350000,
    prior_missouri_penalties_usd: 650000,
    total_paid_civil_penalties_usd_derived: 1000000,
    required_nitrogen_content_reduction_percent_at_least_unscored: 50,
    future_wastewater_technology_spending_usd_up_to_unscored: 50000000,
    supplemental_environmental_project_usd_unscored: 300000
  },
  reviewed_normalization_anchors: {
    confined_swine_head: [0, 10000, 100000, 1000000],
    paid_civil_penalties_usd: [0, 10000, 100000, 1000000],
    operating_system_span_years: [0, 1, 5, 20],
    large_farm_count: [0, 1, 5, 20]
  },
  uncertainty: 'The 1.25 million-pig count is an approximate portfolio total and is not converted to standardized animal units because age and weight classes are mixed. Lagoon liquid volume, volatile-solids load, hydraulic retention, temperature and actual nutrient mass are unavailable and are not imputed. Thirteen years describes the operating-system span, not the duration of each alleged violation. Civil penalties are actual paid economic burden; up-to-USD-50-million future technology spending, the supplemental project and expected pollutant reductions remain unscored. Settlement allegations are not treated as adjudicated findings for every site.'
};

await fs.writeFile(path.join(ROOT, 'public/premium-standard-farms-lagoon-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/premium-standard-farms-lagoon-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
