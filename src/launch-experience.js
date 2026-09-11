import './launch-experience.css';
import { escapeHtml } from './security.js';

function normalizeText(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function classifySourceReach(copy = '') {
  const normalized = copy.toLowerCase();
  if (normalized.includes('global')) return 'global';
  if (/(basin|himalaya|asia|pacific|asean|regional|europe|africa|south asia|southeast asia)/.test(normalized)) return 'regional';
  return 'national';
}

function classifySourceType(copy = '') {
  const normalized = copy.toLowerCase();
  if (/\bapi\b/.test(normalized)) return 'api';
  if (/(dataset|database|data portal|observator|monitor|telemetry|timeseries|tracker|satellite|maps|catalog|records|indices|indexes|index)/.test(normalized)) return 'data';
  return 'reference';
}

function classifySourceRecency(copy = '') {
  const normalized = copy.toLowerCase();
  if (/(real-time|monitor|telemetry|timeseries|tracker|hotspot|alert)/.test(normalized)) return 'live';
  if (/\b(19|20)\d{2}\b/.test(normalized)) return 'dated';
  return 'unstated';
}

function dispatchEscape() {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

function installVisibleCloseButton(overlay, label) {
  if (!overlay || overlay.querySelector(':scope > .launch-overlay-close')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'launch-overlay-close';
  button.setAttribute('aria-label', `Close ${label}`);
  button.innerHTML = '<span aria-hidden="true">×</span><span>Close</span>';
  button.addEventListener('click', dispatchEscape);
  overlay.prepend(button);
}

function installLiveRegion() {
  if (document.getElementById('launch-experience-live')) return;
  const live = document.createElement('div');
  live.id = 'launch-experience-live';
  live.className = 'launch-sr-only';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  document.body.appendChild(live);
}

function announce(message) {
  const live = document.getElementById('launch-experience-live');
  if (!live) return;
  live.textContent = '';
  window.requestAnimationFrame(() => { live.textContent = message; });
}

function installSourceDirectory() {
  const overlay = document.getElementById('sources-view');
  const layout = overlay?.querySelector('.sources-list-layout');
  const heading = overlay?.querySelector('.sources-detail-heading h3');
  const description = overlay?.querySelector('.sources-detail-heading p');
  if (!overlay || !layout || document.getElementById('source-directory-controls')) return;

  if (heading) heading.textContent = 'Featured source directory';
  if (description) description.textContent = 'A curated launch directory of major data surfaces. Node and relationship cards link to the larger, item-level evidence registry.';

  const controls = document.createElement('section');
  controls.id = 'source-directory-controls';
  controls.className = 'source-directory-controls';
  controls.setAttribute('aria-label', 'Filter featured sources');
  controls.innerHTML = `
    <label class="source-search-field"><span>Search</span><input id="source-directory-search" type="search" placeholder="Organization, dataset, or place" /></label>
    <label><span>System</span><select id="source-directory-system"><option value="all">All systems</option></select></label>
    <label><span>Geography</span><select id="source-directory-reach"><option value="all">All geographies</option><option value="global">Global</option><option value="regional">Regional</option><option value="national">National / reference</option></select></label>
    <label><span>Source type</span><select id="source-directory-type"><option value="all">All source types</option><option value="api">Named API</option><option value="data">Data or monitoring portal</option><option value="reference">Research / policy reference</option></select></label>
    <label><span>Recency</span><select id="source-directory-recency"><option value="all">Any update pattern</option><option value="live">Live / regularly updated</option><option value="dated">Dated publication</option><option value="unstated">Not stated</option></select></label>
    <button id="source-directory-reset" type="button">Reset</button>
    <p id="source-directory-status" role="status" aria-live="polite"></p>
  `;
  overlay.querySelector('.sources-content-container')?.prepend(controls);

  const systemSelect = controls.querySelector('#source-directory-system');
  const sourceItems = [];
  [...layout.querySelectorAll('.sources-list-column')].forEach((column, columnIndex) => {
    const system = normalizeText(column.querySelector('.sources-category-title')?.textContent) || `System ${columnIndex + 1}`;
    const option = document.createElement('option');
    option.value = String(columnIndex);
    option.textContent = system;
    systemSelect.appendChild(option);
    [...column.querySelectorAll('.sources-list > li')].forEach(item => {
      const copy = normalizeText(item.textContent);
      const geography = normalizeText(item.querySelector('.sources-list-desc strong')?.textContent);
      const metadata = {
        item,
        column,
        system: String(columnIndex),
        search: `${system} ${copy}`.toLowerCase(),
        reach: classifySourceReach(geography),
        type: classifySourceType(copy),
        recency: classifySourceRecency(copy)
      };
      item.dataset.sourceReach = metadata.reach;
      item.dataset.sourceType = metadata.type;
      item.dataset.sourceRecency = metadata.recency;
      sourceItems.push(metadata);
    });
  });

  const search = controls.querySelector('#source-directory-search');
  const reach = controls.querySelector('#source-directory-reach');
  const type = controls.querySelector('#source-directory-type');
  const recency = controls.querySelector('#source-directory-recency');
  const status = controls.querySelector('#source-directory-status');

  const applyFilters = () => {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    sourceItems.forEach(source => {
      const matches = (!query || source.search.includes(query))
        && (systemSelect.value === 'all' || source.system === systemSelect.value)
        && (reach.value === 'all' || source.reach === reach.value)
        && (type.value === 'all' || source.type === type.value)
        && (recency.value === 'all' || source.recency === recency.value);
      source.item.hidden = !matches;
      if (matches) visible += 1;
    });
    [...layout.querySelectorAll('.sources-list-column')].forEach(column => {
      column.hidden = !column.querySelector('.sources-list > li:not([hidden])');
    });
    status.textContent = `${visible} of ${sourceItems.length} featured sources shown`;
  };
  [search, systemSelect, reach, type, recency].forEach(control => control.addEventListener('input', applyFilters));
  controls.querySelector('#source-directory-reset')?.addEventListener('click', () => {
    search.value = '';
    systemSelect.value = 'all';
    reach.value = 'all';
    type.value = 'all';
    recency.value = 'all';
    applyFilters();
    search.focus();
  });

  const applyKpiFilter = kind => {
    search.value = '';
    systemSelect.value = 'all';
    reach.value = kind === 'global' ? 'global' : 'all';
    type.value = kind === 'data' ? 'data' : 'all';
    recency.value = 'all';
    applyFilters();
    controls.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  [...overlay.querySelectorAll('.registry-kpi-card')].forEach((card, index) => {
    const kind = index === 2 ? 'global' : index === 3 ? 'data' : 'all';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `${normalizeText(card.textContent)}. Filter the featured directory.`);
    const activate = () => applyKpiFilter(kind);
    card.addEventListener('click', activate);
    card.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      activate();
    });
  });
  applyFilters();
}

function installScoreGuide() {
  const overlay = document.getElementById('tulip-score-popup');
  const card = overlay?.querySelector('.tulip-score-card');
  const overview = card?.querySelector('.tulip-score-overview');
  const sections = card ? [...card.querySelectorAll('.tulip-score-section')] : [];
  if (!overlay || !card || !overview || !sections.length || document.getElementById('score-contents-nav')) return;

  overview.id = 'score-guide-overview';
  const nav = document.createElement('nav');
  nav.id = 'score-contents-nav';
  nav.className = 'score-contents-nav';
  nav.setAttribute('aria-label', 'TULIP Score contents');
  const steps = [
    ['Overview', overview],
    ['1 · Evidence', sections[0]],
    ['2 · Normalize', sections[1]],
    ['3 · Calculate', sections[2]],
    ['4 · Read score', sections[3]]
  ];
  steps.forEach(([label, section], index) => {
    section.id ||= `score-guide-step-${index}`;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => section.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    nav.appendChild(button);
  });
  overview.before(nav);

  sections.forEach((section, index) => {
    if (![1, 2, 4].includes(index)) return;
    const heading = section.querySelector(':scope > .tulip-score-section-heading');
    const content = [...section.children].filter(child => child !== heading);
    if (!content.length) return;
    const details = document.createElement('details');
    details.className = 'score-technical-details';
    const summary = document.createElement('summary');
    summary.textContent = index === 4 ? 'Show complete examples' : 'Show technical detail';
    details.appendChild(summary);
    content.forEach(child => details.appendChild(child));
    section.appendChild(details);
  });
}

function installActivityMetadata() {
  const lensCard = document.querySelector('#phenomenon-lens-panel .phenomenon-lens-card');
  if (!lensCard || document.getElementById('activity-source-status')) return;

  const sourceStatus = document.createElement('div');
  sourceStatus.id = 'activity-source-status';
  sourceStatus.className = 'activity-source-status';
  sourceStatus.setAttribute('aria-live', 'polite');
  document.getElementById('phenomenon-lens-source')?.before(sourceStatus);

  const updateActivityMeta = () => window.requestAnimationFrame(() => {
    const forecast = Boolean(document.querySelector('#phenomenon-lens-rows .phenomenon-row.is-speculative'));
    sourceStatus.textContent = forecast
      ? 'Scenario range · forecast or modeled outlook'
      : 'Observed or reference comparison';
    sourceStatus.classList.toggle('is-forecast', forecast);
  });
  window.addEventListener('tulip:phenomenonchange', updateActivityMeta);
  updateActivityMeta();
}

function installMobileUtilities() {
  const filterBar = document.getElementById('filter-bar');
  if (!filterBar || document.getElementById('mobile-launch-utilities')) return;
  const utilities = document.createElement('nav');
  utilities.id = 'mobile-launch-utilities';
  utilities.className = 'mobile-launch-utilities';
  utilities.setAttribute('aria-label', 'TULIP information');
  utilities.innerHTML = `
    <span>INFORMATION</span>
    <button type="button" data-mobile-launch-target="tulip-score-btn">TULIP Score</button>
    <button type="button" data-mobile-launch-target="sources-tab-btn">Sources</button>
    <button type="button" data-mobile-launch-target="registries-btn">Registries</button>
    <button type="button" data-mobile-launch-target="about-btn">About TULIP</button>
  `;
  filterBar.appendChild(utilities);
  utilities.addEventListener('click', event => {
    const button = event.target.closest('[data-mobile-launch-target]');
    if (!button) return;
    document.body.classList.remove('mobile-filters-open');
    const mobileMore = document.getElementById('mobile-more-btn');
    mobileMore?.setAttribute('aria-expanded', 'false');
    mobileMore?.setAttribute('aria-label', 'Open filters');
    document.getElementById(button.dataset.mobileLaunchTarget)?.click();
  });
}

export function initializeLaunchExperience() {
  installLiveRegion();
  installSourceDirectory();
  installScoreGuide();
  installActivityMetadata();
  installMobileUtilities();

  [
    ['sources-view', 'Data Sources'],
    ['registries-dashboard', 'Environmental Registries'],
    ['tulip-score-popup', 'TULIP Score'],
    ['about-popup', 'About TULIP'],
    ['contact-popup', 'Contact']
  ].forEach(([id, label]) => installVisibleCloseButton(document.getElementById(id), label));

  window.addEventListener('tulip:nodechange', event => {
    const node = event.detail?.node;
    if (node) announce(`${node.name} selected. Snapshot is ready at the top of the analysis panel.`);
  });
}
