export const SPHERE_LABELS = Object.freeze({
  atmosphere: 'Air',
  oceans: 'Oceans',
  freshwater: 'Freshwater',
  cryosphere: 'Glaciers',
  biosphere: 'Plants & Wildlife',
  energy: 'Power & Heat',
  digital: 'Digital',
  agriculture: 'Farming',
  transport: 'Travel & Shipping',
  economy: 'Markets',
  health: 'Health',
  sociopolitical: 'Society',
  core: 'Core'
});

export function getNodeInspectorMeaning(node) {
  if (!node) return 'Awaiting description...';
  if (node.readerMeaning) return node.readerMeaning;
  if (node.node_kind === 'response') return node.responseProfile?.summary || node.description || 'A reviewed climate response pathway.';
  return node.description || null;
}

export function formatNodeSourceDate(node, registry) {
  const rawDate = registry?.entries?.[node?.id]?.source_date;
  if (!rawDate) return 'Most Recent Data: Unavailable';
  const [year, month] = String(rawDate).split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return 'Most Recent Data: Unavailable';
  const monthLabel = new Intl.DateTimeFormat('en-US', { month:'long',timeZone:'UTC' }).format(new Date(Date.UTC(year,month - 1,1)));
  return `Most Recent Data: ${monthLabel}, ${year}`;
}

function titleCaseToken(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function formatReceiptDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return 'Unavailable';
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function buildUrgencyTrustProfile(node, receipt, { useReceipt = false, score = null, fallbackAsOf = null } = {}) {
  const reviewStatus = receipt?.scientific_review?.status;
  const method = useReceipt ? receipt?.method : null;
  const reviewed = reviewStatus === 'approved';
  const currentData = method === 'current_data';
  const modeled = method === 'modeled';
  const impactFallback = method === 'impact_fallback';
  const scope = receipt?.method_selection?.review_evidence?.global_scope
    ? 'Global'
    : titleCaseToken(node?.context?.reach || 'mixed');

  let evidenceQuality = 'Modeled baseline';
  let confidence = 'Indicative';
  if (reviewed && currentData) {
    evidenceQuality = 'Reviewed';
    confidence = 'High';
  } else if (currentData) {
    evidenceQuality = 'Source-backed';
    confidence = 'Moderate';
  } else if (impactFallback) {
    evidenceQuality = 'Impact evidence';
    confidence = 'Moderate';
  } else if (modeled) {
    evidenceQuality = 'Modeled estimate';
    confidence = 'Indicative';
  }

  const fallbackWhy = useReceipt
    ? 'The published method combines magnitude, threshold position, momentum, and geographic extent.'
    : 'This baseline score is calculated from the node’s climate, ecological, human, and societal impact profile.';
  const why = receipt?.method_selection?.decision_summary
    || receipt?.selection_reason?.selected_method_passed
    || fallbackWhy;
  const uncertainty = receipt?.uncertainty
    || 'This score is a comparative TULIP indicator, not a forecast or a local attribution result.';

  const receiptAsOf = formatReceiptDate(receipt?.as_of);
  const fallbackDate = formatReceiptDate(fallbackAsOf);

  return {
    evidenceQuality,
    confidence,
    scope,
    asOf: receiptAsOf !== 'Unavailable' ? receiptAsOf : fallbackDate,
    method: useReceipt
      ? ({ current_data: 'Current data', impact_fallback: 'Accumulated impact', modeled: 'Modeled' }[method] || titleCaseToken(method))
      : 'Unavailable',
    sourceCount: Array.isArray(receipt?.source_ids) ? receipt.source_ids.length : 0,
    reviewStatus: reviewed ? 'Scientifically approved' : 'Review pending',
    reviewNote: reviewed ? 'Scientifically approved' : 'Review pending',
    whyLabel: `Why ${Number.isFinite(score) ? score.toFixed(1) : 'this score'}`,
    why,
    uncertainty
  };
}

function isUnvalidatedExpertProfile(node, impact) {
  return node?.calibration?.role === 'generated'
    || node?.calibration?.method === 'anchor_blend_v1'
    || impact?.confidence === 'inherited';
}

const UNVALIDATED_PROFILE_SEVERITY = Object.freeze({
  label: 'Unvalidated expert profile',
  className: 'severity-emerging'
});

function getHumanImpactSeverityMeta(fallout) {
  if (fallout >= 0.9) return { label:'Acute human toll',className:'severity-acute' };
  if (fallout >= 0.75) return { label:'High human exposure',className:'severity-high' };
  if (fallout >= 0.55) return { label:'Material human stress',className:'severity-material' };
  return { label:'Emerging human stress',className:'severity-emerging' };
}

function getResponseBenefitSeverityMeta(score,audience = 'human') {
  const subject = audience === 'planet' ? 'planetary co-benefit' : 'protective benefit';
  if (score >= 8.5) return { label:`Transformative ${subject}`,className:'severity-low' };
  if (score >= 7) return { label:`High ${subject}`,className:'severity-emerging' };
  if (score >= 5) return { label:`Material ${subject}`,className:'severity-material' };
  return { label:`Supporting ${subject}`,className:'severity-high' };
}

function formatImpactMode(confidence) {
  if (confidence === 'curated') return 'curated';
  if (confidence === 'inherited') return 'inherited';
  return 'heuristic';
}

function lowerFirst(text) { return text ? text.charAt(0).toLowerCase() + text.slice(1) : ''; }
function joinWithAnd(items) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0,-1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}
function buildInheritedHumanSummary(impact) {
  const pathways = (impact.primaryPathways || []).slice(0,2).map(lowerFirst);
  const populations = (impact.affectedPopulations || []).slice(0,2).map(item => item.toLowerCase());
  return `People are most exposed when ${joinWithAnd(pathways) || 'climate stress pathways'} intensify, especially for ${joinWithAnd(populations) || 'exposed communities'}.`;
}
function buildInheritedPlanetSummary(impact) {
  const pathways = (impact.primaryPathways || []).slice(0,2).map(lowerFirst);
  const systems = (impact.affectedSystems || []).slice(0,2).map(item => item.toLowerCase());
  return `Planetary stress rises when ${joinWithAnd(pathways) || 'Earth-system stress pathways'} destabilize ${joinWithAnd(systems) || 'connected ecosystems'}.`;
}

