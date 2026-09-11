import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { NODES } from '../src/data.js';
import nodeSourceDates from '../src/node-source-dates.json' with { type: 'json' };
import generatedRecentMajorEvents from '../src/recent-major-events.generated.json' with { type: 'json' };
import {
  formatOccurrenceDate,
  getRecentOccurrenceProfile
} from '../src/recent-occurrences.js';

const generatedProfileIds = Object.keys(generatedRecentMajorEvents.profiles || {});
const generatedSnapshotActive = generatedProfileIds.length === NODES.length;
const profile = getRecentOccurrenceProfile('glacial_lake_failure_risk');
assert.ok(profile, 'The GLOF topic should have a recent-occurrence profile');
assert.equal(profile.occurrences.length, 3, 'Reader-facing profiles should show no more than three events');
assert.deepEqual(
  profile.occurrences.map(occurrence => occurrence.date),
  [...profile.occurrences.map(occurrence => occurrence.date)].sort().reverse(),
  'Events should be ordered from most recent to oldest'
);
if (!generatedSnapshotActive) {
  assert.deepEqual(profile.occurrences.map(occurrence => occurrence.date), ['2026-08-26', '2025-07-07', '2024-08-16']);
  assert.equal(profile.occurrences[0].status, 'under_investigation');
  assert.match(profile.occurrences[0].summary, /glacier collapse rather than a classic lake outburst/i);
} else {
  assert.ok(profile.occurrences.every(occurrence => occurrence.status === 'reported'));
}
assert.ok(profile.occurrences.every(occurrence => occurrence.sources.length > 0));
assert.ok(profile.occurrences.flatMap(occurrence => occurrence.sources).every(source => source.url.startsWith('https://')));

assert.equal(
  getRecentOccurrenceProfile('glacial_lake_outburst_floods')?.occurrences[0].id,
  profile.occurrences[0].id,
  'Known aliases should resolve to the canonical topic'
);

const allNodeProfiles = NODES.map(node => ({
  node,
  profile: getRecentOccurrenceProfile(node, {
    sourceDate: nodeSourceDates.entries?.[node.id]?.source_date || ''
  })
}));
assert.ok(
  generatedProfileIds.length === 0 || generatedProfileIds.length === NODES.length,
  'A generated article snapshot must cover every node or remain disabled'
);
assert.equal(allNodeProfiles.filter(({ profile: nodeProfile }) => !nodeProfile).length, 0, 'Every node should have a reader-facing evidence profile');
assert.ok(allNodeProfiles.every(({ profile: nodeProfile }) => nodeProfile.occurrences.length === 3), 'Every node should expose three examples');
assert.ok(
  allNodeProfiles.every(({ profile: nodeProfile }) => nodeProfile.occurrences.every(occurrence => occurrence.sources.some(source => source.url.startsWith('https://')))),
  'Every example should retain an HTTPS source'
);
assert.ok(allNodeProfiles.every(({ profile: nodeProfile }) => nodeProfile.title === 'Recent Major Events'), 'Every node should use the same section title');
assert.ok(
  allNodeProfiles.every(({ profile: nodeProfile }) => nodeProfile.occurrences.every(occurrence => {
    return !/recent documented example|full article context|affected place or system|reported consequence preserved|linked source preserves/i.test(occurrence.summary);
  })),
  'Event descriptions must not contain generated filler'
);
assert.ok(
  allNodeProfiles.every(({ profile: nodeProfile }) => nodeProfile.occurrences.every(occurrence => !occurrence.relationship && !occurrence.scale)),
  'Event records should not expose relationship or scale tags'
);

const temperatureProfile = allNodeProfiles.find(({ node }) => node.id === 'temp')?.profile;
assert.equal(temperatureProfile?.title, 'Recent Major Events');
assert.equal(temperatureProfile?.occurrences[0].status, generatedSnapshotActive ? 'reported' : 'source_backed');

const responseProfile = allNodeProfiles.find(({ node }) => node.node_kind === 'response')?.profile;
if (!generatedSnapshotActive) {
  assert.ok(
    responseProfile?.occurrences.some(occurrence => /human benefit/i.test(occurrence.title)),
    'Fallback response profiles should describe benefits rather than impacts'
  );
}

