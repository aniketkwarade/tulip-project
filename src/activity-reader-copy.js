import ACTIVITY_READER_COPY from './reader-copy/activities.json' with { type: 'json' };

const lensCopyById = new Map(Object.values(ACTIVITY_READER_COPY).map(copy => [copy.lensId, copy.lens]));
const actionCopyById = new Map(Object.values(ACTIVITY_READER_COPY).map(copy => [copy.actionId, copy.actions]));

function requireText(value, path) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Missing Activity reader copy: ${path}`);
  }
}

export function getActivityReaderCopy(key) {
  const copy = ACTIVITY_READER_COPY[key];
  if (!copy) throw new Error(`Missing Activity reader copy: ${key}`);
  requireText(copy.description, `${key}.description`);
  return copy;
}

// Only reader-facing fields are overlaid. Values, units, source records, dates,
// scale settings and projection flags remain owned by the scientific dataset.
export function applyActivityLensReaderCopy(id, lens) {
  const copy = lensCopyById.get(id);
  if (!copy) return lens; // Non-Activity node lenses retain their existing contract.
  const fields = ['title', 'eyebrow', 'intro', 'scaleNote', 'takeaway'];
  fields.forEach(field => requireText(copy[field], `${id}.${field}`));
  const ids = lens.items.map(item => item.id);
  if (ids.some(id => !id) || new Set(ids).size !== ids.length) {
    throw new Error(`Activity comparison rows need unique stable IDs: ${id}`);
  }
  if (Object.keys(copy.items).length !== ids.length) {
    throw new Error(`Activity comparison reader-copy coverage changed: ${id}`);
  }
  return {
    ...lens,
    ...Object.fromEntries(fields.map(field => [field, copy[field]])),
    items: lens.items.map(item => {
      const authored = copy.items[item.id];
      requireText(authored?.label, `${item.id}.label`);
      requireText(authored?.note, `${item.id}.note`);
      return { ...item, label: authored.label, note: authored.note };
    })
  };
}

export function applyActivityGroupReaderCopy(id, groups) {
  const copy = lensCopyById.get(id);
  if (!copy) return groups;
  return groups.map(group => {
    requireText(copy.groupTitles[group.key], `${id}.groups.${group.key}`);
    return { ...group, title: copy.groupTitles[group.key] };
  });
}

export function applyActivityActionReaderCopy(id, profile) {
  const copy = actionCopyById.get(id);
  if (!copy) return profile;
  const fields = ['title', 'definition', 'whyItMatters', 'confidence', 'confidenceNote', 'strongestAction', 'caution'];
  fields.forEach(field => requireText(copy[field], `${id}.${field}`));
  for (const field of ['personal', 'community', 'policy', 'metrics']) {
    if (!Array.isArray(copy[field]) || copy[field].length !== profile[field].length) {
      throw new Error(`Activity action reader-copy coverage changed: ${id}.${field}`);
    }
    copy[field].forEach((text, index) => requireText(text, `${id}.${field}.${index}`));
  }
  for (const tier of ['personal', 'community', 'policy']) {
    if (!Array.isArray(copy.outcomes?.[tier]) || !copy.outcomes[tier].length) {
      throw new Error(`Missing Activity reader copy: ${id}.outcomes.${tier}`);
    }
    copy.outcomes[tier].forEach((text, index) => requireText(text, `${id}.outcomes.${tier}.${index}`));
  }
  return {
    ...profile,
    ...Object.fromEntries(fields.map(field => [field, copy[field]])),
    personal: copy.personal, community: copy.community, policy: copy.policy,
    metrics: copy.metrics, outcomes: copy.outcomes
  };
}