export function simplifyInspectorImpactCopy(text) {
  if (!text) return text;
  const replacements = [
    [' matters to people because ',' harms people because '],[' matter to people when ',' hit people when '],[' matters to people when ',' hits people when '],
    [' affect people when ',' hit people when '],[' affects people when ',' hits people when '],[' becomes a human crisis when ',' becomes a crisis when '],
    [' becomes a human problem when ',' becomes a problem when '],[' turns climate risk into visible human loss through ',' shows up as human loss through '],
    [' translates into ',' creates '],[' at global scale',' globally'],[' raises baseline ',' raises '],[' shrinks safe outdoor work hours',' reduces safe outdoor work hours'],
    [' worsens ',' increases '],[' steadily makes more neighborhoods expensive to cool or protect',' makes more neighborhoods costly to cool or protect'],
    [' intensifies near-term warming quickly',' speeds up near-term warming'],[' arrive sooner than CO2 alone would',' arrive sooner'],[' externalizes ',' shifts '],
    [' overdraw ',' overuse '],[' less resilient to shocks',' more fragile'],[' can trap people in hotter, flood-prone, and infrastructure-hungry environments',' can trap people in hotter, flood-prone places'],
    [' load the climate system with long-lived warming that multiplies ',' add long-lived warming that increases '],
    [' through air pollution, fuel-cost exposure, unsafe urban design, and high household transport burdens',' through air pollution, fuel costs, unsafe streets, and high transport costs'],
    [' can quickly hit ',' can quickly raise '],[' directly threatens human survivability',' directly threatens survival'],[' becomes visible to people when ',' shows up when '],
    [' turns climate risk into a household balance-sheet crisis when ',' becomes a household financial crisis when '],
    [' is a direct human issue because it moves quickly from field losses into ',' quickly moves from field losses into '],
    [' becomes a climate harm when families cannot pay for ',' becomes harmful when families cannot afford '],
    [' destabilizes multiple Earth systems at once, accelerating ',' destabilizes multiple Earth systems at once by accelerating '],
    [' accelerates near-term planetary heating, amplifying ',' speeds up near-term planetary heating and increases '],
    [' weakens the ecological carrying capacity of land and water systems by exhausting the physical stocks they depend on',' weakens land and water systems by exhausting the physical stocks they depend on'],
    [' are the core long-lived forcing that raises baseline planetary heat and shifts multiple Earth systems toward persistent destabilization',' are a core long-lived force that raises planetary heat and pushes multiple Earth systems toward lasting instability'],
    [' affect the planet indirectly through ',' affect the planet through '],[' raise planetary strain when ',' increase planetary strain when '],[' stress the planet through ',' strain the planet through '],
    [' extend the physical footprint of digital systems across landscapes through ',' spread the physical footprint of digital systems across landscapes through '],
    [' create a global digital backbone whose environmental and systemic importance comes less from everyday emissions than from concentration, repair dependence, and geopolitical chokepoints',' matter less for daily emissions than for concentration risk, repair dependence, and geopolitical chokepoints'],
    [' destabilizes the seasonal freshwater pulse that many terrestrial ecosystems rely on for reproduction, growth, and recovery',' disrupts the seasonal freshwater pulse many ecosystems rely on for reproduction, growth, and recovery'],
    [' climate-linked stress pathways',' climate-linked pressures'],[' interconnected ecological pathways',' connected ecological pressures'],['Earth-system stress pathways','Earth-system pressures']
  ];
  let simplified = text;
  replacements.forEach(([from,to]) => { simplified = simplified.replaceAll(from,to); });
  return simplified.replace(/\bcan not\b/g,'cannot').replace(/\s+/g,' ').replace(/\s([,.;:!?])/g,'$1').trim();
}

