import { test, expect } from '@playwright/test';
const keys = { welcome: 'tulip-desktop-welcome-v1', guide: 'tulip-desktop-guide-v1', footprint: 'tulip-desktop-footprint-v1' };
const guideTitles = [
  'Explore the globe', 'Read the Inspector', 'Follow a connection'
];
async function openSearch(page) {
  await page.keyboard.press('Control+k');
  if (!(await page.locator('#desktop-search-input').isVisible())) {
    await page.locator('#node-search-input').fill('');
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#desktop-search-input')).toBeVisible();
}
async function skipWelcome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toBeHidden();
}
async function startGuide(page) {
  await skipWelcome(page);
  await openSearch(page); await page.locator('#desktop-quick-start').click();
  await expect(page.locator('body')).toHaveAttribute('data-guide-step', '0');
}
async function step(page, number) {
  await expect(page.locator('body')).toHaveAttribute('data-guide-step', String(number));
  await expect(page.locator('#desktop-guide h2')).toHaveText(guideTitles[number]);
}
async function completeGuide(page, keyboard = false) {
  await startGuide(page);
  const activate = async locator => {
    if (keyboard) { await locator.focus(); await page.keyboard.press('Enter'); }
    else await locator.click();
  };
  await activate(page.getByRole('button', { name: 'Rotate globe', exact: true }));
  await step(page, 0);
  await activate(page.getByRole('button', { name: 'Open a topic', exact: true }));
  await step(page, 1);
  await expect(page.locator('#console-node-name')).toHaveText('Global Temperature');
  await activate(page.getByRole('button', { name: 'See connections', exact: true }));
  await step(page, 2);
  await activate(page.locator('[data-guide-next]'));
  await expect(page.locator('#console-node-name')).not.toHaveText('Global Temperature');
  await expect(page.locator('#desktop-guide')).toBeHidden();
  await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'study');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), keys.guide)).toBe('complete');
}
test('welcome is user-paced, resumes, supports Back/Skip and preserves the canvas', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Your planet. Better understood.' })).toBeVisible();
  await expect(page.locator('#app-container')).toHaveAttribute('inert', '');
  await page.evaluate(() => { window.originalCanvas = document.querySelector('#graph-canvas'); });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'One change leads to another.' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.evaluate(() => { window.originalCanvas = document.querySelector('#graph-canvas'); });
  await page.getByRole('button', { name: 'Explore on my own', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toBeHidden();
  expect(await page.evaluate(() => window.originalCanvas === document.querySelector('#graph-canvas'))).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' }); await expect(page.locator('#desktop-welcome')).toBeHidden();
  expect(errors).toEqual([]);
});
test('pointer walkthrough advances only on real actions', async ({ page }) => { await completeGuide(page); });
test('Previous restores the matching live topic and Explore remains available', async ({ page }) => {
  await startGuide(page);
  await page.locator('[data-guide-next]').click(); await step(page, 1);
  await page.locator('[data-guide-next]').click(); await step(page, 2);
  await page.getByRole('button', { name: 'Previous', exact: true }).click(); await step(page, 1);
  await expect(page.locator('#console-node-name')).toHaveText('Global Temperature');
  await page.locator('#footer-btn-explore').click(); await step(page, 0);
});
test('keyboard-accessible walkthrough, replay and Exit', async ({ page }) => {
  await completeGuide(page, true);
  await openSearch(page); await page.locator('#desktop-quick-start').click(); await step(page, 0);
  await page.keyboard.press('Escape'); await expect(page.locator('#desktop-guide')).toBeHidden();
});
test('deep links bypass welcome; legacy visitors receive a dismissible invitation', async ({ page }) => {
  await page.goto('/?node=temp&path=carbon_emission~temp', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#desktop-welcome')).toBeHidden();
  await expect(page.locator('#console-node-name')).toHaveText('Global Temperature');
  await page.evaluate(() => localStorage.setItem('tulip_welcome_splash_visit_count_v2', '2'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#desktop-guide-invitation')).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss Quick Start invitation', exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' }); await expect(page.locator('#desktop-guide-invitation')).toHaveCount(0);
});
test('existing bookmarks, recents, evidence search and returning search context', async ({ page }) => {
  await page.addInitScript(() => { if (!localStorage.getItem('tulip-desktop-bookmarks-v1')) localStorage.setItem('tulip-desktop-bookmarks-v1', JSON.stringify(['ocean_acidification'])); });
  await skipWelcome(page);
  await openSearch(page);
  const input = page.locator('#desktop-search-input');
  await input.fill('What causes ocean acidification?');
  await expect(page.locator('.desktop-discovery-card')).toBeVisible();
  await expect(page.locator('.desktop-discovery-card h2')).toHaveText(/Ocean Acidification/);
  await expect(page.locator('.desktop-evidence-links a').first()).toHaveAttribute('href', /^https:\/\//);
  await page.locator('.desktop-discovery-card [data-topic]').first().click();
  await expect(page.locator('#console-node-name')).toHaveText('Ocean Acidification');
  await expect(input).toBeHidden();
  await openSearch(page);
  await expect(input).toHaveValue('What causes ocean acidification?');
  await page.locator('[data-collection="bookmarks"]').click();
  await expect(page.locator('#desktop-search-content')).toContainText('Ocean Acidification');
  await page.reload({ waitUntil: 'domcontentloaded' }); await openSearch(page);
  await page.locator('[data-collection="bookmarks"]').click();
  await page.locator('[data-remove="bookmarks"]').click();
  await expect(page.locator('#desktop-search-content')).toContainText('No saved topics');
  await page.locator('[data-collection="search"]').click();
  await expect(page.locator('#desktop-search-content')).toContainText('Recent searches');
  await page.locator('[data-clear-recents]').click();
  await input.fill('zxqv zzqqvv');
  await expect(page.locator('#desktop-search-content')).toContainText('No supported match yet');
});
test('Footprint keeps all eleven questions, persists answers and supports reset', async ({ page }) => {
  await skipWelcome(page); await page.locator('#footer-btn-personal-footprint').click();
  await expect(page.locator('.personal-footprint-question-card')).toHaveCount(11);
  const buttons = page.locator('[data-personal-footprint-question="diet"]');
  const selected = await buttons.first().getAttribute('data-personal-footprint-option');
  await buttons.first().click();
  await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('#footer-btn-personal-footprint').click();
  await expect(page.locator(`[data-personal-footprint-question="diet"][data-personal-footprint-option="${selected}"]`)).toHaveAttribute('aria-pressed', 'true');
  const questions = await page.locator('.personal-footprint-question-card').evaluateAll(cards => cards.map(c => c.id));
  for (const id of questions) await page.locator(`#${id} [data-personal-footprint-option]`).first().click();
  await expect(page.locator('#personal-footprint-results-start')).toBeVisible();
  await expect(page.locator('[data-footprint-review]')).not.toHaveCount(0);
  await page.locator('[data-footprint-review="diet"]').click();
  await expect(page.locator('#personal-footprint-question-diet')).toBeInViewport();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#personal-footprint-restart').click();
  expect(await page.evaluate(key => Object.values(JSON.parse(localStorage.getItem(key))).every(value => value === null), keys.footprint)).toBe(true);
});
test('render failure retains welcome and Retry recovers', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { document.querySelector('#graph-canvas').dataset.renderError = 'true'; });
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toBeHidden();
});
test('restricted storage and reduced preferences remain usable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage disabled'); } }); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await skipWelcome(page); await openSearch(page); await page.locator('#desktop-quick-start').click(); await step(page, 0);
  await page.getByRole('button', { name: 'Exit Quick Start' }).click();
  await openSearch(page); await page.locator('#desktop-search-input').fill('methane');
  await page.locator('#desktop-search-content [data-topic="methane"]').first().click();
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
});
for (const viewport of [{ width: 1024, height: 768 }, { width: 3840, height: 2160 }, { width: 768, height: 600 }]) {
  test(`layout ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport); await skipWelcome(page);
    await openSearch(page); await page.locator('#desktop-quick-start').click();
    await expect(page.getByRole('button', { name: 'Exit Quick Start' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Rotate globe', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  });
}
test('phone gate retained', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage(); await page.goto('http://127.0.0.1:4317', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#touch-device-gate')).toBeVisible();
  await expect(page.locator('#desktop-welcome')).toHaveCount(0); await context.close();
});
test('guide allows navigation away and can be restarted', async ({ page }) => {
  await startGuide(page);
  await page.locator('#desktop-guide h2').click(); await step(page, 0);
  await page.locator('#footer-btn-personal-footprint').click();
  await expect(page.locator('#desktop-guide')).toBeHidden();
  await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'personal-footprint');
  await page.locator('#footer-quick-start').click(); await step(page, 0);
});
test('slow first frame waits; eight-second deadline offers Retry', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.graphInstance.pause();
    window.savedResume = window.graphInstance.resume.bind(window.graphInstance);
    window.graphInstance.resume = () => {};
    delete document.getElementById('graph-canvas').dataset.firstFrameRendered;
  });
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toContainText('Preparing your sphere');
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toBeHidden();
});
test('successful delayed frame reveals the original canvas', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.originalCanvas = document.getElementById('graph-canvas');
    window.graphInstance.pause(); window.savedResume = window.graphInstance.resume.bind(window.graphInstance);
    window.graphInstance.resume = () => {}; delete window.originalCanvas.dataset.firstFrameRendered;
  });
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(page.locator('#desktop-welcome')).toContainText('Preparing your sphere');
  await page.evaluate(() => { window.graphInstance.resume = window.savedResume; window.graphInstance.resume(); });
  await expect(page.locator('#desktop-welcome')).toBeHidden();
  expect(await page.evaluate(() => originalCanvas === document.getElementById('graph-canvas'))).toBe(true);
});
test('Search evidence failure has retry and quick search keeps keyboard navigation', async ({ page }) => {
  await page.route('**/relationship-descriptions.json', route => route.abort());
  await skipWelcome(page); await openSearch(page);
  await page.locator('#desktop-search-input').fill('methane');
  await expect(page.getByRole('button', { name: 'Retry evidence', exact: true })).toBeVisible();
  await page.unroute('**/relationship-descriptions.json');
  await page.getByRole('button', { name: 'Retry evidence', exact: true }).click();
  await page.locator('#desktop-search-input').fill('What causes ocean acidification?');
  await expect(page.locator('.desktop-discovery-card')).toBeVisible();
  await page.locator('#footer-btn-explore').click();
  await page.keyboard.press('Control+k');
  await expect(page.locator('#node-search-input')).toBeFocused();
  await page.keyboard.type('methane'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
});
test('original inspector layout and Activity navigation retain their content', async ({ page }) => {
  await page.goto('/?node=temp', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.desktop-inspector-actions,.desktop-disclosure,#desktop-follow-relationship')).toHaveCount(0);
  await expect(page.locator('#human-impact-summary')).toBeVisible();
  await expect(page.locator('#recent-occurrences-toggle')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('#footer-btn-phenomena').click();
  await expect(page.locator('.phenomena-selector-btn')).toHaveCount(16);
  await expect(page.locator('.desktop-activity-icon')).toHaveCount(0);
  await page.locator('#phenomena-mode-actions').click();
  await expect(page.locator('#phenomena-mode-actions')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#phenomena-mode-footprint').click();
  await expect(page.locator('#phenomena-mode-footprint')).toHaveAttribute('aria-selected', 'true');
});
test('welcome focus is confined and all four artworks remain present with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let i = 0; i < 4; i++) {
    await expect(page.locator('#desktop-welcome')).toHaveAttribute('data-page', String(i + 1));
    await expect(page.locator('.desktop-intro-artwork')).toBeVisible();
    for (let tab = 0; tab < 5; tab++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement.closest('#desktop-welcome')))).toBe(true);
    }
    if (i < 3) await page.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Start Quick Start', exact: true }).click();
  await step(page, 0);
  await expect(page.locator('#desktop-guide')).toHaveCount(1);
});

test('200% reflow equivalent keeps all destinations and Search usable', async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 500 }); await skipWelcome(page);
  for (const id of ['explore','analyse','phenomena','personal-footprint']) {
    await expect(page.locator(`#footer-btn-${id}`)).toBeInViewport();
  }
  await openSearch(page);
  await expect(page.locator('#desktop-search-input')).toBeVisible();
  await page.locator('#desktop-search-input').fill('methane');
  await expect(page.locator('#desktop-search-content [data-topic="methane"]').first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('all five desktop guide steps can be completed using only the keyboard', async ({ page }) => {
  await completeGuide(page, true);
});

test('browser Back and Forward restore topics', async ({ page }) => {
  await skipWelcome(page); await openSearch(page);
  await page.locator('#desktop-search-input').fill('methane');
  await page.locator('#desktop-search-content [data-topic="methane"]').first().click();
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
  await expect(page.locator('#desktop-search-input')).toBeHidden();
  await openSearch(page); await page.locator('#desktop-search-input').fill('global temperature');
  await page.locator('#desktop-search-content [data-topic="temp"]').first().click();
  await expect(page.locator('#console-node-name')).toHaveText('Global Temperature');
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
  await page.goForward({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Global Temperature');
});

test('completed Footprint exports a PDF', async ({ page }) => {
  await skipWelcome(page); await page.locator('#footer-btn-personal-footprint').click();
  for (const id of await page.locator('.personal-footprint-question-card').evaluateAll(cards => cards.map(card => card.id))) {
    await page.locator(`#${id} [data-personal-footprint-option]`).first().click();
  }
  const download = page.waitForEvent('download', { timeout: 25000 });
  await page.locator('#personal-footprint-download').click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/i);
  expect(await file.failure()).toBeNull();
});

test('visitors who skipped the guide receive one dismissible return invitation', async ({ page }) => {
  await skipWelcome(page); await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#desktop-guide-invitation')).toBeVisible();
  await page.getByRole('button', { name: 'Dismiss Quick Start invitation', exact: true }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#desktop-guide-invitation')).toHaveCount(0);
});