if (generatedSnapshotActive) {
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 3);
  const minimumDate = cutoff.toISOString().slice(0, 10);
  for (const [nodeId, generatedProfile] of Object.entries(generatedRecentMajorEvents.profiles)) {
    assert.deepEqual(Object.keys(generatedProfile).sort(), ['occurrences', 'profileKind', 'title', 'updatedAt'], `${nodeId} should retain the profile schema`);
    assert.equal(generatedProfile.title, 'Recent Major Events');
    assert.equal(generatedProfile.profileKind, 'events');
    const dates = generatedProfile.occurrences.map(occurrence => occurrence.date);
    assert.deepEqual(dates, [...dates].sort().reverse(), `${nodeId} should be newest first`);
    assert.equal(new Set(generatedProfile.occurrences.map(occurrence => occurrence.sources[0].url)).size, 3, `${nodeId} should use three distinct articles`);
    assert.ok(dates.every(date => date >= minimumDate && date <= today), `${nodeId} should stay inside the rolling three-year window`);
    for (const occurrence of generatedProfile.occurrences) {
      assert.deepEqual(Object.keys(occurrence).sort(), ['date', 'id', 'place', 'sources', 'status', 'summary', 'title'], `${nodeId}/${occurrence.id} should retain the event-card schema`);
      assert.equal(occurrence.summary, '', `${nodeId}/${occurrence.id} should not reintroduce a generated description`);
      assert.ok(occurrence.sources.every(source => Object.keys(source).sort().join(',') === 'label,url'), `${nodeId}/${occurrence.id} should retain the source-link schema`);
    }
  }
}

assert.equal(formatOccurrenceDate('2026-08-26'), 'Aug 26, 2026');
assert.equal(formatOccurrenceDate('2026-08'), 'Aug 2026');
assert.equal(formatOccurrenceDate('not-a-date'), 'Date unavailable');

const indexHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const stylesheet = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
const mainSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const recentSectionPosition = indexHtml.indexOf('id="recent-occurrences-section"');
const measurementPosition = indexHtml.indexOf('id="monitoring-source-section"');
assert.ok(recentSectionPosition > 0 && recentSectionPosition < measurementPosition, 'Recent evidence should sit immediately before measurement');
assert.match(indexHtml, /id="recent-occurrences-toggle"[^>]+aria-expanded="true"/);
const recentContentTag = indexHtml.match(/<div id="recent-occurrences-content"[^>]*>/)?.[0] || '';
assert.doesNotMatch(recentContentTag, /\shidden(?:\s|>)/, 'Recent events should render expanded by default');
assert.doesNotMatch(indexHtml, /id="recent-occurrences-(?:intro|updated)"/, 'Recent events should open directly on the cards');
assert.match(mainSource, /data-node-id[^\n]+node\.id[\s\S]{0,120}setRecentOccurrencesExpanded\(true\)/, 'Selecting a different node should expand its recent events');
assert.doesNotMatch(indexHtml, /id="recent-occurrences-count"/, 'The recent-events disclosure should not show an example count');
assert.doesNotMatch(mainSource, /recent-occurrence-(?:relationship|scale)/, 'The event cards should render only the verification-status tag');
assert.match(mainSource, /occurrence\.summary \?/, 'Event descriptions should render only when they add substantive information');
assert.match(
  stylesheet,
  /#recent-occurrences-section \.section-toggle \{[\s\S]*?border: 0;[\s\S]*?background: transparent;[\s\S]*?box-shadow: none;/,
  'The inner recent-events toggle should not render a second pill surface'
);
assert.match(
  stylesheet,
  /#monitoring-source-section \.section-toggle \{[\s\S]*?justify-content: space-between;[\s\S]*?padding: 0;[\s\S]*?border: 0;[\s\S]*?background: transparent;[\s\S]*?box-shadow: none;/,
  'The measurement toggle should align with section headers without a nested pill surface'
);
assert.match(
  stylesheet,
  /#app-container\[data-view-mode="study"\] :is\([\s\S]*?#monitoring-source-section[\s\S]*?\) \.section-toggle \{[\s\S]*?background-color: transparent;/,
  'The flat study-mode surface rule should not restore a measurement-header background'
);
assert.match(
  stylesheet,
  /\.simulator-card\.monitoring-source-card-shell \{[\s\S]*?padding: 0;[\s\S]*?border: 0;[\s\S]*?box-shadow: none;/,
  'The expanded measurement content should align with adjacent cards without an inset shell'
);
assert.match(
  stylesheet,
  /#recent-occurrences-section \.section-toggle-arrow \{[\s\S]*?border-right-width: 2px;[\s\S]*?border-bottom-width: 2px;/,
  'The recent-events chevron should use a doubled 2px stroke'
);

console.log(`Recent evidence profile tests passed for ${NODES.length} nodes.`);
