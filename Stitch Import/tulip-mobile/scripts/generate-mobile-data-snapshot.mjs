import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PUBLISHED_NODES, PUBLISHED_EDGES } from "../../../src/data.js";
import { PHENOMENON_SELECTOR_CONFIG } from "../../../src/phenomenon-selector.js";
import { getPhenomenonLensById } from "../../../src/phenomenon-lens.js";
import { getActionProfileById } from "../../../src/actions-data.js";
import {
  SPHERE_LABELS,
  buildHumanInspectorProfile,
  buildPlanetInspectorProfile,
  formatNodeSourceDate,
  getNodeInspectorMeaning,
} from "../../../src/node-inspector-display.js";
import { getTulipUrgencyBandV3 } from "../../../src/tulip-urgency-v3.js";
import { getRecentOccurrenceProfile } from "../../../src/recent-occurrences.js";
import { formatMetricDisplayText, metricizeDisplayValue } from "../../../src/metric-display.js";

const root = fileURLToPath(new URL("../../../",import.meta.url));
const sourceDates = JSON.parse(await readFile(new URL("../../../src/node-source-dates.json",import.meta.url),"utf8"));
const graphOutputUrl = new URL("../src/mobile-graph-snapshot.json",import.meta.url);
const catalogOutputUrl = new URL("../src/mobile-node-catalog.json",import.meta.url);
const inspectorOutputUrl = new URL("../src/mobile-inspector-snapshot.json",import.meta.url);
const relationshipContentOutputUrl = new URL("../src/mobile-relationship-content-snapshot.json",import.meta.url);
const activityOutputUrl = new URL("../src/mobile-activity-snapshot.json",import.meta.url);
const nodes = PUBLISHED_NODES;
const edges = PUBLISHED_EDGES;
const nodeNameById = new Map(nodes.map((node) => [node.id,node.name]));
const metricText = (value) => typeof value === "string" ? formatMetricDisplayText(value) : value;

const humanizeKey = (value = "") => value.replace(/_/g," ").replace(/\b\w/g,(letter) => letter.toUpperCase());
const labelSource = (url) => {
  try {
    const host = new URL(url).hostname.replace(/^www\./,"");
    const known = [["ipcc.ch","IPCC"],["fao.org","FAO"],["noaa.gov","NOAA"],["copernicus.eu","Copernicus"],["metoffice.gov.uk","Met Office"],["science.org","Science"]];
    return known.find(([domain]) => host.includes(domain))?.[1] ?? host;
  } catch {
    return "Source";
  }
};
const relationshipText = (edge,sourceName,targetName) => edge.relationship_description
  || edge.evidence?.mechanism
  || edge.evidence?.notes
  || `${sourceName} ${edge.verb || "influences"} ${targetName}${edge.adverb ? ` ${edge.adverb}` : ""}.`;

const graphNodes = nodes.map((node) => ({
  id:node.id,
  name:metricText(node.name),
  node_kind:node.node_kind,
  sphere:node.sphere,
  description:metricText(node.description),
  tulipScore:node.tulipScore,
  impactScore:node.impactScore,
  score:node.score && typeof node.score === "object" ? { baseline:node.score.baseline } : node.score,
  calibration:node.calibration ? { role:node.calibration.role,source_status:node.calibration.source_status } : undefined,
  context:node.context ? { reach:node.context.reach } : undefined,
  vector:node.vector ? { societal_fallout:node.vector.societal_fallout,human_drivenness:node.vector.human_drivenness } : undefined,
  humanImpact:node.humanImpact?.primaryPathways?.length ? { primaryPathways:[true] } : undefined,
  economicContext:node.economicContext ? true : undefined,
}));
const graphEdges = edges.map((edge) => ({
  source:edge.source,
  target:edge.target,
  influence:edge.influence,
  topology_rule:edge.topology_rule,
}));
const nodeCatalog = nodes.map((node) => ({ id:node.id,name:metricText(node.name),sphere:node.sphere,node_kind:node.node_kind }));

