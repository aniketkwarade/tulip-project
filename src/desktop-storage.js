// Browser-local preferences are optional: restricted storage never blocks the app.
export function createLocalStore(getStorage = () => window.localStorage) {
  const memory = new Map();
  return {
    read(key, fallback = null) {
      if (memory.has(key)) return memory.get(key);
      try { const raw = getStorage().getItem(key); return raw === null ? fallback : JSON.parse(raw); }
      catch { return fallback; }
    },
    write(key, value) {
      memory.set(key, value);
      try { getStorage().setItem(key, JSON.stringify(value)); } catch { /* In-memory fallback. */ }
    },
    forget(key) {
      memory.delete(key);
      try { getStorage().removeItem(key); } catch { /* Optional persistence. */ }
    }
  };
}
export const desktopStore = createLocalStore();
export const DESKTOP_KEYS = Object.freeze({
  welcome: 'tulip-desktop-welcome-v1', guide: 'tulip-desktop-guide-v1',
  invitation: 'tulip-desktop-guide-invitation-v1', bookmarks: 'tulip-desktop-bookmarks-v1',
  recents: 'tulip-desktop-recents-v1', footprint: 'tulip-desktop-footprint-v1'
});
export function validFootprintAnswers(questions, value) {
  return Object.fromEntries(questions.map(question => [question.key,
    question.options.some(option => option.value === value?.[question.key]) ? value[question.key] : null
  ]));
}
export function validTopicIds(nodes, value, limit = Infinity) {
  const ids = new Set(nodes.map(node => node.id));
  return Array.isArray(value) ? [...new Set(value.filter(id => typeof id === 'string' && ids.has(id)))].slice(0, limit) : [];
}
