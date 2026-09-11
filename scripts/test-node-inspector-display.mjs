import assert from 'node:assert/strict';
import { buildHumanInspectorProfile, buildPlanetInspectorProfile, buildUrgencyTrustProfile } from '../src/node-inspector-display.js';

const node = { context: { reach: 'global' } };
const reviewedReceipt = {
  method: 'current_data',
  as_of: '2026-06-30',
  source_ids: ['wmo', 'copernicus'],
  uncertainty: 'Monthly and annual products use different reference periods.',
  selection_reason: { selected_method_passed: 'Current observations cover every score component.' },
  method_selection: { review_evidence: { global_scope: true } },
  scientific_review: { status: 'approved' }
};

const reviewed = buildUrgencyTrustProfile(node, reviewedReceipt, { useReceipt: true, score: 7.3 });
assert.equal(reviewed.evidenceQuality, 'Reviewed');
assert.equal(reviewed.confidence, 'High');
assert.equal(reviewed.scope, 'Global');
assert.equal(reviewed.asOf, 'Jun 2026');
assert.equal(reviewed.sourceCount, 2);
assert.equal(reviewed.whyLabel, 'Why 7.3');
assert.equal(reviewed.reviewStatus, 'Scientifically approved');
assert.equal(reviewed.reviewNote, 'Scientifically approved');
assert.equal(reviewed.method, 'Current data');

const fallback = buildUrgencyTrustProfile({ context: { reach: 'regional' } }, null, { score: 5.2 });
assert.equal(fallback.evidenceQuality, 'Modeled baseline');
assert.equal(fallback.confidence, 'Indicative');
assert.equal(fallback.scope, 'Regional');
assert.equal(fallback.asOf, 'Unavailable');
assert.match(fallback.why, /baseline score/i);

const datedFallback = buildUrgencyTrustProfile(
  { context: { reach: 'regional' } },
  null,
  { score: 5.2, fallbackAsOf: '2025-11-26' }
);
assert.equal(datedFallback.asOf, 'Nov 2025');

const pendingHuman = buildHumanInspectorProfile({ name: 'Occupational Heat Exposure', context: { reach: 'global' } });
assert.equal(pendingHuman.severity.label, 'Human evidence pending review');
assert.match(pendingHuman.summary, /human-facing pathway/i);
assert.doesNotMatch(pendingHuman.consequences[0], /no impact/i);

const explicitHuman = buildHumanInspectorProfile({
  name: 'Occupational Heat Exposure',
  context: { reach: 'global' },
  humanImpact: {
    summary: 'Heat exposure reduces safe work capacity and increases injury risk.',
    domains: ['No direct human outcome established'],
    affectedPopulations: ['Outdoor workers'],
    consequences: ['Lost safe work hours rise during dangerous heat.'],
    confidence: 'evidence_derived'
  }
});
assert.equal(explicitHuman.domains.length, 0);
assert.match(explicitHuman.summary, /injury risk/);

const inheritedNode = {
  name: 'Inherited profile',
  context: { reach: 'regional' },
  calibration: { role: 'generated', method: 'anchor_blend_v1' },
  vector: { climate_forcing: 0.95, ecological_damage: 0.95, societal_fallout: 0.95 },
  humanImpact: { summary: 'Inherited context.', confidence: 'inherited' },
  planetImpact: { summary: 'Inherited context.', confidence: 'inherited' }
};
assert.equal(buildHumanInspectorProfile(inheritedNode).severity.label, 'Unvalidated expert profile');
assert.equal(buildPlanetInspectorProfile(inheritedNode).severity.label, 'Unvalidated expert profile');
assert.equal(buildHumanInspectorProfile(inheritedNode).mode, 'unvalidated expert profile');

const responseNode = {
  node_kind: 'response',
  context: { reach: 'global' },
  responseProfile: { overall: 8, co_benefits: 9 },
  vector: { climate_forcing: 1, ecological_damage: 1, societal_fallout: 1 },
  humanImpact: { summary: 'Protective response.', confidence: 'curated' },
  planetImpact: { summary: 'Planetary response.', confidence: 'curated' }
};
assert.match(buildHumanInspectorProfile(responseNode).severity.label, /protective benefit/);
assert.match(buildPlanetInspectorProfile(responseNode).severity.label, /planetary co-benefit/);

console.log('Node inspector trust-profile tests passed.');
