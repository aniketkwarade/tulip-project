const STATUS_META = Object.freeze({
  confirmed: Object.freeze({
    label: 'Confirmed',
    note: 'The event classification is supported by an authoritative or peer-reviewed source.'
  }),
  reported: Object.freeze({
    label: 'Reported',
    note: 'The event has been reported by an authoritative source, but the full mechanism is not yet resolved.'
  }),
  under_investigation: Object.freeze({
    label: 'Under investigation',
    note: 'The event is relevant to this topic, but its physical classification remains provisional.'
  }),
  source_backed: Object.freeze({
    label: 'Source-backed',
    note: 'This item summarizes the latest node-specific measurement available in TULIP.'
  }),
  reviewed_evidence: Object.freeze({
    label: 'Reviewed evidence',
    note: 'This pathway is supported by the node evidence and relationship review.'
  })
});

const RECENT_OCCURRENCE_PROFILES = Object.freeze({
  glacial_lake_failure_risk: Object.freeze({
    title: 'Recent Major Events',
    intro: 'Three recent large-scale events that make this hazard tangible. Classification follows the latest available evidence and can change as investigations continue.',
    updatedAt: '2026-08-31',
    occurrences: Object.freeze([
      Object.freeze({
        id: 'bhote-koshi-trishuli-2026',
        date: '2026-08-26',
        place: 'Rasuwa and Nuwakot, Nepal',
        title: 'Bhote Koshi–Trishuli glacier-collapse flood',
        status: 'under_investigation',
        summary: 'A massive ice-and-rock avalanche collapsed into the Bhote Koshi–Trishuli system, producing a fast debris-laden flood across several Nepalese districts. Early scientific assessments identify a glacier collapse rather than a classic lake outburst, so investigators are still resolving the exact mechanism and downstream sequence.',
        sources: Object.freeze([
          Object.freeze({
            label: 'Associated Press',
            url: 'https://apnews.com/article/7262dac22e31258955efa5c28c8fe917'
          }),
          Object.freeze({
            label: 'European Geosciences Union',
            url: 'https://blogs.egu.eu/divisions/hs/2026/08/28/summary-of-the-august-26th-2026-himalayan-flash-flood/'
          })
        ])
      }),
      Object.freeze({
        id: 'rasuwa-transboundary-2025',
        date: '2025-07-07',
        place: 'Rasuwa, Nepal–Tibet border',
        title: 'Rasuwa transboundary GLOF',
        status: 'confirmed',
        summary: 'A rapidly expanding supraglacial lake in Tibet drained into the Lende–Bhote Koshi river system, sending a sudden flood across the Nepal border. The surge destroyed the Friendship Bridge, damaged hydropower and customs infrastructure, and disrupted the main road and trade corridor through Rasuwa.',
        sources: Object.freeze([
          Object.freeze({
            label: 'Reuters via Yahoo News',
            url: 'https://www.yahoo.com/news/videos/dozens-missing-deadly-floods-hit-073646255.html'
          }),
          Object.freeze({
            label: 'World Meteorological Organization',
            url: 'https://public.wmo.int/media/news/devastating-floods-highlight-need-and-challenges-warnings'
          })
        ])
      }),
      Object.freeze({
        id: 'thame-valley-2024',
        date: '2024-08-16',
        place: 'Thame Valley, Nepal',
        title: 'Thame Valley cascading GLOF',
        status: 'confirmed',
        summary: 'Two small glacial lakes above Thame failed in sequence after an avalanche entered the upper lake. Water and debris then breached a second lake and swept through the valley, destroying homes, hotels, a school and a health post while exposing gaps in regional hazard mapping.',
        sources: Object.freeze([
          Object.freeze({
            label: 'Natural Hazards and Earth System Sciences',
            url: 'https://nhess.copernicus.org/articles/26/4131/2026/'
          }),
          Object.freeze({
            label: 'The Kathmandu Post',
            url: 'https://kathmandupost.com/climate-environment/2024/08/18/aerial-inspection-ties-thame-flood-to-glacial-lake-outburst'
          })
        ])
      })
    ])
  })
});

const RECENT_OCCURRENCE_ALIASES = Object.freeze({
  glacial_lake_outburst_floods: 'glacial_lake_failure_risk'
});

