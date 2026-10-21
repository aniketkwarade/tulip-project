// Session-local view context is keyed by visit, never by topic: A → B → A
// must preserve two different views of A. URLs remain topic/path-only.
export function createNavigationViewStore(sessionId) {
  const entries = new Map();
  let active = null;
  let sequence = 0;
  return {
    get active() { return active; },
    create(pathIds, ancestorEntryIds = active?.ancestorEntryIds || []) {
      active = { entryId: `${sessionId}:${++sequence}`, pathIds,
        ancestorEntryIds: pathIds.length > 1 ? [...ancestorEntryIds].slice(-(pathIds.length - 1)) : [], viewContext: null };
      entries.set(active.entryId, active);
      return active;
    },
    activate(state, pathIds) {
      if (state?.sessionId !== sessionId || typeof state.entryId !== 'string') return this.create(pathIds, []);
      active = entries.get(state.entryId) || { entryId: state.entryId, pathIds,
        ancestorEntryIds: Array.isArray(state.ancestorEntryIds) ? state.ancestorEntryIds.slice(0, 39) : [],
        viewContext: state.viewContext || null };
      entries.set(active.entryId, active);
      return active;
    },
    save(context) { if (active && context) active.viewContext = context; },
    ancestor(index) { return entries.get(active?.ancestorEntryIds[index]) || null; }
  };
}

const sections = [
  ['monitoring-source-toggle', 'monitoring-source-content'],
  ['recent-occurrences-toggle', 'recent-occurrences-content']
];
const visible = element => element && element.getClientRects().length && !element.closest('[hidden]');

export function captureInspectorView(inspector) {
  if (!inspector || !visible(inspector)) return null;
  const bounds = inspector.getBoundingClientRect();
  const top = bounds.top;
  const scale = bounds.height / inspector.clientHeight || 1;
  const anchor = [...inspector.querySelectorAll('[id]')].find(element => {
    const rect = element.getBoundingClientRect();
    return visible(element) && rect.height > 0 && rect.bottom > top && rect.top < top + inspector.clientHeight;
  });
  return {
    scrollTop: inspector.scrollTop,
    anchor: anchor ? { id: anchor.id, offset: (anchor.getBoundingClientRect().top - top) / scale } : null,
    sections: sections.map(([toggle]) => ({ id: toggle, expanded: document.getElementById(toggle)?.getAttribute('aria-expanded') === 'true' })),
    details: [...inspector.querySelectorAll('details[id]')].map(element => ({ id: element.id, open: element.open }))
  };
}

export function restoreInspectorView(inspector, state) {
  if (!inspector || !state) return;
  for (const [toggleId, contentId] of sections) {
    const saved = (Array.isArray(state.sections) ? state.sections : []).find(section => section?.id === toggleId);
    const toggle = document.getElementById(toggleId), content = document.getElementById(contentId);
    if (!saved || typeof saved.expanded !== 'boolean' || !toggle || !content) continue;
    toggle.setAttribute('aria-expanded', String(saved.expanded));
    toggle.classList.toggle('collapsed', !saved.expanded);
    content.hidden = !saved.expanded;
  }
  for (const saved of Array.isArray(state.details) ? state.details : []) {
    const element = document.getElementById(saved?.id);
    if (element?.tagName === 'DETAILS' && inspector.contains(element)) element.open = saved.open === true;
  }
  const anchor = typeof state.anchor?.id === 'string' ? document.getElementById(state.anchor.id) : null;
  if (visible(anchor) && inspector.contains(anchor) && Number.isFinite(state.anchor.offset)) {
    const bounds = inspector.getBoundingClientRect();
    const scale = bounds.height / inspector.clientHeight || 1;
    inspector.scrollTop += (anchor.getBoundingClientRect().top - bounds.top) / scale - state.anchor.offset;
  } else if (Number.isFinite(state.scrollTop)) {
    inspector.scrollTop = Math.max(0, state.scrollTop);
  }
}

export function revealWithinInspector(inspector, element) {
  if (!visible(inspector) || !visible(element)) return;
  const bounds = inspector.getBoundingClientRect(), rect = element.getBoundingClientRect();
  const scale = bounds.height / inspector.clientHeight || 1;
  // Move just enough to show the explanation; never scroll the whole document.
  const delta = rect.top < bounds.top ? rect.top - bounds.top
    : rect.bottom > bounds.bottom
      ? (rect.height > bounds.height ? rect.top - bounds.top : rect.bottom - bounds.bottom)
      : 0;
  if (delta) inspector.scrollTop += delta / scale;
}
