import fs from 'node:fs/promises';
import path from 'node:path';
import { NODES } from '../src/data.js';
import { RIVER_BARRIER_NODE_IDS } from '../src/river-barrier-expansion-contracts.js';
import { HUMANITARIAN_EXPANSION_NODE_IDS } from '../src/humanitarian-expansion-contracts.js';
import { GROUNDWATER_WITHDRAWAL_NODE_IDS } from '../src/groundwater-withdrawal-expansion-contracts.js';
import { NITROUS_OXIDE_DRIVER_NODE_IDS } from '../src/nitrous-oxide-rehabilitation-contracts.js';
import { SULFUR_DIOXIDE_DRIVER_NODE_IDS } from '../src/sulfur-dioxide-rehabilitation-contracts.js';
import { COAL_POWER_EXPANSION_NODE_IDS } from '../src/coal-power-expansion-contracts.js';
import { ELECTRONICS_EOL_EXPANSION_NODE_IDS } from '../src/electronics-end-of-life-expansion-contracts.js';
import { CARBON_MONOXIDE_DRIVER_NODE_IDS, CARBON_MONOXIDE_INDICATOR_ID } from '../src/carbon-monoxide-rehabilitation-contracts.js';
import { LANDFILL_METHANE_DRIVER_NODE_IDS } from '../src/landfill-methane-rehabilitation-contracts.js';
import { RICE_METHANE_DRIVER_NODE_IDS } from '../src/rice-methane-rehabilitation-contracts.js';
import { LOCOMOTIVE_EMISSIONS_NODE_IDS } from '../src/locomotive-emissions-expansion-contracts.js';
import { CEMENT_CALCINATION_NODE_IDS } from '../src/cement-calcination-rehabilitation-contracts.js';
import { REFRIGERANT_LEAKAGE_NODE_IDS } from '../src/refrigerant-leakage-rehabilitation-contracts.js';
import { TIRE_WEAR_NODE_IDS } from '../src/tire-wear-rehabilitation-contracts.js';
import { SEMICONDUCTOR_FGAS_NODE_IDS } from '../src/semiconductor-fgas-rehabilitation-contracts.js';
import { BLAST_FURNACE_SLAG_NODE_IDS } from '../src/blast-furnace-slag-rehabilitation-contracts.js';
import { MANURE_LAGOON_NODE_IDS } from '../src/manure-lagoon-rehabilitation-contracts.js';
import { LITHIUM_BRINE_NODE_IDS } from '../src/lithium-brine-rehabilitation-contracts.js';
import { CATTLE_COMPACTION_NODE_IDS } from '../src/cattle-compaction-repair-contracts.js';
import { WATERBORNE_OUTBREAK_NODE_IDS } from '../src/waterborne-outbreak-repair-contracts.js';
import { POLLINATOR_COLLAPSE_NODE_IDS } from '../src/pollinator-collapse-repair-contracts.js';
import { ACID_DEPOSITION_NODE_IDS } from '../src/acid-deposition-repair-contracts.js';
import { FOREST_DIEBACK_NODE_IDS } from '../src/forest-dieback-repair-contracts.js';
import { SOIL_MICROBIAL_NODE_IDS } from '../src/soil-microbial-repair-contracts.js';
import { URBAN_WATER_RATIONING_NODE_IDS } from '../src/urban-water-rationing-repair-contracts.js';
import { DEEPWATER_SPILL_NODE_IDS } from '../src/deepwater-spill-repair-contracts.js';
import { WILDFIRE_SMOKE_HEALTH_NODE_IDS } from '../src/wildfire-smoke-health-repair-contracts.js';
import { RESERVOIR_STORAGE_NODE_IDS } from '../src/reservoir-storage-repair-contracts.js';
import { AIR_POLLUTION_HEALTH_NODE_IDS } from '../src/air-pollution-health-repair-contracts.js';
import { RAIN_ON_SNOW_NODE_IDS } from '../src/rain-on-snow-repair-contracts.js';
import { TALIK_EXPANSION_NODE_IDS } from '../src/talik-expansion-repair-contracts.js';
import { SURFACE_STORAGE_NODE_IDS } from '../src/surface-water-storage-repair-contracts.js';
import { COASTAL_PERMAFROST_NODE_IDS } from '../src/coastal-permafrost-repair-contracts.js';
import { FRACKING_WASTEWATER_NODE_IDS } from '../src/fracking-wastewater-repair-contracts.js';
import { COASTAL_HYPOXIA_NODE_IDS } from '../src/coastal-hypoxia-repair-contracts.js';
import { TUNDRA_SHRUBIFICATION_NODE_IDS } from '../src/tundra-shrubification-repair-contracts.js';
import { FREEZE_THAW_ROCK_NODE_IDS } from '../src/freeze-thaw-rock-repair-contracts.js';
import { FJORD_SEDIMENTATION_NODE_IDS } from '../src/fjord-sedimentation-repair-contracts.js';
import { INLAND_WATERWAY_SPILL_NODE_IDS } from '../src/inland-waterway-spill-repair-contracts.js';
import { COASTAL_SALTWATER_INTRUSION_NODE_IDS } from '../src/coastal-saltwater-intrusion-repair-contracts.js';
import { ARCTIC_ICE_RETREAT_NODE_IDS } from '../src/arctic-ice-retreat-repair-contracts.js';
import { FINAL_DENSITY_BATCH_NODE_IDS } from '../src/final-density-batch-contracts.js';
import { INVASIVE_SPECIES_NODE_ID } from '../src/invasive-species-repair-contracts.js';
import { OPEN_BACKLOG_WAVE_ONE_NODE_IDS } from '../src/open-backlog-wave-one-contracts.js';