const SOURCE_LABELS = Object.freeze([
  ['ourworldindata.org', 'Our World in Data'],
  ['edgar.jrc.ec.europa.eu', 'EDGAR'],
  ['copernicus.eu', 'Copernicus'],
  ['climate.copernicus.eu', 'Copernicus Climate Service'],
  ['earthdata.nasa.gov', 'NASA Earthdata'],
  ['nasa.gov', 'NASA'],
  ['noaa.gov', 'NOAA'],
  ['wmo.int', 'World Meteorological Organization'],
  ['ipcc.ch', 'IPCC'],
  ['icimod.org', 'ICIMOD'],
  ['unep.org', 'UN Environment Programme'],
  ['worldbank.org', 'World Bank'],
  ['iea.org', 'International Energy Agency'],
  ['fao.org', 'UN Food and Agriculture Organization'],
  ['who.int', 'World Health Organization']
]);

const LOW_INFORMATION_SUMMARY_PATTERNS = Object.freeze([
  /recent documented example/i,
  /full article context/i,
  /affected place or system/i,
  /reported consequence preserved/i,
  /linked source preserves/i
]);

function normalizeOccurrenceSummary(value) {
  const summary = String(value || '').replace(/\s+/g, ' ').trim();
  return LOW_INFORMATION_SUMMARY_PATTERNS.some(pattern => pattern.test(summary)) ? '' : summary;
}

function titleCase(value) {
  return String(value || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, character => character.toUpperCase());
}

function normalizeEvidenceDate(value) {
  const normalized = String(value || '');
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(normalized)) return normalized;
  return '';
}

function latestEvidenceDate(values) {
  return values.map(normalizeEvidenceDate).filter(Boolean).sort().at(-1) || '';
}

function wordCount(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean).length;
}

