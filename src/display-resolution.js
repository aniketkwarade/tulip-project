export const REFERENCE_VIEWPORT = Object.freeze({ width: 1920, height: 1080 });

const STANDARD_DESKTOP_PIXEL_BUDGET = 16_000_000;
const HIGH_RES_DESKTOP_PIXEL_BUDGET = 32_000_000;
const STANDARD_DENSE_TREE_PIXEL_BUDGET = 12_000_000;
const HIGH_RES_DENSE_TREE_PIXEL_BUDGET = 24_000_000;
const PHONE_PIXEL_BUDGET = 8_000_000;

function finitePositive(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

export function getInterfaceScale(width, height) {
  const viewportWidth = finitePositive(width, REFERENCE_VIEWPORT.width);
  const viewportHeight = finitePositive(height, REFERENCE_VIEWPORT.height);
  if (viewportWidth <= REFERENCE_VIEWPORT.width || viewportHeight <= REFERENCE_VIEWPORT.height) return 1;

  return Math.max(1, Math.min(
    2,
    viewportWidth / REFERENCE_VIEWPORT.width,
    viewportHeight / REFERENCE_VIEWPORT.height
  ));
}

export function isHighResolutionViewport(width, height) {
  return finitePositive(width, 0) >= 2560 && finitePositive(height, 0) >= 1400;
}

export function getCanvasRenderProfile({
  width,
  height,
  devicePixelRatio = 1,
  uiScale = 1,
  viewportWidth,
  viewportHeight,
  isPhoneViewport = false,
  isDenseAnalyzeTree = false
}) {
  const logicalWidth = finitePositive(width, 1);
  const logicalHeight = finitePositive(height, 1);
  const pixelRatio = finitePositive(devicePixelRatio, 1);
  const interfaceScale = finitePositive(uiScale, 1);
  const highResolution = isHighResolutionViewport(
    finitePositive(viewportWidth, logicalWidth * interfaceScale),
    finitePositive(viewportHeight, logicalHeight * interfaceScale)
  );
  const nativePixelRatio = Math.max(
    isPhoneViewport ? 2 : 1,
    pixelRatio * interfaceScale
  );
  const maximumPixelRatio = isPhoneViewport
    ? 3
    : isDenseAnalyzeTree
      ? (highResolution ? 3.25 : 2.5)
      : (highResolution ? 4 : 3);
  const pixelBudget = isPhoneViewport
    ? PHONE_PIXEL_BUDGET
    : isDenseAnalyzeTree
      ? (highResolution ? HIGH_RES_DENSE_TREE_PIXEL_BUDGET : STANDARD_DENSE_TREE_PIXEL_BUDGET)
      : (highResolution ? HIGH_RES_DESKTOP_PIXEL_BUDGET : STANDARD_DESKTOP_PIXEL_BUDGET);
  const budgetPixelRatio = Math.sqrt(pixelBudget / (logicalWidth * logicalHeight));
  const renderPixelRatio = Math.max(1, Math.min(
    nativePixelRatio,
    maximumPixelRatio,
    budgetPixelRatio
  ));

  return Object.freeze({
    renderPixelRatio,
    pixelBudget,
    highResolution,
    nativePixelRatio,
    maximumPixelRatio
  });
}
