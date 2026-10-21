import { test, expect } from '@playwright/test';

test.setTimeout(60000);
test.use({ video: { mode: 'on', size: { width: 1440, height: 1000 } } });

async function start(page, node = 'temp') {
  await page.goto(`/?node=${node}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'study');
  await expect.poll(() => page.evaluate(() => !!window.graphInstance?.selectedNode)).toBe(true);
  await settle(page);
}
async function settle(page) {
  await expect.poll(() => page.evaluate(() => !window.graphInstance.targetCamera && !window.graphInstance.needsCentering), { timeout: 15000 }).toBe(true);
}
async function topic(page, query, id) {
  await page.keyboard.press('Control+k');
  if (!(await page.locator('#desktop-search-input').isVisible())) {
    await page.locator('#node-search-input').fill('');
    await page.keyboard.press('Enter');
  }
  await page.locator('#desktop-search-input').fill(query);
  await page.locator(`#desktop-search-content [data-topic="${id}"]`).first().click();
  await expect.poll(() => page.evaluate(() => window.graphInstance.selectedNode.id)).toBe(id);
  await settle(page);
}
async function view(page) {
  return page.evaluate(() => ({ graph: window.graphInstance.captureViewState(), scroll: document.querySelector('#study-console').scrollTop,
    technical: document.querySelector('#monitoring-technical-details')?.open || false,
    monitoring: document.querySelector('#monitoring-source-toggle').getAttribute('aria-expanded'),
    recent: document.querySelector('#recent-occurrences-toggle').getAttribute('aria-expanded') }));
}
async function customize(page, layout, offset = 0) {
  await page.locator(`#layout-toggle-${layout}`).click();
  await settle(page);
  await page.locator('#analyze-show-more-btn').click();
  await settle(page);
  const picker = page.locator('#relationship-effect-select');
  await picker.selectOption(await picker.locator('option').nth(1).getAttribute('value'));
  await page.locator('#monitoring-source-toggle').click();
  await page.waitForTimeout(700);
  const technical = page.locator('#monitoring-technical-details summary');
  if (await technical.count()) await technical.click();
  // Use a deterministic non-default camera to assert exact state rather than incidental animation.
  await page.evaluate(offset => {
    const g = window.graphInstance;
    // Keep this synthetic camera fixture in the normal desktop viewport after
    // Playwright scrolls distant inspector controls into view.
    for (let ancestor = g.canvas.parentElement; ancestor; ancestor = ancestor.parentElement) ancestor.scrollLeft = 0;
    g.needsCentering = false; g.targetCamera = null;
    g.rotationX += .12 + offset; g.rotationY -= .14;
    g.camera.zoom *= .9; g.camera.x += 17 + offset; g.camera.y -= 13;
    g.requestRender();
    document.querySelector('#study-console').scrollTop = 460 + offset;
  }, offset);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return view(page);
}
async function restored(page, expected) {
  await expect.poll(async () => (await view(page)).graph.nodeId).toBe(expected.graph.nodeId);
  await expect.poll(async () => (await view(page)).graph.layoutMode).toBe(expected.graph.layoutMode);
  await expect.poll(async () => (await view(page)).graph.selectedEdgeKey).toBe(expected.graph.selectedEdgeKey);
  await expect.poll(async () => (await view(page)).graph.rotationX).toBeCloseTo(expected.graph.rotationX, 3);
  await expect.poll(async () => {
    const g = (await view(page)).graph;
    return (g.camera.x - g.width / 2) / Math.min(g.width, g.height);
  }).toBeCloseTo((expected.graph.camera.x - expected.graph.width / 2) / Math.min(expected.graph.width, expected.graph.height), 4);
  const actual = await view(page);
  // Browser/CSS scaling can change the canvas's logical bounds between visits.
  // The same world location must retain its relative position in those bounds.
  const size = graph => Math.min(graph.width, graph.height);
  for (const axis of ['x', 'y']) {
    const dimension = axis === 'x' ? 'width' : 'height';
    expect((actual.graph.camera[axis] - actual.graph[dimension] / 2) / size(actual.graph))
      .toBeCloseTo((expected.graph.camera[axis] - expected.graph[dimension] / 2) / size(expected.graph), 4);
  }
  const zoom = graph => graph.camera.zoom / (graph.layoutMode === 'tree' ? size(graph) : 1);
  expect(zoom(actual.graph)).toBeCloseTo(zoom(expected.graph), 4);
  expect(actual.graph.rotationX).toBeCloseTo(expected.graph.rotationX, 3);
  expect(actual.graph.rotationY).toBeCloseTo(expected.graph.rotationY, 3);
  expect(actual.graph.selectedEdgeKey).toBe(expected.graph.selectedEdgeKey);
  expect(actual.graph.showAllAnalyzeConnections).toBe(expected.graph.showAllAnalyzeConnections);
  expect(actual.monitoring).toBe(expected.monitoring);
  expect(actual.technical).toBe(expected.technical);
  expect(actual.recent).toBe(expected.recent);
  // WebKit rounds fractional scroll offsets to whole CSS pixels.
  expect(Math.abs(actual.scroll - expected.scroll)).toBeLessThanOrEqual(2);
  await expect.poll(() => page.evaluate(() => !window.graphInstance.pendingFocusSwap && window.graphInstance.analyzeRevealState.size === 0)).toBe(true);
}

for (const layout of ['network', 'tree']) {
  test(`${layout}: three-topic Back/Forward and history picker restore each visit`, async ({ page }, testInfo) => {
    await start(page);
    const a = await customize(page, layout);
    await page.screenshot({ path: testInfo.outputPath('before-following.png') });
    await topic(page, 'methane', 'methane');
    const b = await customize(page, layout, 30);
    await topic(page, 'ocean acidification', 'ocean_acidification');
    const c = await view(page);
    await page.locator('#focus-step-back-btn').click();
    await restored(page, b);
    await page.goBack(); await restored(page, a);
    await page.screenshot({ path: testInfo.outputPath('after-returning.png') });
    await page.goForward(); await restored(page, b);
    await page.goForward(); await restored(page, c);
    await page.locator('#study-journey-toggle').click();
    await page.locator('#focus-history-tree .history-step').first().click();
    await restored(page, a);
    await page.locator('#footer-btn-explore').click();
    await expect(page.locator('#app-container')).toHaveAttribute('data-view-mode', 'explore');
    expect(await page.evaluate(() => window.graphInstance.selectedNode)).toBeNull();
    await page.goBack();
    await restored(page, a);
    await expect(page.locator('#footer-btn-analyse')).toHaveClass(/active/);
  });
}

test('repeated topic visits retain independent context and same-topic selection is a no-op', async ({ page }) => {
  await start(page);
  const first = await customize(page, 'network');
  await topic(page, 'methane', 'methane');
  await topic(page, 'global temperature', 'temp');
  const second = await customize(page, 'tree', 60);
  await topic(page, 'global temperature', 'temp');
  await restored(page, second);
  await page.goBack(); await page.goBack(); await restored(page, first);
  await page.goForward(); await page.goForward(); await restored(page, second);
});

test('relationship inspection preserves framing and keyboard focus, revealing only offscreen edges', async ({ page }) => {
  await start(page);
  await page.locator('#layout-toggle-tree').click(); await settle(page);
  const picker = page.locator('#relationship-effect-select');
  const key = await picker.locator('option').nth(1).getAttribute('value');
  await picker.selectOption(key);
  await page.evaluate(() => { const g = window.graphInstance; g.camera.zoom = .1; g.camera.x = g.width / 2; g.camera.y = g.height / 2; g.requestRender(); });
  const before = await view(page);
  await picker.focus();
  await picker.selectOption(''); await picker.selectOption(key);
  await expect(picker).toBeFocused();
  const after = await view(page);
  expect(after.graph.camera).toEqual(before.graph.camera);
  expect(after.graph.rotationX).toBe(before.graph.rotationX);
  expect(after.graph.rotationY).toBe(before.graph.rotationY);
  await expect(page.locator('#connection-detail-reason')).toHaveAttribute('aria-live', 'polite');
  await page.evaluate(() => { const g = window.graphInstance; g.camera.x -= 3000; g.requestRender(); });
  await picker.selectOption(''); await picker.selectOption(key);
  expect((await view(page)).graph.camera.zoom).toBe(before.graph.camera.zoom);
  const inside = await page.evaluate(() => {
    const g = window.graphInstance, positions = g.getTreeLayout(g.selectedNode).positions;
    return [g.selectedEdge.source, g.selectedEdge.target].every(id => {
      const p = g.worldToScreen(positions[id].x, positions[id].y);
      return p.x >= 39 && p.x <= g.width - 39 && p.y >= 39 && p.y <= g.height - 39;
    });
  });
  expect(inside).toBe(true);
});

test('resize and invalid legacy context preserve a usable topic', async ({ page }) => {
  await start(page);
  const original = await customize(page, 'tree');
  await topic(page, 'methane', 'methane');
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goBack();
  await expect.poll(async () => (await view(page)).graph.rotationX).toBeCloseTo(original.graph.rotationX, 3);
  expect((await view(page)).graph.layoutMode).toBe('tree');
  expect((await view(page)).scroll).toBeGreaterThan(0);
  await page.evaluate(() => {
    history.replaceState({ tulipNavigation: { version: 1, pathIds: ['temp'], depth: 0 } }, '');
    history.pushState({ tulipNavigation: { version: 1, pathIds: ['methane'], depth: 1 } }, '', '?node=methane');
  });
  await page.goBack();
  await expect(page.locator('#console-node-name')).toHaveText('Global Temperature');
  const valid = await page.evaluate(() => {
    const g = window.graphInstance;
    const old = g.captureViewState();
    return !g.restoreViewState({ ...old, camera: { ...old.camera, zoom: -1 } }) &&
      !g.restoreViewState({ ...old, nodeId: 'missing' }) &&
      !g.restoreViewState({ ...old, width: 1e-300 }) &&
      !g.restoreViewState({ ...old, camera: { ...old.camera, x: NaN } }) && Number.isFinite(g.camera.zoom);
  });
  expect(valid).toBe(true);
});

test('late evidence and rapid navigation never override a new interaction', async ({ page }) => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route('**/runtime-node-details.json', async route => { await gate; await route.continue(); });
  await start(page);
  const original = await customize(page, 'network');
  await topic(page, 'methane', 'methane');
  await page.goBack();
  await restored(page, original);
  // A real wheel input cancels restoration while the evidence request is outstanding.
  await page.locator('#study-console').hover();
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(150);
  const reading = await page.evaluate(() => {
    const inspector = document.querySelector('#study-console'), bounds = inspector.getBoundingClientRect();
    const element = [...inspector.querySelectorAll('[id]')].find(el => el.getClientRects().length && el.getBoundingClientRect().bottom > bounds.top);
    return { id: element.id, offset: element.getBoundingClientRect().top - bounds.top };
  });
  const response = page.waitForResponse('**/runtime-node-details.json');
  release();
  await response;
  await page.waitForTimeout(150);
  const offset = await page.evaluate(id => document.getElementById(id).getBoundingClientRect().top - document.querySelector('#study-console').getBoundingClientRect().top, reading.id);
  expect(Math.abs(offset - reading.offset)).toBeLessThan(3);
  expect((await view(page)).scroll).toBeGreaterThan(original.scroll + 100);
  await page.goForward(); await page.goBack(); await page.goForward();
  await expect(page.locator('#console-node-name')).toHaveText('Methane Emissions');
  await settle(page);
});

