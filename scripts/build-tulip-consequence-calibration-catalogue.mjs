import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { PUBLISHED_NODES } from '../src/data.js';
import { CONSEQUENCE_CALIBRATION_VERSION, CONSEQUENCE_CALIBRATION_POLICY_KEY,
  describeConsequenceCalibrationPolicy } from '../src/tulip-consequence-calibration-v1.js';
import { REGISTERED_DALY_OBSERVATIONS, REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS,
  REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS } from '../src/tulip-source-observation-registry.js';
import { evaluateAttributableDalyEndpoint, SOURCE_NATIVE_BURDEN_VERSION } from '../src/tulip-source-native-burden.js';
import { mapSelectedHealthEndpoint } from '../src/tulip-selected-health-calibration.js';
import { evaluateRecentReefCoverChange, REEF_EVENT_OBSERVATION_VERSION } from '../src/tulip-reef-event-observation.js';
import { requireCatalogueConsequenceRoutes, requireConsequenceRoute } from './lib/tulip-consequence-route-contract.mjs';

const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root)));
const hash = path => createHash('sha256').update(readFileSync(new URL(path, root))).digest('hex');
const paths = {public:'public/tulip-assessments.json',
  ledger:'artifacts/tulip-consequence-rule-audit-2026-09-27/review-ledger.json',
  water:'artifacts/tulip-consequence-rule-audit-2026-09-27/central-water-source-repairs.json',
  policy:'src/tulip-consequence-policy-v1.json',
  calculator:'src/tulip-consequence-calibration-v1.js',
  publishedDefinitions:'src/data.js',
  sourceObservations:'src/tulip-source-observation-registry.js',
  selectedHealthAdapter:'src/tulip-selected-health-calibration.js',
  researchRoutes:'src/tulip-consequence-routes-v1.json',
  industrialHealth:'artifacts/tulip-calibration-completion-2026-09-28/industrial-health-references.json',
  industrialWorkbook:'artifacts/tulip-calibration-completion-2026-09-28/industrial-health-source/41598_2023_38075_MOESM2_ESM.xlsx',
  pilot:'artifacts/tulip-consequence-rule-audit-2026-09-27/original-20-semantic-review.json'};
const current = read(paths.public), ledger = read(paths.ledger), water = read(paths.water), pilot = read(paths.pilot);
const researchRoutes = read(paths.researchRoutes);
requireCatalogueConsequenceRoutes(PUBLISHED_NODES, researchRoutes);
const reviewed = new Map([...ledger.nodes,...ledger.responses].map(node=>[node.nodeId,node]));
const waterById = new Map(water.records.map(node=>[node.nodeId,node]));
const policy = describeConsequenceCalibrationPolicy();
assert.equal(PUBLISHED_NODES.length,381);
assert.equal(reviewed.size,381);
const endpointInputs = {};
const air = REGISTERED_DALY_OBSERVATIONS.who_world_health_statistics_2026_joint_air_2021;
const airPacket = {
  ...air,sourceId:air.sourceId,sourceObservation:{...air},
  methodVersion:SOURCE_NATIVE_BURDEN_VERSION,nodeId:'air_pollution_health_burden',nodeKind:'issue',
  domain:'human',coverage:'endpoint_only',overlapReview:'Joint ambient and household endpoint once; no other endpoint added.'};
const airEndpoint = evaluateAttributableDalyEndpoint(airPacket);
assert.equal(airEndpoint.status,'source_bound_endpoint');
endpointInputs.air_pollution_health_burden = {healthEndpoint:airEndpoint,
  healthBenchmarkDiagnostic:mapSelectedHealthEndpoint(airEndpoint),
  wholeHumanCoverage:false,wholeNodeCoverage:false};
const reefRow = Object.values(REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS)[0];
const reef = evaluateRecentReefCoverChange({...reefRow,sourceObservation:{...reefRow},
  methodVersion:REEF_EVENT_OBSERVATION_VERSION,nodeId:'coral_bleaching',nodeKind:'issue',domain:'ecosystem',
  coverage:'endpoint_only',attributionStatus:'event_associated_not_apportioned'});
assert.equal(reef.status,'source_bound_event_associated_change');
endpointInputs.coral_bleaching = {biologicalIndicatorEndpoint:reef,wholeNatureCoverage:false,wholeNodeCoverage:false};
endpointInputs.deforestation = {physicalExtentContext:Object.values(REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS)[0],
  physicalFlowNotCurrentConditionStock:true,wholeNatureCoverage:false,wholeNodeCoverage:false};