const profiles = Object.fromEntries(nodes.map((node) => {
  const incoming = edges.filter((edge) => edge.target === node.id).map((edge) => {
    const sourceName = nodeNameById.get(edge.source) || humanizeKey(edge.source);
    const content = edge.relationship_content || {};
    return [metricText(sourceName),metricText(content.plain_language || relationshipText(edge,sourceName,node.name)),`${edge.source}->${edge.target}`];
  });
  const outgoing = edges.filter((edge) => edge.source === node.id).map((edge) => {
    const targetName = nodeNameById.get(edge.target) || humanizeKey(edge.target);
    const content = edge.relationship_content || {};
    return [metricText(targetName),metricText(content.plain_language || relationshipText(edge,node.name,targetName)),`${edge.source}->${edge.target}`];
  });
  const metric = node.metric_contract || {};
  const economy = node.economicContext || {};
  const humanProfile = buildHumanInspectorProfile(node);
  const planetProfile = buildPlanetInspectorProfile(node);
  const urgency = Number(node.score?.baseline ?? (typeof node.impactScore === "number" ? node.impactScore / 10 : 0));
  const recentOccurrenceProfile = getRecentOccurrenceProfile(node,{
    sourceDate:sourceDates?.entries?.[node.id]?.source_date || "",
  });
  const sourceUrls = Array.from(new Set([
    ...(node.source_urls || []),
    ...(node.calibration?.source_urls || []),
    ...(economy.sourceUrls || []),
  ])).slice(0,8);
  return [node.name.toLowerCase(),{
    name:metricText(node.name),
    sphere:SPHERE_LABELS[node.sphere] || humanizeKey(node.sphere || "TULIP topic"),
    updated:formatNodeSourceDate(node,sourceDates).replace(/^Most Recent Data:\s*/i,"Last Updated: ").replace(/,\s*(\d{4})\b/," $1"),
    description:metricText(getNodeInspectorMeaning(node) || `Reviewed TULIP graph node: ${node.name}.`),
    urgency,
    urgencyBand:urgency >= 1 && urgency <= 10 ? getTulipUrgencyBandV3(urgency) : "Not scored",
    incoming:incoming.length ? incoming : [["No reviewed incoming relationship","No incoming relationship is asserted in the current reviewed graph."]],
    outgoing:outgoing.length ? outgoing : [["No reviewed outgoing relationship","No outgoing relationship is asserted in the current reviewed graph."]],
    human:{
      severity:humanProfile.severity.label,
      reach:`${humanProfile.reach.replace(/^Reach:\s*/i,"")} · ${humanProfile.mode}`,
      summary:metricText(humanProfile.summary),
      domains:humanProfile.domains.map(metricText),
      consequences:humanProfile.consequences.map(metricText),
      hiddenCost:metricText(economy.hiddenCost || "No distinct hidden-cost claim is asserted for this node."),
      whoPays:metricText(economy.whoPays || "Burden allocation depends on the geography and relationship pathway under review."),
    },
    planet:{
      severity:planetProfile.severity.label,
      reach:`${planetProfile.reach.replace(/^Reach:\s*/i,"")} · ${planetProfile.mode}`,
      summary:metricText(planetProfile.summary),
      domains:planetProfile.domains.map(metricText),
      consequences:planetProfile.consequences.map(metricText),
      physicalLimit:metricText(economy.physicalLimit || metric.failure_behavior || "Interpret within the node's declared measurement boundary."),
    },
    response:{
      defaultDriver:metricText(economy.defaultDriver || "No singular default driver is asserted for this node."),
      levers:(economy.systemLevers || ["Use the reviewed incident relationships and measurement boundary to identify context-specific interventions."]).map(metricText),
    },
    measurement:{
      metric:metricText(metric.metric_name || "No reviewed live metric"),
      unit:metricText(metric.unit || "Not specified"),
      geography:metricText(metric.geography || "Not specified"),
      cadence:metricText(metric.cadence || node.update_policy?.update_cadence || "Not specified"),
      method:metricText(metric.transformation || "No transformation method is declared."),
      uncertainty:metricText(metric.uncertainty || "Uncertainty is not separately declared."),
      boundary:metricText(metric.failure_behavior || node.regional_profile?.interpretation_boundary || economy.evidenceBoundary || "Do not generalize beyond the reviewed evidence boundary."),
    },
    recentOccurrences:recentOccurrenceProfile ? {
      title:recentOccurrenceProfile.title,
      profileKind:recentOccurrenceProfile.profileKind || "events",
      occurrences:recentOccurrenceProfile.occurrences.map((occurrence) => ({
        id:occurrence.id,
        date:occurrence.date,
        place:occurrence.place,
        title:occurrence.title,
        status:occurrence.status,
        statusLabel:occurrence.statusLabel,
        statusNote:occurrence.statusNote,
        summary:occurrence.summary,
        sources:(occurrence.sources || []).filter((source) => /^https:\/\//i.test(source.url)),
      })),
    } : null,
    sources:sourceUrls.length ? sourceUrls.map((url) => [labelSource(url),url]) : [["No external source listed","#"]],
  }];
}));

const activities = PHENOMENON_SELECTOR_CONFIG.map((item) => {
  const lensKey = item.lensKey || item.nodeIds?.[0] || item.key;
  const primaryNode = nodes.find((node) => node.id === item.nodeIds?.[0]);
  const lens = getPhenomenonLensById(lensKey);
  const actions = getActionProfileById(item.lensKey || item.nodeIds?.[0] || item.key);
  return {
    key:item.key,
    label:item.label,
    description:metricText(item.description || primaryNode?.description || lens?.intro || "Footprint-specific explanation surface."),
    lens:metricizeDisplayValue(lens),
    actions:metricizeDisplayValue(actions),
    lensKey,
  };
}).filter((profile) => profile.lens && profile.actions);

const relationshipContent = Object.fromEntries(edges.map((edge) => [
  `${edge.source}->${edge.target}`,
  metricizeDisplayValue(edge.relationship_content || {
    plain_language:relationshipText(edge,nodeNameById.get(edge.source),nodeNameById.get(edge.target)),
    technical_detail:edge.relationship_description || "",
    confidence:{level:edge.evidence?.confidence || "moderate",relationship_level:edge.evidence?.relationship_level || "indirect",explanation:"Supported by reviewed relationship evidence within the stated conditions."},
    sources:(edge.evidence?.relationship_source_urls || []).map((url) => ({url,section:"",source_type:"relationship_evidence"})),
  }),
]));

await Promise.all([
  writeFile(graphOutputUrl,`${JSON.stringify({ graphNodes,graphEdges })}\n`),
  writeFile(catalogOutputUrl,`${JSON.stringify(nodeCatalog)}\n`),
  writeFile(inspectorOutputUrl,`${JSON.stringify(profiles)}\n`),
  writeFile(relationshipContentOutputUrl,`${JSON.stringify(relationshipContent)}\n`),
  writeFile(activityOutputUrl,`${JSON.stringify(activities)}\n`),
]);
console.log(`Generated mobile snapshots (${graphNodes.length} nodes, ${graphEdges.length} edges, ${activities.length} activities) from ${root}.`);
