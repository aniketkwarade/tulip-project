import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blm = {
  culverts_on_fish_bearing_streams: 2822,
  culverts_assessed_for_fish_passage: 1152,
  barrier_culverts_identified: 414,
  additional_barrier_culverts_estimated: 282,
  total_barrier_culverts_identified_and_estimated: 696,
  estimated_restoration_cost_usd: 46447000,
  estimated_backlog_clearance_years: 25
};
const forestService = {
  culverts_on_fish_bearing_streams: 7393,
  culverts_assessed_for_fish_passage: 2986,
  barrier_culverts_identified: 2160,
  additional_barrier_culverts_estimated: 2645,
  total_barrier_culverts_identified_and_estimated: 4805,
  estimated_restoration_cost_usd: 331042000,
  estimated_backlog_clearance_years_lower_bound: 100
};
const snapshot = {
  version: 'gao_02_136_road_stream_crossing_barriers_2001_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [{
    id: 'gao_02_136_fish_passage_barrier_culverts',
    name: 'Land Management Agencies: Restoring Fish Passage Through Culverts on Forest Service and BLM Lands in Oregon and Washington Could Take Decades',
    publisher: 'U.S. Government Accountability Office',
    report_number: 'GAO-02-136',
    publication_date: '2001-11-23',
    product_url: 'https://www.gao.gov/products/gao-02-136',
    accessible_text_url: 'https://www.gao.gov/assets/a233077.html',
    source_locators: [
      'Accessible text lines 325-365: assessed and identified/estimated BLM and Forest Service barrier culverts.',
      'Accessible text lines 408-421: restoration cost and separate BLM and Forest Service backlog-duration estimates.',
      'Accessible text appendix tables: BLM and Forest Service inventory and cost totals.'
    ]
  }],
  metric_contract: {
    node_id: 'road_stream_crossing_barriers',
    metric_id: 'road_stream_crossing_passage_impairment',
    unit: 'assessed and estimated barrier culverts, restoration cost, and backlog duration',
    geography: 'BLM Oregon State Office and Forest Service Pacific Northwest Region 6 lands in Oregon and Washington',
    observation_date: '2001-08-01',
    boundary: 'The score uses only culverts classified as barriers by agency assessment or separately labeled agency estimates. It does not classify every road-stream crossing as a barrier and does not treat unassessed structures as clean.'
  },
  accumulated_impact: {
    blm,
    forest_service: forestService,
    combined_culverts_on_fish_bearing_streams: blm.culverts_on_fish_bearing_streams + forestService.culverts_on_fish_bearing_streams,
    combined_culverts_assessed_for_fish_passage: blm.culverts_assessed_for_fish_passage + forestService.culverts_assessed_for_fish_passage,
    combined_barrier_culverts_identified: blm.barrier_culverts_identified + forestService.barrier_culverts_identified,
    combined_additional_barrier_culverts_estimated: blm.additional_barrier_culverts_estimated + forestService.additional_barrier_culverts_estimated,
    combined_barrier_culverts_identified_and_estimated: blm.total_barrier_culverts_identified_and_estimated + forestService.total_barrier_culverts_identified_and_estimated,
    combined_estimated_restoration_cost_usd: blm.estimated_restoration_cost_usd + forestService.estimated_restoration_cost_usd,
    conservative_persistence_years: blm.estimated_backlog_clearance_years,
    represented_us_states: ['Oregon', 'Washington'],
    represented_us_state_count: 2,
    directly_assessed_country_count: 1
  },
  reviewed_normalization_anchors: {
    barrier_culverts: [0, 100, 1000, 10000],
    restoration_cost_usd: [0, 10000000, 100000000, 1000000000],
    backlog_duration_years: [0, 2, 10, 50],
    represented_us_states: [0, 1, 10, 50]
  },
  uncertainty: 'The inventory is a 2001 bounded federal-land assessment in Oregon and Washington, not a current national or global census. Estimated barriers are kept separate from field-identified barriers, the backlog cost is not inflation-adjusted, and the conservative duration component uses the shorter 25-year BLM estimate rather than the Forest Service estimate of more than 100 years. Passage depends on species, life stage, flow and structure condition.'
};

await fs.writeFile(path.join(ROOT, 'public/gao-road-stream-crossing-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/gao-road-stream-crossing-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