const industrial = read(paths.industrialHealth);
assert.equal(hash(paths.industrialWorkbook), industrial.workbookSha256);
for (const [nodeId, sourceCategory, scopeLimitation] of [
  ['cement_concrete','Cement plants','Direct cement-plant particulate-health model only; concrete use, quarrying, climate and ecological effects are not covered.'],
  ['steel','Steel mills','Direct modeled primary mill-health effects only; the broad materials and production-system boundary is not fully covered.'],
  ['gas_power_dependence','Gas power plants','Direct modeled plant-health effects only; fuel dependence, replacement power and service consequences are not covered.'],
]) {
  const source = industrial.references.find(row=>row.sourceCategory===sourceCategory);
  assert(source && source.replacementValue===null && !source.publicReady);
  endpointInputs[nodeId]={historicalHealthModelReference:{...source,sourceUrl:industrial.sourceUrl,
    sourceArtifactSha256:industrial.workbookSha256,scopeLimitation,
    remainingRequirements:industrial.remainingRequirements},wholeHumanCoverage:false,wholeNatureCoverage:false,wholeNodeCoverage:false};
}
const coal = industrial.references.find(row=>row.sourceCategory==='Coal power plants');
assert(coal?.byPollutantExact?.HEALTH_IMPACTS_SO2_DALY_PER_YEAR);
endpointInputs.coal_power_sulfur_emissions={historicalHealthModelReference:{
  sourceCategory:'Coal power plants, SO2 column only',sourceRows:coal.sourceRows,
  quantityExact:coal.byPollutantExact.HEALTH_IMPACTS_SO2_DALY_PER_YEAR,unit:coal.unit,
  sourceYear:coal.sourceYear,quantityRole:coal.quantityRole,modelBasis:coal.modelBasis,
  sourceUrl:industrial.sourceUrl,sourceArtifactSha256:industrial.workbookSha256,
  locator:'Supplementary table 24, sheet 24, rows 5–7, column J; other pollutants and CO2 excluded',
  scopeLimitation:'Modeled SO2-derived particulate-health reference only; acid deposition, other sulfur chemistry and ecosystem losses remain unassessed.',
  remainingRequirements:industrial.remainingRequirements,replacementValue:null,publicReady:false,
},wholeHumanCoverage:false,wholeNatureCoverage:false,wholeNodeCoverage:false};

let omitted=0, withdrawn=0, repairedNodes=0;
const records = PUBLISHED_NODES.map(node=>{
  const consequenceResearchRoute = requireConsequenceRoute(node, researchRoutes);
  const before = reviewed.get(node.id);
  const existing = current.records[node.id];
  assert(before && existing,`A new published node needs an explicit source review: ${node.id}`);
  assert.equal(existing.value,before.publicValueUnchanged,node.id);
  const response = before.nodeKind==='response';
  const boundary = {definition:node.readerMeaning ?? node.description,
    humanConsequences:node.readerCopy?.human?.consequences ?? [],
    ecologicalConsequences:node.readerCopy?.planet?.consequences ?? [],
    ecologicalSystems:node.readerCopy?.planet?.systems ?? [],
    status:'published_definition_and_authored_outcome_checklist_not_a_completed_scientific_profile'};
  const boundaryKey=createHash('sha256').update(JSON.stringify(boundary)).digest('hex');
  if(response) {
    assert.equal(existing.value,null);
    return {nodeId:node.id,name:node.name,nodeKind:'response',methodVersion:policy.version,
      status:'outside_danger_scoring',value:null,experimentalValue:null,publicReady:false,
      scopeBoundary:boundary,scopeBoundarySha256:boundaryKey,consequenceResearchRoute};
  }
  const components={};
  let lowerWithdrawnHere=false;
  for(const domain of ['human','ecosystem']) {
    const old=before.domainReviews[domain];
    if(!old) omitted++;
    const rejectedLower=old?.checks?.lowerIncoherent===true;
    if(rejectedLower) {withdrawn++;lowerWithdrawnHere=true;}
    components[domain]={
      status:'source_native_consequence_evidence_incomplete',
      positionWasPreviouslyOutsideDraftScope:!old,
      quantity:null,mappedValue:null,lower:null,upper:null,zeroVerified:false,
      requiredUnit:policy[domain].unit,
      requiredEvidence:domain==='human' ? {
        health:'Attributed annual DALYs, or a justified no-health-loss record under the node definition.',
        nonHealth:'A supported function-loss profile for the material service, displacement or livelihood effects, or a justified absence of those effects.',
        overlap:'Joint overlapping-loss estimate or supported disjointness; unknown overlap is not zero.',
      } : {
        condition:'A supported fixed characteristic profile for the named affected ecosystems, with all six classes accounted for.',
        area:'Affected non-overlapping spatial units or explicit allocation of overlapping assets.',
        attribution:'Matched current with-node and without-node outcomes; exposure, historical before/after and physical extent alone are insufficient.',
      },
      candidateCaseRefs:null,
      sourceIds:old?.sourceIds??[],sourceLinks:old?.sourceLinks??[],
      oldSourceReasoning:old?.existingReasoning??null,
      centralInputCorrection:old?.checks?.centralIncoherent ? 'old_central_input_rejected_no_consequence_value_substituted' : null,
      uncertaintyCorrection:rejectedLower ? 'incoherent_ordinal_lower_withdrawn_no_new_quantity_invented' : 'source_native_joint_cases_required',
      oldOrdinalTupleForAudit:old?.original??null,
      numericalAdmission:false,
    };
  }
  if(lowerWithdrawnHere) repairedNodes++;
  return {nodeId:node.id,name:node.name,nodeKind:'issue',methodVersion:CONSEQUENCE_CALIBRATION_VERSION,
    policyKey:CONSEQUENCE_CALIBRATION_POLICY_KEY,
    status:'replacement_evidence_incomplete',value:null,experimentalValue:null,publicReady:false,
    currentPublicValueRetained:existing.value,
    scopeBoundary:boundary,scopeBoundarySha256:boundaryKey,consequenceResearchRoute,
    currentSourceWindow:before.sourceWindow??null,
    components,availableEndpointInputs:endpointInputs[node.id]??null,
    newerUnadmittedSourceCandidates:before.sourceNativeOutcomeCandidates??[],
    centralWaterRepair:waterById.get(node.id)??null,
    reviewStatus:'existing_source_findings_carried_forward_no_new_whole_node_scientific_approval',
  };
});
assert.equal(records.filter(x=>x.nodeKind==='issue').length,354);
assert.equal(records.filter(x=>x.nodeKind==='response').length,27);
assert.equal(omitted,190);assert.equal(withdrawn,132);assert.equal(repairedNodes,110);
const byId=new Map(records.map(x=>[x.nodeId,x]));
const originalTwenty=[...pilot.issues,...pilot.responses].map(x=>({nodeId:x.nodeId,
  name:byId.get(x.nodeId).name,currentValue:current.records[x.nodeId].value,
  replacementValue:byId.get(x.nodeId).value,replacementStatus:byId.get(x.nodeId).status,
  previousFinding:x.finding??x.decision,needed:x.needed??null}));
