import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'kalamazoo_inland_waterway_oil_spill_2010_2014_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'ntsb_enbridge_marshall_pipeline_release_2012',
      name: 'Enbridge Incorporated Hazardous Liquid Pipeline Rupture and Release',
      publisher: 'National Transportation Safety Board',
      publication_date: '2012-07-10',
      url: 'https://www.ntsb.gov/investigations/Pages/DCA10MP007.aspx',
      source_locators: ['What Happened: 843,444 gallons released, cleanup costs exceeding USD 767 million, and about 320 people reporting symptoms consistent with crude-oil exposure.']
    },
    {
      id: 'phmsa_enbridge_marshall_spill_record',
      name: 'Enbridge Spill near Marshall, MI',
      publisher: 'Pipeline and Hazardous Materials Safety Administration',
      publication_date: '2017-06-28',
      url: 'https://www.phmsa.dot.gov/safety-awareness/pipeline/enbridge-spill-near-marshall-mi',
      source_locators: ['Incident summary: Enbridge revised the discharge estimate to 20,082 barrels or 843,444 gallons; EPA-directed cleanup covered over 30 miles of the Kalamazoo River.']
    },
    {
      id: 'epa_enbridge_kalamazoo_response_2010_2014',
      name: 'EPA Response to Enbridge Spill in Michigan',
      publisher: 'U.S. Environmental Protection Agency',
      publication_date: '2026-06-02',
      url: 'https://www.epa.gov/enbridge-spill-michigan',
      source_locators: ['Incident and response summary: EPA-ordered recovery and dredging continued from 2010 to 2014.', 'Response timeline: the release traveled at least 35 miles downstream on the Kalamazoo River.']
    }
  ],
  metric_contract: {
    node_id: 'inland_waterway_fuel_spills',
    metric_id: 'inland_waterway_oil_discharge',
    unit: 'reported released gallons, continuing cleanup cost, cleanup duration, affected river miles and represented countries',
    geography: 'Talmadge Creek and the Kalamazoo River near Marshall, Michigan, United States',
    assessment_period: '2010-2014',
    boundary: 'This is a source-bounded accumulated-impact case, not a complete United States or global spill inventory. It scores an actual reported inland-waterway discharge and does not infer release from pipeline presence, traffic, fuel capacity or spill risk.'
  },
  accumulated_impact: {
    reported_release_gallons: 843444,
    continuing_cleanup_cost_usd_lower_bound: 767000000,
    people_reporting_crude_oil_exposure_consistent_symptoms: 320,
    cleanup_start_year: 2010,
    cleanup_through_year: 2014,
    cleanup_duration_years: 4,
    affected_river_miles_at_least: 35,
    represented_country_count: 1,
    represented_countries: ['United States']
  },
  reviewed_normalization_anchors: {
    reported_release_gallons: [0, 10000, 100000, 1000000],
    continuing_cleanup_cost_usd: [0, 1000000, 100000000, 1000000000],
    cleanup_duration_years: [0, 1, 4, 10],
    represented_country_count: [0, 1, 10, 100]
  },
  uncertainty: 'The released-volume estimate was revised after the incident and is retained at the official 843,444-gallon value. The USD 767 million figure was already a continuing-cost lower bound when the NTSB adopted its report, not a final total-damage valuation. The four-year duration is the documented EPA recovery-and-dredging period and does not imply that all ecological effects ended in 2014. One-country coverage prevents this severe case from being represented as a global incident census.'
};

await fs.writeFile(path.join(ROOT, 'public/kalamazoo-inland-waterway-spill-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/kalamazoo-inland-waterway-spill-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
