import assert from 'node:assert/strict';
import {
  getCanvasRenderProfile,
  getInterfaceScale,
  isHighResolutionViewport
} from '../src/display-resolution.js';

assert.equal(getInterfaceScale(1440, 900), 1);
assert.equal(getInterfaceScale(1920, 1080), 1);
assert.equal(getInterfaceScale(3840, 2160), 2);
assert.equal(getInterfaceScale(3440, 1440), 4 / 3);
assert.equal(isHighResolutionViewport(2560, 1400), true);
assert.equal(isHighResolutionViewport(2559, 1400), false);

const standardDesktop = getCanvasRenderProfile({
  width: 1400,
  height: 1043,
  devicePixelRatio: 1,
  uiScale: 1,
  viewportWidth: 1920,
  viewportHeight: 1080
});
assert.equal(standardDesktop.highResolution, false);
assert.equal(standardDesktop.pixelBudget, 16_000_000);
assert.equal(standardDesktop.renderPixelRatio, 1);

const fourKDesktop = getCanvasRenderProfile({
  width: 1400,
  height: 1043,
  devicePixelRatio: 1,
  uiScale: 2,
  viewportWidth: 3840,
  viewportHeight: 2160
});
assert.equal(fourKDesktop.highResolution, true);
assert.equal(fourKDesktop.pixelBudget, 32_000_000);
assert.equal(fourKDesktop.renderPixelRatio, 2);

const retinaFourKDesktop = getCanvasRenderProfile({
  width: 1400,
  height: 1043,
  devicePixelRatio: 2,
  uiScale: 2,
  viewportWidth: 3840,
  viewportHeight: 2160
});
assert.equal(retinaFourKDesktop.highResolution, true);
assert.equal(retinaFourKDesktop.pixelBudget, 32_000_000);
assert.equal(retinaFourKDesktop.renderPixelRatio, 4);

const denseRetinaFourKTree = getCanvasRenderProfile({
  width: 1400,
  height: 1043,
  devicePixelRatio: 2,
  uiScale: 2,
  viewportWidth: 3840,
  viewportHeight: 2160,
  isDenseAnalyzeTree: true
});
assert.equal(denseRetinaFourKTree.highResolution, true);
assert.equal(denseRetinaFourKTree.pixelBudget, 24_000_000);
assert.equal(denseRetinaFourKTree.renderPixelRatio, 3.25);

const phone = getCanvasRenderProfile({
  width: 440,
  height: 956,
  devicePixelRatio: 3,
  uiScale: 1,
  viewportWidth: 440,
  viewportHeight: 956,
  isPhoneViewport: true
});
assert.equal(phone.pixelBudget, 8_000_000);
assert.equal(phone.renderPixelRatio, 3);

console.log('Display resolution scaling checks passed.');