const report={version:'tulip_consequence_calibration_catalogue_2026_09_28_v1',methodVersion:policy.version,
  status:'all_research_records_prepared_no_replacement_ratings_admitted',
  inputs:Object.fromEntries(Object.values(paths).map(p=>[p,hash(p)])),
  summary:{catalogueNodes:records.length,issues:354,responseExclusions:27,domainPositions:708,
    formerlyOmittedPositions:omitted,incoherentLowerCasesWithdrawn:withdrawn,
    nodesWithWithdrawnLowerCases:repairedNodes,centralWaterRepairsCarriedForward:water.records.length,
    availableEndpointOrContextPackets:Object.keys(endpointInputs).length,
    explicitResearchRoutes:researchRoutes.summary.catalogueNodes,
    newlyInterpretedResearchRoutes:researchRoutes.summary.newlyInterpretedRoutes,
    completedWholeNodeReplacements:0,publicScoresChanged:0},
  records,originalTwenty,
  limitations:[
    'Prepared research records are not completed consequence assessments or calibrated measured ratings.',
    'The public values are preserved in their existing registry. They are not fallback values returned by this candidate method.',
    'Withdrawing incoherent bounds removes them from replacement calculations; it does not supply new evidence bounds.',
    'The nature and function bridges are internal experimental policy choices. Real compatible profiles and scientific challenge are still required.',
  ],publicReady:false};
const directory=new URL('artifacts/tulip-consequence-calibration-v1-2026-09-28/',root);
mkdirSync(directory,{recursive:true});
writeFileSync(new URL('catalogue-assessments.json',directory),`${JSON.stringify(report,null,2)}\n`);
const columns=['nodeId','name','nodeKind','status','currentPublicValueRetained','replacementValue',
  'humanStatus','natureStatus','oldLowerWithdrawn','centralWaterRepair'];
const rows=records.map(x=>({nodeId:x.nodeId,name:x.name,nodeKind:x.nodeKind,status:x.status,
  currentPublicValueRetained:x.currentPublicValueRetained??null,replacementValue:x.value,
  humanStatus:x.components?.human?.status??'response_excluded',natureStatus:x.components?.ecosystem?.status??'response_excluded',
  oldLowerWithdrawn:Object.values(x.components??{}).some(y=>y.uncertaintyCorrection?.startsWith('incoherent')),
  centralWaterRepair:!!x.centralWaterRepair}));
const quote=x=>`"${String(x??'').replaceAll('"','""')}"`;
writeFileSync(new URL('catalogue-status.csv',directory),
  `${columns.join(',')}\n${rows.map(row=>columns.map(c=>quote(row[c])).join(',')).join('\n')}\n`);
console.log(JSON.stringify({status:report.status,...report.summary},null,2));