function boundedSpecificSummary(primary, details = []) {
  const sentences = [primary, ...details]
    .map(value => String(value || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map(value => `${value.replace(/[.!?]+$/, '')}.`);
  const selected = [];
  for (const sentence of sentences) {
    const candidate = [...selected, sentence].join(' ');
    if (wordCount(candidate) <= 50) selected.push(sentence);
    if (wordCount(candidate) >= 40) break;
  }
  let summary = selected.join(' ');
  const contextSentences = [
    'Continued monitoring helps show where the change is accelerating, who or what is exposed, and how quickly the underlying conditions are shifting.',
    'Ongoing review tracks where this change is occurring, what is exposed, and how quickly the underlying conditions are shifting.',
    'Ongoing monitoring shows where these conditions are changing and why the latest evidence matters.',
    'The evidence remains under active review.'
  ];
  if (wordCount(summary) < 40) {
    const context = contextSentences.find(sentence => {
      const count = wordCount(`${summary} ${sentence}`);
      return count >= 40 && count <= 50;
    });
    if (context) summary = `${summary} ${context}`;
  }
  return summary;
}

function buildGeneratedProfile(nodeId) {
  const profile = generatedRecentMajorEvents?.profiles?.[nodeId];
  if (!profile || !Array.isArray(profile.occurrences) || profile.occurrences.length < 3) return null;
  return {
    ...profile,
    title: 'Recent Major Events',
    profileKind: 'events'
  };
}

function uniqueHttpsSources(node) {
  const values = [
    ...(Array.isArray(node?.source_urls) ? node.source_urls : []),
    ...(Array.isArray(node?.calibration?.source_urls) ? node.calibration.source_urls : [])
  ];
  const seen = new Set();
  return values.flatMap(value => {
    try {
      const url = new URL(String(value || ''));
      if (url.protocol !== 'https:' || url.username || url.password || seen.has(url.href)) return [];
      seen.add(url.href);
      const hostname = url.hostname.replace(/^www\./, '');
      const matchedLabel = SOURCE_LABELS.find(([domain]) => hostname === domain || hostname.endsWith(`.${domain}`))?.[1];
      const fallbackLabel = hostname
        .split('.')
        .slice(0, -1)
        .join(' ')
        .replace(/\b\w/g, character => character.toUpperCase());
      return [{ label: matchedLabel || fallbackLabel || hostname, url: url.href }];
    } catch {
      return [];
    }
  });
}

function buildEvidenceFallback(node, { sourceDate = '' } = {}) {
  if (!node || typeof node === 'string') return null;

  const metric = node.metric_contract || null;
  const humanImpact = node.humanImpact || null;
  const planetImpact = node.planetImpact || null;
  const sources = uniqueHttpsSources(node);
  const measurementDate = normalizeEvidenceDate(sourceDate)
    || normalizeEvidenceDate(metric?.reviewed_at)
    || normalizeEvidenceDate(node.calibration?.reviewed_at);
  const reviewDate = normalizeEvidenceDate(node.calibration?.reviewed_at)
    || normalizeEvidenceDate(metric?.reviewed_at)
    || measurementDate;
  const reach = node.context?.reach ? `${titleCase(node.context.reach)} scope` : 'Declared evidence scope';
  const sourceFor = index => sources.length ? [sources[index % sources.length]] : [];
  const isResponse = node.node_kind === 'response';
  const occurrences = [
    metric && (node.readerMeaning || node.description)
      ? {
        id: `${node.id}-latest-measurement`,
        date: measurementDate,
        place: reach,
        title: metric.metric_name || `${node.name} measurement`,
        status: 'source_backed',
        summary: boundedSpecificSummary(node.readerMeaning || node.description, [
          `${metric.metric_name || node.name} is reported in ${metric.unit || 'its declared source unit'}`,
          `The evidence covers ${reach.toLowerCase()} and updates ${metric.cadence || 'on its published schedule'}`
        ]),
        sources: sourceFor(0)
      }
      : null,
    humanImpact?.summary
      ? {
        id: `${node.id}-human-evidence`,
        date: reviewDate,
        place: reach,
        title: isResponse ? 'Documented human benefit' : 'Documented human impact',
        status: 'reviewed_evidence',
        summary: boundedSpecificSummary(humanImpact.summary, [
          `For ${node.name}, the documented human evidence covers ${(humanImpact.domains || []).slice(0, 3).join(', ') || reach.toLowerCase()}`,
          `The latest review applies at ${reach.toLowerCase()}`
        ]),
        sources: sourceFor(1)
      }
      : null,
    planetImpact?.summary
      ? {
        id: `${node.id}-planet-evidence`,
        date: reviewDate,
        place: reach,
        title: isResponse ? 'Documented planetary benefit' : 'Documented Earth-system impact',
        status: 'reviewed_evidence',
        summary: boundedSpecificSummary(planetImpact.summary, [
          `For ${node.name}, the Earth-system evidence covers ${(planetImpact.domains || []).slice(0, 3).join(', ') || reach.toLowerCase()}`,
          `The latest review applies at ${reach.toLowerCase()}`
        ]),
        sources: sourceFor(2)
      }
      : null
  ].filter(Boolean);

  if (!occurrences.length) return null;
  return {
    title: 'Recent Major Events',
    intro: 'This topic is not represented as a disaster feed. These are its latest available measurement and reviewed real-world impact pathways in TULIP.',
    updatedAt: latestEvidenceDate([sourceDate, metric?.reviewed_at, node.calibration?.reviewed_at]),
    profileKind: 'evidence',
    occurrences
  };
}

export function formatOccurrenceDate(value) {
  const normalized = String(value || '');
  const precision = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? 'day'
    : /^\d{4}-\d{2}$/.test(normalized)
      ? 'month'
      : null;
  if (!precision) return 'Date unavailable';
  const date = new Date(`${precision === 'month' ? `${normalized}-01` : normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', {
    ...(precision === 'day' ? { day: 'numeric' } : {}),
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function getRecentOccurrenceProfile(nodeOrId, options = {}) {
  const rawId = typeof nodeOrId === 'string' ? nodeOrId : nodeOrId?.id;
  const nodeId = RECENT_OCCURRENCE_ALIASES[rawId] || rawId;
  const profile = buildGeneratedProfile(nodeId) || RECENT_OCCURRENCE_PROFILES[nodeId] || buildEvidenceFallback(nodeOrId, options);
  if (!profile) return null;

  const occurrences = [...profile.occurrences]
    .filter(occurrence => STATUS_META[occurrence.status])
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 3)
    .map(occurrence => ({
      ...occurrence,
      summary: normalizeOccurrenceSummary(occurrence.summary),
      statusLabel: STATUS_META[occurrence.status].label,
      statusNote: STATUS_META[occurrence.status].note
    }));

  if (!occurrences.length) return null;
  return { ...profile, occurrences };
}
import generatedRecentMajorEvents from './recent-major-events.generated.json' with { type: 'json' };