const promotedAdditionalNodeIds = [...RIVER_BARRIER_NODE_IDS, ...HUMANITARIAN_EXPANSION_NODE_IDS, ...GROUNDWATER_WITHDRAWAL_NODE_IDS, ...NITROUS_OXIDE_DRIVER_NODE_IDS, ...SULFUR_DIOXIDE_DRIVER_NODE_IDS, ...COAL_POWER_EXPANSION_NODE_IDS, ...ELECTRONICS_EOL_EXPANSION_NODE_IDS, ...CARBON_MONOXIDE_DRIVER_NODE_IDS, ...LANDFILL_METHANE_DRIVER_NODE_IDS, ...RICE_METHANE_DRIVER_NODE_IDS, ...LOCOMOTIVE_EMISSIONS_NODE_IDS, ...CEMENT_CALCINATION_NODE_IDS, ...REFRIGERANT_LEAKAGE_NODE_IDS, ...TIRE_WEAR_NODE_IDS, ...SEMICONDUCTOR_FGAS_NODE_IDS, ...BLAST_FURNACE_SLAG_NODE_IDS, ...MANURE_LAGOON_NODE_IDS, ...LITHIUM_BRINE_NODE_IDS, ...CATTLE_COMPACTION_NODE_IDS, ...WATERBORNE_OUTBREAK_NODE_IDS, ...POLLINATOR_COLLAPSE_NODE_IDS, ...ACID_DEPOSITION_NODE_IDS, ...FOREST_DIEBACK_NODE_IDS, ...SOIL_MICROBIAL_NODE_IDS, ...URBAN_WATER_RATIONING_NODE_IDS, ...DEEPWATER_SPILL_NODE_IDS, ...WILDFIRE_SMOKE_HEALTH_NODE_IDS, ...RESERVOIR_STORAGE_NODE_IDS, ...AIR_POLLUTION_HEALTH_NODE_IDS, ...RAIN_ON_SNOW_NODE_IDS, ...SURFACE_STORAGE_NODE_IDS, ...TALIK_EXPANSION_NODE_IDS, ...COASTAL_PERMAFROST_NODE_IDS, ...FRACKING_WASTEWATER_NODE_IDS, ...COASTAL_HYPOXIA_NODE_IDS];
promotedAdditionalNodeIds.push(...TUNDRA_SHRUBIFICATION_NODE_IDS);
promotedAdditionalNodeIds.push(...FREEZE_THAW_ROCK_NODE_IDS);
promotedAdditionalNodeIds.push(...FJORD_SEDIMENTATION_NODE_IDS);
promotedAdditionalNodeIds.push(...INLAND_WATERWAY_SPILL_NODE_IDS);
promotedAdditionalNodeIds.push(...COASTAL_SALTWATER_INTRUSION_NODE_IDS);
promotedAdditionalNodeIds.push(...ARCTIC_ICE_RETREAT_NODE_IDS);
promotedAdditionalNodeIds.push(...FINAL_DENSITY_BATCH_NODE_IDS);
promotedAdditionalNodeIds.push(INVASIVE_SPECIES_NODE_ID, ...OPEN_BACKLOG_WAVE_ONE_NODE_IDS);
promotedAdditionalNodeIds.push(CARBON_MONOXIDE_INDICATOR_ID);
const nodeById = new Map(NODES.map(node => [node.id, node]));
const promotedLiveCausalNodeIds = [...new Set(promotedAdditionalNodeIds)].filter(id => {
  const node = nodeById.get(id);
  return node
    && node.graph_contract?.visibility === 'default_exploration'
    && !id.startsWith('evidence_')
    && !id.startsWith('extension_');
});
const researchBacklog = JSON.parse(await fs.readFile(path.resolve('public/research-backlog.json'), 'utf8'));
const openBacklogNodes = researchBacklog.summary?.open_backlog_nodes || 0;
const campaignEligibleNodes = researchBacklog.summary?.campaign_eligible_nodes || 0;
const campaignReviewableRecords = researchBacklog.summary?.campaign_reviewable_records || 0;
const payload = {
  version: 'density_rebuild_progress_v2',
  generated_at: new Date().toISOString(),
  target_mode: 'exhaustive_open_backlog',
  fixed_target_limit: null,
  historical_requested_milestone: 180,
  open_backlog_nodes: openBacklogNodes,
  campaign_eligible_nodes: campaignEligibleNodes,
  campaign_reviewable_records: campaignReviewableRecords,
  full_campaign_review_queue: researchBacklog.review_queue || [],
  open_execution_queue: researchBacklog.execution_queue || [],
  resolved_records_remain_reopenable: true,
  promoted_additional_evidence_backed_nodes: promotedLiveCausalNodeIds,
  count: promotedLiveCausalNodeIds.length,
  remaining: openBacklogNodes,
  completion_condition: 'Every campaign record has a current reviewed promote, merge, normalize, indicator, root-driver, research-only, or retire disposition; every promoted live node satisfies its ontology and evidence gates, and every prior resolution remains reopenable when stronger evidence changes the decision.',
  rule: 'The campaign has no fixed numerical cap. Count promoted additions only when they are live with relationship-specific evidence; keep every unresolved record eligible and every resolved record reviewable.'
};
await fs.writeFile(path.resolve('public/density-rebuild-progress.json'), `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/density-rebuild-progress.json', count: payload.count, remaining: payload.remaining }, null, 2));
