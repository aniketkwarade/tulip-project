import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const feetToMetres = 0.3048;
const snapshot = {
  version: 'newtok_ninglick_river_bank_erosion_1954_2022_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'alaska_dcra_newtok_erosion_history',
      name: 'Alaska DCRA Newtok Village Relocation History: Erosion Assessment',
      publisher: 'Alaska Division of Community and Regional Affairs',
      publication_date: '2025-01-01',
      url: 'https://www.commerce.alaska.gov/web/dcra/ResiliencePlanningLandManagement/NewtokPlanningGroup/NewtokVillageRelocationHistory/NewtokHistoryPartTwo.aspx',
      source_locators: [
        'Historical shorelines digitized from USGS maps and aerial photographs show 36-83 ft/year average erosion along the Ninglick River and 68 ft/year directly in front of Newtok from 1954 to 2003.',
        'The earlier 1957-1983 assessment measured 19-88 ft/year and concluded that full riverbank protection would be prohibitively expensive.',
        'The state record identifies the repeat-geometry method and preserves the named north-bank river reach rather than inferring erosion from flooding alone.'
      ]
    },
    {
      id: 'gao_04_142_newtok_riverbank_erosion',
      name: 'GAO-04-142 Alaska Native Villages Flooding and Erosion',
      publisher: 'U.S. Government Accountability Office',
      publication_date: '2003-12-12',
      url: 'https://www.gao.gov/assets/a240811.html',
      source_locators: [
        'GAO reports that Newtok lost more than 4,000 feet of land to river erosion between 1954 and 2001.',
        'GAO reports a village population of 321 and an experimental USD 750,000 sandbag wall that failed to slow erosion.',
        'Projected relocation costs are retained as unscored context rather than realized economic loss.'
      ]
    },
    {
      id: 'alaska_dcra_newtok_environmentally_threatened_community',
      name: 'Alaska DCRA Environmentally Threatened Communities: Newtok',
      publisher: 'Alaska Division of Community and Regional Affairs',
      publication_date: '2026-01-01',
      url: 'https://www.commerce.alaska.gov/web/dcra/ResiliencePlanningLandManagement/EVCs',
      source_locators: [
        'The current state record says erosion has claimed Newtok’s barge landing, boat docks and solid-waste site.',
        'It also documents sediment-impaired barge access and threats to the community’s potable-water source.',
        'Permafrost degradation, flooding and storm surge are retained as interacting drivers and are not converted into separate erosion points.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'riparian_zone_erosion',
    metric_id: 'riparian_bank_erosion_and_retreat',
    unit: 'metres per year, cumulative bank retreat, affected residents, observed years and critical infrastructure types lost',
    geography: 'north bank of the Ninglick River directly in front of Newtok, Alaska',
    assessment_period: '1954-01-01 to 2022-03-01',
    boundary: 'The receipt uses repeat mapped shorelines for the named riverbank and observed community impacts. It does not infer bank retreat from sparse vegetation, apply upstream maxima to the village reach, or score projected relocation costs.'
  },
  accumulated_impact: {
    average_bank_retreat_feet_per_year_in_front_of_village: 68,
    average_bank_retreat_metres_per_year_derived: Number((68 * feetToMetres).toFixed(6)),
    cumulative_land_loss_feet_more_than_1954_2001: 4000,
    cumulative_land_loss_metres_more_than_derived: Number((4000 * feetToMetres).toFixed(3)),
    village_population_reported_2003: 321,
    failed_sandbag_wall_cost_usd_1987: 750000,
    observation_start_year: 1954,
    latest_repeat_distance_observation_year: 2022,
    documented_observation_span_years: 68,
    critical_infrastructure_types_already_lost_count: 3,
    critical_infrastructure_types_already_lost: ['barge_landing', 'boat_docks', 'solid_waste_site'],
    projected_relocation_cost_usd_min_unscored: 80000000,
    projected_relocation_cost_usd_max_unscored: 200000000
  },
  reviewed_normalization_anchors: {
    bank_retreat_metres_per_year: [0, 0.5, 5, 20],
    community_population_affected: [0, 50, 250, 1000],
    documented_observation_span_years: [0, 1, 10, 50],
    critical_infrastructure_types_lost: [0, 1, 3, 10]
  },
  uncertainty: 'The 68 ft/year value is a 1954-2003 shoreline-average rate directly in front of the village; episodic annual retreat varies and upstream reaches were faster. The 2022 state monitoring distances extend evidence of persistence but are not combined into a new rate. Population 321 is GAO’s period-specific count, not a current census. Infrastructure count treats three named asset types equally. Permafrost degradation, storm surge, flooding, river morphology and sediment dynamics interact. Projected USD 80-200 million relocation costs and threatened-but-not-yet-lost assets remain unscored.'
};

await fs.writeFile(path.join(ROOT, 'public/newtok-riparian-erosion-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/newtok-riparian-erosion-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
