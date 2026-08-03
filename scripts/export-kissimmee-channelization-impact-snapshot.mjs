import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const channelizationCompletionYear = 1971;
const canalBackfillCompletionYear = 2022;
const snapshot = {
  version: 'kissimmee_channelization_restoration_1971_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'chen_kissimmee_channelization_wetland_loss_2016',
      name: 'From channelization to restoration: Sociohydrologic modeling with changing community preferences in the Kissimmee River Basin',
      publisher: 'Water Resources Research',
      publication_date: '2016-05-01',
      url: 'https://doi.org/10.1002/2015WR018194',
      source_locators: [
        'From 1962 to 1971, the lower Kissimmee River was transformed into a 90-kilometre-long, 91-metre-wide and 9.1-metre-deep C-38 canal.',
        'About two-thirds of the lower-river wetland, approximately 120 square kilometres, disappeared after channelization.',
        'The study treats channelization and restoration as a bounded fifty-year sociohydrologic transition rather than a generic levee-presence proxy.'
      ]
    },
    {
      id: 'usgs_kissimmee_restored_reach_wetlands_2011',
      name: 'Sediment dynamics in the restored reach of the Kissimmee River Basin, Florida',
      publisher: 'U.S. Geological Survey',
      publication_date: '2011-01-01',
      url: 'https://pubs.usgs.gov/publication/70042343',
      source_locators: [
        'USGS reports that channelization in the 1960s and 1970s drained the historically near-annually inundated riparian wetland.',
        'The restoration reconnects more than 10,000 hectares of wetlands to 70 kilometres of naturalized channel.',
        'Sediment monitoring used 87 sites in the restored reach and 14 sites in an unrestored reference reach from 2007 to 2010.'
      ]
    },
    {
      id: 'usace_kissimmee_river_fact_sheet_2025',
      name: 'Kissimmee River, Florida Construction Fact Sheet',
      publisher: 'U.S. Army Corps of Engineers, Jacksonville District',
      publication_date: '2025-05-01',
      url: 'https://www.saj.usace.army.mil/About/Congressional-Fact-Sheets-2025/Kissimmee-River-FL-C/',
      source_locators: [
        'USACE reports that all 22 miles of C-38 canal backfill were completed by July 2022, restoring continuous flow to 44 miles of the historic river.',
        'The project includes more than 100,000 acres of land acquisition, structure removal, flood proofing and restoration works.',
        'Federal allocations through fiscal year 2024 were $429,938,100; the estimated $869,714,000 total project cost remains unscored.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'levee_and_channelization_works',
    metric_id: 'river_floodplain_connectivity_and_channel_modification',
    unit: 'engineered channel kilometres, disconnected wetland area, duration and realized public restoration allocation',
    geography: 'lower Kissimmee River and C-38 canal restoration boundary in central Florida',
    assessment_period: '1962–1971 channelization through the July 2022 backfill milestone and FY2024 allocations',
    boundary: 'The receipt uses a mapped engineered reach with quantified wetland loss and a defined restoration program. It does not infer that every kilometre of levee or channel creates the same impact, equate restored area with complete ecological recovery, or score the estimated future total cost as realized expenditure.'
  },
  accumulated_impact: {
    c38_engineered_channel_length_kilometres: 90,
    c38_engineered_channel_width_metres: 91,
    c38_engineered_channel_depth_metres: 9.1,
    lower_river_wetland_loss_square_kilometres_approximate: 120,
    lower_river_wetland_loss_share_approximate: 0.666667,
    restored_or_reconnected_wetland_hectares_more_than: 10000,
    naturalized_channel_kilometres: 70,
    completed_canal_backfill_miles_2022: 22,
    restored_continuous_river_miles_2022: 44,
    federal_allocation_through_fy2024_usd: 429938100,
    estimated_total_project_cost_usd_unscored: 869714000,
    channelization_completion_year: channelizationCompletionYear,
    canal_backfill_completion_year: canalBackfillCompletionYear,
    persistence_years_to_backfill_milestone_derived: canalBackfillCompletionYear - channelizationCompletionYear,
    usgs_restored_monitoring_site_count: 87,
    usgs_unrestored_reference_site_count: 14
  },
  reviewed_normalization_anchors: {
    disconnected_wetland_area_square_kilometres: [0, 5, 30, 120],
    realized_public_allocation_usd: [0, 25000000, 100000000, 500000000],
    persistence_years: [0, 1, 10, 50],
    engineered_channel_kilometres: [0, 5, 25, 100]
  },
  uncertainty: 'Wetland-loss area and share are historical reconstructions and approximate; pre-channel hydrology, land use and reference definitions affect estimates. Public allocation is a restoration-response burden and not a complete valuation of ecological or private losses. Restoration milestones do not mean every reach or ecological function recovered simultaneously. The receipt is confined to the Kissimmee system and does not generalize unit impacts to other engineered rivers.'
};

await fs.writeFile(path.join(ROOT, 'public/kissimmee-channelization-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/kissimmee-channelization-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