test('canvas topic clicks capture the outgoing view before the graph changes it', async ({ page }) => {
  await start(page);
  await page.locator('#layout-toggle-tree').click();
  await settle(page);
  await page.evaluate(() => { document.querySelector('#study-console').scrollTop = 320; });
  const original = await view(page);
  const target = await page.evaluate(() => {
    const g = window.graphInstance, rect = g.canvas.getBoundingClientRect();
    for (const node of g.nodes) {
      if (node.id === g.selectedNode.id) continue;
      const point = g.worldToScreen(node.x, node.y);
      if (point.x < 50 || point.y < 100 || point.x > g.width - 50 || point.y > g.height - 50) continue;
      if (g.findBestHitNode(point)?.id !== node.id) continue;
      const x = rect.left + point.x * g.uiScale, y = rect.top + point.y * g.uiScale;
      if (document.elementFromPoint(x, y) !== g.canvas) continue;
      return { id: node.id, x, y };
    }
  });
  expect(target).toBeTruthy();
  await page.mouse.click(target.x, target.y);
  await expect.poll(() => page.evaluate(() => window.graphInstance.selectedNode.id)).toBe(target.id);
  await expect(page.locator('#focus-step-back-btn')).toBeEnabled();
  await page.locator('#focus-step-back-btn').click();
  await restored(page, original);
});

test('failed evidence and reduced motion still allow relationship reading and returning', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/runtime-node-details.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await page.route('**/relationship-descriptions.json', route => route.fulfill({ status: 503, body: 'Unavailable' }));
  await start(page);
  const original = await customize(page, 'network');
  await expect(page.locator('#connection-detail-reason')).not.toBeEmpty();
  await topic(page, 'methane', 'methane');
  await page.locator('#focus-step-back-btn').click();
  await restored(page, original);
  await expect(page.locator('#connection-detail-reason')).not.toBeEmpty();
});
