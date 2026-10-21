import { test, expect } from '@playwright/test';

test('the Earth wordmark holds its position across desktop views', async ({ page }) => {
  await page.goto('/?node=methane', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
  const logo = page.locator('#app-logo');
  const initial = await logo.boundingBox();
  expect(initial).toBeTruthy();
  for (const name of ['explore', 'phenomena', 'personal-footprint']) {
    await page.locator(`#footer-btn-${name}`).click();
    await expect(logo).toBeVisible();
    const rect = await logo.boundingBox();
    expect(rect.x).toBeCloseTo(initial.x, 0);
    expect(rect.y).toBeCloseTo(initial.y, 0);
    expect(rect.width).toBeCloseTo(initial.width, 0);
  }
});

test('the iOS inspector reading sheet has a square full-width photo and shared section names', async ({ page }) => {
  await page.goto('/?node=methane', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
  const photo = page.locator('#console-node-photo');
  await expect(photo).toBeVisible();
  expect(await photo.evaluate(el => getComputedStyle(el).borderRadius)).toBe('0px');
  expect(await photo.locator('img').evaluate(el => getComputedStyle(el).borderRadius)).toBe('0px');
  const sheet = await page.locator('#study-console').boundingBox();
  const image = await photo.boundingBox();
  expect(image.x - sheet.x).toBeLessThanOrEqual(2);
  expect(sheet.width - image.width).toBeLessThanOrEqual(15);
  await expect(page.locator('.human-impact-section .section-header-label')).toHaveText('Human impact');
  await expect(page.locator('.planet-impact-section .section-header-label')).toHaveText('Planet impact');
  await expect(page.locator('.response-section .section-header-label')).toHaveText('Response');
});

test('the inspector header uses the iOS score badge, explanation sheet, and share menu', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: async payload => { window.sharedTopic = payload; } });
  });
  await page.goto('/?node=humanitarian_access_constraints', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Humanitarian Access Constraints');
  await expect(page.locator('#console-urgency-score')).toHaveText('3.0');
  await expect(page.locator('.inspector-overview-card .score-provenance-note')).toHaveCount(0);
  await expect(page.locator('#inspector-share-button')).toBeVisible();
  await expect(page.locator('#copy-view-btn')).toBeHidden();

  await page.locator('#console-urgency-score').click();
  await expect(page.locator('#score-status-explanation')).toBeVisible();
  await expect(page.locator('#score-status-explanation')).toContainText('The calculation');
  await page.locator('#score-status-explanation [data-score-done]').click();
  await expect(page.locator('#score-status-explanation')).toBeHidden();

  await page.locator('#inspector-share-button').click();
  await expect(page.locator('#inspector-share-menu')).toBeVisible();
  await expect(page.locator('#inspector-share-menu [role="menuitem"]')).toHaveText(['Share Link', 'Share PDF', 'Bookmark Topic']);
  await page.getByRole('menuitem', { name: 'Share Link' }).click();
  await expect.poll(() => page.evaluate(() => window.sharedTopic?.url)).toContain('node=humanitarian_access_constraints');

  await page.locator('#inspector-share-button').click();
  await page.getByRole('menuitem', { name: 'Bookmark Topic' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('tulip-desktop-bookmarks-v1') || '[]'))).toContain('humanitarian_access_constraints');
  await page.locator('#inspector-share-button').click();
  await expect(page.getByRole('menuitem', { name: 'Remove Bookmark' })).toBeVisible();
});

test('Share PDF provides a PDF file when native file sharing is unavailable', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  await page.goto('/?node=humanitarian_access_constraints', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Humanitarian Access Constraints');
  await page.locator('#inspector-share-button').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Share PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('tulip-humanitarian-access-constraints.pdf');
});

test('mouse wheel and sphere drag continue moving briefly after input ends', async ({ page }) => {
  await page.goto('/?node=methane', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
  const sheet = page.locator('#study-console');
  const panel = await sheet.boundingBox();
  await page.mouse.move(panel.x + panel.width / 2, panel.y + panel.height / 2);
  await page.mouse.wheel(0, 480);
  const firstScroll = await sheet.evaluate(el => el.scrollTop);
  await expect.poll(() => sheet.evaluate(el => el.scrollTop)).toBeGreaterThan(firstScroll + 40);

  await page.locator('#footer-btn-explore').click();
  const canvas = await page.locator('#graph-canvas').boundingBox();
  await page.mouse.move(canvas.x + canvas.width * .16, canvas.y + canvas.height * .55);
  await page.mouse.down();
  await page.mouse.move(canvas.x + canvas.width * .36, canvas.y + canvas.height * .55, { steps: 12 });
  await page.mouse.up();
  const released = await page.evaluate(() => ({
    rotation: window.graphInstance.rotationY,
    momentum: window.graphInstance.touchMomentum?.kind
  }));
  expect(released.momentum).toBe('sphere');
  await expect.poll(() => page.evaluate(() => window.graphInstance.rotationY)).toBeGreaterThan(released.rotation + .05);
});
