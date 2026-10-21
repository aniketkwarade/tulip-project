import { SPHERE_LABELS } from './node-inspector-display.js';

// Shared vector symbols for the web and Android inspector category labels.
export const INSPECTOR_CATEGORY_SYMBOLS = Object.freeze({
  atmosphere: ['M3 8h12a3 3 0 1 0-3-3', 'M2 12h17a3 3 0 1 1-3 3', 'M4 16h5a3 3 0 1 1-3 3'],
  oceans: ['M2 6c3-3 5 3 8 0s5 3 8 0h4', 'M2 12c3-3 5 3 8 0s5 3 8 0h4', 'M2 18c3-3 5 3 8 0s5 3 8 0h4'],
  freshwater: ['M12 2C9 6 5 10 5 15a7 7 0 0 0 14 0c0-5-4-9-7-13Z'],
  cryosphere: ['M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7', 'm8 4 4 4 4-4M8 20l4-4 4 4M3 11l5-1-1-5M21 13l-5 1 1 5M3 13l5 1-1 5M21 11l-5-1 1-5'],
  biosphere: ['M20 3C9 3 3 7 3 14a7 7 0 0 0 7 7c7 0 11-6 10-18Z', 'M3 21 16 8'],
  energy: ['m13 2-9 12h7l-1 8L21 9h-8l1-7Z'],
  digital: ['M6 6h12v12H6Z', 'M9 9h6v6H9ZM9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4'],
  agriculture: ['M6 21 19 8M18 2v6h6', 'M14 6c-4-4-7-3-7-3 0 0-1 3 3 7M18 10c4 0 5 3 5 3s-2 3-7 1M10 10c-4-4-7-3-7-3 0 0-1 3 3 7M14 14c4 0 5 3 5 3s-2 3-7 1'],
  transport: ['m22 2-7 20-4-9-9-4L22 2Z', 'm22 2-11 11'],
  economy: ['M3 3v18h18', 'm6 15 5-5 4 3 6-8', 'M17 5h4v4'],
  health: ['M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z'],
  sociopolitical: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9', 'M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM16 3a4 4 0 0 1 0 8'],
  core: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M2 12h20M12 2c-5 5-5 15 0 20 5-5 5-15 0-20Z'],
});

export function getInspectorCategorySymbol(sphere) {
  const value = String(sphere || '').toLowerCase();
  const key = INSPECTOR_CATEGORY_SYMBOLS[value] ? value : Object.keys(SPHERE_LABELS).find(key => SPHERE_LABELS[key].toLowerCase() === value);
  return INSPECTOR_CATEGORY_SYMBOLS[key || 'core'];
}

export function setInspectorCategoryLabel(host, sphere, label) {
  if (!host) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'inspector-category-symbol');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const d of getInspectorCategorySymbol(sphere)) {
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  host.replaceChildren(svg, document.createTextNode(label));
}
