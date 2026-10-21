import { desktopStore, DESKTOP_KEYS } from './desktop-storage.js';
import { WELCOME_ARTWORK } from './desktop-welcome-art.js';
import './desktop-welcome-art.css';
import { escapeHtml } from './security.js';

export const WELCOME_PAGES = Object.freeze([
  { heading: 'Your planet. Better understood.', copy: 'Explore how human choices affect our climate, nature, and the resources we depend on.', icon: 'NavExplore' },
  { heading: 'One change leads to another.', copy: 'See what causes an environmental problem, what it affects next, and how the consequences reach us.', icon: 'NavAnalyse' },
  { heading: 'Make your footprint visible.', copy: 'Estimate the carbon emissions and resource use behind how you eat, travel, live, and shop.', icon: 'NavFootprint' },
  { heading: 'See what we can change.', copy: 'Explore solutions, from everyday choices to changes in our communities, businesses, and policies.', icon: 'NavActivity' }
]);
export const GUIDE_STEPS = Object.freeze([
  ['Explore the globe', 'Drag to rotate. Scroll to zoom. Choose a point, or open Global Temperature to try it.', '#graph-canvas'],
  ['Read the Inspector', 'See the topic’s TULIP Score, its impacts, and the evidence. Next, explore what it connects to.', '#study-console'],
  ['Follow a connection', 'Choose a connected topic on the graph to see how one change leads to another.', '.inspector-relationships-card']
]);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initializeDesktopOnboarding(api) {
  const { nodes, edges, getGraph, getSelected, selectNode, reset } = api;
  const welcome = document.createElement('section');
  welcome.id = 'desktop-welcome'; welcome.hidden = true;
  welcome.setAttribute('role', 'dialog'); welcome.setAttribute('aria-modal', 'true'); welcome.setAttribute('aria-labelledby', 'desktop-welcome-title');
  document.body.append(welcome);
  const prompt = document.createElement('section');
  prompt.id = 'desktop-guide'; prompt.hidden = true; prompt.setAttribute('role', 'dialog'); prompt.setAttribute('aria-label', 'Quick Start guide');
  prompt.setAttribute('aria-describedby', 'desktop-guide-description');
  document.body.append(prompt);
  let page = 0;
  let phase = 'pages';
  let pendingGuide = false;
  let waitTimer = null;
  let revealTimer = null;
  let checkFrame = null;
  let step = null;
  let rootId = null;
  const inertBefore = new Map();
  const byId = new Map(nodes.map(node => [node.id, node]));

  function cover(active) {
    document.body.classList.toggle('desktop-welcome-active', active);
    for (const el of [document.getElementById('app-container'), document.getElementById('tulip-footer-bar')]) {
      if (active) { if (!inertBefore.has(el)) inertBefore.set(el, el.inert); el.inert = true; }
      else { el.inert = inertBefore.get(el) || false; inertBefore.delete(el); }
    }
  }
  function renderWelcome() {
    const story = WELCOME_PAGES[page];
    welcome.dataset.page = String(page + 1); welcome.dataset.phase = phase;
    welcome.innerHTML = `<div class="desktop-welcome-shell"><img class="desktop-welcome-brand" src="/logo.svg" alt="Tulip Earth">
      <div class="desktop-welcome-story">${WELCOME_ARTWORK[page]}
      <p class="desktop-eyebrow">WELCOME TO TULIP EARTH</p><h1 id="desktop-welcome-title" tabindex="-1">${story.heading}</h1><p class="desktop-welcome-copy">${story.copy}</p>
      <div class="desktop-welcome-progress" aria-label="Page ${page + 1} of 4">${WELCOME_PAGES.map((_, i) => `<span class="${i === page ? 'active' : ''}" aria-hidden="true"></span>`).join('')}</div>
      <p class="desktop-welcome-status" role="${phase === 'error' ? 'alert' : 'status'}">${phase === 'waiting' ? 'Preparing your sphere…' : phase === 'error' ? 'The sphere couldn’t load. Please try again.' : ''}</p>
      <div class="desktop-welcome-actions">${phase === 'error' ? '<button type="button" data-welcome="retry" class="desktop-primary">Retry</button>' : phase === 'pages' ? `${page > 0 ? '<button type="button" data-welcome="back">Back</button>' : ''}<button type="button" data-welcome="next" class="desktop-primary">${page === 3 ? 'Start Quick Start' : 'Next'}</button><button type="button" data-welcome="skip">${page === 3 ? 'Explore on my own' : 'Skip'}</button>` : ''}</div></div>
      <span class="desktop-welcome-footnote">A connected view of our changing planet.</span></div>`;
    welcome.querySelector('h1').focus({ preventScroll: true });
  }
  function showWelcome() {
    stopGuide(false); document.getElementById('desktop-guide-invitation')?.remove();
    const saved = desktopStore.read(DESKTOP_KEYS.welcome);
    page = Number.isInteger(saved?.page) && saved.page >= 0 && saved.page < 4 ? saved.page : 0;
    phase = 'pages'; welcome.hidden = false; cover(true); renderWelcome();
  }
  function cancelReadiness() {
    clearTimeout(waitTimer); clearTimeout(revealTimer); cancelAnimationFrame(checkFrame);
    waitTimer = revealTimer = checkFrame = null;
  }
  function failWelcome() { cancelReadiness(); phase = 'error'; renderWelcome(); }
  function continueWelcome(withGuide) {
    if (phase !== 'pages') return;
    pendingGuide = withGuide; phase = 'waiting'; renderWelcome();
    getGraph()?.resume();
    waitTimer = setTimeout(failWelcome, 8000);
    const check = () => {
      const canvas = document.getElementById('graph-canvas');
      if (canvas?.dataset.renderError) return failWelcome();
      if (canvas?.dataset.firstFrameRendered === 'true') {
        clearTimeout(waitTimer); phase = 'revealing'; welcome.dataset.phase = phase;
        desktopStore.write(DESKTOP_KEYS.welcome, { complete: true });
        if (withGuide) desktopStore.write(DESKTOP_KEYS.guide, 'interrupted');
        revealTimer = setTimeout(() => {
          welcome.hidden = true; cover(false);
          if (pendingGuide) startGuide();
          else document.getElementById('footer-btn-explore').focus();
        }, reduced() ? 150 : 650);
      } else checkFrame = requestAnimationFrame(check);
    };
    check();
  }
  welcome.addEventListener('click', event => {
    const action = event.target.closest('[data-welcome]')?.dataset.welcome;
    if (action === 'retry') { desktopStore.write(DESKTOP_KEYS.welcome, { page, retryGuide: pendingGuide }); window.location.reload(); return; }
    if (phase !== 'pages') return;
    if (action === 'next' && page < 3) { page++; desktopStore.write(DESKTOP_KEYS.welcome, { page }); renderWelcome(); }
    else if (action === 'back') { page--; desktopStore.write(DESKTOP_KEYS.welcome, { page }); renderWelcome(); }
    else if (action === 'next') continueWelcome(true);
    else if (action === 'skip') continueWelcome(false);
  });
  welcome.addEventListener('keydown', event => {
    if (event.key === 'Escape' && phase === 'pages') { event.preventDefault(); continueWelcome(false); }
    if (event.key !== 'Tab') return;
    const buttons = [...welcome.querySelectorAll('button')];
    if (!buttons.length) { event.preventDefault(); return; }
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement);
    buttons[(current + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
  });
  function clearHighlights() {
    document.querySelectorAll('[data-guide-highlight]').forEach(el => el.removeAttribute('data-guide-highlight'));
  }
  function connectedNodes() {
    const id = getSelected()?.id;
    return [...new Set(edges.filter(edge => edge.source === id || edge.target === id)
      .map(edge => edge.source === id ? edge.target : edge.source))]
      .map(id => byId.get(id)).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
  }
  function suggestedConnection() {
    const connected = connectedNodes();
    // Prefer an authored learning path over an arbitrary alphabetical example.
    const recommended = getSelected()?.discoveryGuide?.nextNodeIds || [];
    return recommended.map(id => connected.find(node => node.id === id)).find(Boolean) || connected[0];
  }
  function renderGuide() {
    clearHighlights();
    if (step === null) return;
    const [title, copy, selector] = GUIDE_STEPS[step];
    document.body.dataset.guideStep = String(step);
    if (step > 0) document.querySelector(selector)?.setAttribute('data-guide-highlight', 'true');
    const next = suggestedConnection();
    const action = step === 0 ? 'Open a topic' : step === 1 ? 'See connections' : next ? 'Follow connection' : 'Finish';
    const description = step === 2 && next ? `Try ${next.name}, or choose a connected topic on the graph.` : copy;
    prompt.innerHTML = `<div class="desktop-guide-card">
      <div class="desktop-guide-copy"><div class="desktop-guide-label">QUICK START <span>${step + 1} / ${GUIDE_STEPS.length}</span><span class="desktop-guide-progress" aria-hidden="true">${GUIDE_STEPS.map((_, i) => `<i class="${i <= step ? 'is-complete' : ''}"></i>`).join('')}</span></div>
      <h2 tabindex="-1">${title}</h2><p id="desktop-guide-description">${escapeHtml(description)}</p></div>
      <button type="button" class="ui-close" data-guide-exit aria-label="Exit Quick Start"><span aria-hidden="true">×</span></button></div>
      <div class="desktop-guide-actions">${step > 0 ? '<button type="button" data-guide-previous>Previous</button>' : '<button type="button" data-rotate="1">Rotate globe</button>'}<button type="button" class="desktop-primary" data-guide-next>${action}<span aria-hidden="true">→</span></button></div>`;
    prompt.querySelector('h2').focus({ preventScroll: true });
  }
  function advance() {
    if (step === null) return;
    if (step === GUIDE_STEPS.length - 1) return stopGuide(true);
    step++;
    renderGuide();
  }
  function startGuide() {
    cancelReadiness();
    if (step !== null) stopGuide(false);
    welcome.hidden = true; cover(false);
    document.getElementById('desktop-guide-invitation')?.remove();
    reset();
    rootId = null;
    desktopStore.write(DESKTOP_KEYS.guide, 'interrupted');
    step = 0;
    prompt.hidden = false;
    document.body.classList.add('desktop-guide-active');
    renderGuide();
  }
  function stopGuide(completed) {
    const wasActive = step !== null;
    step = null; prompt.hidden = true; clearHighlights();
    document.body.classList.remove('desktop-guide-active'); delete document.body.dataset.guideStep;
    if (completed) {
      desktopStore.write(DESKTOP_KEYS.guide, 'complete');
      const message = document.createElement('div');
      message.className = 'desktop-guide-complete'; message.setAttribute('role', 'status');
      message.innerHTML = '<strong>You’re ready to explore.</strong><span>Keep following connections, or choose Explore for the globe.</span>';
      document.body.append(message); setTimeout(() => message.remove(), 4200);
    } else if (wasActive) desktopStore.write(DESKTOP_KEYS.guide, 'dismissed');
    if (wasActive) {
      const destination = completed ? document.getElementById('console-node-name') : document.getElementById('footer-quick-start');
      (destination?.getClientRects().length ? destination : document.getElementById('footer-btn-explore'))?.focus({ preventScroll: true });
    }
  }
  prompt.addEventListener('click', event => {
    if (event.target.closest('[data-guide-exit]')) { stopGuide(false); return; }
    if (event.target.closest('[data-rotate]')) { getGraph()?.rotateForAccessibility(1); return; }
    if (event.target.closest('[data-guide-previous]') && step > 0) {
      const destination = step - 1;
      // Suspend automatic progression while restoring the previous step's view.
      step = null;
      if (destination === 0) reset();
      else if (rootId && getSelected()?.id !== rootId) selectNode(byId.get(rootId));
      step = destination;
      renderGuide();
      if (destination === 1) document.querySelector('#study-console')?.scrollTo({ top: 0, behavior: reduced() ? 'instant' : 'smooth' });
      return;
    }
    if (!event.target.closest('[data-guide-next]') || step === null) return;
    if (step === 0) selectNode(byId.get('temp') || nodes[0]);
    else if (step === 1) {
      if (!getSelected()) { step = 0; renderGuide(); return; }
      advance();
      document.querySelector('.inspector-relationships-card')?.scrollIntoView({ block: 'start', behavior: reduced() ? 'instant' : 'smooth' });
    } else if (step === 2) {
      const next = suggestedConnection();
      if (next) selectNode(next); else stopGuide(true);
    }
  });
  window.addEventListener('tulip:nodechange', event => {
    const node = event.detail?.node;
    if (!node || step === null) return;
    if (step === 0) { rootId = node.id; step = 1; renderGuide(); }
    else if (step === 2 && node.id !== rootId && edges.some(edge =>
      (edge.source === rootId && edge.target === node.id) || (edge.target === rootId && edge.source === node.id))) stopGuide(true);
    else { rootId = node.id; renderGuide(); }
  });
  window.addEventListener('tulip:modechange', event => {
    if (step === null) return;
    if (event.detail.mode === 'explore') {
      if (step > 0) { step = 0; renderGuide(); }
    } else if (event.detail.mode !== 'study') stopGuide(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && step !== null) { event.preventDefault(); stopGuide(false); }
  });
  document.addEventListener('click', event => {
    if (step !== null && event.target.closest?.('#tulip-score-btn, #sources-tab-btn, #registries-btn, #about-btn, #contact-btn')) stopGuide(false);
  }, true);
  document.getElementById('desktop-quick-start')?.addEventListener('click', startGuide);
  document.getElementById('footer-quick-start')?.addEventListener('click', startGuide);
  document.getElementById('desktop-replay-welcome')?.addEventListener('click', () => {
    desktopStore.write(DESKTOP_KEYS.welcome, { page: 0 }); showWelcome();
  });
  function invitation(interrupted = false) {
    const banner = document.createElement('aside'); banner.id = 'desktop-guide-invitation';
    banner.innerHTML = `<div><strong>${interrupted ? 'Pick up your exploration' : 'A little guidance. A world to discover.'}</strong><p>${interrupted ? 'Restart the short guide, or explore on your own.' : 'Learn the sphere and its connections with Quick Start.'}</p></div><button class="desktop-primary" type="button" data-start>${interrupted ? 'Restart Quick Start' : 'Quick Start'}</button><button type="button" class="ui-close" data-dismiss aria-label="Dismiss Quick Start invitation"><span aria-hidden="true">×</span></button>`;
    document.body.append(banner);
    banner.querySelector('[data-start]').addEventListener('click', startGuide);
    banner.querySelector('[data-dismiss]').addEventListener('click', () => { desktopStore.write(DESKTOP_KEYS.invitation, true); if (interrupted) desktopStore.write(DESKTOP_KEYS.guide, 'dismissed'); banner.remove(); });
  }
  document.body.classList.remove('splash-active');
  const params = new URLSearchParams(location.search);
  const deepLink = (import.meta.env.DEV && params.get('glassReview') === '1') || params.has('node') || params.has('path') || (location.hash && location.hash !== '#explore');
  const saved = desktopStore.read(DESKTOP_KEYS.welcome);
  const guide = desktopStore.read(DESKTOP_KEYS.guide);
  let legacy = false;
  try { legacy = Number(localStorage.getItem('tulip_welcome_splash_visit_count_v2')) > 0; } catch { /* Fresh in-memory visit. */ }
  if (!deepLink && (!saved?.complete && !legacy || params.get('demoSplash') === '1')) {
    showWelcome();
    if (typeof saved?.retryGuide === 'boolean') continueWelcome(saved.retryGuide);
  } else if (!deepLink && guide === 'interrupted') invitation(true);
  else if (!deepLink && (legacy || saved?.complete) && !desktopStore.read(DESKTOP_KEYS.invitation) && guide !== 'complete' && guide !== 'dismissed') invitation();
  return { startGuide, showWelcome };
}
