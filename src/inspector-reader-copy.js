import definitions from './reader-copy/definitions.json' with { type: 'json' };
import profiles from './reader-copy/profiles.json' with { type: 'json' };
import measurements from './reader-copy/measurements.json' with { type: 'json' };
import relationships from './reader-copy/relationships.json' with { type: 'json' };

export const inspectorReaderCopy = Object.freeze({ definitions, profiles, measurements, relationships });

// Run before any published projection is exported. Research-only records may
// retain technical text; publication always requires an explicit authored record.
export function assertPublishedReaderCopy(nodes, edges, copy = inspectorReaderCopy) {
  const failures = [];
  const requireText = (value, path) => {
    if (typeof value !== 'string' || !value.trim()) failures.push(path);
  };
  const requireList = (value, path, required = false) => {
    if (!Array.isArray(value) || (required && !value.length)) failures.push(path);
    else value.forEach((item, index) => requireText(item, `${path}[${index}]`));
  };
  for (const node of nodes) {
    const id = node.id;
    requireText(copy.definitions?.[id], `${id}.definition`);
    const profile = copy.profiles?.[id];
    for (const kind of ['human', 'planet']) {
      requireText(profile?.[kind]?.summary, `${id}.${kind}.summary`);
      requireList(profile?.[kind]?.consequences, `${id}.${kind}.consequences`);
      requireList(profile?.[kind]?.domains, `${id}.${kind}.domains`);
    }
    for (const field of ['hiddenCost', 'whoPays', 'physicalLimit', 'defaultDriver', 'evidenceBoundary']) {
      requireText(profile?.economy?.[field], `${id}.economy.${field}`);
    }
    requireList(profile?.economy?.systemLevers, `${id}.economy.systemLevers`, true);
    for (const field of ['method', 'uncertainty', 'boundary']) {
      requireText(copy.measurements?.[id]?.[field], `${id}.measurement.${field}`);
    }
  }
  for (const edge of edges) {
    const key = `${edge.source}->${edge.target}`;
    requireText(copy.relationships?.[key], `${key}.explanation`);
  }
  if (failures.length) throw new Error(`Publication requires authored reader copy:\n${failures.join('\n')}`);
}

// Authored display copy is separate from scientific contracts and evidence.
// Publication checks require complete copy for every published topic.
export function attachInspectorReaderCopy(nodes) {
  return nodes.map(node => {
    const definition = definitions[node.id];
    if (!definition) return node; // Unpublished research nodes retain their source text.
    return {
      ...node,
      readerMeaning: definition,
      readerMeaningBasis: 'authored_plain_language_v1',
      readerCopy: { ...profiles[node.id], measurement: measurements[node.id], definition, version: 1 }
    };
  });
}
