import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const antecedentDischarge = 1180;
const peakDischarge = 5430;
const snapshot = {
  version: 'usgs_montana_wyoming_runoff_surge_may_1978_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'usgs_professional_paper_1244_may_1978_floods',
      name: 'USGS Professional Paper 1244: May 1978 Floods in Southeastern Montana and Northeastern Wyoming',
      publisher: 'U.S. Geological Survey',
      publication_date: '1983-01-01',
      url: 'https://pubs.usgs.gov/pp/1244/report.pdf',
      source_locators: [
        'Table 9 defines each event hydrograph from before the major rise until discharge approached antecedent flow; Goose Creek below Sheridan, Wyoming (site 50) rose from 1,180 ft3/s on May 16 to 5,430 ft3/s on May 18.',
        'The May 16-19 precipitation on saturated ground produced widespread flooding in the Yellowstone, Cheyenne, Belle Fourche and North Platte River drainages.',
        'Flood damage exceeded USD 33 million, 19 counties in Montana and Wyoming were declared major disaster areas, and the report documents flood hydrographs through May 23.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'hydrological_runoff_surges',
    metric_id: 'runoff_event_peak_to_baseline_ratio',
    unit: 'unitless peak-to-antecedent-flow ratio, cubic feet per second, nominal 1978 US dollars, event days and disaster-declared counties',
    geography: 'Goose Creek below Sheridan gauge for the runoff ratio; documented Montana-Wyoming flood-event boundary for burden, duration and extent',
    assessment_period: '1978-05-16 to 1978-05-23',
    boundary: 'The receipt derives one within-gauge runoff ratio from the source-defined antecedent and peak observations. It does not transfer that ratio to the other affected basins, treat prior-record comparisons as antecedent flow, or inflation-adjust the documented damage total.'
  },
  accumulated_impact: {
    antecedent_discharge_cubic_feet_per_second: antecedentDischarge,
    peak_discharge_cubic_feet_per_second: peakDischarge,
    derived_peak_to_antecedent_flow_ratio: Number((peakDischarge / antecedentDischarge).toFixed(6)),
    documented_damage_usd_nominal_1978_more_than: 33000000,
    event_start_date: '1978-05-16',
    event_end_date: '1978-05-23',
    inclusive_event_day_count: 8,
    disaster_declared_counties: 19,
    affected_state_count: 2,
    named_major_drainage_count: 4
  },
  reviewed_normalization_anchors: {
    peak_to_antecedent_flow_ratio: [1, 1.5, 3, 5],
    documented_damage_usd_nominal: [0, 1000000, 10000000, 50000000],
    inclusive_event_day_count: [0, 1, 3, 14],
    disaster_declared_counties: [0, 1, 5, 25]
  },
  uncertainty: 'The 1,180 and 5,430 ft3/s observations are paired at one Goose Creek gauge and do not represent a spatial average. The USD 33 million amount is a historical nominal lower bound covering the broader two-state event; it is not inflation-adjusted or assigned to Goose Creek alone. The eight-day window is an inclusive reporting window from the first tabulated antecedent observations through the last documented reservoir peak/outflow date, not a claim that every location flooded continuously. County declarations are an administrative extent measure, while the four named drainages remain unscored context.'
};

await fs.writeFile(path.join(ROOT, 'public/usgs-1978-runoff-surge-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/usgs-1978-runoff-surge-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
