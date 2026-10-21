import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { NODE_PHOTOS } from '../src/node-photos.js';
import { PUBLISHED_NODES } from '../src/data.js';

// Run against local desktop/mobile development servers, never production.
const desktop = process.env.TULIP_PHOTO_DESKTOP_URL || 'http://127.0.0.1:5188';
const mobile = process.env.TULIP_PHOTO_MOBILE_URL || 'http://127.0.0.1:5189';
const output = new URL('../artifacts/inspector-photographs-2026-09-28/', import.meta.url).pathname;
await mkdir(output, {recursive:true});
const browser = await chromium.launch({headless:true});
const reports = [];
// Exercise the optional-photo fallback even when the real catalogue is complete.
// Intercept only this test page's data request; never alter shipped selections.
async function omitTemperaturePhoto(page, isMobile = false) {
  const relative = isMobile
    ? '../Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json'
    : '../public/runtime-node-details.json';
  const data = JSON.parse(await readFile(new URL(relative, import.meta.url), 'utf8'));
  if (isMobile) delete data['global temperature'].photo;
  else delete data.nodes.find(node => node.id === 'temp').photo;
  const pattern = isMobile ? '**/src/mobile-inspector-snapshot.json*' : '**/runtime-node-details.json';
  await page.route(pattern, route => route.fulfill({
    contentType: isMobile ? 'application/javascript' : 'application/json',
    body: isMobile ? `export default ${JSON.stringify(data)};` : JSON.stringify(data),
  }));
}
async function loaded(page, selector) {
  await page.waitForFunction(s => {
    const image = document.querySelector(s);
    return image?.complete && image.naturalWidth === 2400 && image.naturalHeight === 1350;
  }, selector);
  await page.locator(selector).evaluate(image => image.decode());
}
async function selectDesktop(page, id) {
  await page.evaluate(id => window.graphInstance.onSelectNode(window.graphInstance.nodes.find(n => n.id === id)), id);
}
async function selectMobile(page, id) {
  const name = PUBLISHED_NODES.find(node => node.id === id)?.name;
  assert.ok(name, `Published node ${id} exists`);
  await page.evaluate(id => {
    window.__TULIP_PENDING_TOPIC__ = id;
    window.dispatchEvent(new Event('tulip-android-open-topic'));
  }, id);
  await page.waitForFunction(name => document.querySelector('.analyse-screen.is-active h1')?.textContent === name, name);
}
async function swipeUp(page, selector) {
  const box=await page.locator(selector).boundingBox();
  const x=box.x+box.width*.5,y=box.y+box.height*.75;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x,y-100,{steps:8});await page.mouse.up();
}
try {
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  await omitTemperaturePhoto(page);
  const requests=[]; const errors=[];
  page.on('request',r => { if (r.url().includes('/node-photos/')) requests.push(r.url()); });
  page.on('pageerror',e => errors.push(e.message));
  await page.goto(`${desktop}/?node=thermokarst_expansion`);
  const imageSelector='#console-node-photo img';
  await loaded(page,imageSelector);
  await page.locator('#study-console').waitFor({state:'visible'});
  await page.locator('#console-node-photo').waitFor({state:'visible'});
  assert.equal(requests.length,1,'Desktop must load only the selected photograph');
  const heading=await page.locator('#console-node-name').boundingBox();
  const photo=await page.locator('#console-node-photo').boundingBox();
  const meaning=await page.locator('#console-node-meaning').boundingBox();
  const panel=await page.locator('#study-console').boundingBox();
  assert.ok(heading.y+heading.height <= photo.y,'Photograph sits below the node name');
  assert.ok(photo.x > panel.x && photo.x+photo.width < panel.x+panel.width,'Photograph keeps the inspector content inset');
  assert.ok(photo.x-panel.x <=14,'Photograph uses reduced desktop side margins');
  assert.equal(await page.locator('#console-sphere-badge .inspector-category-symbol').count(),1,'Desktop category includes its symbol');
  assert.equal(await page.locator('.urgency-section .platform-section-icon-brand').count(),1,'TULIP score retains its original brand symbol');
  assert.ok(Math.abs(photo.width/photo.height - 16/9)<0.01,'Inline photograph uses its compact 16:9 ratio');
  assert.ok(photo.y+photo.height <= meaning.y+1,'Description follows the photograph');
  const updated=await page.locator('#node-source-date').boundingBox();
  const score=await page.locator('#console-urgency-score').boundingBox();
  for (const box of [updated,score]) assert.ok(box.y+box.height <= photo.y,'Identity and score stay above the photo');
  assert.equal(await page.locator('.inspector-photo-trigger').evaluate(e=>getComputedStyle(e,'::after').content),'none','No overlay obscures the photograph');
  assert.equal(await page.locator('.inspector-photo-credit').count(),0,'Photo details must stay hidden until opened');
  await page.getByRole('button',{name:'View photograph of Thermokarst Expansion',exact:true}).click();
  assert.equal(await page.getByRole('dialog').isVisible(),true);
  assert.equal(await page.locator('.inspector-photo-viewer-stage img').getAttribute('alt'),NODE_PHOTOS.thermokarst_expansion.alt);
  assert.equal(await page.locator('.inspector-photo-credit a').first().getAttribute('href'),NODE_PHOTOS.thermokarst_expansion.sourceUrl);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog').count(),0);
  await page.waitForFunction(()=>document.querySelector('#console-node-photo button')===document.activeElement);
  assert.equal(await page.locator(imageSelector).getAttribute('srcset'),null);
  assert.equal(await page.locator(imageSelector).getAttribute('alt'),NODE_PHOTOS.thermokarst_expansion.alt);
  await page.screenshot({path:output+'desktop-thermokarst.png'});
  await page.setViewportSize({width:785,height:950});
  await page.locator(imageSelector).scrollIntoViewIfNeeded();
  const narrowPhoto=await page.locator('#console-node-photo').boundingBox();
  assert.ok(Math.abs(narrowPhoto.width/narrowPhoto.height - 16/9)<0.01);
  assert.equal(await page.locator('.mobile-sheet-summary .inspector-photo').count(),0,'Compact header stays separate from its scrolling photo');
  await page.screenshot({path:output+'desktop-narrow-header.png'});
  await page.setViewportSize({width:1440,height:1000});
  await selectDesktop(page,'glacial_lake_failure_risk');
  await loaded(page,imageSelector);
  await page.locator('#console-node-photo button').click();
  assert.match(await page.locator('.inspector-photo-viewer-details').innerText(),/outburst.*not shown/i);
  await swipeUp(page,'.inspector-photo-viewer-stage');
  assert.equal(await page.getByRole('dialog').count(),0);
  await page.screenshot({path:output+'desktop-glacial-lake.png'});
  await selectDesktop(page,'active_mobility');
  await loaded(page,imageSelector);
  assert.match(await page.locator(imageSelector).getAttribute('src'),/cycling.jpg$/);
  await page.locator('#console-node-photo button').click();
  await selectDesktop(page,'temp');
  await page.locator('.inspector-photo-viewer').waitFor({state:'detached'});
  assert.equal(await page.getByRole('dialog').count(),0,'Node changes dismiss stale photo details');
  await page.waitForFunction(() => document.querySelector('#console-node-photo').hidden);
  assert.equal(await page.locator(imageSelector).count(),0);
  assert.ok((await page.locator('#console-node-meaning').innerText()).length>80);
  await page.route('**/node-photos/permafrost.jpg',route=>route.abort());
  await selectDesktop(page,'permafrost_thaw');
  await page.waitForFunction(() => document.querySelector('#console-node-photo').hidden);
  assert.ok((await page.locator('#console-node-meaning').innerText()).length>80);
  await page.unroute('**/node-photos/permafrost.jpg');
  // A delayed obsolete request must not replace the latest selection.
  await page.route('**/node-photos/coral.jpg',async route => {
    await new Promise(resolve=>setTimeout(resolve,200)); await route.abort();
  });
  await selectDesktop(page,'coral_bleaching');
  await page.waitForFunction(() => document.querySelector('#console-node-photo')?.dataset.asset==='/node-photos/coral.jpg');
  await selectDesktop(page,'thermokarst_expansion');
  await loaded(page,imageSelector);
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#console-node-photo').isVisible(),true);
  assert.match(await page.locator(imageSelector).getAttribute('src'),/thermokarst.jpg$/);
  assert.deepEqual(errors,[]);
  await page.getByRole('button',{name:'EXPLORE',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#app-container')?.dataset.viewMode==='explore');
  assert.ok(await page.locator('#filter-bar .filter-pill-icon').evaluateAll(icons=>icons.length>0 && icons.every(icon=>icon.getBoundingClientRect().width>0)),'Explore filter symbols remain visible');
  reports.push({platform:'desktop',checks:['separate photo below identity and score','tap viewer and credit links','Escape and restored focus','swipe up','selection dismisses viewer','direct/context','response node','selected-only loading','dimensions and alt','missing','failed','rapid replacement'],passed:true});
  await page.close();

  for (const android of [false,true]) {
    const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
    await context.addInitScript(android => {
      localStorage.setItem('tulip-mobile-introduction-v1','complete');
      localStorage.setItem('tulip-mobile-quick-start-v1','complete');
      if(android) Object.assign(window,{__TULIP_NATIVE_APP__:true,__TULIP_ANDROID_APP__:true,TULIPNative:{haptic:()=>{},share:()=>{},startupReady:()=>{}}});
    },android);
    const page=await context.newPage();const requests=[];const errors=[];
    await omitTemperaturePhoto(page, true);
    page.on('request',r=>{if(r.url().includes('/node-photos/')) requests.push(r.url());});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(mobile+'/#search');
    await page.getByRole('textbox',{name:'Search Tulip Earth',exact:true}).fill('thermokarst');
    await page.getByRole('button',{name:/Thermokarst Expansion/}).click();
    const selector='.analyse-screen.is-active .inspector-photo img';
    assert.equal(await page.locator(selector).count(),0,'Collapsed inspector keeps only its text header');
    await page.getByRole('button',{name:'Expand node inspector',exact:true}).click();
    await loaded(page,selector);
    assert.equal(requests.length,1,'Only the selected photograph loads');
    const header=await page.locator(selector).boundingBox();
    const title=await page.locator('.analyse-screen.is-active h1').boundingBox();
    const date=await page.locator('.analyse-screen.is-active .analysis-source-date').boundingBox();
    assert.ok(date.y-title.y-title.height <=3,'Update date stays directly beneath the full title');
    const categorySymbol=await page.locator('.analyse-screen.is-active .eyebrow .inspector-category-symbol').boundingBox();
    assert.ok(categorySymbol.width>0,'Expanded category symbol is visible');
    assert.equal(await page.locator('.analyse-screen.is-active .inspector-section-symbol').count(),7,'Every inspector section retains its symbol');
    assert.ok(await page.locator('.analyse-screen.is-active .inspector-section-symbol').evaluateAll(symbols=>symbols.every(symbol=>getComputedStyle(symbol).maskImage!=='none' && symbol.getBoundingClientRect().width>0)),'Section symbols have loaded masks and reserved display sizes');
    const inspector=await page.locator('.analyse-screen.is-active .analysis-sheet-shell').boundingBox();
    assert.ok(Math.abs(header.x-inspector.x) <=2,'Photograph reaches the left sheet edge');
    assert.ok(Math.abs(header.x+header.width-inspector.x-inspector.width) <=2,'Photograph reaches the right sheet edge');
    assert.equal(await page.locator('.analyse-screen.is-active .inspector-photo').evaluate(element => getComputedStyle(element).borderRadius),'0px','Inline photograph has square corners');
    for (const locator of ['h1','.analysis-source-date','.mobile-score-summary']) {
      const box=await page.locator('.analyse-screen.is-active '+locator).boundingBox();
      assert.ok(box.y+box.height <= header.y,'Readable identity and score sit above the photo');
    }
    assert.equal(await page.locator('.inspector-photo-credit').count(),0);
    await page.getByRole('button',{name:'View photograph of Thermokarst Expansion',exact:true}).click();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    assert.equal(await page.locator('.inspector-photo-credit a').first().getAttribute('href'),NODE_PHOTOS.thermokarst_expansion.sourceUrl);
    await swipeUp(page,'.inspector-photo-viewer-stage');
    assert.equal(await page.getByRole('dialog').count(),0);
    assert.equal(await page.getByRole('button',{name:'Collapse node inspector',exact:true}).isVisible(),true);
    // A cancelled swipe must leave the viewer open; a score tap owns its action.
    await page.getByRole('button',{name:'View photograph of Thermokarst Expansion',exact:true}).click();
    const stage=page.locator('.inspector-photo-viewer-stage');
    const stageBox=await stage.boundingBox();
    await page.mouse.move(stageBox.x+stageBox.width*.5,stageBox.y+stageBox.height*.75);
    await page.mouse.down();
    await stage.dispatchEvent('pointercancel',{pointerId:1});
    await page.mouse.move(stageBox.x+stageBox.width*.5,stageBox.y+stageBox.height*.75-100);
    await page.mouse.up();
    assert.equal(await page.getByRole('dialog').isVisible(),true);
    await page.getByRole('button',{name:'Close photograph',exact:true}).click();
    await page.locator('.analyse-screen.is-active .mobile-score-summary').click();
    assert.equal(await page.locator('.mobile-photo-viewer').count(),0);
    assert.equal(await page.getByRole('dialog',{name:'TULIP Score',exact:true}).isVisible(),true);
    await page.keyboard.press('Escape');
    await loaded(page,selector);
    await page.locator(selector).scrollIntoViewIfNeeded();
    assert.equal(requests.length,1);
    const box=await page.locator(selector).boundingBox();assert.ok(box.width>200 && box.width<=390);
    assert.ok(Math.abs(box.width/box.height - 16/9)<0.01,'Mobile photograph keeps its compact 16:9 ratio');
    assert.equal(await page.locator('.analyse-screen.is-active .analysis-sheet-grab-zone .inspector-photo').count(),0);
    await page.screenshot({path:output+(android?'android':'mobile')+'-thermokarst.png'});
    // Keyboard activation avoids synthesizing a drag on the moving grab zone.
    await page.getByRole('button',{name:'Collapse node inspector',exact:true}).press('Enter');
    await page.waitForFunction(()=>document.querySelector('.analyse-screen.is-active .analysis-sheet-shell').classList.contains('is-collapsed'));
    assert.equal(await page.locator(selector).count(),0,'Collapsed inspector removes the photo block');
    await page.getByRole('button',{name:'Expand node inspector',exact:true}).press('Enter');
    await selectMobile(page,'active_mobility');
    await loaded(page,selector);
    assert.match(await page.locator(selector).getAttribute('src'),/cycling.jpg$/);
    await selectMobile(page,'temp');
    await page.waitForFunction(()=>document.querySelector('.analyse-screen.is-active h1')?.textContent==='Global Temperature');
    assert.equal(await page.locator(selector).count(),0);
    await page.route('**/node-photos/permafrost.jpg',route=>route.abort());
    await selectMobile(page,'permafrost_thaw');
    await page.waitForFunction(()=>document.querySelector('.analyse-screen.is-active h1')?.textContent==='Permafrost Thaw');
    await page.waitForFunction(()=>!document.querySelector('.analyse-screen.is-active .inspector-photo'));
    assert.ok((await page.locator('.analyse-screen.is-active .overview-section').innerText()).length>80);
    await page.unroute('**/node-photos/permafrost.jpg');
    await selectMobile(page,'coral_bleaching');
    await selectMobile(page,'thermokarst_expansion');
    await loaded(page,selector);
    await page.setViewportSize({width:320,height:720});
    await page.addStyleTag({content:'.inspector-photo figcaption {font-size:24px} .inspector-photo-credit {font-size:22px}'});
    await page.getByRole('button',{name:'View photograph of Thermokarst Expansion',exact:true}).click();
    await page.addStyleTag({content:'.inspector-photo-viewer-details {font-size:30px} .inspector-photo-credit {font-size:24px}'});
    await page.locator('.inspector-photo-credit a').first().scrollIntoViewIfNeeded();
    const narrow=await page.locator('.mobile-photo-viewer').boundingBox();
    assert.ok(narrow.x>=0 && narrow.x+narrow.width<=320);
    assert.ok(await page.locator('.inspector-photo-credit a').first().isVisible());
    await page.screenshot({path:output+(android?'android':'mobile')+'-narrow-large-text.png'});
    await page.getByRole('button',{name:'Close photograph',exact:true}).click();
    await page.setViewportSize({width:390,height:844});
    const distinctInspectorAssets = new Set();
    const reviewedNodes = ['industry_farming','livestock_disease_pressure','wet_bulb_heat','occupational_heat_exposure','farm_heat_stress','agricultural_labor_exposure','water_stress','glacier_hydrologic_system_floods','old_growth_forest_logging','drought_persistence','migration','food_waste','marine_heatwaves'];
    for (const id of reviewedNodes) {
      await selectMobile(page,id);
      await loaded(page,selector);
      const asset = await page.locator(selector).getAttribute('src');
      assert.ok(!distinctInspectorAssets.has(asset),`${id} must not repeat another selected inspector photograph`);
      assert.equal(await page.locator(selector).getAttribute('alt'), NODE_PHOTOS[id].alt);
      distinctInspectorAssets.add(asset);
    }
    assert.equal(distinctInspectorAssets.size,reviewedNodes.length);
    assert.deepEqual(errors,[]);
    reports.push({platform:android?'Android webview':'mobile web',checks:['photo only in expanded inspector','separate identity and score','tap viewer','swipe up','hidden attribution until tap','collapse removes photo','response node','missing','failed','rapid replacement','thirteen distinct related-topic photographs','320px width','200% caption text and scroll'],passed:true});
    await context.close();
  }
  await writeFile(output+'browser-verification.json',JSON.stringify(reports,null,2)+'\n');
  console.log(JSON.stringify(reports));
} finally { await browser.close(); }