function getHumanDisplaySummary(impact) {
  if (!impact) return 'Human exposure rises through climate-linked stress pathways.';
  return simplifyInspectorImpactCopy(impact.confidence === 'inherited' ? buildInheritedHumanSummary(impact) : (impact.summary || 'Human exposure rises through climate-linked stress pathways.'));
}
function getPlanetDisplaySummary(impact) {
  if (!impact) return 'Earth-system strain rises through interconnected ecological pathways.';
  return simplifyInspectorImpactCopy(impact.confidence === 'inherited' ? buildInheritedPlanetSummary(impact) : (impact.summary || 'Earth-system strain rises through interconnected ecological pathways.'));
}
function getPlanetImpactSeverityMeta(node) {
  const pressure = ((node?.vector?.ecological_damage ?? 0.5) * 0.65) + ((node?.vector?.climate_forcing ?? 0.5) * 0.35);
  if (pressure >= 0.9) return { label:'Acute Earth-system strain',className:'severity-acute' };
  if (pressure >= 0.75) return { label:'High ecological disruption',className:'severity-high' };
  if (pressure >= 0.55) return { label:'Material planetary stress',className:'severity-material' };
  return { label:'Emerging planetary stress',className:'severity-emerging' };
}

export function buildHumanInspectorProfile(node) {
  const reach = node?.context?.reach || 'mixed';
  const impact = node?.humanImpact || null;
  const unvalidated = node?.node_kind !== 'response' && isUnvalidatedExpertProfile(node, impact);
  const severity = node?.node_kind === 'response'
    ? getResponseBenefitSeverityMeta(node.responseProfile?.co_benefits || node.responseProfile?.overall || 5,'human')
    : unvalidated
      ? UNVALIDATED_PROFILE_SEVERITY
      : getHumanImpactSeverityMeta(node?.vector?.societal_fallout ?? 0.5);
  if (!impact) return { severity:{ label:'Human evidence pending review',className:'severity-emerging' },reach:`Reach: ${reach}`,mode:'research boundary',summary:`${node?.name || 'This topic'} has a human-facing pathway, but its structured outcome profile is still being reviewed.`,domains:[],populations:[],timeHorizon:null,basis:'explicit_uncurated_profile_boundary',consequences:['Use the topic description and cited measurement as context; TULIP does not yet assign a reviewed human severity or affected population.'] };
  const domains = (impact.domains || []).filter(domain => !/no direct human outcome established/i.test(domain));
  return { severity,reach:`Reach: ${reach}`,mode:unvalidated ? 'unvalidated expert profile' : formatImpactMode(impact.confidence),summary:getHumanDisplaySummary(impact),domains,populations:impact.affectedPopulations || [],timeHorizon:impact.timeHorizon || null,basis:impact.basis || null,consequences:(impact.consequences || []).slice(0,4).map(simplifyInspectorImpactCopy) };
}

export function buildPlanetInspectorProfile(node) {
  const reach = node?.context?.reach || 'mixed';
  const impact = node?.planetImpact || null;
  const unvalidated = node?.node_kind !== 'response' && isUnvalidatedExpertProfile(node, impact);
  const severity = node?.node_kind === 'response'
    ? getResponseBenefitSeverityMeta(node.responseProfile?.co_benefits || node.responseProfile?.overall || 5,'planet')
    : unvalidated
      ? UNVALIDATED_PROFILE_SEVERITY
      : getPlanetImpactSeverityMeta(node);
  if (!impact) return { severity:{ label:'Impact not yet characterized',className:'severity-emerging' },reach:`Reach: ${reach}`,mode:'research boundary',summary:`A node-specific planetary-impact synthesis has not yet been curated for ${node?.name || 'this node'}.`,domains:[],systems:[],timeHorizon:null,basis:'explicit_uncurated_profile_boundary',consequences:['No Earth-system domain, affected system, or severity is inferred from the node label or sphere.'] };
  return { severity,reach:`Reach: ${reach}`,mode:unvalidated ? 'unvalidated expert profile' : formatImpactMode(impact.confidence),summary:getPlanetDisplaySummary(impact),domains:impact.domains || [],systems:impact.affectedSystems || [],timeHorizon:impact.timeHorizon || null,basis:impact.basis || null,consequences:(impact.consequences || []).slice(0,4).map(simplifyInspectorImpactCopy) };
}
