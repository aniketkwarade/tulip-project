import { desktopStore, DESKTOP_KEYS, validTopicIds } from './desktop-storage.js';
import { searchNodes, getSearchRecoverySuggestions } from './search.js';
import { createDiscoveryIndex, discoverTopics, isDiscoveryQuestion } from './desktop-discovery.js';
import { loadRuntimeNodeDetails } from './node-details.js';
import { loadRelationshipDetails } from './relationship-details.js';
import { getRecentOccurrenceProfile } from './recent-occurrences.js';
import { getTulipAssessment } from './tulip-assessment.js';
import { escapeHtml, safeHttpsUrl } from './security.js';

export function initializeDesktopSearch({ nodes, edges, selectNode, setMode, getMode }) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  let bookmarks = validTopicIds(nodes, desktopStore.read(DESKTOP_KEYS.bookmarks));
  let recents = validTopicIds(nodes, desktopStore.read(DESKTOP_KEYS.recents), 12);
  let origin = 'explore';
  let index = null;
  let loading = null;
  let failed = false;
  let section = 'search';
  const panel = document.createElement('section');
  panel.id = 'desktop-search'; panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'desktop-search-title');
  panel.innerHTML = `<div class="desktop-search-inner">
    <div class="desktop-search-heading"><div><p class="desktop-eyebrow">FOLLOW YOUR CURIOSITY</p><h1 id="desktop-search-title">Search Tulip Earth</h1><p>Find a topic, ask what causes it, or see what happens next.</p></div><button type="button" class="ui-close" data-close-search aria-label="Close search"><span aria-hidden="true">×</span></button></div>
    <label class="desktop-search-field"><img src="/desktop-icons/NavSearch.svg" alt=""><input id="desktop-search-input" type="search" placeholder="Try “What causes ocean acidification?”" aria-label="Search topics or ask a question" autocomplete="off"></label>
    <div class="desktop-search-tabs" aria-label="Search collection"><button type="button" data-collection="search" aria-pressed="true">Discover</button><button type="button" data-collection="bookmarks" aria-pressed="false">Bookmarks <span data-bookmark-count></span></button></div>
    <p id="desktop-search-status" role="status" aria-live="polite"></p><div id="desktop-search-content"></div><div class="desktop-search-learning"><button id="desktop-quick-start" type="button">Quick Start</button><button id="desktop-replay-welcome" type="button">Welcome</button></div>
  </div>`;
  document.getElementById('app-container').append(panel);
  const input = panel.querySelector('input');
  const content = panel.querySelector('#desktop-search-content');
  const status = panel.querySelector('#desktop-search-status');
  const quick = document.getElementById('node-search-input');
  const quickResults = document.getElementById('search-results');
  quick.setAttribute('role', 'combobox');
  function riskLabel(node) {
    const assessment = getTulipAssessment(node);
    return Number.isFinite(assessment?.value)
      ? `${assessment.value.toFixed(1)} / 10${assessment.valueLabel ? ` · ${assessment.valueLabel}` : ''}`
      : assessment?.label || 'Not yet scored';
  }

  const persist = () => {
    desktopStore.write(DESKTOP_KEYS.bookmarks, bookmarks);
    desktopStore.write(DESKTOP_KEYS.recents, recents);
  };
  function syncBookmark() {
    panel.querySelector('[data-bookmark-count]').textContent = String(bookmarks.length);
  }
  function remember(node) { recents = [node.id, ...recents.filter(id => id !== node.id)].slice(0, 12); persist(); }
  function choose(id, query) {
    const node = byId.get(id); if (!node) return;
    remember(node); closeQuick(); selectNode(node, { selectionContext: query });
    window.dispatchEvent(new CustomEvent('tulip:searchselect', { detail: { node } }));
  }
  function row(node, removeKind = '', evidence = null) {
    return `<article class="desktop-topic-row"><button type="button" class="desktop-topic-link" data-topic="${escapeHtml(node.id)}"><span>${escapeHtml(node.name)}</span><small>${escapeHtml(node.sphere || 'Earth systems')}${evidence ? ` · ${escapeHtml(evidence)}` : ''}</small></button>${removeKind ? `<button type="button" class="desktop-remove" data-remove="${removeKind}" data-id="${escapeHtml(node.id)}" aria-label="Remove ${escapeHtml(node.name)} from ${removeKind}">×</button>` : ''}</article>`;
  }
  function group(title, ids, kind = '') {
    return `<section class="desktop-result-group"><div class="desktop-result-heading"><h2>${title}</h2>${kind === 'recents' && ids.length ? '<button type="button" data-clear-recents>Clear recent searches</button>' : ''}</div>${ids.map(id => row(byId.get(id), kind)).join('')}</section>`;
  }
  function evidenceCard(match, result) {
    const evidence = match.evidence;
    const sources = (evidence?.urls || []).map(url => safeHttpsUrl(url, '')).filter(Boolean).slice(0, 3);
    return `<article class="desktop-discovery-card"><p class="desktop-eyebrow">${result.ambiguous ? 'POSSIBLE MATCH' : 'FROM THE TULIP GRAPH'}</p><h2>${escapeHtml(match.node.name)}</h2>
      ${evidence ? `<p>${escapeHtml(evidence.text)}</p>` : '<p>Open this topic to inspect its published evidence.</p>'}
      ${evidence && result.intent !== 'overview' && evidence.kind !== result.intent ? '<p class="desktop-muted">The graph has no specific passage for this question. This is the topic overview.</p>' : ''}
      <div class="desktop-evidence-links">${sources.map((url, i) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Source ${i + 1} ↗</a>`).join('')}</div>
      <button type="button" class="desktop-primary" data-topic="${escapeHtml(match.node.id)}">Explore ${escapeHtml(match.node.name)} →</button>
      ${match.related.length ? `<h3>${result.intent === 'cause' ? 'Contributing topics' : 'Connected topics'}</h3>${match.related.map(node => row(node)).join('')}` : ''}</article>`;
  }
  function getMatches(query) {
    if (index && isDiscoveryQuestion(query)) return discoverTopics(index, query).matches;
    return searchNodes(nodes, query, nodes.length);
  }
  function prepare() {
    if (index || loading) return loading;
    failed = false;
    loading = Promise.all([loadRuntimeNodeDetails(), loadRelationshipDetails()]).then(([details, relationships]) => {
      index = createDiscoveryIndex(nodes, edges, details, relationships, getRecentOccurrenceProfile);
    }).catch(() => { failed = true; }).finally(() => {
      loading = null; render(); if (quick.value.trim()) renderQuick();
    });
    return loading;
  }
  function render() {
    const query = input.value.trim();
    syncBookmark();
    panel.querySelectorAll('[data-collection]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collection === section)));
    if (section === 'bookmarks') {
      status.textContent = `${bookmarks.length} saved topics · stored in this browser`;
      content.innerHTML = bookmarks.length ? group('Saved topics', bookmarks, 'bookmarks') : '<div class="desktop-empty"><h2>No saved topics</h2><p>Previously saved topics appear here.</p></div>';
      return;
    }
    if (!query) {
      status.textContent = 'Explore a starting point, or describe what you want to understand.';
      const suggested = ['temp', 'ocean_heat_content', 'methane', 'deforestation', 'carbon_emission', 'ocean_acidification'].filter(id => byId.has(id));
      content.innerHTML = `<div class="desktop-search-columns">${recents.length ? group('Recent searches', recents, 'recents') : ''}${group('Suggested topics', suggested)}</div>`;
      return;
    }
    const matches = getMatches(query);
    const discovery = index && isDiscoveryQuestion(query) ? discoverTopics(index, query) : null;
    status.textContent = `${matches.length} ${matches.length === 1 ? 'topic' : 'topics'} found${loading && isDiscoveryQuestion(query) ? ' · Preparing graph evidence…' : ''}`;
    content.innerHTML = `${failed ? '<p class="desktop-search-notice">Graph evidence could not load. Topic search still works. <button type="button" data-retry-search>Retry evidence</button></p>' : ''}${discovery?.scopeNote ? `<p class="desktop-search-notice">${escapeHtml(discovery.scopeNote)}</p>` : ''}${discovery?.ambiguous ? '<p class="desktop-search-notice">Several topics may fit. Choose the one closest to your question.</p>' : ''}${discovery?.matches.length ? evidenceCard(discovery.matches[0], discovery) : ''}${matches.length ? group(discovery ? 'Topic matches' : 'Topics', matches.map(match => match.node.id)) : `<div class="desktop-empty"><h2>No supported match yet</h2><p>Try a topic name or a broader question. These starting points may help:</p>${getSearchRecoverySuggestions(nodes).map(node => row(node)).join('')}</div>`}`;
  }
  function closeQuick() {
    quickResults.style.display = 'none'; quickResults.replaceChildren(); quick.setAttribute('aria-expanded', 'false'); quick.removeAttribute('aria-activedescendant');
  }
  function renderQuick() {
    const query = quick.value.trim(); if (!query) return closeQuick();
    const matches = getMatches(query);
    const visible = matches.slice(0, 5);
    quickResults.style.display = 'block'; quick.setAttribute('aria-expanded', 'true'); quick.removeAttribute('aria-activedescendant');
    quickResults.innerHTML = `<div class="search-results-summary" role="presentation">${matches.length} topics found${loading && isDiscoveryQuestion(query) ? ' · Preparing evidence…' : ''}</div>${visible.map(({ node, matchedTerm, evidence }, i) => `<div class="search-result-item" id="desktop-quick-${i}" role="option" aria-selected="false" tabindex="-1" data-quick-topic="${escapeHtml(node.id)}"><span class="search-result-copy">${escapeHtml(node.name)}<small>${escapeHtml(evidence?.text || matchedTerm || node.sphere)}</small></span><span class="search-result-meta"><span class="search-result-sphere-badge">${escapeHtml(node.sphere)}</span><strong class="search-result-score" aria-label="Risk assessment: ${escapeHtml(riskLabel(node))}">${escapeHtml(riskLabel(node))}</strong></span></div>`).join('')}${!matches.length ? '<p class="desktop-muted">No direct match. Open Search for suggestions.</p>' : ''}<button type="button" id="desktop-quick-all" role="option" aria-selected="false" data-full-search>Open Search${matches.length > 5 ? ` · View all ${matches.length} results` : ' and evidence'} →</button>`;
  }
  function open(query) {
    if (getMode() !== 'search') origin = getMode();
    if (typeof query === 'string') { input.value = query; section = 'search'; }
    setMode('search'); render(); void prepare(); input.focus({ preventScroll: true });
  }
  function close() { setMode(origin === 'search' ? 'explore' : origin); (quick.getClientRects().length ? quick : document.getElementById('footer-btn-explore'))?.focus(); }
  panel.querySelector('[data-close-search]').addEventListener('click', close);
  panel.addEventListener('click', event => {
    const topic = event.target.closest('[data-topic]');
    if (topic) choose(topic.dataset.topic, input.value);
    const collection = event.target.closest('[data-collection]');
    if (collection) { section = collection.dataset.collection; render(); }
    const remove = event.target.closest('[data-remove]');
    if (remove) {
      if (remove.dataset.remove === 'bookmarks') bookmarks = bookmarks.filter(id => id !== remove.dataset.id);
      else recents = recents.filter(id => id !== remove.dataset.id);
      persist(); render(); panel.querySelector('[data-collection][aria-pressed="true"]')?.focus();
    }
    if (event.target.closest('[data-clear-recents]')) { recents = []; persist(); render(); input.focus(); }
    if (event.target.closest('[data-retry-search]')) { void prepare(); render(); }
  });
  input.addEventListener('input', () => { section = 'search'; render(); void prepare(); });
  input.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
  quick.addEventListener('focus', () => { void prepare(); });
  quick.addEventListener('input', () => { renderQuick(); void prepare(); });
  quickResults.addEventListener('click', event => {
    const item = event.target.closest('[data-quick-topic]');
    if (item) choose(item.dataset.quickTopic, quick.value);
    if (event.target.closest('[data-full-search]')) { const query = quick.value; closeQuick(); open(query); }
  });
  quick.addEventListener('keydown', event => {
    const options = [...quickResults.querySelectorAll('[role="option"]')];
    const active = options.findIndex(option => option.id === quick.getAttribute('aria-activedescendant'));
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && options.length) {
      event.preventDefault(); const next = (active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
      options.forEach((option, i) => option.setAttribute('aria-selected', String(i === next)));
      quick.setAttribute('aria-activedescendant', options[next].id); options[next].scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter') { event.preventDefault(); if (options.length) (options[active] || options[0]).click(); else { closeQuick(); open(quick.value || undefined); } }
    else if (event.key === 'Escape') closeQuick();
  });
  document.addEventListener('click', event => { if (!event.target.closest('#search-container')) closeQuick(); });
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k' && !document.body.classList.contains('desktop-welcome-active') && !document.body.classList.contains('footer-overlay-active')) {
      event.preventDefault(); if (getMode() === 'search') input.focus(); else if (!quick.getClientRects().length) open(); else { quick.focus(); quick.select(); }
    }
  });
  document.getElementById('footer-btn-search')?.addEventListener('click', () => open());
  window.addEventListener('tulip:modechange', event => { panel.hidden = event.detail.mode !== 'search'; if (!panel.hidden) render(); });
  window.addEventListener('tulip:bookmark-toggle', event => {
    const id = event.detail?.id;
    if (!byId.has(id)) return;
    bookmarks = bookmarks.includes(id) ? bookmarks.filter(saved => saved !== id) : [id, ...bookmarks];
    persist(); syncBookmark();
    if (!panel.hidden) render();
  });
  window.addEventListener('storage', event => {
    if (![DESKTOP_KEYS.bookmarks, DESKTOP_KEYS.recents].includes(event.key)) return;
    // Refresh another tab's values without overwriting them with this tab's cache.
    if (event.key === DESKTOP_KEYS.bookmarks) { try { bookmarks = validTopicIds(nodes, JSON.parse(event.newValue)); } catch { bookmarks = []; } }
    else { try { recents = validTopicIds(nodes, JSON.parse(event.newValue), 12); } catch { recents = []; } }
    syncBookmark(); if (!panel.hidden) render();
  });
  syncBookmark();
  return { open, getMatches, prepare };
}
