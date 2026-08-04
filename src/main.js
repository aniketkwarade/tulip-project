/**
 * THE TULIP PROJECT - Application Orchestrator & UI Controller (Minimalist Realignment)
 */

import './style.css';
import { NODES, EDGES, PUBLISHED_NODES, PUBLISHED_EDGES, DISCOVERY_TRAILS, getAdjective } from './data.js';
import nodeSourceDateRegistry from './node-source-dates.json';
import { propagateChange } from './propagation.js';
import { TulipGraph } from './graph.js';
import { generateAvatarDataURL } from './avatar.js';
import { initTelemetry, trackEvent } from './telemetry.js';
import { escapeHtml, safeHttpsUrl } from './security.js';
import {
  PERSONAL_FOOTPRINT_CONTEXT_VERSION,
  estimateGlobalCarbonPercentile,
  getFootprintEquivalencies
} from './personal-footprint-context.js';
import { getTulipUrgencyBand as getTulipUrgencyBandV2 } from './tulip-urgency-v2.js';
import {
  TULIP_URGENCY_BANDS_V3,
  getTulipUrgencyBandV3
} from './tulip-urgency-v3.js';
import {
  getRelationshipSemanticLabel,
  getRelationshipQuestionAuxiliary,
  isCausalRelationship
} from './relationship-semantics.js';

let activityModulesPromise = null;
let getPhenomenonLens = null;
let getPhenomenonLensById = null;
let getActionProfileById = null;

async function ensureActivityModules() {
  if (!activityModulesPromise) {
    activityModulesPromise = Promise.all([
      import('./phenomenon-lens.js'),
      import('./actions-data.js')
    ]).then(([lensModule, actionsModule]) => {
      getPhenomenonLens = lensModule.getPhenomenonLens;
      getPhenomenonLensById = lensModule.getPhenomenonLensById;
      getActionProfileById = actionsModule.getActionProfileById;
    });
  }
  return activityModulesPromise;
}

const SPHERE_LABELS = {
  atmosphere: 'Air & Skies',
  oceans: 'Oceans & Water',
  cryosphere: 'Ice & Glaciers',
  biosphere: 'Plants & Wildlife',
  energy: 'Power & Heat',
  digital: 'Digital Infrastructure',
  agriculture: 'Farming & Food',
  transport: 'Travel & Shipping',
  economy: 'Markets & Money',
  sociopolitical: 'Society & Politics',
  core: 'Core'
};

const SPHERE_MOTION_RGB = Object.freeze({
  atmosphere: '210, 170, 245',
  oceans: '70, 190, 235',
  cryosphere: '165, 220, 255',
  biosphere: '105, 205, 135',
  energy: '255, 190, 90',
  digital: '155, 145, 245',
  agriculture: '190, 205, 95',
  transport: '245, 145, 90',
  economy: '230, 135, 160',
  sociopolitical: '120, 185, 225',
  core: '184, 212, 255'
});

const GATEWAY_TOPICS = [
  {
    key: 'deforestation',
    label: 'DEFORESTATION',
    side: 'left',
    position: 'top',
    color: '#5AAD2D',
    nodeId: 'deforestation',
    viewBox: '0 0 92.58 92.86',
    filled: true,
    iconSvg: `
      <path d="M76.76,49.55c0-1.84-1.5-3.34-3.34-3.34h-5.55c2.05-1.53,4.03-3.22,5.92-5.05.69-.67,1.06-1.61,1.01-2.57-.04-.96-.51-1.86-1.27-2.46-.28-.22-6.53-5.23-12.33-12.77l19.13-6.83c3.21-1.14,5.37-4.19,5.37-7.59,0-.88-.14-1.76-.43-2.62-.7-2.04-2.15-3.68-4.09-4.61-1.93-.93-4.11-1.06-6.12-.35l-21.95,7.59c-.31-.75-.88-1.36-1.62-1.72-.8-.39-1.71-.44-2.55-.15l-20.68,7.15c-.84.29-1.52.89-1.92,1.7-.36.74-.43,1.57-.21,2.35l-2.75.95c-3.24,1.12-5.41,4.17-5.41,7.59,0,.88.15,1.79.44,2.63,1.13,3.23,4.19,5.4,7.62,5.4h.59s.01-.03.01-.03c.67-.05,1.35-.19,2-.41l.05-.02c.13,9.8-1.79,17.8-1.81,17.88-.23.94-.04,1.93.51,2.72.55.79,1.42,1.3,2.39,1.4,9.45.97,18.31-.21,26.35-3.49.04,0,.09,0,.13,0h13.96c.49,6.66,2.52,20.96,10.87,32.37h-43.18c3.1-8.51,4.14-19.29,4.19-19.77.17-1.83-1.18-3.47-3-3.65-.88-.08-1.75.17-2.44.74-.69.57-1.12,1.37-1.21,2.27-.01.13-1.3,12.91-4.74,20.4H11.5c8.35-11.43,10.38-25.72,10.87-32.38h.49c1.84,0,3.34-1.5,3.34-3.34s-1.5-3.34-3.34-3.34h-3.69c-1.84,0-3.34,1.5-3.34,3.34,0,.24-.21,23.75-14,36.62-1.01.95-1.33,2.39-.83,3.67.5,1.27,1.75,2.12,3.11,2.12h82.76,0s1.62,0,1.62,0c1.36,0,2.61-.85,3.11-2.12.5-1.29.18-2.73-.83-3.67-13.78-12.87-14-36.39-14-36.62ZM79.01,8.93c0,.57-.37,1.09-.9,1.28l-20.84,7.44c-.52-.85-1-1.71-1.46-2.57l21.45-7.42h0c.34-.12.68-.1,1,.05.32.16.56.42.67.73.05.16.08.32.08.48ZM35.16,29.58c0-.12-.01-.23-.02-.28-.29-3.4-.83-6.64-1.62-9.65-.01-.06-.02-.11-.04-.17l14.61-5.05c4.84,11.25,13.87,20.35,18.32,24.39-9.39,8.01-19.97,11.67-32.28,11.16.75-4.41,1.69-12.09,1.02-20.41ZM28.21,27.46l-1.77.61c-.71.25-1.46-.12-1.72-.84-.04-.12-.07-.28-.07-.43,0-.57.36-1.08.9-1.26l2.24-.77c.16.88.3,1.79.41,2.7Z"/>
    `,
    layout: { xPad: 0.09, yFactor: -0.44, widthScale: 0.16, heightScale: 0.18, minWidth: 112, maxWidth: 124, minHeight: 98, maxHeight: 108 }
  },
  {
    key: 'melting-glaciers',
    label: 'MELTING GLACIERS',
    side: 'left',
    position: 'middle',
    color: '#8A8A8D',
    nodeId: 'ice_sheet_mass_loss',
    viewBox: '0 0 102.26 102.69',
    filled: true,
    iconSvg: `
      <path d="M98.62,37.42h-4.94l-3.46-5.8-.1-.15c-.3-.38-.74-.96-1.51-1.21l-14.49-5.81-7.95-12.95c-.25-.55-.7-1-1.25-1.26L49.74,1.84l-1.07-.59-.46-.25c-.71-.41-1.57-.54-2.36-.37l-.1.02c-.68.19-1.41.69-1.86,1.27l-12.78,17.35-10.71,5.22c-.49.21-.94.59-1.23,1.03l-9.08,11.9H3.64c-1.77,0-3.27,1.39-3.27,3.03s1.5,3.03,3.27,3.03h5.4l3.34,15.77.47.82,7.24,8.01,2.61,12.65c.08.85.64,1.46.99,1.76l22.8,19.48.23.16c.7.4,1.39.61,2.05.61.91,0,1.73-.3,2.4-.87l14.48-15.06c.13-.13.23-.25.29-.35l9.13-15.52,8.41,1.18c1.66.33,3.25-.6,3.71-2.21l7.03-26.43h4.4c1.77,0,3.27-1.39,3.27-3.03s-1.5-3.03-3.27-3.03ZM70.27,66.32l-9.83,16.78-12.01,12.42-19.56-16.7-2.59-12.45c-.06-.6-.37-1.02-.54-1.26l-7.24-8.02-2.95-13.6h71.91l-6,22.43-7.81-1.14c-1.43-.18-2.72.42-3.37,1.54ZM36.87,28.66c-.45.05-.9.27-1.19.51l-11.15,8.25h-6.5l6.08-7.92,10.72-5.22c.5-.21.95-.6,1.24-1.04l4.7-6.32-.02.04c-.32.84-.21,1.68.32,2.36l5.64,7.55-9.84,1.8ZM60.92,15.15l8.06,13.23.1.14c.3.38.74.95,1.51,1.21l14.49,5.81,1.16,1.88h-53.03l5.41-4.02,13.24-2.39.15-.03c.89-.26,1.53-.79,1.81-1.51.32-.84.21-1.68-.32-2.36l-7.29-9.64,3.33-8.63,11.38,6.32Z"/>
    `,
    layout: { xPad: 0.13, yFactor: 0.01, widthScale: 0.15, heightScale: 0.18, minWidth: 106, maxWidth: 116, minHeight: 96, maxHeight: 104 }
  },
  {
    key: 'global-warming',
    label: 'GLOBAL WARMING',
    side: 'left',
    position: 'bottom',
    color: '#CF493D',
    nodeId: 'temp',
    viewBox: '0 0 90 105.59',
    filled: true,
    iconSvg: `
      <path d="M82.36,23.29c-1.61-4.78-3.43-10.2-2.43-19.47.13-1.22-.45-2.42-1.5-3.07-1.04-.64-2.38-.63-3.41.03-6.13,3.94-9.93,7.61-11.83,15.03-2.72-2.18-6.15-3.45-10.87-4.06-1.03-.13-2.07.25-2.77,1.02-.71.77-.99,1.84-.76,2.86.5,2.24-.16,5-.83,7.41l-.13.47c-.25.87-.11,1.81.38,2.58.49.76,1.28,1.28,2.17,1.42l.16-.99-.1,1c1.58.26,3.11-.72,3.55-2.27.28-.98.49-1.78.66-2.53.32-1.4.53-2.67.63-3.85,3.25,1.01,5.41,2.86,7.1,6.01.81,1.52,2.67,2.13,4.24,1.37.99-.48,1.67-1.52,1.78-2.7.59-6.39,1.92-10.15,4.86-13.26.2,6.46,1.72,11.04,2.96,14.8.33.99.65,1.95.92,2.88,1.77,6.02.56,10.25-.77,12.73-.58,1.09-.5,2.39.23,3.43.6.85,1.56,1.35,2.59,1.35.06,0,.12,0,.19,0,1.11-.06,2.09-.68,2.62-1.66,1.92-3.52,3.71-9.45,1.29-17.65-.28-.93-.59-1.89-.93-2.88Z"/>
      <path d="M52.41,30.37c-2.89-.69-5.88-1.04-8.87-1.04-9.96,0-19.37,3.83-26.51,10.79-7.4,7.22-11.48,16.88-11.48,27.2,0,1.94.15,3.88.44,5.77.6,3.91,1.79,7.66,3.55,11.18l-.1-.02,1.18,2.04c6.78,11.73,19.39,19.02,32.92,19.02,6.53,0,12.97-1.69,18.63-4.88,6.6-3.72,11.89-9.26,15.3-16.01,2.7-5.34,4.07-11.09,4.07-17.1,0-17.65-11.97-32.84-29.12-36.95ZM23.09,62.43c.51,1.22.71,2.18.14,3.21-.59,1.07-1.79,1.92-3.67,2.59-2,.71-4.59,1.12-7.54,1.2-.05-.69-.07-1.4-.07-2.11,0-6.66,2.12-13.17,6.02-18.54.21.71.42,1.42.63,2.13.54,1.84,1.1,3.74,1.7,5.54.41,1.23,1.03,2.42,1.63,3.57.43.83.84,1.62,1.18,2.41ZM28.52,92.96c4.97.88,8.78-1.69,12.47-4.17l.25-.17c2.44-1.64,4.55-3.05,7.37-1.73,1.73.81,3.26,2.3,4.95,4.84.97,1.45,1.83,3,2.65,4.53-3.99,1.76-8.25,2.65-12.67,2.65-8,0-15.54-2.97-21.32-8.28,1.95,1,4,1.92,6.3,2.33ZM46.44,79.95c-3.39,0-6.26,1.67-8.79,3.37l-.79.54c-1.17.8-2.38,1.63-3.61,2.2-1.34.62-2.46.81-3.62.61-1.99-.35-3.81-1.33-5.57-2.27-.44-.24-.88-.47-1.32-.7-2.11-1.08-4.62-2.18-7.48-2.29-.89-1.79-1.61-3.67-2.15-5.6,2.52-.12,5.73-.51,8.6-1.53,3.32-1.18,5.78-3.09,7.12-5.51,1.97-3.55,1.04-6.72.17-8.79-.35-.83-.78-1.65-1.2-2.45-.56-1.06-1.09-2.06-1.43-3.08-.6-1.79-1.16-3.7-1.7-5.55-.53-1.82-1.08-3.7-1.69-5.53,5.73-4.92,13.01-7.62,20.57-7.62,1.55,0,3.1.11,4.64.34-.02.28-.04.57-.05.85-.14,2.24-.28,4.56-1.14,6.51-.65,1.47-1.48,2.47-2.62,3.17-.85.52-1.83.95-2.77,1.37-1.1.49-2.23.99-3.21,1.64-1.99,1.33-4.54,3.69-3.77,8.92.85,5.72,6.51,9.45,11.75,10.61,2.15.48,4.43.38,6.64.27.52-.02,1.03-.05,1.55-.06,1.98-.06,3.74-.03,5.2.95,1.11.75,1.48,1.89,1.91,3.22l.12.37c.46,1.39,1.02,3.12,2.07,4.65,1.33,1.94,3.57,3.93,6.38,5.67-2.2,3.47-5.1,6.51-8.45,8.89-1.17-2.17-2.5-4.53-4.06-6.57-1.97-2.57-4.06-4.35-6.39-5.44-1.74-.82-3.37-1.15-4.88-1.15ZM67.5,70.85c-.7-1.98-1.74-4.22-4.19-5.86-2.54-1.71-5.36-2.05-7.9-2.05-.36,0-.71,0-1.06.02-.56.02-1.13.05-1.69.08-1.75.1-3.41.19-4.92-.14-1.46-.32-6.26-1.66-6.8-5.3-.11-.76-.08-1.33.09-1.73.24-.55.77-.9,1.67-1.37.61-.32,1.26-.6,1.92-.9,1.02-.45,2.08-.92,3.06-1.52,2.29-1.39,3.97-3.37,5.15-6.05,1.12-2.53,1.33-5.31,1.54-8,0-.12.02-.24.03-.36,12.44,4.55,20.71,16.32,20.71,29.67,0,3.85-.68,7.6-2.03,11.16-1.81-1.16-3.17-2.37-3.96-3.54-.59-.86-.91-1.88-1.25-2.95-.12-.38-.24-.77-.38-1.14Z"/>
    `,
    layout: { xPad: 0.1, yFactor: 0.48, widthScale: 0.17, heightScale: 0.19, minWidth: 114, maxWidth: 124, minHeight: 100, maxHeight: 110 }
  },
  {
    key: 'industrial-farming',
    label: 'INDUSTRIAL FARMING',
    side: 'right',
    position: 'top',
    color: '#C68286',
    nodeId: 'industry_farming',
    viewBox: '0 0 90 90',
    filled: true,
    iconSvg: `
      <path d="M85.7,69.94l-.14-.07c-2.24-2.01-5.52-2.58-8.29-1.4l-8.08-8.08c2.53-4.94.27-8.64-2.12-12.53l-.07-.12c-1.2-1.87-2.55-3.99-3.32-6.61-.65-2.11-1.32-4.5-1.96-6.8-2.61-9.37-5.3-19.06-10.21-23.98C46.02,4.85,38.71,1.83,30.93,1.83s-15.09,3.03-20.58,8.52C4.85,15.85,1.83,23.15,1.83,30.93s3.03,15.09,8.52,20.58c6.93,6.93,14.71,8.53,22.22,10.08,2.61.55,5.63,1.21,8.58,2.11,2.6.76,4.72,2.12,6.62,3.33l.09.06c3.89,2.39,7.59,4.66,12.53,2.12l8.08,8.08c-.41.96-.62,1.99-.62,3.03,0,2.1.83,4.13,2.28,5.58l.19.19.12.06c1.43,1.33,3.25,2.03,5.27,2.03s4.04-.8,5.58-2.28c.75-.75,1.23-1.61,1.6-2.37.06-.15.12-.3.18-.45.17-.06.34-.13.53-.22.67-.33,1.53-.81,2.31-1.59,1.46-1.52,2.26-3.5,2.26-5.56s-.83-4.13-2.28-5.58l-.19-.19ZM77.66,80.33c-.03.25-.07.55-.13.66l-.08.16c-.09.21-.2.36-.37.53-.38.38-.83.56-1.37.56-.5,0-.97-.19-1.31-.51l-.1-.1c-.45-.42-.52-1.01-.52-1.32,0-.51.21-1.01.57-1.37,1.12-1.13,1.12-3.03,0-4.16l-9.18-9.22s.1-.1.15-.15l-1.1-1.2h0s0,0,0,0l1.15,1.15.03-.03c.06-.06.12-.12.17-.17l9.22,9.17c1.13,1.13,3.03,1.13,4.16,0,.36-.36.86-.56,1.37-.56.37,0,.89.09,1.37.56.38.38.56.83.56,1.37,0,.51-.21,1.01-.56,1.37l-.1.11s-.13.13-.43.26l-.17.08c-.1.06-.41.1-.59.12-1.48.12-2.63,1.28-2.74,2.68ZM50.71,61.85c-2.14-1.32-4.58-2.82-7.87-3.84-3.04-.92-5.96-1.53-8.78-2.11l-.58-.12c-7.2-1.57-13.42-2.93-18.92-8.48-4.38-4.33-6.8-10.15-6.8-16.36s2.41-12.03,6.81-16.37c4.33-4.38,10.15-6.8,16.36-6.8s12.03,2.41,16.37,6.81c3.91,3.91,6.58,13.58,8.73,21.36l1.98,6.93c1.02,3.28,2.52,5.71,3.84,7.86l.12.19c2.44,3.88,3.67,5.83-.75,10.3-4.48,4.43-6.43,3.21-10.31.77l-.19-.12ZM30.93,11.46c-5.15,0-10.16,2.09-13.68,5.67-.6.54-.95,1.32-.95,2.14s.32,1.54.89,2.08c.54.56,1.29.89,2.08.89s1.56-.33,2.1-.91c2.55-2.54,5.94-3.94,9.56-3.94s7.03,1.41,9.52,3.9c.53.59,1.27.93,2.07.95.82.03,1.62-.3,2.21-.89,1.13-1.13,1.13-3.03,0-4.16-3.7-3.7-8.59-5.73-13.79-5.73Z"/>
    `,
    layout: { xPad: 0.09, yFactor: -0.44, widthScale: 0.16, heightScale: 0.18, minWidth: 112, maxWidth: 124, minHeight: 98, maxHeight: 108 }
  },
  {
    key: 'fossil-fuels',
    label: 'FOSSIL FUELS',
    side: 'right',
    position: 'middle',
    color: '#8A8A8D',
    nodeId: 'carbon_emission',
    viewBox: '0 0 90 90',
    filled: true,
    iconSvg: `
      <path d="M78.39,60.42v-2.05c-.03-2.44.47-4.81,1.49-7.01,1.86-3.96,1.86-8.5,0-12.46-1-2.18-1.51-4.59-1.49-7v-2.03c-.01-2.49.49-4.91,1.48-7.17,1.49-3.32,1.72-7.04.62-10.52-2.14-6.2-7.99-10.37-14.56-10.37H24.03c-6.57,0-12.41,4.14-14.55,10.35-1.1,3.48-.87,7.23.64,10.54,1.01,2.31,1.51,4.72,1.48,7.17v2.05c.03,2.41-.49,4.84-1.49,7.02-1.86,3.96-1.86,8.5,0,12.46,1,2.18,1.51,4.59,1.49,7v2.06c.02,2.49-.48,4.91-1.48,7.17-1.49,3.32-1.72,7.04-.62,10.52,2.16,6.18,7.99,10.34,14.53,10.34h41.93c6.57,0,12.41-4.14,14.55-10.35,1.1-3.48.87-7.23-.64-10.54-1-2.26-1.5-4.67-1.48-7.16ZM16.57,70.23c1.5-3.27,2.25-6.89,2.15-10.44v-1.05c-.11-3.75-.91-7.42-2.36-10.87-.76-2.04-.63-4.3.37-6.24,1.41-2.92,2.1-6.19,1.99-9.42v-1.74c.12-3.58-.58-7.18-2.06-10.44-.72-1.5-.95-3.09-.68-4.71.74-3.71,4.02-6.41,7.81-6.41h42.52c3.8,0,7.09,2.73,7.81,6.46.26,1.59.03,3.2-.68,4.67-1.5,3.27-2.25,6.89-2.15,10.44v1.04c.13,3.74.92,7.39,2.37,10.85l.14.25c.6,1.73.56,3.56-.09,5.27-1.46,3.4-2.27,7.02-2.42,10.82v1.09c-.12,3.58.58,7.18,2.06,10.44.72,1.49.95,3.09.68,4.71-.74,3.71-4.05,6.41-7.87,6.41H23.7s0,0,0,0c-3.8,0-7.09-2.73-7.81-6.46-.26-1.59-.03-3.2.68-4.67Z"/>
      <path d="M44.98,65.39c5.75-.07,10.97-3.28,13.6-8.32,5.99-10.38-3.05-20.71-9.66-28.25l-1.44-1.35-.06-.06c-1.16-1.22-3-1.4-4.4-.47h-.54l.24.22c-.07.06-.13.11-.2.18l-1.32,1.48c-4.85,5.61-11.5,13.29-11.5,21.15,0,8.4,6.83,15.31,15.26,15.41ZM53.3,54.03l-.09.17c-1.62,3.09-4.78,5.04-8.22,5.1-5.05-.07-9.16-4.25-9.16-9.3s5.14-11.51,9.26-16.29c6.62,7.62,11.63,14.43,8.22,20.33Z"/>
    `,
    layout: { xPad: 0.13, yFactor: 0.01, widthScale: 0.15, heightScale: 0.18, minWidth: 106, maxWidth: 116, minHeight: 96, maxHeight: 104 }
  },
  {
    key: 'extreme-weather',
    label: 'EXTREME WEATHER',
    side: 'right',
    position: 'bottom',
    color: '#6560DF',
    nodeId: 'environ_anomalies',
    viewBox: '0 0 90 90',
    filled: true,
    iconSvg: `
      <path d="M63.05,51.38v-.21h-9.61l2.37-13.65c.31-1.83-.69-3.67-2.39-4.39-1.72-.73-3.73-.15-4.76,1.35l-20.2,27.79c-1.02,1.38-1.17,3.21-.39,4.8.8,1.53,2.35,2.48,4.05,2.48h8.36l-2.4,13.73c-.31,1.83.7,3.67,2.38,4.36.51.22,1.05.33,1.58.33,1.24,0,2.44-.58,3.23-1.64l20.23-27.84c1.04-1.41,1.18-3.24.38-4.75-.57-1.15-1.61-2-2.81-2.35ZM47.18,63.93c-.64-.76-1.61-1.22-2.61-1.22h-7.98l10.41-14.31-.98,5.62c-.17,1.02.12,2.04.75,2.75.64.76,1.61,1.22,2.61,1.22h7.98l-10.42,14.36.99-5.67c.17-1.03-.12-2.04-.75-2.75Z"/>
      <path d="M78.03,23.46c-1.92-12.1-12.99-21.14-26.02-21.14-9.91,0-18.77,5.08-23.32,13.31-8.46.22-15.53,6.57-16.29,14.63-6.69,2.75-11.13,9.11-11.13,16.07,0,9.65,8.29,17.5,18.48,17.5h2.25c1.89,0,3.43-1.54,3.43-3.43s-1.54-3.43-3.43-3.43h-2.25c-6.42,0-11.65-4.79-11.65-10.67,0-4.79,3.51-9.02,8.54-10.28,1.62-.42,2.69-1.9,2.56-3.55,0-.14,0-.29-.01-.43,0-.13-.01-.26-.01-.38,0-5.06,4.51-9.19,10.06-9.19.41,0,.76,0,1.16.07,1.48.17,2.91-.68,3.49-2.04,2.99-6.88,10.1-11.33,18.1-11.33,10.2,0,18.74,7.35,19.44,16.73.08,1.21.79,2.27,1.89,2.81,5.3,2.63,8.6,7.7,8.6,13.24s-3.75,11.15-9.34,13.59c-.83.36-1.47,1.03-1.81,1.88-.33.85-.32,1.78.05,2.61.36.83,1.03,1.47,1.88,1.81.85.33,1.78.32,2.61-.05,8.16-3.58,13.44-11.37,13.44-19.86,0-7.54-3.99-14.39-10.7-18.45Z"/>
    `,
    layout: { xPad: 0.1, yFactor: 0.48, widthScale: 0.17, heightScale: 0.19, minWidth: 114, maxWidth: 124, minHeight: 100, maxHeight: 110 }
  }
];

const GATEWAY_TOPIC_LABELS = {
  'global-warming': 'Global Warming',
  'melting-glaciers': 'Melting Glaciers',
  deforestation: 'Deforestation',
  'industrial-farming': 'Industry Farming',
  'fossil-fuels': 'Carbon Emissions',
  'extreme-weather': 'Weather Anomalies'
};

const GATEWAY_TOPIC_ORDER = {
  'global-warming': 0,
  'melting-glaciers': 1,
  deforestation: 2,
  'industrial-farming': 0,
  'fossil-fuels': 1,
  'extreme-weather': 2
};

const REGISTRY_DIRECTORY = [
  {
    tab: 'climate',
    title: 'NOAA GML / AGGI',
    scope: 'Global atmospheric monitoring',
    kind: 'operational',
    summary: 'Primary greenhouse-gas concentration and radiative-forcing context for CO2 and CH4 loading.',
    links: [
      { label: 'Greenhouse Gas Trends', href: 'https://gml.noaa.gov/ccgg/trends/', note: 'Atmospheric concentration timeseries.' },
      { label: 'Annual Greenhouse Gas Index', href: 'https://gml.noaa.gov/aggi/aggi.html', note: 'Radiative forcing benchmark layer.' }
    ]
  },
  {
    tab: 'climate',
    title: 'Copernicus Climate Data Store',
    scope: 'Global reanalysis and climate datasets',
    kind: 'operational',
    summary: 'Core climate archive for temperature, humidity, reanalysis fields, and derived anomaly products.',
    links: [
      { label: 'Climate Data Store', href: 'https://cds.climate.copernicus.eu/', note: 'Official data catalogue and access hub.' },
      { label: 'ERA5 Single Levels', href: 'https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels?tab=overview', note: 'Flagship near-surface reanalysis dataset.' }
    ]
  },
  {
    tab: 'climate',
    title: 'NASA Earthdata / CMR',
    scope: 'Global Earth observation collections',
    kind: 'operational',
    summary: 'Open NASA Earthdata collection-discovery layer for atmosphere, oceans, cryosphere, land, and hazard-relevant Earth observation datasets.',
    links: [
      { label: 'Earthdata Portal', href: 'https://www.earthdata.nasa.gov/', note: 'Program overview and dataset discovery entry point.' },
      { label: 'Earth Science Data Systems', href: 'https://www.earthdata.nasa.gov/about/esdis', note: 'Program evidence and stewardship context for NASA Earth science data.' }
    ]
  },
  {
    tab: 'climate',
    title: 'NASA POWER',
    scope: 'Global climate and solar baselines',
    kind: 'operational',
    summary: 'Open NASA climatology API for temperature, humidity, precipitation, and surface solar baselines aligned with the platform refresh cadence.',
    links: [
      { label: 'NASA POWER Project', href: 'https://power.larc.nasa.gov/', note: 'Project overview, methodology context, and climate-data products.' }
    ]
  },
  {
    tab: 'climate',
    title: 'NASA EONET',
    scope: 'Natural hazard event tracker',
    kind: 'reference',
    summary: 'Official NASA hazard-event feed for active fires, storms, floods, and other events. Useful context, but too high-frequency for the platform’s frozen scoring cadence.',
    links: [
      { label: 'EONET Event Tracker', href: 'https://eonet.gsfc.nasa.gov/', note: 'Public event map and natural-hazard records.' }
    ]
  },
  {
    tab: 'climate',
    title: 'NASA GIBS',
    scope: 'Global imagery browse service',
    kind: 'reference',
    summary: 'NASA imagery service for browsable satellite layers and map tiles. Valuable for visual inspection, but not a direct operational score input.',
    links: [
      { label: 'Global Imagery Browse Services', href: 'https://www.earthdata.nasa.gov/data/tools/gibs', note: 'Service overview, imagery purpose, and supported Earth-observation layers.' }
    ]
  },
  {
    tab: 'climate',
    title: 'NASA FIRMS',
    scope: 'Active fire detections',
    kind: 'reference',
    summary: 'Critical wildfire monitoring surface used for contextual fire-detection evidence rather than frozen operational scoring.',
    links: [
      { label: 'NASA FIRMS Overview', href: 'https://www.earthdata.nasa.gov/data/tools/firms', note: 'Science purpose, satellite inputs, and fire-monitoring context.' },
      { label: 'FIRMS Fire Map', href: 'https://firms.modaps.eosdis.nasa.gov/map/', note: 'Public map of active-fire observations.' }
    ]
  },
  {
    tab: 'climate',
    title: 'Our World in Data',
    scope: 'Long-run global baseline indicators',
    kind: 'operational',
    summary: 'Open annual climate, land-use, energy, and emissions baselines that work well for structural trend context across TULIP nodes.',
    links: [
      { label: 'OWID CO2 & Greenhouse Gas Emissions', href: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions', note: 'Topic hub for emissions, greenhouse gases, land use, and energy context.' },
      { label: 'OWID Data Explorer', href: 'https://ourworldindata.org/data', note: 'Open chart and dataset discovery surface across topics.' },
      { label: 'OWID CO2 Data Repo', href: 'https://github.com/owid/co2-data', note: 'Open data repository used for the platform snapshot and API fallback.' }
    ]
  },
  {
    tab: 'climate',
    title: 'OpenAQ',
    scope: 'Global air quality sensor network',
    kind: 'operational',
    summary: 'Public particulate and air-pollution observations for PM2.5, PM10, ozone, and related urban exposure signals.',
    links: [
      { label: 'OpenAQ Platform', href: 'https://openaq.org/', note: 'Open air-quality data platform and API entry point.' }
    ]
  },
  {
    tab: 'climate',
    title: 'World Meteorological Organization',
    scope: 'Global meteorological coordination',
    kind: 'reference',
    summary: 'Institutional climate and weather reference layer used for standards, reports, and monitoring context.',
    links: [
      { label: 'WMO Portal', href: 'https://wmo.int/', note: 'Official institutional and standards reference.' }
    ]
  },
  {
    tab: 'climate',
    title: 'JMA Tokyo Climate Center',
    scope: 'Pacific and global climate diagnostics',
    kind: 'operational',
    summary: 'Useful for SST anomalies, ENSO context, and West Pacific climate diagnostics.',
    links: [
      { label: 'Tokyo Climate Center', href: 'https://ds.data.jma.go.jp/tcc/tcc/', note: 'Regional climate monitoring and anomaly products.' }
    ]
  },
  {
    tab: 'climate',
    title: 'KMA Climate Data Service',
    scope: 'Northeast Asia climate records',
    kind: 'reference',
    summary: 'Regional climate normals and meteorological records for Korea and neighboring systems.',
    links: [
      { label: 'National Climate Data Center Info', href: 'https://data.kma.go.kr/resources/html/en/ncdci.html', note: 'Official climate-data access page.' }
    ]
  },
  {
    tab: 'climate',
    title: 'NOAA Climate.gov',
    scope: 'Public reference and discovery layer',
    kind: 'reference',
    summary: 'Useful for explainers, visuals, and public-facing discovery. Contextual only, not a direct scoring input.',
    links: [
      { label: 'Dataset Gallery', href: 'https://www.climate.gov/maps-data/dataset-gallery', note: 'Curated datasets, maps, and snapshots.' },
      { label: 'Tools & Interactives', href: 'https://www.climate.gov/maps-data/tools-interactives', note: 'Public-facing analysis and visualization tools.' }
    ]
  },
  {
    tab: 'climate',
    title: 'IMD Mausam',
    scope: 'India meteorological services',
    kind: 'reference',
    summary: 'Monsoon and South Asian weather reference surface for regional context and diagnostics.',
    links: [
      { label: 'Mausam IMD', href: 'https://mausam.imd.gov.in/', note: 'India Meteorological Department portal.' }
    ]
  },
  {
    tab: 'climate',
    title: 'ASEAN Specialised Meteorological Centre',
    scope: 'Southeast Asia haze and hotspots',
    kind: 'reference',
    summary: 'Regional haze, fire, and hotspot monitoring layer for peatland and smoke conditions.',
    links: [
      { label: 'ASMC Portal', href: 'https://asmc.asean.org/', note: 'Official ASEAN regional monitoring surface.' }
    ]
  },
  {
    tab: 'water',
    title: 'NASA GRACE / GRACE-FO',
    scope: 'Mass change and water storage',
    kind: 'operational',
    summary: 'Gravity-based monitoring of groundwater, land water storage, ice-sheet mass change, and ocean mass anomalies.',
    links: [
      { label: 'GRACE Mission Portal', href: 'https://grace.jpl.nasa.gov/', note: 'JPL mission overview, science framing, and dataset guidance.' },
      { label: 'GRACE Data Guidance', href: 'https://grace.jpl.nasa.gov/data/get-data/', note: 'Mission data products, processing centers, and access guidance.' }
    ]
  },
  {
    tab: 'water',
    title: 'Stockholm Resilience Centre',
    scope: 'Planetary boundaries framework',
    kind: 'reference',
    summary: 'Threshold and safe-operating-space context for Earth-system pressure interpretation.',
    links: [
      { label: 'Planetary Boundaries', href: 'https://www.stockholmresilience.org/research/planetary-boundaries.html', note: 'Framework and research reference.' }
    ]
  },
  {
    tab: 'water',
    title: 'IUCN Red List',
    scope: 'Global biodiversity risk',
    kind: 'reference',
    summary: 'Species-status reference layer for extinction pressure, habitat stress, and ecological risk framing.',
    links: [
      { label: 'IUCN Red List', href: 'https://www.iucnredlist.org/', note: 'Official species conservation and threat-status portal.' }
    ]
  },
  {
    tab: 'water',
    title: 'UN Biodiversity Lab',
    scope: 'Protected areas and nature spatial data',
    kind: 'reference',
    summary: 'Spatial biodiversity and protected-area reference surface for land and marine conservation context.',
    links: [
      { label: 'UN Biodiversity Lab', href: 'https://map.unbiodiversitylab.org/', note: 'Official spatial-data platform.' }
    ]
  },
  {
    tab: 'water',
    title: 'UNEP WESR',
    scope: 'World environment situation room',
    kind: 'reference',
    summary: 'UN environmental signal and indicator layer used for global ecological context and telemetry.',
    links: [
      { label: 'WESR Platform', href: 'https://wesr.unep.org/', note: 'UNEP environment situation room.' }
    ]
  },
  {
    tab: 'water',
    title: 'WRI Aqueduct',
    scope: 'Global water-risk analytics',
    kind: 'operational',
    summary: 'Water stress, water risk, and basin exposure surfaces that are directly relevant to infrastructure and compute siting.',
    links: [
      { label: 'Aqueduct Overview', href: 'https://www.wri.org/aqueduct', note: 'Program overview and methodology.' },
      { label: 'Water Risk Atlas', href: 'https://www.wri.org/applications/aqueduct/water-risk-atlas/', note: 'Interactive atlas for baseline water stress and related risks.' },
      { label: 'Aqueduct 4.0 Methodology', href: 'https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators', note: 'Research note defining the water-risk indicators and methodology.' }
    ]
  },
  {
    tab: 'water',
    title: 'Global Forest Watch',
    scope: 'Forest cover and loss',
    kind: 'operational',
    summary: 'Tree-cover change, canopy loss, and land-use pressure tracking for biosphere stress context.',
    links: [
      { label: 'Global Forest Watch', href: 'https://www.globalforestwatch.org/', note: 'Official forest monitoring portal.' }
    ]
  },
  {
    tab: 'water',
    title: 'InforMEA',
    scope: 'Environmental treaty registry',
    kind: 'reference',
    summary: 'Multilateral environmental agreement registry used for policy and governance reference.',
    links: [
      { label: 'InforMEA Portal', href: 'https://www.informea.org/', note: 'UN treaty and environmental-law reference surface.' }
    ]
  },
  {
    tab: 'water',
    title: 'Mekong River Commission',
    scope: 'Lower Mekong basin hydrology',
    kind: 'reference',
    summary: 'Regional hydrology, water levels, and basin monitoring context for Southeast Asia.',
    links: [
      { label: 'MRC Data Portal', href: 'https://portal.mrcmekong.org/', note: 'Official Mekong basin monitoring portal.' }
    ]
  },
  {
    tab: 'water',
    title: 'ICIMOD Regional Database System',
    scope: 'Hindu Kush Himalaya datasets',
    kind: 'reference',
    summary: 'Mountain, glacier, and regional environmental datasets for Himalayan and HKH context.',
    links: [
      { label: 'ICIMOD RDS', href: 'https://rds.icimod.org/', note: 'Current official ICIMOD data surface.' }
    ]
  },
  {
    tab: 'water',
    title: 'SERVIR ClimateSERV',
    scope: 'Regional climate analytics',
    kind: 'reference',
    summary: 'Regional climate-data access and analysis layer useful for drought, vegetation, and rainfall context.',
    links: [
      { label: 'ClimateSERV', href: 'https://climateserv.servirglobal.net/', note: 'SERVIR data access and analysis platform.' }
    ]
  },
  {
    tab: 'energy',
    title: 'U.S. EIA Open Data',
    scope: 'U.S. energy and electricity data',
    kind: 'operational',
    summary: 'Primary U.S. power-sector data source for grid mix, demand, and energy-system baselines.',
    links: [
      { label: 'EIA Open Data', href: 'https://www.eia.gov/opendata/', note: 'Official API and dataset access page.' }
    ]
  },
  {
    tab: 'energy',
    title: 'EPA eGRID',
    scope: 'U.S. grid emissions factors',
    kind: 'operational',
    summary: 'Subregional electricity emissions and generation factors for U.S. operational scoring context.',
    links: [
      { label: 'EPA eGRID', href: 'https://www.epa.gov/egrid', note: 'Official emissions-factor and subregion source.' }
    ]
  },
  {
    tab: 'energy',
    title: 'EPA GHG Emission Factors Hub',
    scope: 'Official factor reference',
    kind: 'operational',
    summary: 'Standard U.S. greenhouse-gas emission-factor reference layer for energy and activity conversions.',
    links: [
      { label: 'GHG Factors Hub', href: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub', note: 'Official factor tables and supporting files.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Electricity Maps',
    scope: 'Grid carbon-intensity documentation',
    kind: 'operational',
    summary: 'Useful for archived grid-carbon snapshots and zone-level power mix interpretation.',
    links: [
      { label: 'Electricity Maps Methodology', href: 'https://www.electricitymaps.com/methodology', note: 'Carbon-intensity calculation and data-quality methodology.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Ember',
    scope: 'Global electricity transition data',
    kind: 'operational',
    summary: 'Global electricity and transition datasets used for annualized power-system comparisons.',
    links: [
      { label: 'Ember Data', href: 'https://ember-energy.org/data/', note: 'Official global electricity data portal.' }
    ]
  },
  {
    tab: 'energy',
    title: 'EDGAR',
    scope: 'Global emissions database',
    kind: 'operational',
    summary: 'Sectoral greenhouse-gas inventory surface for emissions benchmarking and global comparisons.',
    links: [
      { label: 'EDGAR', href: 'https://edgar.jrc.ec.europa.eu/', note: 'Official emissions database portal.' }
    ]
  },
  {
    tab: 'energy',
    title: 'IEA Energy Data',
    scope: 'Global energy statistics',
    kind: 'operational',
    summary: 'Institutional energy statistics and analysis layer for annual energy-system baselines.',
    links: [
      { label: 'Data & Statistics', href: 'https://www.iea.org/data-and-statistics', note: 'Core IEA data catalogue.' },
      { label: 'Energy and AI', href: 'https://www.iea.org/reports/energy-and-ai', note: 'Relevant context for AI and compute demand.' }
    ]
  },
  {
    tab: 'energy',
    title: 'LBNL Data Center Energy Usage Report',
    scope: 'U.S. data-center demand reference',
    kind: 'reference',
    summary: 'Research-grade demand and growth framing for data centers and AI-related compute loads.',
    links: [
      { label: '2024 LBNL Report', href: 'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report', note: 'Lawrence Berkeley National Laboratory publication.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Climate TRACE',
    scope: 'Asset-scale emissions intelligence',
    kind: 'reference',
    summary: 'Independent emissions-estimation layer for facility and sector context.',
    links: [
      { label: 'Climate TRACE', href: 'https://www.climatetrace.org/', note: 'Asset-level emissions tracking platform.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Google Data Centers',
    scope: 'Corporate disclosure layer',
    kind: 'disclosure',
    summary: 'Disclosure-only context for fleet design, efficiency, and water use. Does not directly drive core operational scoring.',
    links: [
      { label: 'Data Centers', href: 'https://datacenters.google/', note: 'Campus and infrastructure overview.' },
      { label: 'Water Stewardship', href: 'https://datacenters.google/water/', note: 'Water use and stewardship disclosures.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Microsoft Sustainability Report',
    scope: 'Corporate disclosure layer',
    kind: 'disclosure',
    summary: 'Structured disclosure context for energy, water, and emissions commitments. Not a direct operational input.',
    links: [
      { label: 'Microsoft Sustainability Report', href: 'https://www.microsoft.com/en-us/corporate-responsibility/sustainability/report', note: 'Official disclosure report.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Meta Sustainability',
    scope: 'Corporate disclosure layer',
    kind: 'disclosure',
    summary: 'Corporate sustainability and infrastructure disclosures kept separate from core grid and water-risk scoring.',
    links: [
      { label: 'Meta Sustainability', href: 'https://sustainability.atmeta.com/', note: 'Official sustainability portal.' }
    ]
  },
  {
    tab: 'energy',
    title: 'Amazon Sustainability',
    scope: 'Corporate disclosure layer',
    kind: 'disclosure',
    summary: 'Corporate reporting layer for broader infrastructure and emissions context, separated from core operational metrics.',
    links: [
      { label: 'Amazon Sustainability', href: 'https://sustainability.aboutamazon.com/', note: 'Official sustainability portal.' }
    ]
  }
];

let graphInstance = null;
let currentSelectedNode = null;
let currentSelectedEdge = null;
let selectionHistory = [];
let studyWorkspaceState = null;
let queuedSelectionToken = 0;
const NODE_BY_ID = new Map(NODES.map(node => [node.id, node]));
const ROUTABLE_NODE_BY_ID = new Map(PUBLISHED_NODES.map(node => [node.id, node]));
const NAVIGATION_STATE_VERSION = 1;
const navigationSessionId = `tulip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
let navigationHistoryReady = false;
let navigationEntryDepth = 0;
const OUTGOING_EDGES_BY_SOURCE = new Map();
const INCOMING_EDGES_BY_TARGET = new Map();
const TRAIL_TARGET_LENGTH = 5;
let owidGlobalData = [];
let owidCatalog = null;
let srcBoundariesData = [];
let earthdataCatalog = null;
let graceCatalog = null;
let powerCatalog = null;
let adbDatasetsData = [];
let escapDatasetsData = [];
let rdsDatasetsData = [];
let asmcDatasetsData = [];
let mrcDatasetsData = [];
let servirDatasetsData = [];
let apccDatasetsData = [];
let jmaDatasetsData = [];
let wmoDatasetsData = [];
let sahfDatasetsData = [];
let mosdacDatasetsData = [];
let drawdownDatasetsData = [];
let pikWbDatasetsData = [];
let kmaImdDatasetsData = [];
let iucnUnblDatasetsData = [];
let unepWesrDatasetsData = [];
let undrrEmdatDatasetsData = [];
let ieaCrDatasetsData = [];
let ipccScenariosDatasetsData = [];
let dataCenterSourcesRegistry = null;
let dataCenterPlatformSummary = null;
let natureClimateCrosswalk = null;
let natureClimateById = new Map();
let natureClimateByName = new Map();
let tulipUrgencyByNodeId = new Map();
let tulipUrgencyStatus = null;
const tulipUrgencyQuery = new URLSearchParams(window.location.search);
const tulipUrgencyHistoricalV2Preview = tulipUrgencyQuery.get('tulipUrgencyVersion') === 'v2';
const tulipUrgencyV3ShadowPreview = tulipUrgencyQuery.get('tulipUrgencyV3') === 'shadow';
let tulipUrgencyMethodVersion = tulipUrgencyHistoricalV2Preview ? 'tulip_urgency_v2' : 'tulip_urgency_v3';









// DOM Cache (Landing View)
const authorAvatar = document.getElementById('author-avatar');
const filterBar = document.getElementById('filter-bar');

// DOM Cache (Study Console)
let studyConsole = null;
let studyControlsOverlay = null;
let analyzeNodeKey = null;
let focusStepBackBtn = null;
let focusHistoryTree = null;
let studyJourneyToggle = null;
let studyJourneyCurrent = null;
let studyHistoryPopover = null;
let studyHistoryReset = null;
let copyViewBtn = null;
let studySharePopover = null;
let copyViewStatus = null;
let nodeSourceDate = null;
let trailPromptPanel = null;
let trailPromptKicker = null;
let trailPromptTitle = null;
let trailPromptBody = null;
let trailUpstreamBtn = null;
let trailDownstreamBtn = null;
let trailUnexpectedBtn = null;
let trailContinueBtn = null;
let trailHeroTitle = null;
let trailHeroMeta = null;
let trailProgressLabel = null;
let analyzeShowMoreBtn = null;
let analyzeShowMoreIcon = null;
let editorialArcsLayer = null;
let editorialArcButtons = [];
let editorialArcsSvg = null;
let editorialArcPaths = { leftTop: null, leftBottom: null, rightTop: null, rightBottom: null };
let editorialArcTriggers = new Map();
let editorialArcCloseTimers = new Map();
let editorialArcHoverZones = new Map();
let consoleNodeName = null;
let consoleSphereBadge = null;
let consoleThreatPercentage = null;
let consoleThreatStatus = null;
let consoleNodeMeaning = null;
let relationshipEvidencePickerSection = null;
let relationshipTriggerSelect = null;
let relationshipEffectSelect = null;
let connectionDetailSection = null;
let connectionDetailHeader = null;
let connectionDetailReason = null;
let connectionDetailEvidence = null;
let consoleNodeSensors = null;
let consoleEarthdataCollections = null;
let consoleGraceCollections = null;
let consolePowerBaselines = null;
let consoleDriversList = null;
let consoleImpactsList = null;
let humanImpactSeverity = null;
let humanImpactReach = null;
let humanImpactSummary = null;
let humanImpactDomains = null;
let humanImpactConsequences = null;
let humanImpactEconomic = null;
let humanImpactHiddenCostItem = null;
let humanImpactHiddenCost = null;
let humanImpactWhoPaysItem = null;
let humanImpactWhoPays = null;
let planetImpactSeverity = null;
let planetImpactReach = null;
let planetImpactSummary = null;
let planetImpactDomains = null;
let planetImpactConsequences = null;
let planetImpactEconomic = null;
let planetImpactPhysicalLimitItem = null;
let planetImpactPhysicalLimit = null;
let responseDefaultDriver = null;
let responseSystemLevers = null;
let phenomenonLensEyebrow = null;
let phenomenonLensTitle = null;
let phenomenonLensIntro = null;
let phenomenonLensScale = null;
let phenomenonLensSource = null;
let phenomenonLensAxis = null;
let phenomenonLensRows = null;
let phenomenonLensTakeaway = null;
let monitoringSourceToggle = null;
let monitoringSourceContent = null;
let registriesDashboard = null;
let openRegistriesBtn = null;
let dashboardActiveNodeName = null;
let footerRegistries = null;
let urgencyAxisInfoToggle = null;
let urgencyAxisPopover = null;
let urgencyAxisInfoIcon = null;
let urgencyAxisInfoLabel = null;
let lastUrgencyAxisPointerToggleAt = 0;

let registriesCommonMode = false;

EDGES.forEach(edge => {
  if (!OUTGOING_EDGES_BY_SOURCE.has(edge.source)) {
    OUTGOING_EDGES_BY_SOURCE.set(edge.source, []);
  }
  OUTGOING_EDGES_BY_SOURCE.get(edge.source).push(edge);

  if (!INCOMING_EDGES_BY_TARGET.has(edge.target)) {
    INCOMING_EDGES_BY_TARGET.set(edge.target, []);
  }
  INCOMING_EDGES_BY_TARGET.get(edge.target).push(edge);
});

const REGISTRY_CARD_IDS = [
  'nasa-datasets-card',
  'eonet-events-card',
  'noaa-datasets-card',
  'cds-datasets-card',
  'ecmwf-datasets-card',
  'edgar-datasets-card',
  'owid-datasets-card',
  'asmc-datasets-card',
  'apcc-datasets-card',
  'jma-datasets-card',
  'wmo-datasets-card',
  'sahf-datasets-card',
  'pik-wb-datasets-card',
  'kma-imd-datasets-card',
  'climate-gov-resources-card',
  'gfw-datasets-card',
  'gbif-datasets-card',
  'rds-datasets-card',
  'mrc-datasets-card',
  'servir-datasets-card',
  'mosdac-datasets-card',
  'faostat-datasets-card',
  'wri-datasets-card',
  'gcp-datasets-card',
  'gcb-datasets-card',
  'iucn-unbl-datasets-card',
  'unep-wesr-datasets-card',
  'data-center-intel-card',
  'src-datasets-card',
  'adb-datasets-card',
  'unep-datasets-card',
  'informea-datasets-card',
  'escap-datasets-card',
  'drawdown-datasets-card',
  'undrr-emdat-datasets-card',
  'iea-cr-transition-card',
  'ipcc-scenarios-card'
];

const REGISTRY_LIST_META = [
  { listId: 'nasa-datasets-list', label: 'NASA Earthdata registry entries' },
  { listId: 'eonet-events-list', label: 'NASA EONET event feeds' },
  { listId: 'noaa-datasets-list', label: 'NOAA NCEI registry entries' },
  { listId: 'cds-datasets-list', label: 'Copernicus Climate Data Store entries' },
  { listId: 'ecmwf-datasets-list', label: 'ECMWF archive records' },
  { listId: 'edgar-datasets-list', label: 'EDGAR emissions datasets' },
  { listId: 'owid-datasets-list', label: 'Our World in Data datasets' },
  { listId: 'asmc-datasets-list', label: 'ASMC climate datasets' },
  { listId: 'apcc-datasets-list', label: 'APCC climate datasets' },
  { listId: 'jma-datasets-list', label: 'JMA climate datasets' },
  { listId: 'wmo-datasets-list', label: 'WMO registry datasets' },
  { listId: 'sahf-datasets-list', label: 'SAHF forum datasets' },
  { listId: 'pik-wb-datasets-list', label: 'PIK and World Bank projections' },
  { listId: 'kma-imd-datasets-list', label: 'National climate service datasets' },
  { listId: 'gfw-datasets-list', label: 'Global Forest Watch datasets' },
  { listId: 'gbif-datasets-list', label: 'GBIF biodiversity datasets' },
  { listId: 'rds-datasets-list', label: 'ICIMOD RDS datasets' },
  { listId: 'mrc-datasets-list', label: 'Mekong River Commission datasets' },
  { listId: 'servir-datasets-list', label: 'SERVIR regional datasets' },
  { listId: 'mosdac-datasets-list', label: 'MOSDAC satellite datasets' },
  { listId: 'faostat-datasets-list', label: 'FAOSTAT datasets' },
  { listId: 'wri-datasets-list', label: 'WRI Resource Watch datasets' },
  { listId: 'gcp-datasets-list', label: 'Global Carbon Project datasets' },
  { listId: 'gcb-datasets-list', label: 'Global Carbon Budget datasets' },
  { listId: 'iucn-unbl-datasets-list', label: 'IUCN and UN Biodiversity datasets' },
  { listId: 'unep-wesr-datasets-list', label: 'UNEP WESR sensing datasets' },
  { listId: 'data-center-intel-list', label: 'Data center intelligence sources' },
  { listId: 'src-datasets-list', label: 'Stockholm Resilience Centre datasets' },
  { listId: 'adb-datasets-list', label: 'Asian Development Bank datasets' },
  { listId: 'unep-datasets-list', label: 'UNEP indicator datasets' },
  { listId: 'informea-datasets-list', label: 'InforMEA treaty references' },
  { listId: 'escap-datasets-list', label: 'UN ESCAP datasets' },
  { listId: 'drawdown-datasets-list', label: 'Project Drawdown resources' },
  { listId: 'undrr-emdat-datasets-list', label: 'Disaster risk datasets' },
  { listId: 'iea-cr-transition-list', label: 'IEA transition datasets' },
  { listId: 'ipcc-scenarios-list', label: 'IPCC scenario datasets' }
];

let tulipScorePopup = null;
let aboutPopup = null;

let footerExplore = null;
let footerAnalyse = null;
let footerPhenomena = null;
let footerPersonalFootprint = null;
let phenomenaView = null;
let phenomenaSelector = null;
let phenomenaAnalyzeBtn = null;
let phenomenaFocusSphere = null;
let phenomenaFocusName = null;
let phenomenaFocusIcon = null;
let phenomenaFocusNameText = null;
let phenomenaFocusDescription = null;
let currentPhenomenonNode = null;
let currentPhenomenonMode = 'footprint';
let phenomenonModeFootprintBtn = null;
let phenomenonModeActionsBtn = null;
let phenomenonLensPanel = null;
let phenomenonActionsPanel = null;
let phenomenonActionBridgeKicker = null;
let phenomenonActionBridgeTitle = null;
let phenomenonActionBridgeNote = null;
let phenomenonActionBridgeBtn = null;
let actionsFocusConfidence = null;
let actionsFocusStrongest = null;
let actionsFocusWhy = null;
let actionsFocusSystem = null;
let actionsPersonalList = null;
let actionsCommunityList = null;
let actionsPolicyList = null;
let actionsImpactPersonalList = null;
let actionsImpactCommunityList = null;
let actionsImpactPolicyList = null;
let personalFootprintView = null;
let personalFootprintFocusNameText = null;
let personalFootprintGlobalRank = null;
let personalFootprintFocusDescription = null;
let personalFootprintSummaryTitle = null;
let personalFootprintSummaryNote = null;
let personalFootprintMetricStrip = null;
let personalFootprintQuestions = null;
let personalFootprintDrivers = null;
let personalFootprintMethod = null;
let personalFootprintBreakdown = null;

const PERSONAL_FOOTPRINT_QUESTIONS = [
  {
    key: 'geography',
    title: 'Where are you located?',
    help: 'This sets your starting baseline. Different places have very different energy grids and transport patterns.',
    role: 'contextual',
    options: [
      { value: 'clean_transit', label: 'Nordics / France / Switzerland', note: 'Cleaner electricity and stronger transit. Typical home-energy baseline is about 1.8 tCO2e/yr before home-specific choices.', gridMultiplier: 0.6, transportMultiplier: 0.75, flightsMultiplier: 1.0, homeBaselineCarbon: 1.8 },
      { value: 'clean_car', label: 'US Pacific Northwest / Parts of Latin America', note: 'Cleaner electricity, but more car dependence. Typical home-energy baseline is about 2.6 tCO2e/yr before home-specific choices.', gridMultiplier: 0.7, transportMultiplier: 1.1, flightsMultiplier: 1.0, homeBaselineCarbon: 2.6 },
      { value: 'mixed_transit', label: 'UK / Japan / South Korea', note: 'More mixed electricity with good transit. Typical home-energy baseline is about 3.0 tCO2e/yr before home-specific choices.', gridMultiplier: 1.0, transportMultiplier: 0.8, flightsMultiplier: 1.0, homeBaselineCarbon: 3.0 },
      { value: 'mixed_car', label: 'Most of the US / Canada', note: 'More mixed electricity and higher car dependence. Typical home-energy baseline is about 4.3 tCO2e/yr before home-specific choices.', gridMultiplier: 1.0, transportMultiplier: 1.1, flightsMultiplier: 1.0, homeBaselineCarbon: 4.3 },
      { value: 'fossil_transit', label: 'China / India / Southeast Asia', note: 'More fossil-heavy electricity with mixed transit access. Typical home-energy baseline is about 4.8 tCO2e/yr before home-specific choices.', gridMultiplier: 1.3, transportMultiplier: 0.9, flightsMultiplier: 1.0, homeBaselineCarbon: 4.8 },
      { value: 'fossil_car', label: 'Australia / Middle East / South Africa', note: 'More fossil-heavy electricity and higher car dependence. Typical home-energy baseline is about 5.8 tCO2e/yr before home-specific choices.', gridMultiplier: 1.3, transportMultiplier: 1.2, flightsMultiplier: 1.0, homeBaselineCarbon: 5.8 }
    ]
  },
  {
    key: 'hvac',
    title: 'How much heating or air conditioning do you use?',
    help: 'This adjusts your home energy use.',
    role: 'contextual',
    options: [
      { value: 'rarely', label: 'Rarely', note: 'Minimal heating or cooling', hvacMultiplier: 0.8, co2: 0, nature: 0, water: 0, material: 0 },
      { value: 'seasonally', label: 'Seasonally', note: 'Typical summer or winter use', hvacMultiplier: 1.0, co2: 0, nature: 0, water: 0, material: 0 },
      { value: 'heavily', label: 'Almost year-round', note: 'Heavy heating or cooling demand', hvacMultiplier: 1.2, co2: 0, nature: 0, water: 0, material: 0 }
    ]
  },
  {
    key: 'household_size',
    title: 'How many people share your home and its energy use?',
    help: 'This adjusts your share of home energy use.',
    role: 'contextual',
    options: [
      { value: 'solo', label: '1 Person', note: 'You carry the full home share', homeMultiplier: 1.18, co2: 0, nature: 0, water: 0, material: 0 },
      { value: 'two', label: '2 People', note: 'A typical shared-home baseline', homeMultiplier: 1.0, co2: 0, nature: 0, water: 0, material: 0 },
      { value: 'three', label: '3 People', note: 'Energy is spread across more people', homeMultiplier: 0.82, co2: 0, nature: 0, water: 0, material: 0 },
      { value: 'four', label: '4 People', note: 'Energy is spread across more people', homeMultiplier: 0.68, co2: 0, nature: 0, water: 0, material: 0 },
      { value: 'five_plus', label: '5+ People', note: 'The per-person home share is lower', homeMultiplier: 0.58, co2: 0, nature: 0, water: 0, material: 0 }
    ]
  },
  {
    key: 'home_type',
    title: 'Which home feels most like yours?',
    help: 'A simple proxy for home size and type.',
    role: 'direct',
    module: 'home',
    options: [
      { value: 'small_apt', label: 'Small Apartment / Shared Room', note: 'Compact home', co2: 0, nature: 1, water: 2, material: 2, homeDemandMultiplier: 0.65 },
      { value: 'average_apt', label: 'Average Apartment / Condo', note: 'Typical multi-unit home', co2: 0, nature: 2, water: 3, material: 3, homeDemandMultiplier: 1.0 },
      { value: 'small_house', label: 'Small Townhome / House', note: 'Smaller attached or detached home', co2: 0, nature: 4, water: 4, material: 5, homeDemandMultiplier: 1.35 },
      { value: 'average_house', label: 'Average Detached House', note: 'Typical detached home', co2: 0, nature: 6, water: 6, material: 7, homeDemandMultiplier: 1.75 },
      { value: 'large_house', label: 'Large Detached House', note: 'Large home with a bigger material footprint', co2: 0, nature: 9, water: 8, material: 10, homeDemandMultiplier: 2.4 }
    ]
  },
  {
    key: 'home_energy',
    title: 'Compared with similar homes in your area, how energy-intensive is yours?',
    help: 'This moves your local baseline up or down based on how much energy your home uses.',
    role: 'direct',
    module: 'home',
    options: [
      { value: 'lower_area', label: 'Lower Than Typical for My Area', note: 'Smaller bills or lighter heating and cooling', co2: 0, nature: 1, water: 2, material: 2, homeUseMultiplier: 0.75 },
      { value: 'typical_area', label: 'About Typical for My Area', note: 'Roughly average for similar homes nearby', co2: 0, nature: 2, water: 3, material: 3, homeUseMultiplier: 1.0 },
      { value: 'higher_area', label: 'Higher Than Typical for My Area', note: 'More space, more appliances, or heavier HVAC use', co2: 0, nature: 3, water: 4, material: 4, homeUseMultiplier: 1.3 },
      { value: 'very_high_area', label: 'Much Higher Than Typical for My Area', note: 'Very high home energy demand', co2: 0, nature: 4, water: 5, material: 5, homeUseMultiplier: 1.65 }
    ]
  },
  {
    key: 'everyday_travel',
    title: 'In a typical week, how do you mostly get around?',
    help: 'Your usual day-to-day travel pattern.',
    role: 'direct',
    module: 'travel',
    options: [
      { value: 'walk_transit', label: 'Mostly Walk, Bike, or Transit', note: 'Low-carbon daily travel', co2: 0.4, nature: 1, water: 1, material: 1 },
      { value: 'mixed', label: 'Mix Of Transit and Occasional Car', note: 'A mixed travel pattern', co2: 1.2, nature: 2, water: 3, material: 3 },
      { value: 'small_ev', label: 'Mostly Drive a Smaller Car / EV', note: 'More efficient private travel', co2: 1.2, nature: 6, water: 9, material: 10 },
      { value: 'regular_gas', label: 'Mostly Drive a Regular Gas Car', note: 'Typical private-car commuting', co2: 3.8, nature: 4, water: 4, material: 5 },
      { value: 'multiple_cars', label: 'Multiple Cars / Long Daily Drives', note: 'High private travel demand', co2: 6.0, nature: 8, water: 10, material: 14 }
    ]
  },
  {
    key: 'flights',
    title: 'About how much flying do you do in a year?',
    help: 'Include both work and personal flights.',
    role: 'direct',
    module: 'travel',
    options: [
      { value: 'rare', label: 'Rarely or Never', note: 'Minimal flight impact', co2: 0.1, nature: 0.1, water: 0.1, material: 0.1 },
      { value: 'annual', label: '1-2 Shorter Trips', note: 'Occasional flying', co2: 1.2, nature: 0.5, water: 0.5, material: 0.5 },
      { value: 'regular', label: 'About 1 Long-haul / 3-4 Shorter', note: 'Moderate flying', co2: 3.0, nature: 1, water: 1, material: 1 },
      { value: 'frequent', label: '2+ Long-haul / 5-8 Shorter', note: 'Frequent flying', co2: 6.0, nature: 2, water: 2, material: 2 },
      { value: 'very_frequent', label: 'Very Frequent Flyer', note: 'High volume air travel', co2: 10.0, nature: 4, water: 3, material: 3 }
    ]
  },
  {
    key: 'diet',
    title: 'Which option best matches how you usually eat?',
    help: 'A simple diet proxy based on your usual habits.',
    role: 'direct',
    module: 'food',
    options: [
      { value: 'vegan', label: 'Vegan', note: 'No animal products', co2: 1.0, nature: 5, water: 10, material: 4 },
      { value: 'vegetarian', label: 'Vegetarian', note: 'No meat, some dairy/eggs', co2: 1.5, nature: 8, water: 14, material: 6 },
      { value: 'plant_forward', label: 'Mostly Plant-forward', note: 'Mostly plants, occasional meat', co2: 2.1, nature: 12, water: 18, material: 8 },
      { value: 'mixed', label: 'Mixed Diet', note: 'Meat a few times a week', co2: 3.3, nature: 20, water: 25, material: 11 },
      { value: 'meat_heavy', label: 'Meat With Most Meals', note: 'Frequent meat and dairy', co2: 4.7, nature: 30, water: 32, material: 14 }
    ]
  },
  {
    key: 'food_waste',
    title: 'How much food from your home usually goes uneaten?',
    help: 'Think about spoilage, leftovers, and food you throw away.',
    role: 'direct',
    module: 'food',
    options: [
      { value: 'very_low', label: 'Very Little', note: 'Meals are planned well', co2: 0.1, nature: 1, water: 1, material: 1 },
      { value: 'some', label: 'Some Leftovers Now and Then', note: 'Some spoilage or uneaten food', co2: 0.4, nature: 3, water: 3, material: 2 },
      { value: 'average', label: 'About Average', note: 'Standard household pattern', co2: 0.8, nature: 5, water: 5, material: 3 },
      { value: 'high', label: 'Quite a Bit Most Weeks', note: 'Frequent uneaten food', co2: 1.2, nature: 8, water: 7, material: 5 }
    ]
  },
  {
    key: 'new_clothes',
    title: 'How often do you buy new clothes or shoes?',
    help: 'Includes clothing, shoes, and accessories.',
    role: 'direct',
    module: 'stuff',
    options: [
      { value: 'rare', label: 'Rarely (mostly repair / secondhand)', note: 'Very few new purchases', co2: 0.2, nature: 1, water: 2, material: 1 },
      { value: 'occasional', label: 'A Few Times a Year', note: 'Seasonal basics', co2: 0.5, nature: 3, water: 10, material: 3 },
      { value: 'monthly', label: 'New Items Most Months', note: 'Regular clothing shopping', co2: 1.0, nature: 6, water: 20, material: 6 },
      { value: 'frequent', label: 'Frequent Refreshes / Trend-led', note: 'High-turnover clothing buying', co2: 1.8, nature: 12, water: 35, material: 10 }
    ]
  },
  {
    key: 'other_stuff',
    title: 'How often do you buy new things for yourself or your home, like electronics, décor, furniture, hobby gear, or replacement items?',
    help: 'Excludes groceries and clothing.',
    role: 'direct',
    module: 'stuff',
    options: [
      { value: 'rare', label: 'Rarely', note: 'Repair-first, light buying', co2: 0.2, nature: 1, water: 1, material: 2 },
      { value: 'occasional', label: 'A Few Times a Year', note: 'Moderate replacement cycle', co2: 0.6, nature: 3, water: 3, material: 8 },
      { value: 'bimonthly', label: 'Every Month or Two', note: 'Regular convenience buying', co2: 1.2, nature: 5, water: 5, material: 16 },
      { value: 'monthly', label: 'Most Months', note: 'Frequent retail or online orders', co2: 2.0, nature: 8, water: 8, material: 24 },
      { value: 'heavy', label: 'Large or Frequent Purchases', note: 'Constant flow of new goods', co2: 3.5, nature: 12, water: 12, material: 38 }
    ]
  }
];

let personalFootprintState = {
  geography: null,
  hvac: null,
  household_size: null,
  home_type: null,
  home_energy: null,
  everyday_travel: null,
  flights: null,
  diet: null,
  food_waste: null,
  new_clothes: null,
  other_stuff: null
};

const PERSONAL_FOOTPRINT_BASELINE_SELECTIONS = Object.freeze({
  geography: 'mixed_car',
  hvac: 'seasonally',
  household_size: 'two',
  home_type: 'average_apt',
  home_energy: 'typical_area',
  everyday_travel: 'mixed',
  flights: 'annual',
  diet: 'mixed',
  food_waste: 'some',
  new_clothes: 'occasional',
  other_stuff: 'occasional'
});

const PERSONAL_FOOTPRINT_LABELS = {
  geography: 'Geography',
  hvac: 'HVAC Usage',
  household_size: 'Household Size',
  home_type: 'Home Type',
  home_energy: 'Home Energy',
  everyday_travel: 'Everyday Travel',
  flights: 'Flights',
  diet: 'Diet',
  food_waste: 'Food Waste',
  new_clothes: 'Clothing',
  other_stuff: 'Other Purchases'
};

const PERSONAL_FOOTPRINT_BENCHMARKS = Object.freeze({
  carbon: { low: 3.5, average: 6.6, high: 40.0 },
  nature: { low: 20.0, average: 50.0, high: 75.0 },
  water: { low: 25.0, average: 60.0, high: 80.0 },
  material: { low: 20.0, average: 45.0, high: 75.0 }
});

// Benchmark-calibrated physical estimates. Land is anchored to the JRC's
// global-average cropland footprint (0.19 ha/person), water to the Water
// Footprint Network global-consumer estimate (1,385 m3/yr), and materials to
// the UN SDG 12.2.1 global material footprint (about 12.3 t/person in 2022). The
// question-level values distribute those annual benchmarks across sections.
const PERSONAL_FOOTPRINT_PHYSICAL_FACTORS = Object.freeze({
  landM2PerPoint: 1900 / PERSONAL_FOOTPRINT_BENCHMARKS.nature.average,
  waterM3PerPoint: 1385 / PERSONAL_FOOTPRINT_BENCHMARKS.water.average,
  materialTonnesPerPoint: 12.3 / PERSONAL_FOOTPRINT_BENCHMARKS.material.average
});

const PERSONAL_FOOTPRINT_ANNUAL_REFERENCES = Object.freeze({
  carbonTonnes: PERSONAL_FOOTPRINT_BENCHMARKS.carbon.average,
  waterM3: 1385,
  landM2: 1900,
  materialTonnes: 12.3
});

const PERSONAL_FOOTPRINT_MODULES = Object.freeze([
  { key: 'home', label: 'Home' },
  { key: 'travel', label: 'Travel' },
  { key: 'food', label: 'Food' },
  { key: 'stuff', label: 'Purchasing' }
]);


let personalFootprintPreviousMetrics = null;
let personalFootprintLastInteraction = null;
let personalFootprintStartedTracked = false;
let personalFootprintCompletedTracked = false;


const makeLineIcon = paths => `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">${paths}</svg>`;

const PHENOMENON_ICONS = {
  diet: makeLineIcon('<path d="M4.9 2.8v3.9M6.2 2.8v3.9M7.5 2.8v3.9M6.2 6.7V13" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><path d="M10.8 4.3c0-1.1-.8-1.9-1.9-1.9v1.9c0 1 .8 1.9 1.9 1.9V13" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/><path d="M11.5 9.4c0-1.9 1.2-3 2.1-3-.1 1.8-.8 2.9-2.1 3.5" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/>'),
  industryFarming: makeLineIcon('<path d="M2.8 12.7h10.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M4.1 12.7V8.1l3.9-2.4 3.9 2.4v4.6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.8 12.7V9.8h1.6v2.9M9.4 9.3h1.2M9.4 11h1.2" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.9 9.8c1-.9 2.1-.9 3.1 0" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  methane: makeLineIcon('<path d="M8 2.3c2.1 2.5 3.9 4.3 3.9 6.4a3.9 3.9 0 1 1-7.8 0c0-2.1 1.8-4 3.9-6.4Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6.2 8.9c.7-.7 1.3-.9 1.8-.9.6 0 1.1.2 1.8.9M6.6 10.7h2.8" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>'),
  carbon: makeLineIcon('<circle cx="8" cy="8" r="2.7" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="2.8" r="1.3" stroke="currentColor" stroke-width="1.1"/><circle cx="12.4" cy="10.5" r="1.3" stroke="currentColor" stroke-width="1.1"/><circle cx="3.6" cy="10.5" r="1.3" stroke="currentColor" stroke-width="1.1"/><path d="M8 4.1v2.2M10.1 9.3 11.3 10M5.9 9.3 4.7 10" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>'),
  electricity: makeLineIcon('<path d="M8.8 2.3 5.1 8h2.5L7 13.7 10.9 8H8.3l.5-5.7Z" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M3.6 13h8.8" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/>'),
  conveyance: makeLineIcon('<path d="M3.1 9.5h9.8l-.8-2.3c-.2-.7-.8-1.1-1.5-1.1H5.4c-.7 0-1.3.4-1.5 1.1l-.8 2.3Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M4.4 9.5V11M11.6 9.5V11" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="5.3" cy="11" r=".9" stroke="currentColor" stroke-width="1.1"/><circle cx="10.7" cy="11" r=".9" stroke="currentColor" stroke-width="1.1"/>'),
  logistics: makeLineIcon('<path d="M2.8 6.4h5.7v4.1H2.8V6.4Zm5.7 1.1h2l1.4 1.6v1.4H8.5V7.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M10.1 8.4h1.3" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/><circle cx="5" cy="11.2" r=".85" stroke="currentColor" stroke-width="1.1"/><circle cx="10.9" cy="11.2" r=".85" stroke="currentColor" stroke-width="1.1"/>'),
  foodWaste: makeLineIcon('<path d="M5.3 4.3h5.4M6.2 4.3v-1h3.6v1m-4.1 0-.4 6.8c0 .7.5 1.2 1.1 1.2h3.1c.6 0 1.1-.5 1.1-1.2l-.4-6.8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.4 6.1v3.9M8.9 6.1v3.9" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/><path d="M3 5.8c.8-.8 1.7-.7 2.6.1" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  fertilizers: makeLineIcon('<path d="M8 12.9V9.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M8 9.1c0-2 1.7-3.7 3.8-3.7v.8c0 2-1.8 3.7-3.8 3.7Zm0 0c0-1.9-1.6-3.5-3.5-3.5v.8c0 1.9 1.6 3.5 3.5 3.5Z" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.2 12h3.6" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/><path d="M11.8 3.4v2.1M10.8 4.5h2" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  mining: makeLineIcon('<path d="m4 12.4 2.7-2.7M8.1 8.3 12 4.4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/><path d="M7.2 7.4 5.5 5.7M9.2 10.3l-1.6-1.6" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/><path d="m10.8 5.6 1.7-1.7M3.5 12.9h9" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>'),
  housing: makeLineIcon('<path d="M3.4 7.3 8 3.8l4.6 3.5v5.1H3.4V7.3Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M6.5 12.4V9.5h3v2.9" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>'),
  buildingOps: makeLineIcon('<path d="M3.7 12.8V3.8h4.9v9M8.6 6.4h3.7v6.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.2 5.2h1.2M5.2 7.2h1.2M5.2 9.2h1.2M10 8.2h1.1M10 10.2h1.1" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  deforestation: makeLineIcon('<path d="M8 12.8V9.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M8 9.3c0-2.1 1.8-3.8 3.9-3.8v.8c0 2.1-1.8 3.8-3.9 3.8Zm0 0c0-2-1.6-3.6-3.6-3.6v.8c0 2 1.6 3.6 3.6 3.6Z" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.4 12.8h7.2M10.7 4.1l1.6-1.6" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  petroplastics: makeLineIcon('<path d="M6.3 3.1h3.4M7 3.1v2.3l-1.7 2.1a3.3 3.3 0 0 0-.8 2.1 2.5 2.5 0 0 0 2.5 2.5h1.9a2.5 2.5 0 0 0 2.5-2.5c0-.8-.3-1.5-.8-2.1L9 5.4V3.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.6 8.5h4.8" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  dataCenters: makeLineIcon('<rect x="3.1" y="3.2" width="9.8" height="2.8" rx="1" stroke="currentColor" stroke-width="1.15"/><rect x="3.1" y="7.4" width="9.8" height="2.8" rx="1" stroke="currentColor" stroke-width="1.15"/><rect x="3.1" y="11.6" width="9.8" height="1.2" rx=".6" fill="currentColor"/><path d="M5.1 4.6h.01M5.1 8.8h.01M7.6 4.6h2.8M7.6 8.8h2.8" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  aiCompute: makeLineIcon('<rect x="3.4" y="3.4" width="9.2" height="9.2" rx="1.6" stroke="currentColor" stroke-width="1.15"/><path d="M6 6h4v4H6z" stroke="currentColor" stroke-width="1.05"/><path d="M8 1.9v1.5M8 12.6v1.5M1.9 8h1.5M12.6 8h1.5M4.2 4.2l.8.8M11 11l.8.8M11.8 4.2l-.8.8M5 11l-.8.8" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><path d="m10.9 4.2 1.2-1.2" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  shipping: makeLineIcon('<path d="M2.9 10.2h10.2M4.2 10.2l1.4-2.3h4.2l1.5 2.3" stroke="currentColor" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.8 11.7c.8-.6 1.6-.6 2.4 0 .8.6 1.6.6 2.4 0 .8-.6 1.6-.6 2.4 0 .8.6 1.6.6 2.4 0" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/><path d="M6.9 6.3h2.2" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  construction: makeLineIcon('<path d="M3.2 12.8h9.6M5 12.8V7.7l3-2.2 3 2.2v5.1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 7.1h8" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/><path d="M8 8.9v3.9" stroke="currentColor" stroke-width="1.05" stroke-linecap="round"/>'),
  refrigerants: makeLineIcon('<path d="M8 2.4v11.2M4.5 4.5l7 7M11.5 4.5l-7 7M2.4 8h11.2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><circle cx="8" cy="8" r="1.1" fill="currentColor"/>')
};

const PHENOMENON_SELECTOR_ITEMS = [
  { key: 'food', label: 'Diet', nodeIds: ['food'], icon: PHENOMENON_ICONS.diet },
  { key: 'industry_farming', label: 'Industry Farming', nodeIds: ['industry_farming'], icon: PHENOMENON_ICONS.industryFarming },
  { key: 'methane', label: 'Methane', nodeIds: ['methane'], icon: PHENOMENON_ICONS.methane },
  { key: 'carbon_emission', label: 'Carbon', nodeIds: ['carbon_emission'], icon: PHENOMENON_ICONS.carbon },
  { key: 'electricity_generation', label: 'Electricity', nodeIds: ['carbon_emission'], lensKey: 'electricity_generation', description: 'Electricity generation shows the upstream power mix behind many other footprints, especially coal- and gas-heavy grids that lock in large annual emissions.', icon: PHENOMENON_ICONS.electricity },
  { key: 'personal_conveyance', label: 'Conveyance', nodeIds: ['personal_conveyance'], icon: PHENOMENON_ICONS.conveyance },
  { key: 'road_freight_logistics', label: 'Logistics', nodeIds: ['personal_conveyance'], lensKey: 'road_freight_logistics', description: 'Road freight and logistics track the movement of goods through trucks, vans, warehousing, and cold-chain systems that keep freight emissions structurally high.', icon: PHENOMENON_ICONS.logistics },
  { key: 'food_waste', label: 'Food Waste', nodeIds: ['food_waste'], icon: PHENOMENON_ICONS.foodWaste },
  { key: 'fertilizer_production', label: 'Fertilizers', nodeIds: ['fertilizer_production'], icon: PHENOMENON_ICONS.fertilizers },
  { key: 'mining_critical_minerals', label: 'Mining', nodeIds: ['mining_critical_minerals'], icon: PHENOMENON_ICONS.mining },
  { key: 'urban_sprawl_housing', label: 'Housing', nodeIds: ['urban_sprawl_housing'], icon: PHENOMENON_ICONS.housing },
  { key: 'building_operations', label: 'Building Operations', nodeIds: ['urban_sprawl_housing'], lensKey: 'building_operations', description: 'Building operations capture the ongoing climate burden from electricity, heating, cooling, and onsite fuel use across homes, offices, and commercial buildings.', icon: PHENOMENON_ICONS.buildingOps },
  { key: 'deforestation_land_use', label: 'Deforestation', nodeIds: ['deforestation'], icon: PHENOMENON_ICONS.deforestation },
  { key: 'plastics_petrochemicals', label: 'Petroplastics', nodeIds: ['plastics_petrochemicals'], icon: PHENOMENON_ICONS.petroplastics },
  { key: 'data_centers', label: 'Data Centers', nodeIds: ['data_centers'], icon: PHENOMENON_ICONS.dataCenters },
  { key: 'ai_compute', label: 'AI Compute', nodeIds: ['ai_data_centers'], icon: PHENOMENON_ICONS.aiCompute },
  { key: 'aviation_shipping', label: 'Shipping', nodeIds: ['aviation', 'shipping'], icon: PHENOMENON_ICONS.shipping },
  { key: 'cement_steel', label: 'Construction', nodeIds: ['cement_concrete', 'steel'], icon: PHENOMENON_ICONS.construction },
  { key: 'air_conditioning_refrigerants', label: 'Refrigerants', nodeIds: ['air_conditioning_refrigerants'], icon: PHENOMENON_ICONS.refrigerants }
];

const REGISTRY_COVERAGE_SPHERES = [
  'atmosphere', 'oceans', 'cryosphere', 'freshwater', 'biosphere', 'agriculture',
  'energy', 'digital', 'transport', 'economy', 'sociopolitical', 'health'
];

const REGISTRY_SOURCE_STATUS_META = {
  official_registry_link: { label: 'Official registry', shortLabel: 'Registry', rgb: '96, 165, 250' },
  web_verified_official: { label: 'Official web source', shortLabel: 'Official web', rgb: '34, 211, 238' },
  primary_research_link: { label: 'Primary research', shortLabel: 'Research', rgb: '74, 222, 128' },
  node_specific_rehabilitation: { label: 'Node-specific repair', shortLabel: 'Node repair', rgb: '196, 181, 253' },
  relationship_dossier_readback: { label: 'Relationship dossier', shortLabel: 'Dossier', rgb: '251, 191, 36' },
  reviewed_phenomenon: { label: 'Reviewed phenomenon', shortLabel: 'Reviewed', rgb: '251, 113, 133' },
  source_backed_operational_concept: { label: 'Source-backed concept', shortLabel: 'Operational', rgb: '163, 230, 53' },
  curated_response_reference: { label: 'Curated response source', shortLabel: 'Response', rgb: '249, 115, 22' },
  undocumented: { label: 'Not documented', shortLabel: 'Missing', rgb: '148, 163, 184' }
};

function formatRegistrySphereLabel(sphere) {
  const labels = {
    freshwater: 'Freshwater',
    health: 'Health'
  };
  return labels[sphere] || SPHERE_LABELS[sphere] || String(sphere || 'Unknown').replaceAll('_', ' ');
}

function getRegistryNodeSourceStatus(node) {
  return node?.source_status
    || node?.calibration?.source_status
    || node?.authenticity?.status
    || 'undocumented';
}

function getRegistrySourceStatusMeta(status, index = 0) {
  const fallbackColors = [
    '96, 165, 250', '34, 211, 238', '74, 222, 128', '196, 181, 253',
    '251, 191, 36', '251, 113, 133', '163, 230, 53', '249, 115, 22'
  ];
  return REGISTRY_SOURCE_STATUS_META[status] || {
    label: String(status || 'undocumented').replaceAll('_', ' '),
    shortLabel: String(status || 'undocumented').replaceAll('_', ' '),
    rgb: fallbackColors[index % fallbackColors.length]
  };
}

function renderRegistryCoverageCockpit(backlogRegistry = null) {
  const root = document.getElementById('registry-coverage-cockpit');
  if (!root) return;

  const nodeCount = PUBLISHED_NODES.length;
  const relationshipCount = PUBLISHED_EDGES.length;
  const metricContractCount = PUBLISHED_NODES.filter(node => (
    node?.graph_contract?.metric_contract_status === 'defined' || Boolean(node?.metric_contract)
  )).length;
  const missingMetricContractCount = Math.max(nodeCount - metricContractCount, 0);
  const relationshipLevels = PUBLISHED_EDGES.reduce((counts, edge) => {
    const level = edge?.evidence?.relationship_level || 'unclassified';
    counts[level] = (counts[level] || 0) + 1;
    return counts;
  }, {});
  const directRelationshipCount = relationshipLevels.direct || 0;
  const indirectRelationshipCount = relationshipLevels.indirect || 0;
  const otherRelationshipCount = Math.max(relationshipCount - directRelationshipCount - indirectRelationshipCount, 0);

  const sphereCounts = REGISTRY_COVERAGE_SPHERES.map(sphere => ({
    sphere,
    label: formatRegistrySphereLabel(sphere),
    count: PUBLISHED_NODES.filter(node => node.sphere === sphere).length
  }));
  const maximumSphereCount = Math.max(...sphereCounts.map(item => item.count), 1);

  const sourceStatusCounts = PUBLISHED_NODES.reduce((counts, node) => {
    const status = getRegistryNodeSourceStatus(node);
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {});
  const preferredStatusOrder = Object.keys(REGISTRY_SOURCE_STATUS_META);
  const sourceStatuses = Object.entries(sourceStatusCounts)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => {
      const aIndex = preferredStatusOrder.indexOf(a.status);
      const bIndex = preferredStatusOrder.indexOf(b.status);
      if (aIndex === -1 && bIndex === -1) return b.count - a.count;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    })
    .map((item, index) => ({ ...item, meta: getRegistrySourceStatusMeta(item.status, index) }));

  const heatmapRows = REGISTRY_COVERAGE_SPHERES.map(sphere => ({
    sphere,
    label: formatRegistrySphereLabel(sphere),
    cells: sourceStatuses.map(item => ({
      ...item,
      count: PUBLISHED_NODES.filter(node => node.sphere === sphere && getRegistryNodeSourceStatus(node) === item.status).length
    }))
  }));
  const maximumHeatmapCount = Math.max(...heatmapRows.flatMap(row => row.cells.map(cell => cell.count)), 1);

  const campaignRecords = Array.isArray(backlogRegistry?.campaign_records)
    ? backlogRegistry.campaign_records
    : Array.isArray(backlogRegistry?.nodes)
      ? backlogRegistry.nodes
      : [];
  const resolvedCampaignCount = Number(backlogRegistry?.summary?.resolved_campaign_records
    ?? campaignRecords.filter(record => record.status !== 'open').length);
  const unresolvedCampaignCount = Number(backlogRegistry?.summary?.open_backlog_nodes
    ?? campaignRecords.filter(record => record.status === 'open').length);
  const campaignLoaded = Boolean(backlogRegistry);
  const metricCoveragePercent = nodeCount > 0 ? (metricContractCount / nodeCount) * 100 : 0;
  const directPercent = relationshipCount > 0 ? (directRelationshipCount / relationshipCount) * 100 : 0;
  const indirectPercent = relationshipCount > 0 ? (indirectRelationshipCount / relationshipCount) * 100 : 0;

  root.innerHTML = `
    <div class="registry-kpi-grid">
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Published graph</span>
        <strong>${nodeCount.toLocaleString('en-US')}</strong>
        <span class="registry-kpi-note">nodes across ${sphereCounts.filter(item => item.count > 0).length} spheres</span>
      </article>
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Relationships</span>
        <strong>${relationshipCount.toLocaleString('en-US')}</strong>
        <div class="registry-kpi-split-bar" aria-label="${directRelationshipCount} direct and ${indirectRelationshipCount} indirect relationships">
          <span class="is-direct" style="width:${directPercent}%"></span>
          <span class="is-indirect" style="width:${indirectPercent}%"></span>
        </div>
        <span class="registry-kpi-note">${directRelationshipCount.toLocaleString('en-US')} direct · ${indirectRelationshipCount.toLocaleString('en-US')} indirect${otherRelationshipCount > 0 ? ` · ${otherRelationshipCount.toLocaleString('en-US')} other` : ''}</span>
      </article>
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Metric contracts</span>
        <strong>${metricContractCount.toLocaleString('en-US')}<small> / ${nodeCount.toLocaleString('en-US')}</small></strong>
        <div class="registry-kpi-progress" aria-label="${metricCoveragePercent.toFixed(0)} percent of published nodes have metric contracts"><span style="width:${metricCoveragePercent}%"></span></div>
        <span class="registry-kpi-note">${metricContractCount.toLocaleString('en-US')} defined · ${missingMetricContractCount.toLocaleString('en-US')} missing</span>
      </article>
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Research campaign</span>
        <strong>${campaignLoaded ? resolvedCampaignCount.toLocaleString('en-US') : '—'}</strong>
        <span class="registry-kpi-note">${campaignLoaded ? `${unresolvedCampaignCount.toLocaleString('en-US')} unresolved` : 'Loading campaign registry…'}</span>
      </article>
    </div>

    <div class="registry-chart-grid">
      <section class="registry-chart-card registry-sphere-chart" aria-labelledby="registry-sphere-chart-title">
        <div class="registry-chart-heading">
          <h4 id="registry-sphere-chart-title">Nodes by sphere</h4>
          <span>${nodeCount.toLocaleString('en-US')} total</span>
        </div>
        <div class="registry-sphere-bars">
          ${sphereCounts.map(item => `
            <div class="registry-sphere-row">
              <div class="registry-sphere-label"><span>${escapeHtml(item.label)}</span><strong>${item.count}</strong></div>
              <div class="registry-sphere-track"><span style="width:${(item.count / maximumSphereCount) * 100}%"></span></div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="registry-chart-card registry-status-chart" aria-labelledby="registry-status-chart-title">
        <div class="registry-chart-heading">
          <h4 id="registry-status-chart-title">Source status</h4>
          <span>${sourceStatuses.length} statuses</span>
        </div>
        <div class="registry-status-stack" aria-label="Source-status distribution across ${nodeCount} published nodes">
          ${sourceStatuses.map(item => `<span style="width:${(item.count / Math.max(nodeCount, 1)) * 100}%; --status-rgb:${item.meta.rgb}" title="${escapeHtml(item.meta.label)}: ${item.count}"></span>`).join('')}
        </div>
        <div class="registry-status-legend">
          ${sourceStatuses.map(item => `
            <div class="registry-status-legend-row">
              <i style="--status-rgb:${item.meta.rgb}"></i>
              <span>${escapeHtml(item.meta.label)}</span>
              <strong>${item.count}</strong>
            </div>
          `).join('')}
        </div>
      </section>
    </div>

    <section class="registry-chart-card registry-heatmap-card" aria-labelledby="registry-heatmap-title">
      <div class="registry-chart-heading">
        <div>
          <h4 id="registry-heatmap-title">Evidence coverage by sphere</h4>
          <p>Darker cells contain more published nodes in that source-status group.</p>
        </div>
        <span>Sphere × source status</span>
      </div>
      <div class="registry-heatmap-scroll">
        <div class="registry-heatmap" style="--registry-status-count:${sourceStatuses.length}">
          <div class="registry-heatmap-corner">Sphere</div>
          ${sourceStatuses.map(item => `<div class="registry-heatmap-column-label" title="${escapeHtml(item.meta.label)}">${escapeHtml(item.meta.shortLabel)}</div>`).join('')}
          ${heatmapRows.map(row => `
            <div class="registry-heatmap-row-label">${escapeHtml(row.label)}</div>
            ${row.cells.map(cell => {
              const alpha = cell.count === 0 ? 0.035 : 0.12 + (cell.count / maximumHeatmapCount) * 0.7;
              return `<div class="registry-heatmap-cell ${cell.count === 0 ? 'is-empty' : ''}" style="--status-rgb:${cell.meta.rgb}; --heat-alpha:${alpha}" title="${escapeHtml(row.label)} · ${escapeHtml(cell.meta.label)}: ${cell.count}"><span>${cell.count}</span></div>`;
            }).join('')}
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

const SOURCE_COVERAGE_REACH_META = {
  global: { label: 'Global', shortLabel: 'Global', rgb: '96, 165, 250' },
  regional: { label: 'Regional', shortLabel: 'Regional', rgb: '34, 211, 238' },
  national: { label: 'National or reference', shortLabel: 'National', rgb: '148, 163, 184' }
};

const SOURCE_COVERAGE_ACCESS_META = {
  api: { label: 'Named API', rgb: '96, 165, 250' },
  data_portal: { label: 'Data or monitoring portal', rgb: '34, 211, 238' },
  reference: { label: 'Research, policy, or disclosure', rgb: '196, 181, 253' }
};

function classifySourceCoverageReach(scope) {
  const normalized = String(scope || '').toLowerCase();
  if (normalized.includes('global')) return 'global';
  if (/(basin|himalaya|asia|pacific|asean|regional|europe|africa|south asia|southeast asia)/.test(normalized)) return 'regional';
  return 'national';
}

function classifySourceCoverageAccess(name, description) {
  const normalized = `${name || ''} ${description || ''}`.toLowerCase();
  if (/\bapi\b/.test(normalized)) return 'api';
  if (/(dataset|database|data portal|observator|monitor|telemetry|timeseries|tracker|satellite|maps|tools|hotspots|catalog|records|indices|indexes|index)/.test(normalized)) return 'data_portal';
  return 'reference';
}

function renderSourcesCoverageCockpit() {
  const root = document.getElementById('sources-coverage-cockpit');
  const columns = [...document.querySelectorAll('#sources-view .sources-list-column')];
  if (!root || columns.length === 0) return;

  const categories = columns.map(column => {
    const label = column.querySelector('.sources-category-title')?.textContent?.trim() || 'Uncategorized';
    const sources = [...column.querySelectorAll('.sources-list > li')].map(item => {
      const link = item.querySelector('a');
      const description = item.querySelector('.sources-list-desc');
      const scope = description?.querySelector('strong')?.textContent?.trim() || 'Not stated';
      const name = String(link?.textContent || 'Unnamed source').replace('↗', '').trim();
      const descriptionText = description?.textContent?.trim() || '';
      return {
        name,
        href: link?.getAttribute('href') || '',
        scope,
        description: descriptionText,
        reach: classifySourceCoverageReach(scope),
        access: classifySourceCoverageAccess(name, descriptionText)
      };
    });
    return { label, sources };
  });

  const sources = categories.flatMap(category => category.sources);
  const sourceCount = sources.length;
  const maximumCategoryCount = Math.max(...categories.map(category => category.sources.length), 1);
  const reachOrder = ['global', 'regional', 'national'];
  const accessOrder = ['api', 'data_portal', 'reference'];
  const reachCounts = reachOrder.map(reach => ({
    reach,
    count: sources.filter(source => source.reach === reach).length,
    meta: SOURCE_COVERAGE_REACH_META[reach]
  }));
  const accessCounts = accessOrder.map(access => ({
    access,
    count: sources.filter(source => source.access === access).length,
    meta: SOURCE_COVERAGE_ACCESS_META[access]
  }));
  const globalSourceCount = reachCounts.find(item => item.reach === 'global')?.count || 0;
  const operationalSurfaceCount = accessCounts
    .filter(item => item.access !== 'reference')
    .reduce((sum, item) => sum + item.count, 0);
  const maximumReachCell = Math.max(...categories.flatMap(category => (
    reachOrder.map(reach => category.sources.filter(source => source.reach === reach).length)
  )), 1);

  root.innerHTML = `
    <div class="registry-kpi-grid">
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Listed sources</span>
        <strong>${sourceCount}</strong>
        <span class="registry-kpi-note">linked organizations and data surfaces</span>
      </article>
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Coverage areas</span>
        <strong>${categories.length}</strong>
        <span class="registry-kpi-note">subject and regional directory sections</span>
      </article>
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Global reach</span>
        <strong>${globalSourceCount}<small> / ${sourceCount}</small></strong>
        <div class="registry-kpi-progress" aria-label="${globalSourceCount} of ${sourceCount} sources state global coverage"><span style="width:${(globalSourceCount / Math.max(sourceCount, 1)) * 100}%"></span></div>
        <span class="registry-kpi-note">sources explicitly marked global</span>
      </article>
      <article class="registry-kpi-card">
        <span class="registry-kpi-label">Data surfaces</span>
        <strong>${operationalSurfaceCount}</strong>
        <span class="registry-kpi-note">named APIs, datasets, and monitoring portals</span>
      </article>
    </div>

    <div class="registry-chart-grid">
      <section class="registry-chart-card" aria-labelledby="sources-area-chart-title">
        <div class="registry-chart-heading">
          <h4 id="sources-area-chart-title">Sources by coverage area</h4>
          <span>${sourceCount} total</span>
        </div>
        <div class="sources-area-bars">
          ${categories.map(category => `
            <div class="registry-sphere-row">
              <div class="registry-sphere-label"><span>${escapeHtml(category.label)}</span><strong>${category.sources.length}</strong></div>
              <div class="registry-sphere-track"><span style="width:${(category.sources.length / maximumCategoryCount) * 100}%"></span></div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="registry-chart-card" aria-labelledby="sources-access-chart-title">
        <div class="registry-chart-heading">
          <h4 id="sources-access-chart-title">Access surface</h4>
          <span>Directory labels</span>
        </div>
        <div class="registry-status-stack" aria-label="Source directory access-surface distribution">
          ${accessCounts.map(item => `<span style="width:${(item.count / Math.max(sourceCount, 1)) * 100}%; --status-rgb:${item.meta.rgb}" title="${escapeHtml(item.meta.label)}: ${item.count}"></span>`).join('')}
        </div>
        <div class="registry-status-legend">
          ${accessCounts.map(item => `
            <div class="registry-status-legend-row">
              <i style="--status-rgb:${item.meta.rgb}"></i>
              <span>${escapeHtml(item.meta.label)}</span>
              <strong>${item.count}</strong>
            </div>
          `).join('')}
        </div>
      </section>
    </div>

    <section class="registry-chart-card registry-heatmap-card" aria-labelledby="sources-reach-heatmap-title">
      <div class="registry-chart-heading">
        <div>
          <h4 id="sources-reach-heatmap-title">Geographic reach by coverage area</h4>
          <p>Counts use the scope stated in each source-directory entry.</p>
        </div>
        <span>Coverage area × reach</span>
      </div>
      <div class="registry-heatmap-scroll">
        <div class="registry-heatmap sources-reach-heatmap" style="--registry-status-count:${reachOrder.length}">
          <div class="registry-heatmap-corner">Coverage area</div>
          ${reachCounts.map(item => `<div class="registry-heatmap-column-label">${escapeHtml(item.meta.shortLabel)}</div>`).join('')}
          ${categories.map(category => `
            <div class="registry-heatmap-row-label">${escapeHtml(category.label)}</div>
            ${reachCounts.map(item => {
              const count = category.sources.filter(source => source.reach === item.reach).length;
              const alpha = count === 0 ? 0.035 : 0.12 + (count / maximumReachCell) * 0.7;
              return `<div class="registry-heatmap-cell ${count === 0 ? 'is-empty' : ''}" style="--status-rgb:${item.meta.rgb}; --heat-alpha:${alpha}" title="${escapeHtml(category.label)} · ${escapeHtml(item.meta.label)}: ${count}"><span>${count}</span></div>`;
            }).join('')}
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

const PHENOMENON_THEME_BY_KEY = {
  food: { start: 'rgba(255, 183, 77, 0.98)', end: 'rgba(255, 111, 97, 0.96)', glow: 'rgba(255, 145, 120, 0.24)' },
  industry_farming: { start: 'rgba(163, 230, 53, 0.98)', end: 'rgba(34, 197, 94, 0.96)', glow: 'rgba(74, 222, 128, 0.22)' },
  methane: { start: 'rgba(125, 211, 252, 0.98)', end: 'rgba(14, 165, 233, 0.96)', glow: 'rgba(56, 189, 248, 0.22)' },
  carbon_emission: { start: 'rgba(244, 114, 182, 0.98)', end: 'rgba(239, 68, 68, 0.96)', glow: 'rgba(248, 113, 113, 0.24)' },
  electricity_generation: { start: 'rgba(96, 165, 250, 0.98)', end: 'rgba(45, 212, 191, 0.96)', glow: 'rgba(96, 165, 250, 0.22)' },
  personal_conveyance: { start: 'rgba(251, 191, 36, 0.98)', end: 'rgba(249, 115, 22, 0.96)', glow: 'rgba(251, 146, 60, 0.22)' },
  road_freight_logistics: { start: 'rgba(248, 196, 113, 0.98)', end: 'rgba(235, 87, 87, 0.96)', glow: 'rgba(242, 153, 74, 0.22)' },
  food_waste: { start: 'rgba(250, 204, 21, 0.98)', end: 'rgba(132, 204, 22, 0.96)', glow: 'rgba(163, 230, 53, 0.22)' },
  fertilizer_production: { start: 'rgba(52, 211, 153, 0.98)', end: 'rgba(16, 185, 129, 0.96)', glow: 'rgba(52, 211, 153, 0.2)' },
  mining_critical_minerals: { start: 'rgba(192, 132, 252, 0.98)', end: 'rgba(99, 102, 241, 0.96)', glow: 'rgba(129, 140, 248, 0.22)' },
  urban_sprawl_housing: { start: 'rgba(250, 204, 21, 0.98)', end: 'rgba(245, 158, 11, 0.96)', glow: 'rgba(251, 191, 36, 0.22)' },
  building_operations: { start: 'rgba(147, 197, 253, 0.98)', end: 'rgba(59, 130, 246, 0.96)', glow: 'rgba(96, 165, 250, 0.22)' },
  deforestation_land_use: { start: 'rgba(110, 231, 183, 0.98)', end: 'rgba(34, 197, 94, 0.96)', glow: 'rgba(74, 222, 128, 0.22)' },
  plastics_petrochemicals: { start: 'rgba(248, 113, 113, 0.98)', end: 'rgba(236, 72, 153, 0.96)', glow: 'rgba(244, 114, 182, 0.22)' },
  data_centers: { start: 'rgba(129, 140, 248, 0.98)', end: 'rgba(45, 212, 191, 0.96)', glow: 'rgba(94, 234, 212, 0.22)' },
  ai_compute: { start: 'rgba(167, 139, 250, 0.98)', end: 'rgba(59, 130, 246, 0.96)', glow: 'rgba(129, 140, 248, 0.24)' },
  aviation_shipping: { start: 'rgba(56, 189, 248, 0.98)', end: 'rgba(14, 165, 233, 0.96)', glow: 'rgba(56, 189, 248, 0.22)' },
  cement_steel: { start: 'rgba(248, 113, 113, 0.98)', end: 'rgba(217, 119, 6, 0.96)', glow: 'rgba(251, 146, 60, 0.22)' },
  air_conditioning_refrigerants: { start: 'rgba(103, 232, 249, 0.98)', end: 'rgba(59, 130, 246, 0.96)', glow: 'rgba(96, 165, 250, 0.22)' }
};

function getPhenomenonTheme(selection) {
  const fallback = { start: 'rgba(66, 178, 255, 0.96)', end: 'rgba(28, 214, 220, 0.94)', glow: 'rgba(43, 205, 238, 0.18)' };
  if (!selection) return fallback;
  return PHENOMENON_THEME_BY_KEY[selection.key] || PHENOMENON_THEME_BY_KEY[selection.lensKey] || fallback;
}

function renderRegistryDirectory() {
  const panelsRoot = document.getElementById('registry-panels');
  if (!panelsRoot) return;

  renderRegistryCoverageCockpit();

  const tabs = ['climate', 'water', 'energy'];
  panelsRoot.innerHTML = tabs.map(tab => {
    const entries = REGISTRY_DIRECTORY.filter(entry => entry.tab === tab);
    return `
      <section class="registry-panel ${tab === 'climate' ? 'active' : ''}" data-registry-panel="${tab}" role="tabpanel">
        <div class="registry-grid">
          ${entries.map(entry => `
            <article class="registry-card">
              <div class="registry-card-head">
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  <h3 class="registry-card-title">${entry.title}</h3>
                  <div class="registry-card-meta">
                    <span class="registry-chip kind-${entry.kind}">${entry.kind}</span>
                    <span class="registry-chip">${entry.scope}</span>
                  </div>
                </div>
              </div>
              <p class="registry-card-summary">${entry.summary}</p>
              <div class="registry-card-links">
                ${entry.links.map(link => `
                  <div class="registry-link-row">
                    <a href="${link.href}" target="_blank" rel="noreferrer noopener">${link.label} ↗</a>
                    <div class="registry-link-note">${link.note}</div>
                  </div>
                `).join('')}
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  }).join('') + `
    <section class="registry-panel" data-registry-panel="lineage" role="tabpanel">
      <div id="pipeline-lineage-directory" class="pipeline-lineage-directory" aria-live="polite">
        <p class="registry-card-summary">Loading the operational pipeline lineage graph…</p>
      </div>
    </section>
    <section class="registry-panel" data-registry-panel="research" role="tabpanel">
      <div id="research-backlog-directory" class="research-backlog-directory" aria-live="polite">
        <p class="registry-card-summary">Loading the complete research backlog…</p>
      </div>
    </section>
  `;
}

function scoreSearchTerm(term, query) {
  const value = String(term || '').toLowerCase();
  if (!value) return 0;
  if (value === query) return 100;
  if (value.startsWith(query)) return 80;
  const words = value.split(/\s+/);
  if (words.some(word => word.startsWith(query))) return 60;
  if (value.includes(query)) return 40;
  const initials = words.map(word => word[0]).join('');
  if (initials.includes(query)) return 30;
  let queryIndex = 0;
  for (let index = 0; index < value.length && queryIndex < query.length; index += 1) {
    if (value[index] === query[queryIndex]) queryIndex += 1;
  }
  return queryIndex === query.length ? 10 : 0;
}

function backlogSearchTerms(record) {
  return [record.id, record.display_name, record.sphere, record.node_class, record.action, record.workstream, record.topology_lane].filter(Boolean);
}

function renderResearchBacklogRecords(registry, query = '') {
  const root = document.getElementById('research-backlog-directory');
  if (!root) return;
  const records = Array.isArray(registry?.campaign_records)
    ? registry.campaign_records
    : Array.isArray(registry?.nodes)
      ? registry.nodes
      : [];
  const normalizedQuery = String(query).trim().toLowerCase();
  const rankedMatches = normalizedQuery
    ? records.map((record, index) => ({
        record,
        index,
        score: Math.max(...backlogSearchTerms(record).map(term => scoreSearchTerm(term, normalizedQuery)))
      })).filter(item => item.score > 0).sort((a, b) => b.score - a.score || b.index - a.index)
    : [];
  const visibleRecords = normalizedQuery ? rankedMatches.map(item => item.record) : records;
  const reviewableCount = Number(registry?.summary?.campaign_reviewable_records || records.length);
  const openCount = Number(registry?.summary?.open_backlog_nodes || 0);
  const resolvedCount = Number(registry?.summary?.resolved_campaign_records || 0);
  const relationshipGap = Number(registry?.summary?.minimum_relationships_if_every_node_were_independently_repaired || 0);
  const laneCounts = Object.entries(registry?.execution_lanes || {}).map(([lane, ids]) => ({ lane, count: Array.isArray(ids) ? ids.length : 0 }));

  root.innerHTML = `
    <div class="research-backlog-header">
      <div>
        <h3 class="registry-card-title">Full research campaign</h3>
        <p class="registry-card-summary">The entire registered backlog—including prior metric, merge, and promotion decisions—is open to continuous review. Publication gates remain evidence-bound.</p>
      </div>
      <div class="registry-card-meta">
        <span class="registry-chip kind-operational">${reviewableCount} reviewable records</span>
        <span class="registry-chip kind-disclosure">${openCount} unresolved</span>
        <span class="registry-chip">${resolvedCount} resolved decisions</span>
        <span class="registry-chip">${relationshipGap} maximum raw degree gap</span>
      </div>
      <div class="research-backlog-search">
        <input id="research-backlog-search-input" type="search" value="${escapeHtml(query)}" placeholder="Search all backlog records" aria-label="Search all backlog records" autocomplete="off" />
        <div id="research-backlog-search-results" class="research-backlog-search-results" ${normalizedQuery ? '' : 'hidden'}>
          ${rankedMatches.slice(0, 15).map(({ record }) => `
            <button type="button" class="search-result-item research-backlog-search-result" data-backlog-record-id="${escapeHtml(record.id)}">
              <span>${escapeHtml(record.display_name)}</span>
              <span class="search-result-sphere-badge">${escapeHtml(SPHERE_LABELS[record.sphere] || record.sphere || 'Core')}</span>
            </button>
          `).join('') || (normalizedQuery ? '<div class="research-backlog-search-empty">No matching backlog records found</div>' : '')}
        </div>
      </div>
      <div class="research-backlog-links">
        <a href="/research-backlog.csv" target="_blank" rel="noreferrer noopener">CSV registry ↗</a>
        <a href="/ontology-review-queue.json" target="_blank" rel="noreferrer noopener">Ontology review queue ↗</a>
      </div>
      <p class="research-backlog-result-count">Showing ${visibleRecords.length} of ${records.length} records</p>
      <div class="registry-card-meta">
        ${laneCounts.map(({ lane, count }) => `<span class="registry-chip">${count} ${escapeHtml(lane.replaceAll('_', ' '))}</span>`).join('')}
      </div>
    </div>
    <div class="registry-grid research-backlog-grid">
      ${visibleRecords.map(record => `
        <article class="registry-card research-backlog-card">
          <div class="registry-card-head">
            <div>
              <h3 class="registry-card-title">${escapeHtml(record.display_name)}</h3>
              <div class="registry-card-meta">
                <span class="registry-chip kind-${record.status === 'open' ? 'disclosure' : 'operational'}">${escapeHtml(record.status)}</span>
                ${Number.isFinite(record.total_degree) ? `<span class="registry-chip">degree ${Number(record.total_degree)}</span>` : '<span class="registry-chip">metric binding</span>'}
                <span class="registry-chip">${escapeHtml(record.node_class)}</span>
                <span class="registry-chip">${escapeHtml(record.sphere)}</span>
                <span class="registry-chip">${escapeHtml(String(record.topology_lane || 'unassigned').replaceAll('_', ' '))}</span>
              </div>
            </div>
          </div>
          <p class="registry-card-summary">${escapeHtml(record.rationale)}</p>
        </article>
      `).join('') || '<p class="registry-card-summary">No backlog records match this search.</p>'}
    </div>
  `;

  const input = document.getElementById('research-backlog-search-input');
  const suggestions = document.getElementById('research-backlog-search-results');
  if (input) {
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('input', event => renderResearchBacklogRecords(registry, event.target.value));
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        const firstSuggestion = suggestions?.querySelector('.research-backlog-search-result');
        if (firstSuggestion) firstSuggestion.click();
      } else if (event.key === 'Escape' && suggestions) {
        suggestions.hidden = true;
      }
    });
    input.addEventListener('blur', () => window.setTimeout(() => {
      if (suggestions) suggestions.hidden = true;
    }, 140));
  }
  suggestions?.querySelectorAll('.research-backlog-search-result').forEach(button => {
    button.addEventListener('mousedown', event => event.preventDefault());
    button.addEventListener('click', () => {
      const record = records.find(candidate => candidate.id === button.getAttribute('data-backlog-record-id'));
      if (record) renderResearchBacklogRecords(registry, record.display_name);
    });
  });
}

function loadResearchBacklogDirectory() {
  loadJsonWithApiFallback('/api/northstar/research-backlog', '/research-backlog.json', registry => {
    renderRegistryCoverageCockpit(registry);
    renderResearchBacklogRecords(registry);
  });
}

function formatLineageIdentifier(value) {
  return String(value || '')
    .replace(/^\/api\//, '')
    .replace(/\.(json|mjs|js)$/i, '')
    .replaceAll('_', ' ')
    .replaceAll('-', ' ');
}

function formatLineageBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value < 0) return 'size unavailable';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function pipelineLineageSearchTerms(pipeline) {
  return [
    pipeline.pipeline_id,
    pipeline.source?.id,
    pipeline.snapshot?.id,
    pipeline.delivery?.api_route,
    ...(pipeline.job?.implementation_paths || []),
    ...(pipeline.bindings || []).flatMap(binding => [
      binding.declared_owner_id,
      binding.canonical_node_id,
      binding.metric_contract_id,
      binding.measurement_role
    ])
  ].filter(Boolean);
}

function renderPipelineLineageRecords(registry, query = '') {
  const root = document.getElementById('pipeline-lineage-directory');
  if (!root) return;
  const pipelines = Array.isArray(registry?.pipelines) ? registry.pipelines : [];
  const normalizedQuery = String(query).trim().toLowerCase();
  const visiblePipelines = normalizedQuery
    ? pipelines.filter(pipeline => pipelineLineageSearchTerms(pipeline).some(term => (
        String(term).toLowerCase().includes(normalizedQuery)
      )))
    : pipelines;
  const summary = registry?.summary || {};

  root.innerHTML = `
    <div class="research-backlog-header lineage-directory-header">
      <div>
        <div class="registry-evidence-kicker">Operational provenance</div>
        <h3 class="registry-card-title">Source-to-graph pipeline lineage</h3>
        <p class="registry-card-summary">A generated, checksum-bound view of how external sources become validated snapshots, API routes, metric contracts, and published graph-node measurements. This documents data provenance; it does not assert scientific causality.</p>
      </div>
      <div class="registry-card-meta">
        <span class="registry-chip kind-operational">${Number(summary.pipelines || 0)} pipelines</span>
        <span class="registry-chip">${Number(summary.sources || 0)} sources</span>
        <span class="registry-chip">${Number(summary.snapshots || 0)} snapshots</span>
        <span class="registry-chip">${Number(summary.metric_bindings || 0)} metric bindings</span>
        <span class="registry-chip">${Number(summary.lineage_edges || 0)} lineage links</span>
      </div>
      <div class="research-backlog-search">
        <input id="pipeline-lineage-search-input" type="search" value="${escapeHtml(query)}" placeholder="Search source, job, snapshot, metric, or graph node" aria-label="Search pipeline lineage" autocomplete="off" />
      </div>
      <div class="research-backlog-links">
        <a href="/pipeline-lineage-registry.json" target="_blank" rel="noreferrer noopener">JSON lineage registry ↗</a>
      </div>
      <p class="research-backlog-result-count">Showing ${visiblePipelines.length} of ${pipelines.length} pipelines</p>
    </div>
    <div class="lineage-pipeline-list">
      ${visiblePipelines.map(pipeline => {
        const implementationPath = pipeline.job?.implementation_paths?.[0] || 'implementation unresolved';
        const checksum = String(pipeline.snapshot?.sha256 || '').slice(0, 12);
        return `
          <article class="registry-card lineage-pipeline-card">
            <div class="lineage-pipeline-heading">
              <div>
                <span class="registry-kpi-label">Pipeline</span>
                <h3 class="registry-card-title">${escapeHtml(formatLineageIdentifier(pipeline.pipeline_id))}</h3>
              </div>
              <div class="registry-card-meta">
                <span class="registry-chip">${escapeHtml(formatLineageBytes(pipeline.snapshot?.bytes))}</span>
                ${Number.isFinite(pipeline.snapshot?.record_count) ? `<span class="registry-chip">${Number(pipeline.snapshot.record_count).toLocaleString('en-US')} records</span>` : ''}
                <span class="registry-chip">sha256 ${escapeHtml(checksum || 'unavailable')}</span>
              </div>
            </div>
            <div class="lineage-flow" role="list" aria-label="Pipeline stages">
              <div class="lineage-stage is-source" role="listitem">
                <span>Source</span>
                <strong>${escapeHtml(formatLineageIdentifier(pipeline.source?.id))}</strong>
              </div>
              <i aria-hidden="true">→</i>
              <div class="lineage-stage is-job" role="listitem">
                <span>Ingestion</span>
                <strong>${escapeHtml(implementationPath.replace(/^scripts\//, ''))}</strong>
              </div>
              <i aria-hidden="true">→</i>
              <div class="lineage-stage is-snapshot" role="listitem">
                <span>Snapshot</span>
                <strong>${escapeHtml(pipeline.snapshot?.id)}</strong>
              </div>
              <i aria-hidden="true">→</i>
              <div class="lineage-stage is-route" role="listitem">
                <span>Delivery</span>
                <strong>${escapeHtml(pipeline.delivery?.api_route)}</strong>
              </div>
            </div>
            <div class="lineage-binding-list">
              ${(pipeline.bindings || []).map(binding => {
                const canonicalNode = binding.canonical_node_id
                  ? NODE_BY_ID.get(binding.canonical_node_id)
                  : null;
                const targetLabel = canonicalNode?.name || binding.canonical_node_id || 'research ledger';
                const aliasNote = binding.canonical_node_id && binding.declared_owner_id !== binding.canonical_node_id
                  ? `${formatLineageIdentifier(binding.declared_owner_id)} → ${targetLabel}`
                  : targetLabel;
                return `
                  <div class="lineage-binding-row">
                    <span>${escapeHtml(formatLineageIdentifier(binding.metric_contract_id))}</span>
                    <i aria-hidden="true">→</i>
                    <strong>${escapeHtml(aliasNote)}</strong>
                    <small>${escapeHtml(formatLineageIdentifier(binding.measurement_role || binding.binding_type))}</small>
                  </div>
                `;
              }).join('')}
            </div>
          </article>
        `;
      }).join('') || '<p class="registry-card-summary">No pipelines match this search.</p>'}
    </div>
  `;

  const input = document.getElementById('pipeline-lineage-search-input');
  if (input) {
    input.focus({ preventScroll: true });
    input.setSelectionRange(input.value.length, input.value.length);
    input.addEventListener('input', event => renderPipelineLineageRecords(registry, event.target.value));
  }
}

function loadPipelineLineageDirectory() {
  loadJsonWithApiFallback('/api/northstar/pipeline-lineage', '/pipeline-lineage-registry.json', registry => {
    renderPipelineLineageRecords(registry);
  });
}

const loadedRegistryTabs = new Set();

function ensureRegistryTabContent(tab) {
  if (!['lineage', 'research'].includes(tab) || loadedRegistryTabs.has(tab)) return;
  loadedRegistryTabs.add(tab);
  if (tab === 'lineage') loadPipelineLineageDirectory();
  if (tab === 'research') loadResearchBacklogDirectory();
}

function setActiveRegistryTab(tab) {
  const tabButtons = document.querySelectorAll('.registry-tab-btn');
  const panels = document.querySelectorAll('.registry-panel');

  tabButtons.forEach(button => {
    const isActive = button.getAttribute('data-registry-tab') === tab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  panels.forEach(panel => {
    panel.classList.toggle('active', panel.getAttribute('data-registry-panel') === tab);
  });

  ensureRegistryTabContent(tab);
}

function bindRegistryDirectoryTabs() {
  const tabButtons = document.querySelectorAll('.registry-tab-btn');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      setActiveRegistryTab(button.getAttribute('data-registry-tab'));
    });
  });
}

function prefersReducedMotion() {
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
}

function restartMotionClass(element, className, duration = 520) {
  if (!element || prefersReducedMotion()) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  window.setTimeout(() => element.classList.remove(className), duration);
}

function getNodeMotionOrigin(node) {
  if (!node || !graphInstance?.canvas || typeof graphInstance.worldToScreen !== 'function') return null;
  const canvasRect = graphInstance.canvas.getBoundingClientRect();
  const point = graphInstance.worldToScreen(node.x, node.y);
  const logicalWidth = graphInstance.width || canvasRect.width;
  const logicalHeight = graphInstance.height || canvasRect.height;
  return {
    x: canvasRect.left + point.x * (canvasRect.width / Math.max(1, logicalWidth)),
    y: canvasRect.top + point.y * (canvasRect.height / Math.max(1, logicalHeight))
  };
}

function playNodeBridgeTransition(node, origin) {
  if (!node || !origin || !consoleNodeName || prefersReducedMotion()) return;
  const targetRect = consoleNodeName.getBoundingClientRect();
  if (!targetRect.width || !targetRect.height) return;

  const bridge = document.createElement('div');
  bridge.className = 'node-motion-bridge';
  bridge.style.setProperty('--node-motion-rgb', SPHERE_MOTION_RGB[node.sphere] || SPHERE_MOTION_RGB.core);
  bridge.innerHTML = `
    <span class="node-motion-bridge-dot" aria-hidden="true"></span>
    <span class="node-motion-bridge-label">${escapeHtml(node.name)}</span>
  `;
  document.body.appendChild(bridge);

  const targetX = targetRect.left + Math.min(18, targetRect.width * 0.12);
  const targetY = targetRect.top + targetRect.height / 2;
  const deltaX = targetX - origin.x;
  const deltaY = targetY - origin.y;

  bridge.animate([
    {
      transform: `translate3d(${origin.x}px, ${origin.y}px, 0) translate(-50%, -50%) scale(0.35)`,
      opacity: 0
    },
    {
      transform: `translate3d(${origin.x}px, ${origin.y}px, 0) translate(-50%, -50%) scale(0.76)`,
      opacity: 1,
      offset: 0.16
    },
    {
      transform: `translate3d(${origin.x + deltaX * 0.68}px, ${origin.y + deltaY * 0.72}px, 0) translate(-50%, -50%) scale(0.9)`,
      opacity: 0.92,
      offset: 0.72
    },
    {
      transform: `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%) scale(0.5)`,
      opacity: 0
    }
  ], {
    duration: 620,
    easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    fill: 'forwards'
  }).finished.finally(() => bridge.remove());

  restartMotionClass(consoleNodeName, 'motion-arrival', 700);
}

function setActiveTab(tab) {
  if (footerExplore) footerExplore.classList.toggle('active', tab === 'explore');
  if (footerAnalyse) footerAnalyse.classList.toggle('active', tab === 'study');
  if (footerPhenomena) footerPhenomena.classList.toggle('active', tab === 'phenomena');
  if (footerPersonalFootprint) footerPersonalFootprint.classList.toggle('active', tab === 'personal-footprint');
}

function forceExploreTabState() {
  setActiveTab('explore');
  if (footerExplore) footerExplore.classList.add('active');
  if (footerAnalyse) footerAnalyse.classList.remove('active');
  if (footerPhenomena) footerPhenomena.classList.remove('active');
  if (footerPersonalFootprint) footerPersonalFootprint.classList.remove('active');
}

function captureStudyWorkspaceState() {
  if (!currentSelectedNode || !graphInstance) return;
  studyWorkspaceState = {
    nodeId: currentSelectedNode.id,
    camera: { ...graphInstance.camera },
    targetCamera: graphInstance.targetCamera ? { ...graphInstance.targetCamera } : null,
    layoutMode: graphInstance.layoutMode,
    showAllAnalyzeConnections: graphInstance.showAllAnalyzeConnections,
    userCollapsedAnalyzeConnections: graphInstance.userCollapsedAnalyzeConnections,
    showIncomingInfluences: graphInstance.showIncomingInfluences,
    showOutgoingInfluences: graphInstance.showOutgoingInfluences,
    inspectorScrollTop: studyConsole?.scrollTop || 0
  };
}

function setShellMode(mode) {
  const appContainer = document.getElementById('app-container');
  const mainContent = document.getElementById('main-content');
  const legendContainer = document.getElementById('c-legend-container');
  const searchContainer = document.getElementById('search-container');
  const filterDisclosure = document.getElementById('filter-disclosure');
  const isStudy = mode === 'study';
  const isPhenomena = mode === 'phenomena';
  const isPersonalFootprint = mode === 'personal-footprint';

  const previousMode = appContainer?.dataset.viewMode || 'explore';
  if (previousMode === 'study' && mode !== 'study') captureStudyWorkspaceState();
  if (appContainer) {
    appContainer.dataset.viewMode = mode;
    appContainer.classList.toggle('study-active', isStudy);
  }
  if (graphInstance) {
    if (isPhenomena || isPersonalFootprint) {
      graphInstance.pause();
    } else {
      graphInstance.resume();
    }
  }
  if (mainContent) {
    mainContent.classList.toggle('focus-active', isStudy);
    mainContent.style.display = (isPhenomena || isPersonalFootprint) ? 'none' : '';
  }
  if (studyConsole) {
    studyConsole.style.display = isStudy ? 'flex' : 'none';
    studyConsole.toggleAttribute('hidden', !isStudy);
  }
  if (phenomenaView) {
    phenomenaView.style.display = isPhenomena ? 'block' : 'none';
    phenomenaView.toggleAttribute('hidden', !isPhenomena);
  }
  if (personalFootprintView) {
    personalFootprintView.style.display = isPersonalFootprint ? 'block' : 'none';
    personalFootprintView.toggleAttribute('hidden', !isPersonalFootprint);
    if (isPersonalFootprint) {
      personalFootprintView.scrollTop = 0;
    }
  }
  if (studyControlsOverlay) {
    studyControlsOverlay.style.display = isStudy && graphInstance?.isFocusMode ? 'flex' : 'none';
  }
  if (legendContainer) {
    legendContainer.style.display = isStudy ? 'flex' : 'none';
  }
  if (analyzeNodeKey) {
    analyzeNodeKey.style.display = isStudy ? '' : 'none';
  }
  if (filterBar) {
    filterBar.classList.toggle('hidden', isStudy || isPhenomena || isPersonalFootprint);
  }
  if (filterDisclosure && (isStudy || isPhenomena || isPersonalFootprint)) {
    filterDisclosure.open = false;
  }
  if (searchContainer) {
    searchContainer.classList.remove('hidden');
  }
  if (isStudy) {
    setActiveTab('study');
  } else if (isPhenomena) {
    setActiveTab('phenomena');
  } else if (isPersonalFootprint) {
    setActiveTab('personal-footprint');
  } else {
    forceExploreTabState();
  }

  if (previousMode !== mode) {
    trackEvent('view_opened', { view: mode });
    const enteringView = isStudy
      ? studyConsole
      : isPhenomena
        ? phenomenaView
        : isPersonalFootprint
          ? personalFootprintView
          : mainContent;
    window.requestAnimationFrame(() => restartMotionClass(enteringView, 'shell-view-enter', 560));
  }
}


// Target and select node, focusing the 3D globe and loading diagnostics
function targetAndSelectNode(node, navigationOptions = {}) {
  if (!node) return;
  trackEvent('node_selected', { node_id: node.id, sphere: node.sphere });

  // Close search results dropdown
  const searchResults = document.getElementById('search-results');
  const searchInput = document.getElementById('node-search-input');
  if (searchResults && searchInput) {
    searchResults.style.display = 'none';
    searchResults.innerHTML = '';
    searchInput.value = '';
    searchInput.blur();
  }

  const appContainer = document.getElementById('app-container');
  const shouldBridgeFromExplore = (
    node &&
    (appContainer?.dataset.viewMode || 'explore') === 'explore' &&
    !navigationOptions.motionOrigin
  );
  const motionOrigin = shouldBridgeFromExplore ? getNodeMotionOrigin(node) : navigationOptions.motionOrigin;

  if (graphInstance) {
    graphInstance.isFocusMode = true;
    graphInstance.needsCentering = true;
    graphInstance.selectNode(node, { instantSwap: true });
    
    if (graphInstance.activeFilter !== 'all' && node.sphere !== graphInstance.activeFilter) {
      setGraphFilter('all');
      const pills = document.querySelectorAll('.filter-pill');
      pills.forEach(p => {
        if (p.getAttribute('data-filter') === 'all') {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    }
    
    // Restore the centered radial sphere frame or fit the active tree.
    graphInstance.zoomToFit();
  }
  scheduleSelectNode(node, { ...navigationOptions, motionOrigin });
}

function scheduleSelectNode(node, navigationOptions = {}) {
  const token = ++queuedSelectionToken;
  window.setTimeout(() => {
    if (token !== queuedSelectionToken) return;
    selectNode(node, navigationOptions);
  }, 0);
}

function cancelPendingSelection() {
  queuedSelectionToken += 1;
}

function normalizeNavigationPath(pathIds = [], fallbackNodeId = null) {
  const ids = Array.isArray(pathIds) ? pathIds : [];
  const nodes = ids.slice(-40).map(id => ROUTABLE_NODE_BY_ID.get(id)).filter(Boolean);
  const fallbackNode = fallbackNodeId ? ROUTABLE_NODE_BY_ID.get(fallbackNodeId) : null;
  if (fallbackNode && nodes.at(-1)?.id !== fallbackNode.id) nodes.push(fallbackNode);
  return nodes;
}

function readNavigationPathFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const pathIds = (params.get('path') || '').split('~').filter(Boolean);
  return normalizeNavigationPath(pathIds, params.get('node'));
}

function getCurrentNavigationPath(node = currentSelectedNode) {
  return [...selectionHistory, node].filter(Boolean).slice(-40);
}

function buildNavigationUrl(pathNodes = getCurrentNavigationPath()) {
  const url = new URL(window.location.href);
  const path = pathNodes.filter(Boolean);
  ['node', 'path'].forEach(key => url.searchParams.delete(key));

  if (path.length) {
    url.searchParams.set('node', path.at(-1).id);
    if (path.length > 1) url.searchParams.set('path', path.map(node => node.id).join('~'));
  }

  return url;
}

function createNavigationHistoryState(pathNodes, depth = navigationEntryDepth) {
  return {
    tulipNavigation: {
      version: NAVIGATION_STATE_VERSION,
      sessionId: navigationSessionId,
      depth,
      pathIds: pathNodes.map(node => node.id)
    }
  };
}

function updateNavigationDocumentTitle(pathNodes) {
  document.title = pathNodes.length ? `${pathNodes.at(-1).name} | TULIP` : 'TULIP';
}

function writeNavigationHistory(mode = 'push') {
  if (!navigationHistoryReady || mode === 'none') return;
  const pathNodes = getCurrentNavigationPath();
  const url = buildNavigationUrl(pathNodes);
  const currentUrl = new URL(window.location.href);
  const isSameUrl = url.pathname === currentUrl.pathname && url.search === currentUrl.search && url.hash === currentUrl.hash;

  if (mode === 'push' && isSameUrl) {
    updateNavigationDocumentTitle(pathNodes);
    return;
  }

  const nextDepth = mode === 'push' ? navigationEntryDepth + 1 : navigationEntryDepth;
  const state = createNavigationHistoryState(pathNodes, nextDepth);
  window.history[mode === 'replace' ? 'replaceState' : 'pushState'](state, '', url);
  navigationEntryDepth = nextDepth;
  updateNavigationDocumentTitle(pathNodes);
}

function resetExplorationState({ historyMode = 'push' } = {}) {
  cancelPendingSelection();

  document.querySelectorAll('.filter-pill').forEach(pill => {
    pill.classList.toggle('active', pill.getAttribute('data-filter') === 'all');
  });

  if (graphInstance) {
    setGraphFilter('all');
    graphInstance.exitFocusMode();
  }

  selectionHistory = [];
  setShellMode('explore');
  selectNode(null, { historyMode, pathNodes: [] });
  studyWorkspaceState = null;
  window.requestAnimationFrame(() => forceExploreTabState());
}

function restoreNavigationPath(pathNodes, { historyMode = 'none' } = {}) {
  const normalizedPath = normalizeNavigationPath(pathNodes.map(node => node.id));
  if (!normalizedPath.length) {
    resetExplorationState({ historyMode });
    return;
  }

  targetAndSelectNode(normalizedPath.at(-1), {
    historyMode,
    pathNodes: normalizedPath
  });
}

function undoLastSelection() {
  const pathNodes = getCurrentNavigationPath();
  if (pathNodes.length <= 1) {
    const currentState = window.history.state?.tulipNavigation;
    if (currentState?.sessionId === navigationSessionId && navigationEntryDepth > 0) {
      window.history.back();
    } else {
      resetExplorationState({ historyMode: 'replace' });
    }
    return;
  }

  const currentState = window.history.state?.tulipNavigation;
  if (currentState?.sessionId === navigationSessionId && navigationEntryDepth > 0) {
    window.history.back();
    return;
  }

  restoreNavigationPath(pathNodes.slice(0, -1), { historyMode: 'replace' });
}

function formatNodeSourceDate(node) {
  const rawDate = nodeSourceDateRegistry.entries?.[node?.id]?.source_date;
  if (!rawDate) return 'Most Recent Data: Unavailable';

  const [year, month] = String(rawDate).split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return 'Most Recent Data: Unavailable';
  }

  const monthLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return `Most Recent Data: ${monthLabel}, ${year}`;
}

function announceStudyShareStatus(message) {
  if (!copyViewStatus) return;
  copyViewStatus.textContent = message;
  window.setTimeout(() => {
    if (copyViewStatus?.textContent === message) copyViewStatus.textContent = '';
  }, 1800);
}

function openCurrentViewInNewTab() {
  window.open(buildNavigationUrl().toString(), '_blank', 'noopener,noreferrer');
  announceStudyShareStatus('Opened in a new tab');
}

async function copyCurrentViewUrl() {
  const shareUrl = buildNavigationUrl().toString();
  try {
    await navigator.clipboard.writeText(shareUrl);
    announceStudyShareStatus('Link copied');
  } catch {
    window.prompt('Copy URL', shareUrl);
    announceStudyShareStatus('Link ready to copy');
  }
}

function normalizePdfText(value = '') {
  return String(value)
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2022/g, '-')
    .replace(/\u2192/g, '->')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPdfElementText(element) {
  return normalizePdfText(element?.textContent || '');
}

function getPdfListItems(element) {
  return [...(element?.querySelectorAll('li') || [])]
    .map(item => getPdfElementText(item))
    .filter(Boolean);
}

async function rasterizeExportAsset(src, targetWidth, fillColor = '') {
  const [{ Canvg }, response] = await Promise.all([
    import('canvg'),
    fetch(src)
  ]);
  if (!response.ok) throw new Error(`Unable to load export asset: ${src}`);
  const sourceSvg = await response.text();
  const svg = fillColor
    ? sourceSvg.replace(/#e0e0e0/gi, fillColor)
    : sourceSvg;
  const viewBox = svg.match(/viewBox=["']\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*["']/i);
  const aspectRatio = viewBox && Number(viewBox[4]) > 0
    ? Number(viewBox[3]) / Number(viewBox[4])
    : 1;
  const raster = document.createElement('canvas');
  raster.width = Math.max(1, Math.round(targetWidth));
  raster.height = Math.max(1, Math.round(raster.width / aspectRatio));
  const context = raster.getContext('2d');
  if (!context) throw new Error(`Unable to rasterize export asset: ${src}`);
  const renderer = Canvg.fromString(context, svg, {
    ignoreAnimation: true,
    ignoreMouse: true,
    ignoreDimensions: true,
    scaleWidth: raster.width,
    scaleHeight: raster.height
  });
  await renderer.render();
  return raster;
}

function pdfArrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return window.btoa(binary);
}

async function registerPdfInterDisplay(pdf) {
  const fontFiles = [
    { file: 'InterDisplay-Regular.ttf', style: 'normal' },
    { file: 'InterDisplay-SemiBold.ttf', style: 'semibold' },
    { file: 'InterDisplay-Bold.ttf', style: 'bold' },
    { file: 'InterDisplay-SemiBoldItalic.ttf', style: 'semibolditalic' }
  ];
  const fontBuffers = await Promise.all(fontFiles.map(async font => {
    const response = await fetch(`/fonts/${font.file}`);
    if (!response.ok) throw new Error(`Unable to load ${font.file} for PDF export`);
    return response.arrayBuffer();
  }));
  fontFiles.forEach((font, index) => {
    pdf.addFileToVFS(font.file, pdfArrayBufferToBase64(fontBuffers[index]));
    pdf.addFont(font.file, 'InterDisplay', font.style);
  });
}

function buildPdfInspectorCards(hasSelectedRelationship) {
  const cards = [];
  const nodeName = currentSelectedNode?.name || getPdfElementText(consoleNodeName) || 'Selected node';
  cards.push({
    accent: [255, 255, 255],
    blocks: [
      { kind: 'kicker', text: getPdfElementText(consoleSphereBadge) || 'TULIP' },
      { kind: 'title', text: nodeName },
      { kind: 'body', text: getPdfElementText(consoleNodeMeaning) },
      { kind: 'label', text: 'TULIP URGENCY' },
      {
        kind: 'urgency',
        score: getPdfElementText(document.getElementById('console-urgency-score')) || '0.0',
        rating: getPdfElementText(document.getElementById('console-urgency-rating')) || 'Low'
      }
    ]
  });

  if (hasSelectedRelationship && currentSelectedEdge) {
    const isTrigger = currentSelectedEdge.target === currentSelectedNode?.id;
    const triggerName = NODE_BY_ID.get(currentSelectedEdge.source)?.name || currentSelectedEdge.source;
    const effectName = NODE_BY_ID.get(currentSelectedEdge.target)?.name || currentSelectedEdge.target;
    cards.push({
      accent: [126, 204, 255],
      blocks: [
        { kind: 'kicker', text: 'RELATIONSHIP' },
        {
          kind: 'pills',
          pills: [
            { text: isTrigger ? triggerName : 'Incoming influence', active: isTrigger },
            { text: isTrigger ? 'Outgoing influence' : effectName, active: !isTrigger }
          ]
        },
        { kind: 'subhead', text: getPdfElementText(connectionDetailHeader) },
        { kind: 'body', text: getPdfElementText(connectionDetailReason) }
      ]
    });
  }

  const humanBlocks = [
    { kind: 'kicker', text: 'IMPACT ON HUMANS' },
    { kind: 'body', text: getPdfElementText(humanImpactSummary) }
  ];
  const humanDomains = [...(humanImpactDomains?.querySelectorAll('.human-impact-domain') || [])]
    .map(domain => getPdfElementText(domain))
    .filter(Boolean)
    .join(', ');
  if (humanDomains) humanBlocks.push({ kind: 'subhead', text: humanDomains });
  getPdfListItems(humanImpactConsequences).forEach(text => humanBlocks.push({ kind: 'bullet', text }));
  if (humanImpactHiddenCostItem && !humanImpactHiddenCostItem.hidden) {
    humanBlocks.push({ kind: 'label', text: 'HIDDEN COST' });
    humanBlocks.push({ kind: 'body', text: getPdfElementText(humanImpactHiddenCost) });
  }
  if (humanImpactWhoPaysItem && !humanImpactWhoPaysItem.hidden) {
    humanBlocks.push({ kind: 'label', text: 'WHO PAYS FOR IT' });
    humanBlocks.push({ kind: 'body', text: getPdfElementText(humanImpactWhoPays) });
  }
  cards.push({ accent: [255, 196, 140], blocks: humanBlocks });

  const planetBlocks = [
    { kind: 'kicker', text: 'IMPACT ON THE PLANET' },
    { kind: 'body', text: getPdfElementText(planetImpactSummary) }
  ];
  const planetDomains = [...(planetImpactDomains?.querySelectorAll('.planet-impact-domain') || [])]
    .map(domain => getPdfElementText(domain))
    .filter(Boolean)
    .join(', ');
  if (planetDomains) planetBlocks.push({ kind: 'subhead', text: planetDomains });
  getPdfListItems(planetImpactConsequences).forEach(text => planetBlocks.push({ kind: 'bullet', text }));
  if (planetImpactPhysicalLimitItem && !planetImpactPhysicalLimitItem.hidden) {
    planetBlocks.push({ kind: 'label', text: 'PHYSICAL LIMIT' });
    planetBlocks.push({ kind: 'body', text: getPdfElementText(planetImpactPhysicalLimit) });
  }
  cards.push({ accent: [146, 221, 176], blocks: planetBlocks });

  const responseBlocks = [
    { kind: 'kicker', text: 'WHAT CAN BE DONE' },
    { kind: 'label', text: 'DEFAULT DRIVER' },
    { kind: 'body', text: getPdfElementText(responseDefaultDriver) },
    { kind: 'label', text: 'SYSTEM LEVERS' }
  ];
  getPdfListItems(responseSystemLevers).forEach(text => responseBlocks.push({ kind: 'bullet', text }));
  cards.push({ accent: [255, 255, 255], blocks: responseBlocks });
  return cards;
}

function getPdfBlockStyle(kind, scale = 1) {
  const styles = {
    kicker: { size: 5.4, lineHeight: 2.5, font: 'bold', color: 'accent', margin: 0 },
    title: { size: 8.6, lineHeight: 4.0, font: 'bold', color: 'white', margin: 1.1 },
    body: { size: 5.0, lineHeight: 2.35, font: 'normal', color: 'body', margin: 1.2 },
    subhead: { size: 5.1, lineHeight: 2.4, font: 'bold', color: 'white', margin: 1.2 },
    label: { size: 5.1, lineHeight: 2.4, font: 'bold', color: 'teal', margin: 1.5 },
    bullet: { size: 4.8, lineHeight: 2.3, font: 'normal', color: 'body', margin: 0.7 }
  };
  const style = styles[kind] || styles.body;
  return Object.fromEntries(Object.entries(style).map(([key, value]) => (
    [key, typeof value === 'number' ? value * scale : value]
  )));
}

function layoutPdfInspectorCard(pdf, card, width, scale = 1) {
  const padding = 3.2;
  const textWidth = width - padding * 2;
  let cursor = padding;
  const items = [];
  for (const block of card.blocks.filter(block => block.text || ['pills', 'urgency'].includes(block.kind))) {
    if (block.kind === 'pills') {
      cursor += 1.2 * scale;
      const pills = block.pills.map(pill => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(4.8 * scale);
        const lines = pdf.splitTextToSize(normalizePdfText(pill.text), textWidth - 5);
        return { ...pill, lines, height: Math.max(6 * scale, lines.length * 2.2 * scale + 2.4 * scale) };
      });
      const height = pills.reduce((sum, pill) => sum + pill.height, 0) + Math.max(0, pills.length - 1) * 1.1 * scale;
      items.push({ block, pills, y: cursor, height });
      cursor += height;
      continue;
    }
    if (block.kind === 'urgency') {
      const height = 17 * scale;
      cursor += 1.1 * scale;
      items.push({ block, y: cursor, height });
      cursor += height;
      continue;
    }
    const style = getPdfBlockStyle(block.kind, scale);
    cursor += style.margin;
    pdf.setFont('helvetica', style.font);
    pdf.setFontSize(style.size);
    const prefix = block.kind === 'bullet' ? '- ' : '';
    const lines = pdf.splitTextToSize(`${prefix}${normalizePdfText(block.text)}`, textWidth);
    const height = Math.max(style.lineHeight, lines.length * style.lineHeight);
    items.push({ block, style, lines, y: cursor, height });
    cursor += height;
  }
  return { height: cursor + padding, items, padding, textWidth };
}

function drawPdfInspectorCard(pdf, card, layout, x, y, width, height, monogramLogoRaster, scale = 1) {
  pdf.setFillColor(41, 42, 48);
  pdf.setDrawColor(58, 59, 66);
  pdf.roundedRect(x, y, width, height, 2.6, 2.6, 'FD');
  const textX = x + layout.padding;
  for (const item of layout.items) {
    const itemY = y + item.y;
    if (item.block.kind === 'pills') {
      let pillY = itemY;
      for (const pill of item.pills) {
        if (pill.active) {
          pdf.setFillColor(255, 255, 255);
          pdf.setTextColor(17, 19, 24);
        } else {
          pdf.setFillColor(31, 32, 38);
          pdf.setTextColor(205, 207, 213);
        }
        pdf.roundedRect(textX, pillY, layout.textWidth, pill.height, 2.4, 2.4, 'F');
        pdf.setFont('helvetica', pill.active ? 'bold' : 'normal');
        pdf.setFontSize(4.8 * scale);
        const firstBaseline = pillY + (pill.height - pill.lines.length * 2.2 * scale) / 2 + 1.8 * scale;
        pdf.text(pill.lines, textX + layout.textWidth / 2, firstBaseline, { align: 'center' });
        pillY += pill.height + 1.1 * scale;
      }
      continue;
    }
    if (item.block.kind === 'urgency') {
      const logoSize = 5.2 * scale;
      pdf.addImage(monogramLogoRaster.toDataURL('image/png'), 'PNG', textX, itemY + 0.5 * scale, logoSize, logoSize);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12 * scale);
      pdf.setTextColor(255, 255, 255);
      pdf.text(normalizePdfText(item.block.score), textX + logoSize + 1.6 * scale, itemY + 4.7 * scale);
      pdf.setFontSize(5.1 * scale);
      pdf.setTextColor(255, 107, 129);
      pdf.text(normalizePdfText(item.block.rating), textX + logoSize + 14 * scale, itemY + 4.4 * scale);
      const trackY = itemY + 8 * scale;
      const trackWidth = layout.textWidth;
      const segmentWidth = trackWidth / 4;
      [[82, 165, 230], [130, 169, 206], [186, 157, 173], [225, 117, 117]].forEach((color, index) => {
        pdf.setFillColor(...color);
        pdf.rect(textX + segmentWidth * index, trackY, segmentWidth, 4.1 * scale, 'F');
      });
      const score = Math.max(1, Math.min(10, Number(item.block.score) || 1));
      const markerX = textX + ((score - 1) / 9) * trackWidth;
      pdf.setFillColor(24, 25, 31);
      pdf.circle(markerX, trackY + 2.05 * scale, 1.5 * scale, 'F');
      pdf.setFontSize(4.2 * scale);
      pdf.setTextColor(255, 255, 255);
      pdf.text(score.toFixed(1), markerX, trackY + 2.55 * scale, { align: 'center' });
      continue;
    }
    const { style } = item;
    pdf.setFont('helvetica', style.font);
    pdf.setFontSize(style.size);
    if (style.color === 'accent') pdf.setTextColor(...card.accent);
    else if (style.color === 'teal') pdf.setTextColor(38, 205, 199);
    else if (style.color === 'white') pdf.setTextColor(255, 255, 255);
    else pdf.setTextColor(205, 207, 213);
    pdf.text(item.lines, textX, itemY + style.lineHeight * 0.76, { lineHeightFactor: 1.05 });
  }
}

function buildPdfQuestionAnswers(hasSelectedRelationship) {
  const nodeName = currentSelectedNode?.name || getPdfElementText(consoleNodeName) || 'Selected node';
  const entries = [];
  const addEntry = (section, question, paragraphs = [], bullets = [], accent = [255, 255, 255]) => {
    const cleanParagraphs = paragraphs.map(normalizePdfText).filter(Boolean);
    const cleanBullets = bullets.map(normalizePdfText).filter(Boolean);
    if (!cleanParagraphs.length && !cleanBullets.length) return;
    entries.push({ section, question: normalizePdfText(question), paragraphs: cleanParagraphs, bullets: cleanBullets, accent });
  };

  addEntry(
    'OVERVIEW',
    `What is ${nodeName}?`,
    [getPdfElementText(consoleNodeMeaning)],
    [],
    [255, 255, 255]
  );

  if (hasSelectedRelationship && currentSelectedEdge) {
    const triggerName = NODE_BY_ID.get(currentSelectedEdge.source)?.name || currentSelectedEdge.source;
    const effectName = NODE_BY_ID.get(currentSelectedEdge.target)?.name || currentSelectedEdge.target;
    addEntry(
      'RELATIONSHIP',
      getPdfElementText(connectionDetailHeader)
        || `How ${getRelationshipQuestionAuxiliary(NODE_BY_ID.get(currentSelectedEdge.source) || currentSelectedEdge.source)} ${triggerName} affect ${effectName}?`,
      [`Active relationship: ${triggerName} -> ${effectName}`, getPdfElementText(connectionDetailReason)],
      [],
      [126, 204, 255]
    );
  }

  const humanDomains = [...(humanImpactDomains?.querySelectorAll('.human-impact-domain') || [])]
    .map(domain => getPdfElementText(domain))
    .filter(Boolean)
    .join(', ');
  addEntry(
    'IMPACT ON HUMANS',
    `How does ${nodeName} affect people?`,
    [
      getPdfElementText(humanImpactSummary),
      humanDomains ? `Affected domains: ${humanDomains}` : ''
    ],
    getPdfListItems(humanImpactConsequences),
    [255, 196, 140]
  );
  if (humanImpactHiddenCostItem && !humanImpactHiddenCostItem.hidden) {
    addEntry(
      'IMPACT ON HUMANS',
      'What is the hidden cost?',
      [getPdfElementText(humanImpactHiddenCost)],
      [],
      [255, 196, 140]
    );
  }
  if (humanImpactWhoPaysItem && !humanImpactWhoPaysItem.hidden) {
    addEntry(
      'IMPACT ON HUMANS',
      'Who pays for it?',
      [getPdfElementText(humanImpactWhoPays)],
      [],
      [255, 196, 140]
    );
  }

  const planetDomains = [...(planetImpactDomains?.querySelectorAll('.planet-impact-domain') || [])]
    .map(domain => getPdfElementText(domain))
    .filter(Boolean)
    .join(', ');
  addEntry(
    'IMPACT ON THE PLANET',
    `How does ${nodeName} affect the planet?`,
    [
      getPdfElementText(planetImpactSummary),
      planetDomains ? `Affected systems: ${planetDomains}` : ''
    ],
    getPdfListItems(planetImpactConsequences),
    [146, 221, 176]
  );
  if (planetImpactPhysicalLimitItem && !planetImpactPhysicalLimitItem.hidden) {
    addEntry(
      'IMPACT ON THE PLANET',
      'What is the physical limit?',
      [getPdfElementText(planetImpactPhysicalLimit)],
      [],
      [146, 221, 176]
    );
  }

  addEntry(
    'WHAT CAN BE DONE',
    `What keeps ${nodeName} in place?`,
    [getPdfElementText(responseDefaultDriver)],
    [],
    [38, 205, 199]
  );
  addEntry(
    'WHAT CAN BE DONE',
    'What can be done?',
    [],
    getPdfListItems(responseSystemLevers),
    [38, 205, 199]
  );
  return entries;
}

function buildSamplePdfSections(hasSelectedRelationship) {
  const nodeName = currentSelectedNode?.name || getPdfElementText(consoleNodeName) || 'Selected node';
  const cleanAnswers = values => values.map(normalizePdfText).filter(Boolean);
  const sections = [];

  if (hasSelectedRelationship && currentSelectedEdge) {
    const triggerName = NODE_BY_ID.get(currentSelectedEdge.source)?.name || currentSelectedEdge.source;
    const effectName = NODE_BY_ID.get(currentSelectedEdge.target)?.name || currentSelectedEdge.target;
    sections.push({
      title: 'Relationship',
      items: [{
        question: getPdfElementText(connectionDetailHeader)
          || `How ${getRelationshipQuestionAuxiliary(NODE_BY_ID.get(currentSelectedEdge.source) || currentSelectedEdge.source)} ${triggerName} affect ${effectName}?`,
        answers: cleanAnswers([
          `${triggerName} -> ${effectName}`,
          getPdfElementText(connectionDetailReason)
        ])
      }]
    });
  }

  const humanItems = [{
    question: `How does ${nodeName} affect people?`,
    answers: cleanAnswers([
      getPdfElementText(humanImpactSummary),
      ...getPdfListItems(humanImpactConsequences)
    ])
  }];
  if (humanImpactHiddenCostItem && !humanImpactHiddenCostItem.hidden) {
    humanItems.push({
      question: 'What is the hidden cost?',
      answers: cleanAnswers([getPdfElementText(humanImpactHiddenCost)])
    });
  }
  if (humanImpactWhoPaysItem && !humanImpactWhoPaysItem.hidden) {
    humanItems.push({
      question: 'Who pays for it?',
      answers: cleanAnswers([getPdfElementText(humanImpactWhoPays)])
    });
  }
  sections.push({ title: 'Impact on Humans', items: humanItems });

  sections.push({
    title: 'Impact on the Planet',
    items: [{
      question: `How does ${nodeName} affect the planet?`,
      answers: cleanAnswers([
        getPdfElementText(planetImpactSummary),
        ...getPdfListItems(planetImpactConsequences)
      ])
    }]
  });

  sections.push({
    title: 'What can be done',
    items: [{
      question: `What keeps ${nodeName} in place?`,
      answers: cleanAnswers([
        getPdfElementText(responseDefaultDriver),
        ...getPdfListItems(responseSystemLevers)
      ])
    }]
  });

  return sections;
}

function cropPdfGraphCapture(canvas, labels, viewportWidth, viewportHeight) {
  if (!labels.length || !viewportWidth || !viewportHeight) {
    return { canvas, labels, width: viewportWidth || canvas.width, height: viewportHeight || canvas.height };
  }

  const horizontalPadding = 48;
  const verticalPadding = 58;
  const halfLabelWidth = label => Math.max(62, label.text.length * 5.8);
  const minX = Math.max(0, Math.min(...labels.map(label => label.x - halfLabelWidth(label))) - horizontalPadding);
  const maxX = Math.min(viewportWidth, Math.max(...labels.map(label => label.x + halfLabelWidth(label))) + horizontalPadding);
  const minY = Math.max(0, Math.min(...labels.map(label => label.y)) - verticalPadding);
  const maxY = Math.min(viewportHeight, Math.max(...labels.map(label => label.y)) + verticalPadding);
  const cropWidth = Math.max(1, maxX - minX);
  const cropHeight = Math.max(1, maxY - minY);
  const scaleX = canvas.width / viewportWidth;
  const scaleY = canvas.height / viewportHeight;
  const cropped = document.createElement('canvas');
  cropped.width = Math.max(1, Math.round(cropWidth * scaleX));
  cropped.height = Math.max(1, Math.round(cropHeight * scaleY));
  const context = cropped.getContext('2d');
  if (!context) return { canvas, labels, width: viewportWidth, height: viewportHeight };
  context.drawImage(
    canvas,
    Math.round(minX * scaleX),
    Math.round(minY * scaleY),
    cropped.width,
    cropped.height,
    0,
    0,
    cropped.width,
    cropped.height
  );
  return {
    canvas: cropped,
    labels: labels.map(label => ({ ...label, x: label.x - minX, y: label.y - minY })),
    width: cropWidth,
    height: cropHeight
  };
}

function cropWhitePdfGraphCapture(canvas, labels, viewportWidth, viewportHeight) {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !canvas.width || !canvas.height) {
    return { canvas, labels, width: viewportWidth || canvas.width, height: viewportHeight || canvas.height };
  }
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  let minX = canvas.width;
  let minY = canvas.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const offset = (y * canvas.width + x) * 4;
      if (data[offset + 3] < 16) continue;
      if (data[offset] > 246 && data[offset + 1] > 246 && data[offset + 2] > 246) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) {
    return { canvas, labels, width: viewportWidth || canvas.width, height: viewportHeight || canvas.height };
  }

  const scaleX = canvas.width / Math.max(1, viewportWidth);
  const scaleY = canvas.height / Math.max(1, viewportHeight);
  const padX = Math.round(16 * scaleX);
  const padY = Math.round(12 * scaleY);
  minX = Math.max(0, minX - padX);
  minY = Math.max(0, minY - padY);
  maxX = Math.min(canvas.width - 1, maxX + padX);
  maxY = Math.min(canvas.height - 1, maxY + padY);
  const cropWidth = Math.max(1, maxX - minX + 1);
  const cropHeight = Math.max(1, maxY - minY + 1);
  const cropped = document.createElement('canvas');
  cropped.width = cropWidth;
  cropped.height = cropHeight;
  const croppedContext = cropped.getContext('2d');
  if (!croppedContext) return { canvas, labels, width: viewportWidth, height: viewportHeight };
  croppedContext.fillStyle = '#ffffff';
  croppedContext.fillRect(0, 0, cropWidth, cropHeight);
  croppedContext.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
  const logicalMinX = minX / scaleX;
  const logicalMinY = minY / scaleY;
  return {
    canvas: cropped,
    labels: labels.map(label => ({ ...label, x: label.x - logicalMinX, y: label.y - logicalMinY })),
    width: cropWidth / scaleX,
    height: cropHeight / scaleY
  };
}

function fillPdfPageBackground(pdf) {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight(), 'F');
}

function createPdfGradientCanvas(colors, width = 1200, height = 80) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create PDF gradient canvas');
  const gradient = context.createLinearGradient(0, 0, width, 0);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / Math.max(1, colors.length - 1), `rgb(${color.join(',')})`);
  });
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  return canvas;
}

function drawPdfBrandLogo(pdf, brandLogoRaster, x, y, width = 40) {
  const height = width * brandLogoRaster.height / brandLogoRaster.width;
  pdf.addImage(brandLogoRaster.toDataURL('image/png'), 'PNG', x, y, width, height);
  return y + height;
}

function createPdfCapsulePath(x, y, width, height) {
  const radius = height / 2;
  const curve = radius * 0.5522847498;
  return [
    { op: 'm', c: [x + radius, y] },
    { op: 'l', c: [x + width - radius, y] },
    {
      op: 'c',
      c: [
        x + width - radius + curve,
        y,
        x + width,
        y + radius - curve,
        x + width,
        y + radius
      ]
    },
    {
      op: 'c',
      c: [
        x + width,
        y + radius + curve,
        x + width - radius + curve,
        y + height,
        x + width - radius,
        y + height
      ]
    },
    { op: 'l', c: [x + radius, y + height] },
    {
      op: 'c',
      c: [
        x + radius - curve,
        y + height,
        x,
        y + radius + curve,
        x,
        y + radius
      ]
    },
    {
      op: 'c',
      c: [
        x,
        y + radius - curve,
        x + radius - curve,
        y,
        x + radius,
        y
      ]
    },
    { op: 'h', c: [] }
  ];
}

function drawPdfCapsule(pdf, x, y, width, height, color) {
  pdf.setFillColor(...color);
  pdf.path(createPdfCapsulePath(x, y, width, height));
  pdf.fill();
}

function drawPdfGradientCapsule(pdf, gradientCanvas, x, y, width, height) {
  pdf.saveGraphicsState();
  pdf.path(createPdfCapsulePath(x, y, width, height));
  pdf.clip();
  pdf.discardPath();
  pdf.addImage(gradientCanvas.toDataURL('image/png'), 'PNG', x, y, width, height);
  pdf.restoreGraphicsState();
}

function drawPdfDocumentHeader(pdf, brandLogoRaster, nodeName, sphereLabel, meaning, scoreText, margin) {
  const logoWidth = 40;
  const headerX = margin - 0.4;
  drawPdfBrandLogo(pdf, brandLogoRaster, headerX, 16.6, logoWidth);

  pdf.setFont('InterDisplay', 'semibold');
  pdf.setFontSize(10);
  pdf.setTextColor(43, 40, 40);
  pdf.text(normalizePdfText(sphereLabel).toUpperCase(), headerX, 46.9);

  let titleFontSize = 20;
  const score = Math.max(1, Math.min(10, Number(scoreText) || 1));
  const scoreLabel = score.toFixed(1);
  const scorePillWidth = 15.7;
  const availableTitleWidth = pdf.internal.pageSize.getWidth() - headerX - margin - scorePillWidth - 8;
  pdf.setFont('InterDisplay', 'normal');
  pdf.setFontSize(titleFontSize);
  while (titleFontSize > 16 && pdf.getTextWidth(normalizePdfText(nodeName)) > availableTitleWidth) {
    titleFontSize -= 0.5;
    pdf.setFontSize(titleFontSize);
  }
  const titleY = 55.9;
  pdf.text(normalizePdfText(nodeName), headerX, titleY);
  const titleWidth = pdf.getTextWidth(normalizePdfText(nodeName));
  const scoreX = Math.min(
    pdf.internal.pageSize.getWidth() - margin - scorePillWidth,
    headerX + titleWidth + 6.85
  );
  const titleScoreY = 49.15;
  const titleScoreHeight = 8.4;
  drawPdfCapsule(pdf, scoreX, titleScoreY, scorePillWidth, titleScoreHeight, [0, 0, 0]);
  pdf.setFont('InterDisplay', 'semibold');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text(
    scoreLabel,
    scoreX + scorePillWidth / 2,
    titleScoreY + titleScoreHeight / 2,
    { align: 'center', baseline: 'middle' }
  );

  pdf.setDrawColor(43, 40, 40);
  pdf.setLineWidth(0.22);
  pdf.line(headerX, 57.95, Math.max(headerX + 35, scoreX - 7.3), 57.95);

  pdf.setFont('InterDisplay', 'normal');
  pdf.setFontSize(12);
  pdf.setTextColor(43, 40, 40);
  const meaningLines = pdf.splitTextToSize(
    normalizePdfText(meaning),
    pdf.internal.pageSize.getWidth() - headerX - margin
  );
  pdf.text(meaningLines, headerX, 65.5, { lineHeightFactor: 1.18 });
  return 65.5 + meaningLines.length * 5 + 8;
}

function drawPdfUrgencyGraph(pdf, x, y, width, scoreText, ratingText) {
  const score = Math.max(1, Math.min(10, Number(scoreText) || 1));
  pdf.setFont('InterDisplay', 'semibold');
  pdf.setFontSize(13);
  pdf.setTextColor(43, 40, 40);
  pdf.text(`TULIP URGENCY SCORE: ${score.toFixed(1)} (${normalizePdfText(ratingText).toUpperCase()})`, x, y);

  const trackY = y + 6.15;
  const trackHeight = 5.5;
  const urgencyGradient = createPdfGradientCanvas([[117, 170, 219], [131, 167, 215], [232, 91, 71]], 1600, 96);
  drawPdfGradientCapsule(pdf, urgencyGradient, x, trackY, width, trackHeight);

  const markerWidth = 15.7;
  const markerHeight = 8.4;
  const markerCenterX = x + ((score - 1) / 9) * width;
  const markerLeft = Math.max(x, Math.min(x + width - markerWidth, markerCenterX - markerWidth / 2));
  const markerTop = trackY - 1.4;
  drawPdfCapsule(pdf, markerLeft, markerTop, markerWidth, markerHeight, [21, 24, 29]);
  pdf.setFont('InterDisplay', 'normal');
  pdf.setFontSize(16);
  pdf.setTextColor(255, 255, 255);
  pdf.text(
    score.toFixed(1),
    markerLeft + markerWidth / 2,
    markerTop + markerHeight / 2,
    { align: 'center', baseline: 'middle' }
  );

  pdf.setFont('InterDisplay', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(158, 161, 172);
  [1, 3, 5, 7, 10].forEach(value => {
    const tickX = x + ((value - 1) / 9) * width;
    pdf.text(String(value), tickX, trackY + 14, { align: 'center' });
  });
  return trackY + 18;
}

function captureCenteredGraphForExport(sourceCanvas) {
  const snapshot = document.createElement('canvas');
  snapshot.width = sourceCanvas.width;
  snapshot.height = sourceCanvas.height;
  const snapshotContext = snapshot.getContext('2d');
  if (!snapshotContext) throw new Error('Graph export canvas context unavailable');

  if (!graphInstance) {
    snapshotContext.drawImage(sourceCanvas, 0, 0);
    return { canvas: snapshot, labels: [], width: sourceCanvas.width, height: sourceCanvas.height };
  }

  const savedCamera = { ...graphInstance.camera };
  const savedTargetCamera = graphInstance.targetCamera ? { ...graphInstance.targetCamera } : null;
  const savedCanvas = graphInstance.canvas;
  const savedContext = graphInstance.ctx;
  const savedWidth = graphInstance.width;
  const savedHeight = graphInstance.height;
  const savedNeedsCentering = graphInstance.needsCentering;
  const savedLayoutMode = graphInstance.layoutMode;
  const savedLayoutTransition = graphInstance.layoutTransition;
  const savedExportBackgroundColor = graphInstance.exportBackgroundColor;
  const savedCachedTreeLayout = graphInstance.cachedTreeLayout;
  const savedCachedTreeLayoutKey = graphInstance.cachedTreeLayoutKey;
  const savedCachedAnalyzeFocusData = graphInstance.cachedAnalyzeFocusData;
  const savedCachedAnalyzeFocusKey = graphInstance.cachedAnalyzeFocusKey;
  const savedNodeState = graphInstance.nodes.map(node => ({
    node,
    x: node.x,
    y: node.y,
    z: node.z,
    opacityMultiplier: node.opacityMultiplier
  }));
  const wasRunning = graphInstance.isRunning;
  let captureViewportWidth = savedWidth;
  let captureViewportHeight = savedHeight;
  let labels = [];

  try {
    graphInstance.pause();
    const exportCanvas = document.createElement('canvas');
    const exportContext = exportCanvas.getContext('2d');
    if (!exportContext) throw new Error('Graph export canvas context unavailable');
    const exportViewportScale = 1.45;
    const renderPixelRatio = graphInstance.renderPixelRatio || Math.min(window.devicePixelRatio || 1, 3);
    captureViewportWidth = savedWidth * exportViewportScale;
    captureViewportHeight = savedHeight;
    exportCanvas.width = Math.max(1, Math.round(captureViewportWidth * renderPixelRatio));
    exportCanvas.height = Math.max(1, Math.round(captureViewportHeight * renderPixelRatio));
    graphInstance.canvas = exportCanvas;
    graphInstance.ctx = exportContext;
    graphInstance.width = captureViewportWidth;
    graphInstance.height = captureViewportHeight;
    snapshot.width = exportCanvas.width;
    snapshot.height = exportCanvas.height;
    graphInstance.layoutMode = 'tree';
    graphInstance.layoutTransition = 1;
    graphInstance.exportBackgroundColor = '#ffffff';
    graphInstance.needsCentering = false;
    graphInstance.invalidateAnalyzeCaches();
    if (currentSelectedEdge) graphInstance.setSelectedEdge(currentSelectedEdge);
    graphInstance.zoomToFit();
    if (graphInstance.targetCamera) {
      graphInstance.camera = { ...graphInstance.targetCamera };
    }
    // The tree's category brackets and labels sit beyond the node-label bounds.
    // Add export-only breathing room so those outer labels render inside the
    // source canvas before the white-space crop is calculated.
    const exportZoomFactor = 0.9;
    const viewportCenter = {
      x: graphInstance.width / 2,
      y: graphInstance.height / 2
    };
    const worldCenter = graphInstance.screenToWorld(viewportCenter.x, viewportCenter.y);
    graphInstance.camera.zoom *= exportZoomFactor;
    graphInstance.camera.x = viewportCenter.x - worldCenter.x * graphInstance.camera.zoom;
    graphInstance.camera.y = viewportCenter.y - worldCenter.y * graphInstance.camera.zoom;
    graphInstance.targetCamera = null;
    graphInstance.updatePhysics();
    graphInstance.draw();
    snapshotContext.drawImage(exportCanvas, 0, 0);
    labels = graphInstance.nodes
      .filter(node => (node.labelOpacity || 0) > 0.08 && graphInstance.isNodeVisibleInCurrentView(node))
      .map(node => ({
        text: normalizePdfText(node.name),
        ...graphInstance.worldToScreen(node.x, node.y)
      }));
  } finally {
    savedNodeState.forEach(state => {
      state.node.x = state.x;
      state.node.y = state.y;
      state.node.z = state.z;
      state.node.opacityMultiplier = state.opacityMultiplier;
    });
    graphInstance.camera = savedCamera;
    graphInstance.targetCamera = savedTargetCamera;
    graphInstance.canvas = savedCanvas;
    graphInstance.ctx = savedContext;
    graphInstance.width = savedWidth;
    graphInstance.height = savedHeight;
    graphInstance.needsCentering = savedNeedsCentering;
    graphInstance.layoutMode = savedLayoutMode;
    graphInstance.layoutTransition = savedLayoutTransition;
    graphInstance.exportBackgroundColor = savedExportBackgroundColor;
    graphInstance.cachedTreeLayout = savedCachedTreeLayout;
    graphInstance.cachedTreeLayoutKey = savedCachedTreeLayoutKey;
    graphInstance.cachedAnalyzeFocusData = savedCachedAnalyzeFocusData;
    graphInstance.cachedAnalyzeFocusKey = savedCachedAnalyzeFocusKey;
    graphInstance.draw();
    if (wasRunning) graphInstance.resume();
  }

  return cropWhitePdfGraphCapture(snapshot, labels, captureViewportWidth, captureViewportHeight);
}

async function exportCurrentViewAsPdf() {
  const sourceCanvas = graphInstance?.canvas || document.getElementById('graph-canvas');
  if (!sourceCanvas || !studyConsole) {
    announceStudyShareStatus('PDF export unavailable');
    return;
  }

  const hasSelectedRelationship = Boolean(
    currentSelectedEdge
    && connectionDetailSection
    && !connectionDetailSection.hidden
  );
  announceStudyShareStatus('Preparing PDF');

  try {
    await document.fonts?.ready;
    const [{ jsPDF }, graphCapture, brandLogoRaster] = await Promise.all([
      import('jspdf'),
      Promise.resolve(captureCenteredGraphForExport(sourceCanvas)),
      rasterizeExportAsset('/logo.svg', 960, '#555153')
    ]);

    const nodeSlug = (currentSelectedNode?.name || 'view')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'view';
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    await registerPdfInterDisplay(pdf);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const nodeName = currentSelectedNode?.name || getPdfElementText(consoleNodeName) || 'Selected node';
    const sphereLabel = getPdfElementText(consoleSphereBadge) || 'TULIP';
    const meaning = getPdfElementText(consoleNodeMeaning);
    const scoreText = getPdfElementText(document.getElementById('console-urgency-score')) || '1.0';
    const ratingText = getPdfElementText(document.getElementById('console-urgency-rating')) || 'Low';
    const sourceDate = formatNodeSourceDate(currentSelectedNode)
      .replace(/^LAST UPDATED:/i, 'Most Recent Data:')
      .replace(/^MOST RECENT DATA:/, 'Most Recent Data:');
    const sections = buildSamplePdfSections(hasSelectedRelationship);
    const humanSection = sections.find(section => section.title === 'Impact on Humans');
    const relationshipSection = sections.find(section => section.title === 'Relationship');
    const planetSection = sections.find(section => section.title === 'Impact on the Planet');
    const actionSection = sections.find(section => section.title === 'What can be done');
    pdf.setProperties({
      title: `TULIP_${nodeName}`,
      subject: 'TULIP node-link tree and impact briefing',
      author: 'TULIP',
      creator: 'TULIP'
    });

    const startPdfPage = (addPage = false) => {
      if (addPage) pdf.addPage('a4', 'portrait');
      fillPdfPageBackground(pdf);
    };

    const bodyColor = [43, 40, 40];
    const answerFontSize = 12;
    const answerLineHeight = 5.08;
    const questionFontSize = 12;
    const questionLineHeight = 5.08;
    const sectionFontSize = 14;
    const numberX = 3.7;
    const answerX = margin;
    const answerWidth = pageWidth - margin * 2;

    const drawSectionHeading = (sectionTitle, y, continued = false) => {
      pdf.setFont('InterDisplay', 'semibold');
      pdf.setFontSize(sectionFontSize);
      pdf.setTextColor(...bodyColor);
      pdf.text(sectionTitle, margin, y);
      const titleWidth = pdf.getTextWidth(sectionTitle);
      if (continued) {
        pdf.setFont('InterDisplay', 'semibolditalic');
        pdf.text(' (continued)', margin + titleWidth, y);
      }
      pdf.setDrawColor(...bodyColor);
      pdf.setLineWidth(0.22);
      pdf.line(margin, y + 1.5, margin + titleWidth, y + 1.5);
      return y + 9.1;
    };

    const drawQuestion = (question, y, continued = false) => {
      pdf.setFont('InterDisplay', 'semibold');
      pdf.setFontSize(questionFontSize);
      pdf.setTextColor(...bodyColor);
      const suffix = continued ? ' (continued)' : '';
      const lines = pdf.splitTextToSize(`${normalizePdfText(question)}${suffix}`, answerWidth);
      pdf.text(lines, margin, y, { lineHeightFactor: 1.2 });
      return y + lines.length * questionLineHeight + 3.5;
    };

    const drawNumberedAnswers = (answers, y, bottomY, startNumber = 1) => {
      const remaining = [];
      let cursorY = y;
      answers.forEach((answer, answerIndex) => {
        if (remaining.length) {
          remaining.push(answer);
          return;
        }
        pdf.setFont('InterDisplay', 'normal');
        pdf.setFontSize(answerFontSize);
        const lines = pdf.splitTextToSize(normalizePdfText(answer), answerWidth);
        const requiredHeight = lines.length * answerLineHeight;
        if (cursorY + requiredHeight > bottomY) {
          remaining.push(answer);
          return;
        }
        pdf.setTextColor(...bodyColor);
        pdf.text(`${startNumber + answerIndex}.`, numberX, cursorY);
        pdf.text(lines, answerX, cursorY, { lineHeightFactor: 1.2 });
        cursorY += requiredHeight;
      });
      return { y: cursorY, remaining };
    };

    const drawQuestionBlock = (item, y, bottomY, options = {}) => {
      let cursorY = drawQuestion(item.question, y, options.continued === true);
      const answerResult = drawNumberedAnswers(
        options.answers || item.answers,
        cursorY,
        bottomY,
        options.startNumber || 1
      );
      return { y: answerResult.y, remaining: answerResult.remaining };
    };

    startPdfPage();
    const headerEndY = drawPdfDocumentHeader(
      pdf,
      brandLogoRaster,
      nodeName,
      sphereLabel,
      meaning,
      scoreText,
      margin
    );
    const graphRegionY = Math.max(84, headerEndY + 6);
    const graphRegionBottom = 180;
    const graphRegionHeight = Math.max(1, graphRegionBottom - graphRegionY);
    const graphRegionWidth = contentWidth;
    const graphAspect = graphCapture.canvas.width / Math.max(1, graphCapture.canvas.height);
    const graphRegionAspect = graphRegionWidth / graphRegionHeight;
    const graphWidth = graphAspect > graphRegionAspect
      ? graphRegionWidth
      : graphRegionHeight * graphAspect;
    const graphHeight = graphWidth / graphAspect;
    const graphX = (pageWidth - graphWidth) / 2;
    const graphY = graphRegionY + (graphRegionHeight - graphHeight) / 2;
    pdf.addImage(
      graphCapture.canvas.toDataURL('image/png'),
      'PNG',
      graphX,
      graphY,
      graphWidth,
      graphHeight,
      undefined,
      'FAST'
    );

    pdf.setFont('InterDisplay', 'normal');
    pdf.setFontSize(10);
    graphCapture.labels.forEach(label => {
      const labelX = graphX + (label.x / Math.max(1, graphCapture.width)) * graphWidth;
      const labelY = graphY + (label.y / Math.max(1, graphCapture.height)) * graphHeight;
      pdf.text(label.text, labelX, labelY, { renderingMode: 'invisible', align: 'center' });
    });

    drawPdfUrgencyGraph(
      pdf,
      margin,
      190.9,
      188,
      scoreText,
      ratingText
    );

    let firstHumanRemaining = [];
    let firstHumanContinuationNumber = 1;
    if (humanSection?.items?.length) {
      let pageOneY = drawSectionHeading(humanSection.title, 227.9);
      const firstHumanResult = drawQuestionBlock(humanSection.items[0], pageOneY, 290);
      firstHumanRemaining = firstHumanResult.remaining;
      firstHumanContinuationNumber = Math.max(
        1,
        (humanSection.items[0].answers?.length || 0) - firstHumanRemaining.length + 1
      );
    }

    const firstSectionGap = 12;
    const sectionGap = 12;
    const questionBlockGap = 7;
    // Use the full A4 body before paginating. The footer is positioned after
    // the final content block, so reserving its old fixed Y here created a
    // large empty area and unnecessarily pushed short final sections forward.
    const flowingContentBottom = 280;
    let pageTwoY = 0;

    const startFlowingPage = (sectionTitle, continued = true) => {
      startPdfPage(true);
      const logoBottom = drawPdfBrandLogo(pdf, brandLogoRaster, margin - 0.4, 16.6, 40);
      pageTwoY = drawSectionHeading(sectionTitle, logoBottom + 22.9, continued);
    };

    const startFlowingSection = (sectionTitle, gap = sectionGap) => {
      const minimumSectionHeight = 9.1 + questionLineHeight + answerLineHeight + 7;
      if (pageTwoY + gap + minimumSectionHeight > flowingContentBottom) {
        startFlowingPage(sectionTitle, false);
        return;
      }
      pageTwoY = drawSectionHeading(sectionTitle, pageTwoY + gap);
    };

    const drawFlowingQuestion = (sectionTitle, item, options = {}, gapAfter = 0) => {
      let answers = options.answers || item.answers || [];
      let startNumber = options.startNumber || 1;
      let continued = options.continued === true;

      while (true) {
        const questionLines = pdf.splitTextToSize(
          `${normalizePdfText(item.question)}${continued ? ' (continued)' : ''}`,
          answerWidth
        );
        const minimumBlockHeight = questionLines.length * questionLineHeight
          + 3.5
          + (answers.length ? answerLineHeight : 0);
        if (pageTwoY + minimumBlockHeight > flowingContentBottom) {
          startFlowingPage(sectionTitle, true);
          continued = true;
        }

        const result = drawQuestionBlock(item, pageTwoY, flowingContentBottom, {
          ...options,
          answers,
          startNumber,
          continued
        });
        const consumedAnswerCount = answers.length - result.remaining.length;
        pageTwoY = result.y;

        if (!result.remaining.length) break;
        if (consumedAnswerCount === 0) {
          throw new Error(`PDF answer is too long to fit on an A4 page: ${item.question}`);
        }

        startNumber += consumedAnswerCount;
        answers = result.remaining;
        continued = true;
        startFlowingPage(sectionTitle, true);
      }

      pageTwoY += gapAfter;
    };

    startFlowingPage('Impact on Humans', true);
    const pageTwoHumanItems = [];
    if (firstHumanRemaining.length && humanSection?.items?.[0]) {
      pageTwoHumanItems.push({
        item: humanSection.items[0],
        options: {
          continued: true,
          answers: firstHumanRemaining,
          startNumber: firstHumanContinuationNumber
        }
      });
    }
    (humanSection?.items || []).slice(1).forEach(item => {
      pageTwoHumanItems.push({ item, options: {} });
    });
    pageTwoHumanItems.forEach((entry, index) => {
      drawFlowingQuestion(
        'Impact on Humans',
        entry.item,
        entry.options,
        index < pageTwoHumanItems.length - 1 ? questionBlockGap : 0
      );
    });

    if (relationshipSection?.items?.length) {
      startFlowingSection(relationshipSection.title, firstSectionGap);
      relationshipSection.items.forEach((item, index) => {
        drawFlowingQuestion(
          relationshipSection.title,
          item,
          {},
          index < relationshipSection.items.length - 1 ? questionBlockGap : 0
        );
      });
    }

    if (planetSection?.items?.length) {
      const planetSectionGap = relationshipSection?.items?.length ? sectionGap : firstSectionGap;
      startFlowingSection(planetSection.title, planetSectionGap);
      planetSection.items.forEach((item, index) => {
        drawFlowingQuestion(
          planetSection.title,
          item,
          {},
          index < planetSection.items.length - 1 ? questionBlockGap : 0
        );
      });
    }

    if (actionSection?.items?.length) {
      startFlowingSection(actionSection.title, sectionGap);
      actionSection.items.forEach((item, index) => {
        drawFlowingQuestion(
          actionSection.title,
          item,
          {},
          index < actionSection.items.length - 1 ? questionBlockGap : 0
        );
      });
    }

    const footerLineY = Math.max(253.46, pageTwoY + 3.5);
    const footerTextY = footerLineY + 6.94;
    pdf.setDrawColor(...bodyColor);
    pdf.setLineWidth(0.22);
    pdf.line(8.57, footerLineY, pageWidth - 8.57, footerLineY);
    pdf.setFont('InterDisplay', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...bodyColor);
    pdf.text(normalizePdfText(sourceDate), pageWidth / 2, footerTextY, { align: 'center' });

    pdf.save(`tulip-${nodeSlug}.pdf`);
    announceStudyShareStatus('PDF saved');
  } catch (error) {
    console.error('Unable to export TULIP PDF:', error);
    announceStudyShareStatus('PDF export unavailable');
  }
}

function initializeNavigationHistory() {
  const pathNodes = readNavigationPathFromUrl();
  navigationEntryDepth = 0;
  navigationHistoryReady = true;
  window.history.replaceState(createNavigationHistoryState(pathNodes, 0), '', buildNavigationUrl(pathNodes));
  updateNavigationDocumentTitle(pathNodes);

  window.addEventListener('popstate', event => {
    const state = event.state?.tulipNavigation;
    navigationEntryDepth = state?.sessionId === navigationSessionId && Number.isFinite(state.depth) ? state.depth : 0;
    const restoredPath = state?.pathIds
      ? normalizeNavigationPath(state.pathIds)
      : readNavigationPathFromUrl();
    restoreNavigationPath(restoredPath, { historyMode: 'none' });
    updateNavigationDocumentTitle(restoredPath);
  });

  if (pathNodes.length) restoreNavigationPath(pathNodes, { historyMode: 'none' });
}

const DEFAULT_REFRESH_WINDOW_MS = 42 * 24 * 60 * 60 * 1000;
const REMOTE_REFRESH_ENABLED = import.meta.env.VITE_TULIP_REMOTE_REFRESH_ENABLED === 'true';
let supportingCatalogsRequested = false;

function scheduleBackgroundTask(task, timeout = 1500) {
  if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => task(), { timeout });
  } else {
    window.setTimeout(task, Math.min(timeout, 250));
  }
}

// Reusable source refresh checker and local caching manager
function loadDatasetWithUpdateCheck(key, localUrl, remoteUrl, callback) {
  const lastCheck = localStorage.getItem('dataset_check_' + key);
  const now = Date.now();
  
  const loadLocal = () => {
    const cachedData = localStorage.getItem('dataset_cache_' + key);
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        console.log(`[Update Manager] Loaded ${key} from localStorage cache.`);
        callback(parsed);
        return;
      } catch (e) {
        console.error(`[Update Manager] Error parsing cached data for ${key}:`, e);
      }
    }
    
    // Fallback to local public file
    fetch(localUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log(`[Update Manager] Loaded ${key} from local public catalog fallback.`);
        callback(data);
      })
      .catch(err => {
        console.error(`[Update Manager] Error loading local public file for ${key}:`, err);
      });
  };

  loadLocal();

  // Browser-side source refreshes are opt-in. Production uses reviewed,
  // versioned snapshots and should not contact dozens of third-party services.
  if (!REMOTE_REFRESH_ENABLED) return;

  // Skip update check if we did it recently
  if (lastCheck && (now - parseInt(lastCheck, 10)) < DEFAULT_REFRESH_WINDOW_MS) {
    const daysLeft = ((DEFAULT_REFRESH_WINDOW_MS - (now - parseInt(lastCheck, 10))) / (24 * 60 * 60 * 1000)).toFixed(1);
    console.log(`[Update Manager] ${key} update check skipped. Next check in ${daysLeft} days.`);
    return;
  }

  console.log(`[Update Manager] Refresh window elapsed or first check for ${key}. Checking remote: ${remoteUrl}`);
  
  scheduleBackgroundTask(() => {
    fetch(remoteUrl, { mode: 'cors' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP Status ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data && (Array.isArray(data) || typeof data === 'object')) {
          console.log(`[Update Manager] Successfully fetched remote update for ${key}! Caching and updating.`);
          localStorage.setItem('dataset_cache_' + key, JSON.stringify(data));
          localStorage.setItem('dataset_check_' + key, now.toString());
          callback(data);
        } else {
          throw new Error('Invalid or empty response format');
        }
      })
      .catch(err => {
        console.warn(`[Update Manager] Remote update check for ${key} failed (CORS block, network error, or invalid endpoint):`, err.message || err);
        // Wait until the next refresh window before checking again to avoid spamming failed requests
        localStorage.setItem('dataset_check_' + key, now.toString());
      });
  }, 2500);
}

function loadJsonWithApiFallback(apiUrl, fallbackUrl, callback) {
  const loadFallback = () =>
    fetch(fallbackUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        return res.json();
      })
      .then(data => callback(data, 'static'))
      .catch(err => {
        console.error(`[Data Center Loader] Failed to load ${fallbackUrl}:`, err);
      });

  if (apiUrl === fallbackUrl) {
    loadFallback();
    return;
  }

  // Production is a static Vercel deployment. Read the versioned public
  // snapshots directly instead of probing development-only API routes first.
  if (import.meta.env.PROD) {
    loadFallback();
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  fetch(apiUrl, { signal: controller.signal })
    .then(res => {
      if (!res.ok) throw new Error(`Status: ${res.status}`);
      return res.json();
    })
    .then(data => callback(data, 'api'))
    .catch(() => {
      loadFallback();
    })
    .finally(() => {
      clearTimeout(timeoutId);
    });
}

function setNatureClimateCrosswalk(data) {
  natureClimateCrosswalk = data;
  natureClimateById = new Map();
  natureClimateByName = new Map();

  const entries = Array.isArray(data?.nodes)
    ? data.nodes
    : Array.isArray(data?.anchors)
      ? data.anchors
      : [];

  entries.forEach(entry => {
    if (entry?.id) natureClimateById.set(entry.id, entry);
    if (entry?.name) natureClimateByName.set(entry.name.toLowerCase(), entry);
  });

  if (currentSelectedNode) {
    updateTulipUrgencyProfile(currentSelectedNode);
  }
}

function getNatureClimateEntry(node) {
  if (!node) return null;

  if (node.id && natureClimateById.has(node.id)) {
    return natureClimateById.get(node.id);
  }

  const normalizedName = (node.name || '').toLowerCase();
  if (normalizedName && natureClimateByName.has(normalizedName)) {
    return natureClimateByName.get(normalizedName);
  }

  return null;
}

function renderTulipScoreMethodologyStats(registry) {
  if (!registry) return;
  const total = Number(registry.issue_node_count) || (registry.receipts ?? []).length;
  const counts = registry.method_counts ?? {};
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };
  const countAndShare = value => {
    const count = Number(value) || 0;
    const share = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
    return `${count.toLocaleString()} (${share}%)`;
  };

  setText('tulip-score-live-count', total.toLocaleString());
  setText('tulip-score-current-count', countAndShare(counts.current_data));
  setText('tulip-score-impact-count', countAndShare(counts.impact_fallback));
  setText('tulip-score-modeled-count', countAndShare(counts.modeled));
  setText('tulip-score-response-count', (registry.excluded_response_node_ids ?? []).length.toLocaleString());

  const generatedAt = new Date(registry.generated_at);
  if (!Number.isNaN(generatedAt.getTime())) {
    setText('tulip-score-registry-date', new Intl.DateTimeFormat('en', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC'
    }).format(generatedAt));
  }
}

const TULIP_URGENCY_BANDS_V2_UI = Object.freeze([
  Object.freeze({ label: 'Low', min: 1.0, max: 2.9, width: 2 }),
  Object.freeze({ label: 'Elevated', min: 3.0, max: 4.9, width: 2 }),
  Object.freeze({ label: 'Rising', min: 5.0, max: 6.9, width: 2 }),
  Object.freeze({ label: 'Critical', min: 7.0, max: 10.0, width: 3 })
]);

const TULIP_URGENCY_BAND_COLORS = Object.freeze([
  '#5ba6f5', '#78a8dc', '#9ca4d0', '#b49ab7', '#ca9197', '#dc7568', '#eb553d'
]);

function getActiveTulipUrgencyBands() {
  return tulipUrgencyMethodVersion === 'tulip_urgency_v3'
    ? TULIP_URGENCY_BANDS_V3.map(band => ({ ...band, width: band.max - band.min + 0.1 }))
    : TULIP_URGENCY_BANDS_V2_UI;
}

function getActiveTulipUrgencyBand(score) {
  return tulipUrgencyMethodVersion === 'tulip_urgency_v3'
    ? getTulipUrgencyBandV3(score)
    : getTulipUrgencyBandV2(score);
}

function renderTulipUrgencyBandScale() {
  const bands = getActiveTulipUrgencyBands();
  const bandContainer = document.getElementById('urgency-scale-bands');
  const track = document.querySelector('.urgency-scale-track');
  const axis = document.getElementById('urgency-scale-axis');
  const methodologyBandDescription = document.getElementById('tulip-score-band-description');
  const temperatureBandExample = document.getElementById('tulip-score-temperature-band-example');
  if (bandContainer) {
    bandContainer.replaceChildren();
    bandContainer.style.gridTemplateColumns = bands.map(band => `${band.width}fr`).join(' ');
    bands.forEach((band, index) => {
      const label = document.createElement('span');
      const abbreviation = document.createElement('span');
      const tooltip = document.createElement('span');
      const tooltipId = `urgency-band-tooltip-${index}`;
      label.className = 'urgency-band-label';
      label.dataset.urgencyBand = band.label;
      label.tabIndex = 0;
      label.setAttribute('aria-label', `${band.label}, scores ${band.min.toFixed(1)} to ${band.max.toFixed(1)}`);
      label.setAttribute('aria-describedby', tooltipId);
      label.style.setProperty('--urgency-band-color', TULIP_URGENCY_BAND_COLORS[index]);
      abbreviation.className = 'urgency-band-abbreviation';
      abbreviation.setAttribute('aria-hidden', 'true');
      abbreviation.textContent = bands.length > 4 && band.width < 1 ? band.label.charAt(0) : band.label;
      tooltip.id = tooltipId;
      tooltip.className = 'urgency-band-tooltip';
      tooltip.setAttribute('role', 'tooltip');
      tooltip.textContent = band.label;
      label.append(abbreviation, tooltip);
      bandContainer.append(label);
    });
  }
  if (track) {
    const stops = bands.map((band, index) => {
      const midpoint = ((((band.min + band.max) / 2) - 1) / 9) * 100;
      return `${TULIP_URGENCY_BAND_COLORS[index]} ${midpoint.toFixed(3)}%`;
    });
    stops.unshift(`${TULIP_URGENCY_BAND_COLORS[0]} 0%`);
    stops.push(`${TULIP_URGENCY_BAND_COLORS[bands.length - 1]} 100%`);
    track.style.background = `linear-gradient(90deg, ${stops.join(', ')})`;
  }
  if (axis) {
    const ticks = tulipUrgencyMethodVersion === 'tulip_urgency_v3' ? [1, 5, 7, 8, 9, 10] : [1, 3, 5, 7, 10];
    axis.replaceChildren();
    ticks.forEach(tick => {
      const label = document.createElement('span');
      label.textContent = String(tick);
      label.style.left = `${urgencyScalePosition(tick)}%`;
      axis.append(label);
    });
  }
  if (methodologyBandDescription) {
    methodologyBandDescription.innerHTML = tulipUrgencyMethodVersion === 'tulip_urgency_v3'
      ? 'The result is rounded to one decimal place. <strong>1.0-4.9 is Low Concern, 5.0-6.9 is Elevated, 7.0-7.5 is Concerning, 7.6-8.1 is High Risk, 8.2-8.6 is Severe, 8.7-9.2 is Critical, and 9.3-10.0 is Extreme.</strong>'
      : 'The result is rounded to one decimal place. <strong>1.0-2.9 is Low, 3.0-4.9 is Elevated, 5.0-6.9 is Rising, and 7.0-10.0 is Critical.</strong>';
  }
  if (temperatureBandExample) {
    temperatureBandExample.textContent = `7.3, or ${getActiveTulipUrgencyBand(7.3)}`;
  }
}

function requestSupportingCatalogs() {
  if (supportingCatalogsRequested) return;
  supportingCatalogsRequested = true;

  const urgencyEndpoint = tulipUrgencyHistoricalV2Preview
    ? '/api/tulip/urgency-v2-scores'
    : tulipUrgencyV3ShadowPreview
      ? '/api/tulip/urgency-v3-shadow-scores'
      : '/api/tulip/urgency-scores';
  const urgencyFallback = tulipUrgencyHistoricalV2Preview
    ? '/tulip-urgency-scores.json'
    : tulipUrgencyV3ShadowPreview
      ? '/tulip-urgency-v3-shadow-scores.json'
      : '/tulip-urgency-v3-scores.json';
  loadJsonWithApiFallback(urgencyEndpoint, urgencyFallback, (registry, mode) => {
    tulipUrgencyStatus = registry.status ?? null;
    tulipUrgencyMethodVersion = registry.method_version ?? 'tulip_urgency_v2';
    tulipUrgencyByNodeId = new Map((registry.receipts ?? []).map(receipt => [receipt.node_id, receipt]));
    renderTulipScoreMethodologyStats(registry);
    renderTulipUrgencyBandScale();
    NODES.forEach(node => {
      node.tulipUrgencyReceipt = tulipUrgencyByNodeId.get(node.id) ?? null;
      const registryIsActive = tulipUrgencyStatus === 'approved' || tulipUrgencyV3ShadowPreview;
      if (registryIsActive && node.tulipUrgencyReceipt && node.node_kind !== 'response') {
        node.score.baseline = node.tulipUrgencyReceipt.value;
        node.score.band = node.tulipUrgencyReceipt.band;
        node.tulipScore = node.tulipUrgencyReceipt.value;
        node.impactScore = Math.round(node.tulipUrgencyReceipt.value * 10);
      }
    });
    if (tulipUrgencyStatus === 'approved' || tulipUrgencyV3ShadowPreview) {
      const rankedNorthAtlanticNodes = NODES
        .filter(node => node.name.startsWith('North Atlantic'))
        .sort((a, b) => b.tulipScore - a.tulipScore);
      rankedNorthAtlanticNodes.forEach((node, index) => {
        node.isNorthAtlanticHighlightEligible = index < 18;
      });
      graphInstance?.requestRender();
    }
    console.log(`[TULIP Urgency] Loaded ${tulipUrgencyByNodeId.size} ${registry.method_version ?? 'unknown-version'} ${registry.status ?? 'unknown-status'} receipts via ${mode}.`);
    if (currentSelectedNode) updateTulipUrgencyProfile(currentSelectedNode);
  });

  loadJsonWithApiFallback('/api/owid/global-co2', '/owid-global-co2.json', (data, mode) => {
    owidGlobalData = data;
    console.log(`[OWID Global CO2] Loaded ${owidGlobalData.length || Object.keys(data).length} records via ${mode}.`);
  });

  loadJsonWithApiFallback('/api/owid/catalog', '/owid-catalog.json', (data, mode) => {
    owidCatalog = data;
    console.log(`[OWID Catalog] Loaded ${owidCatalog?.indicator_summaries?.length || 0} indicators via ${mode}.`);
  });

  // Load Stockholm Resilience Centre Planetary Boundaries dataset with the default refresh window
  loadDatasetWithUpdateCheck(
    'src_planetary_boundaries',
    '/src-planetary-boundaries.json',
    'https://www.stockholmresilience.org/api/planetary-boundaries/latest',
    data => {
      srcBoundariesData = data;
      console.log(`Loaded ${srcBoundariesData.length} records from Stockholm Resilience Centre Planetary Boundaries.`);
    }
  );

  loadJsonWithApiFallback('/api/data-centers/sources', '/data-center-sources.json', (data, mode) => {
    dataCenterSourcesRegistry = data;
    console.log(`[Data Center Registry] Loaded ${dataCenterSourcesRegistry.sources?.length || 0} source definitions via ${mode}.`);
    if (isDataCenterNode(currentSelectedNode)) fetchDataCenterIntelligence(currentSelectedNode);
  });

  loadJsonWithApiFallback('/api/data-centers/summary', '/data-center-platform-summary.json', (data, mode) => {
    dataCenterPlatformSummary = data;
    console.log(`[Data Center Summary] Loaded frozen data-center summary via ${mode}.`);
    if (isDataCenterNode(currentSelectedNode)) fetchDataCenterIntelligence(currentSelectedNode);
  });

  loadJsonWithApiFallback('/api/earthdata/catalog', '/earthdata-catalog.json', (data, mode) => {
    earthdataCatalog = data;
    console.log(`[Earthdata Catalog] Loaded ${earthdataCatalog.collections?.length || 0} Earthdata collections via ${mode}.`);
    if (currentSelectedNode) {
      renderEarthdataCollections(currentSelectedNode);
    }
  });

  loadJsonWithApiFallback('/api/grace/catalog', '/grace-catalog.json', (data, mode) => {
    graceCatalog = data;
    console.log(`[GRACE Catalog] Loaded ${graceCatalog.collections?.length || 0} GRACE collections via ${mode}.`);
    if (currentSelectedNode) {
      renderGraceCollections(currentSelectedNode);
    }
  });

  loadJsonWithApiFallback('/api/power/catalog', '/power-catalog.json', (data, mode) => {
    powerCatalog = data;
    console.log(`[POWER Catalog] Loaded ${powerCatalog.baselines?.length || 0} NASA POWER baselines via ${mode}.`);
    if (currentSelectedNode) {
      renderPowerBaselines(currentSelectedNode);
    }
  });

  // Load Asian Development Bank datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'adb_datasets',
    '/adb-datasets.json',
    'https://api.adb.org/v1/projects?sector=climate',
    data => {
      adbDatasetsData = data;
      console.log(`Loaded ${adbDatasetsData.length} records from Asian Development Bank.`);
    }
  );

  // Load UN ESCAP datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'escap_datasets',
    '/escap-datasets.json',
    'http://api-dataexplorer.unescap.org/rest/v2/data/ESCAP,DF_ESCAP_DATAFLOW,1.0/all',
    data => {
      escapDatasetsData = data;
      console.log(`Loaded ${escapDatasetsData.length} records from UN ESCAP.`);
    }
  );

  // Load ICIMOD RDS datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'rds_datasets',
    '/rds-datasets.json',
    'http://rds.icimod.org:8080/geonetwork/srv/api/records',
    data => {
      rdsDatasetsData = data;
      console.log(`Loaded ${rdsDatasetsData.length} records from ICIMOD RDS.`);
    }
  );

  // Load ASMC datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'asmc_datasets',
    '/asmc-datasets.json',
    'https://asmc.asean.org/api/v1/hazemonitoring/latest',
    data => {
      asmcDatasetsData = data;
      console.log(`Loaded ${asmcDatasetsData.length} records from ASMC.`);
    }
  );

  // Load MRC datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'mrc_datasets',
    '/mrc-datasets.json',
    'https://portal.mrcmekong.org/api/v1/hydromet/station',
    data => {
      mrcDatasetsData = data;
      console.log(`Loaded ${mrcDatasetsData.length} records from MRC.`);
    }
  );

  // Load SERVIR datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'servir_datasets',
    '/servir-datasets.json',
    'https://climateserv.servirglobal.net/api/v1/request/latest',
    data => {
      servirDatasetsData = data;
      console.log(`Loaded ${servirDatasetsData.length} records from SERVIR.`);
    }
  );

  // Load APCC datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'apcc_datasets',
    '/apcc-datasets.json',
    'https://clik.apcc21.org/api/v1/mme/forecast',
    data => {
      apccDatasetsData = data;
      console.log(`Loaded ${apccDatasetsData.length} records from APCC.`);
    }
  );

  // Load JMA datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'jma_datasets',
    '/jma-datasets.json',
    'https://ds.data.jma.go.jp/tcc/tcc/api/v1/climatview',
    data => {
      jmaDatasetsData = data;
      console.log(`Loaded ${jmaDatasetsData.length} records from JMA.`);
    }
  );

  // Load WMO datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'wmo_datasets',
    '/wmo-datasets.json',
    'https://wis2.wmo.int/api/v1/gdc/collections/datasets/items',
    data => {
      wmoDatasetsData = data;
      console.log(`Loaded ${wmoDatasetsData.length} records from WMO.`);
    }
  );

  // Load SAHF datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'sahf_datasets',
    '/sahf-datasets.json',
    'https://www.sahf.info/api/v1/sascof/outlook',
    data => {
      sahfDatasetsData = data;
      console.log(`Loaded ${sahfDatasetsData.length} records from SAHF.`);
    }
  );

  // Load MOSDAC datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'mosdac_datasets',
    '/mosdac-datasets.json',
    'https://mosdac.gov.in/api/v1/download/search',
    data => {
      mosdacDatasetsData = data;
      console.log(`Loaded ${mosdacDatasetsData.length} records from MOSDAC.`);
    }
  );

  // Load Drawdown datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'drawdown_datasets',
    '/drawdown-datasets.json',
    'https://api.drawdown.org/v1/solutions',
    data => {
      drawdownDatasetsData = data;
      console.log(`Loaded ${drawdownDatasetsData.length} records from Drawdown.`);
    }
  );

  // Load PIK-WB projections with the default refresh window
  loadDatasetWithUpdateCheck(
    'pik_wb_projections',
    '/pik-wb-datasets.json',
    'https://www.pik-potsdam.de/api/v1/projections',
    data => {
      pikWbDatasetsData = data;
      console.log(`Loaded ${pikWbDatasetsData.length} records from PIK Potsdam & World Bank CCKP.`);
    }
  );

  // Load KMA-IMD datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'kma_imd_datasets',
    '/kma-imd-datasets.json',
    'https://dsp.imdpune.gov.in/api/v1/climate_indices',
    data => {
      kmaImdDatasetsData = data;
      console.log(`Loaded ${kmaImdDatasetsData.length} records from KMA & IMD.`);
    }
  );

  // Load IUCN-UNBL datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'iucn_unbl_datasets',
    '/iucn-unbl-datasets.json',
    'https://api.iucnredlist.org/api/v4/assessments',
    data => {
      iucnUnblDatasetsData = data;
      console.log(`Loaded ${iucnUnblDatasetsData.length} records from IUCN & UNBL.`);
    }
  );

  // Load UNEP-WESR datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'unep_wesr_datasets',
    '/unep-wesr-datasets.json',
    'https://wesr.unep.org/api/v1/sensing',
    data => {
      unepWesrDatasetsData = data;
      console.log(`Loaded ${unepWesrDatasetsData.length} records from UNEP WESR & Earth.org.`);
    }
  );

  // Load UNDRR-EMDAT datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'undrr_emdat_datasets',
    '/undrr-emdat-datasets.json',
    'https://api.emdat.be/v1/disasters',
    data => {
      undrrEmdatDatasetsData = data;
      console.log(`Loaded ${undrrEmdatDatasetsData.length} records from UNDRR & EM-DAT.`);
    }
  );

  // Load IEA-CR datasets with the default refresh window
  loadDatasetWithUpdateCheck(
    'iea_cr_datasets',
    '/iea-cr-datasets.json',
    'https://api.iea.org/v1/transition_indicators',
    data => {
      ieaCrDatasetsData = data;
      console.log(`Loaded ${ieaCrDatasetsData.length} records from IEA & Climate Reality.`);
    }
  );

  // Load IPCC scenarios with the default refresh window
  loadDatasetWithUpdateCheck(
    'ipcc_scenarios_datasets',
    '/ipcc-scenarios-datasets.json',
    'https://api.ipcc.ch/v1/scenarios',
    data => {
      ipccScenariosDatasetsData = data;
      console.log(`Loaded ${ipccScenariosDatasetsData.length} records from IPCC Scenarios.`);
    }
  );
}

function getNatureClimateTierMeta(tier) {
  switch (tier) {
    case 'core':
      return {
        label: 'CORE',
        color: '#fb923c',
        border: 'rgba(251, 146, 60, 0.30)',
        bg: 'rgba(251, 146, 60, 0.08)'
      };
    case 'strong':
      return {
        label: 'STRONG',
        color: '#facc15',
        border: 'rgba(250, 204, 21, 0.28)',
        bg: 'rgba(250, 204, 21, 0.08)'
      };
    case 'moderate':
      return {
        label: 'MODERATE',
        color: '#67e8f9',
        border: 'rgba(103, 232, 249, 0.26)',
        bg: 'rgba(103, 232, 249, 0.08)'
      };
    case 'limited':
      return {
        label: 'LIMITED',
        color: 'rgba(248, 250, 252, 0.82)',
        border: 'rgba(255, 255, 255, 0.14)',
        bg: 'rgba(255, 255, 255, 0.05)'
      };
    default:
      return {
        label: '---',
        color: 'rgba(255, 255, 255, 0.65)',
        border: 'rgba(255, 255, 255, 0.08)',
        bg: 'rgba(255, 255, 255, 0.03)'
      };
  }
}

function getDataCenterAnchorId(node) {
  if (!node) return null;

  const anchorId = node.calibration?.anchor_id || node.id || '';
  if (anchorId === 'data_centers' || anchorId === 'ai_data_centers') {
    return anchorId;
  }

  const name = (node.name || '').toLowerCase();
  if (name.includes('ai') || name.includes('compute')) {
    return 'ai_data_centers';
  }
  if (name.includes('data center') || name.includes('server') || name.includes('cooling water')) {
    return 'data_centers';
  }

  return null;
}

function isDataCenterNode(node) {
  return Boolean(getDataCenterAnchorId(node));
}

function getIntegrationTierMeta(tier) {
  switch (tier) {
    case 'ready_now':
      return {
        label: 'Ready now',
        color: 'rgba(52, 211, 153, 0.95)',
        border: 'rgba(52, 211, 153, 0.22)',
        bg: 'rgba(52, 211, 153, 0.10)'
      };
    case 'proxy_required':
      return {
        label: 'Proxy required',
        color: 'rgba(251, 191, 36, 0.95)',
        border: 'rgba(251, 191, 36, 0.22)',
        bg: 'rgba(251, 191, 36, 0.10)'
      };
    case 'proxy_recommended':
      return {
        label: 'Proxy recommended',
        color: 'rgba(96, 165, 250, 0.95)',
        border: 'rgba(96, 165, 250, 0.22)',
        bg: 'rgba(96, 165, 250, 0.10)'
      };
    case 'catalog_only':
      return {
        label: 'Catalog only',
        color: 'rgba(196, 181, 253, 0.95)',
        border: 'rgba(196, 181, 253, 0.22)',
        bg: 'rgba(196, 181, 253, 0.10)'
      };
    default:
      return {
        label: 'Reference only',
        color: 'rgba(248, 250, 252, 0.88)',
        border: 'rgba(255, 255, 255, 0.14)',
        bg: 'rgba(255, 255, 255, 0.05)'
      };
  }
}

function renderDataCenterSourceGroup(title, sources) {
  if (!sources || sources.length === 0) return '';

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.48); font-weight: 700;">
        ${title}
      </div>
      ${sources.map(source => {
        const tier = getIntegrationTierMeta(source.integration_tier);
        const metrics = (source.metrics_supported || [])
          .slice(0, 3)
          .map(metric => metric.replace(/_/g, ' '))
          .join(' • ');

        return `
          <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; background: rgba(255, 255, 255, 0.02);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <a href="${source.url}" target="_blank" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 600; line-height: 1.35;">
                ${source.name} ↗
              </a>
              <span style="flex-shrink: 0; font-size: 12px; font-weight: 700; letter-spacing: 0.7px; text-transform: uppercase; color: ${tier.color}; border: none; background: ${tier.bg}; border-radius: 8px; padding: 3px 7px;">
                ${tier.label}
              </span>
            </div>
            <div style="font-size: 12px; color: rgba(255, 255, 255, 0.56); line-height: 1.45;">
              ${source.notes}
            </div>
            <div style="display: flex; justify-content: space-between; gap: 10px; font-size: 12px; color: rgba(255, 255, 255, 0.42);">
              <span>Refresh: ${source.refresh_days}d</span>
              <span>${source.access.replace(/_/g, ' ')}</span>
              <span>${source.region}</span>
            </div>
            ${metrics ? `<div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.88); line-height: 1.4;">Metrics: ${metrics}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDataCenterGlobalBenchmark(summary, anchorId) {
  const benchmark = summary?.iea_energy_and_ai;
  const observed = benchmark?.observed_2024;
  const baseCase = benchmark?.base_case;
  const sensitivity = benchmark?.sensitivity;
  if (!observed || !baseCase || !sensitivity) return '';

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; justify-content: space-between; gap: 10px; align-items: baseline;">
        <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.48); font-weight: 700;">
          IEA global benchmark
        </div>
        <a href="${benchmark.source}" target="_blank" style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.88); text-decoration: none;">Energy and AI ↗</a>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; font-size: 12px;">
        <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">2024 electricity: <strong style="color:#fff;">${observed.data_center_electricity_twh} TWh</strong></div>
        <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">Global share: <strong style="color:#fff;">${observed.share_of_global_electricity_pct}%</strong></div>
        <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">Indirect CO₂: <strong style="color:#fff;">${observed.indirect_electricity_co2_mt} Mt</strong></div>
        <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">2030 base case: <strong style="color:#fff;">${baseCase.data_center_electricity_2030_twh} TWh</strong></div>
      </div>
      <div style="font-size: 12px; color: rgba(255,255,255,0.56); line-height: 1.5;">
        ${anchorId === 'ai_data_centers'
          ? benchmark.ai_boundary
          : 'Observed values cover all data-centre workloads. AI is one workload category and must not be assigned the full total.'}
      </div>
      <div style="font-size: 12px; color: rgba(255,255,255,0.42); line-height: 1.45;">
        Boundary: ${benchmark.emissions_boundary} 2035 electricity spans ${sensitivity.data_center_electricity_2035_low_twh.toLocaleString()}–${sensitivity.data_center_electricity_2035_high_twh.toLocaleString()} TWh across IEA scenarios; this is a scenario range, not a confidence interval.
      </div>
    </div>
  `;
}

function renderDataCenterOperationalSnapshot(summary, anchorId) {
  if (!summary?.electricity_maps?.priority_zone_snapshots) return '';

  const preferredStates = anchorId === 'ai_data_centers'
    ? ['VA', 'TX', 'CA', 'WA', 'OR']
    : ['VA', 'TX', 'GA', 'NC', 'AZ'];

  const zoneSnapshots = summary.electricity_maps.priority_zone_snapshots
    .filter(item => (item.mapped_states || []).some(state => preferredStates.includes(state)))
    .slice(0, 4);

  if (zoneSnapshots.length === 0) return '';

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.48); font-weight: 700;">
        Frozen operational snapshots
      </div>
      ${zoneSnapshots.map(item => {
        const snap = item.snapshot || {};
        const sources = (snap.top_power_sources_mw || [])
          .map(entry => `${escapeHtml(entry.fuel)}: ${Math.round(entry.value).toLocaleString()} MW`)
          .join(' • ');
        const location = item.hubs?.length
          ? item.hubs.map(value => escapeHtml(value)).join(' • ')
          : item.mapped_states?.map(value => escapeHtml(value)).join(', ');

        return `
          <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; background: rgba(255, 255, 255, 0.02);">
            <div style="display: flex; justify-content: space-between; gap: 10px; align-items: baseline;">
              <div style="font-size: 13px; color: #ffffff; font-weight: 600;">${escapeHtml(item.label)}</div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.45);">${snap.captured_at ? new Date(snap.captured_at).toLocaleDateString() : 'Snapshot'}</div>
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.56); line-height: 1.45;">
              ${location || 'Priority data-center region'}
            </div>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; font-size: 12px;">
              <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">Current CI: <strong style="color:#fff;">${escapeHtml(snap.carbon_intensity_gco2eq_kwh ?? '—')}</strong></div>
              <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">24h Avg: <strong style="color:#fff;">${escapeHtml(snap.carbon_intensity_24h_avg_gco2eq_kwh ?? '—')}</strong></div>
              <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">Renewables: <strong style="color:#fff;">${escapeHtml(snap.renewable_percentage ?? '—')}%</strong></div>
              <div style="padding: 7px 8px; border-radius: 8px; background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.7);">Carbon-free: <strong style="color:#fff;">${escapeHtml(snap.carbon_free_percentage ?? '—')}%</strong></div>
            </div>
            ${sources ? `<div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.88); line-height: 1.4;">Top sources: ${sources}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDataCenterAnnualBaselines(summary, anchorId) {
  if (!summary?.eia?.state_profiles) return '';

  const preferredStates = anchorId === 'ai_data_centers'
    ? ['VA', 'TX', 'CA', 'WA']
    : ['VA', 'TX', 'GA', 'NC'];

  const stateProfiles = summary.eia.state_profiles
    .filter(item => preferredStates.includes(item.state_code))
    .slice(0, 4);

  if (stateProfiles.length === 0) return '';

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.48); font-weight: 700;">
        Annual grid baselines
      </div>
      ${stateProfiles.map(item => {
        const mix = item.annual_generation_mix_pct || {};
        return `
          <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; background: rgba(255, 255, 255, 0.02);">
            <div style="display: flex; justify-content: space-between; gap: 10px; align-items: baseline;">
              <div style="font-size: 13px; color: #ffffff; font-weight: 600;">${item.state_name}</div>
              <div style="font-size: 12px; color: rgba(255,255,255,0.45);">EIA ${item.latest_year}</div>
            </div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.56); line-height: 1.45;">
              ${item.data_center_hub}
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 12px; color: rgba(255,255,255,0.7); border: none; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 4px 7px;">Fossil ${mix.fossil_pct ?? '—'}%</span>
              <span style="font-size: 12px; color: rgba(255,255,255,0.7); border: none; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 4px 7px;">Nuclear ${mix.nuclear_pct ?? '—'}%</span>
              <span style="font-size: 12px; color: rgba(255,255,255,0.7); border: none; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 4px 7px;">Renewables ${mix.renewables_pct ?? '—'}%</span>
              <span style="font-size: 12px; color: rgba(255,255,255,0.7); border: none; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 4px 7px;">Gas ${mix.gas_pct ?? '—'}%</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderDisclosureLayer(summary) {
  const operators = summary?.disclosures?.operators || [];
  if (operators.length === 0) return '';

  return `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.48); font-weight: 700;">
        Disclosure layer
      </div>
      ${operators.map(item => `
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; background: rgba(255, 255, 255, 0.02);">
          <div style="display: flex; justify-content: space-between; gap: 10px; align-items: baseline;">
            <div style="font-size: 13px; color: #ffffff; font-weight: 600;">${item.operator}</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.45); text-transform: uppercase;">Context only</div>
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.56); line-height: 1.45;">
            ${item.notes}
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${Object.entries(item.fields || {}).slice(0, 4).map(([key, value]) => `
              <span style="font-size: 12px; color: rgba(255,255,255,0.7); border: none; background: rgba(255,255,255,0.03); border-radius: 8px; padding: 4px 7px;">
                ${key.replace(/_/g, ' ')}: ${value}
              </span>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function fetchDataCenterIntelligence(node) {
  const cardContainer = document.getElementById('data-center-intel-card');
  const listContainer = document.getElementById('data-center-intel-list');
  if (!cardContainer || !listContainer) return;

  if (!isDataCenterNode(node)) {
    cardContainer.style.display = 'none';
    return;
  }

  cardContainer.style.display = 'block';

  if (!dataCenterSourcesRegistry || !Array.isArray(dataCenterSourcesRegistry.sources)) {
    requestSupportingCatalogs();
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 6px 0;">Loading data-center source registry...</div>`;
    setTimeout(() => {
      if (currentSelectedNode === node) fetchDataCenterIntelligence(node);
    }, 200);
    return;
  }

  const anchorId = getDataCenterAnchorId(node);
  const priorityMetrics = (dataCenterSourcesRegistry.priority_metrics || []).filter(metric => (metric.applies_to || []).includes(anchorId));
  const relevantSources = dataCenterSourcesRegistry.sources.filter(source => (source.priority_for || []).includes(anchorId) || (source.priority_for || []).includes('data_centers'));

  const readySources = relevantSources.filter(source => source.integration_tier === 'ready_now');
  const proxySources = relevantSources.filter(source => ['proxy_required', 'proxy_recommended'].includes(source.integration_tier));
  const referenceSources = relevantSources.filter(source => !['ready_now', 'proxy_required', 'proxy_recommended'].includes(source.integration_tier));
  const refreshPolicy = dataCenterSourcesRegistry.refresh_policy || {};

  const summaryBadges = [
    { label: 'Ready', value: readySources.length, color: 'rgba(52, 211, 153, 0.95)' },
    { label: 'Derived', value: proxySources.length, color: 'rgba(251, 191, 36, 0.95)' },
    { label: 'Reference', value: referenceSources.length, color: 'rgba(248, 250, 252, 0.9)' }
  ];

  listContainer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.62); line-height: 1.5;">
        This stack separates browser-safe datasets from derived APIs and report-grade calibration sources. Default refresh is modeled at
        <strong style="color: #ffffff;">${refreshPolicy.default_days || 42} days</strong>, with slower-moving disclosures at
        <strong style="color: #ffffff;">${refreshPolicy.slow_moving_days || 56} days</strong>.
      </div>

      ${dataCenterPlatformSummary ? `
        <div style="font-size: 12px; color: rgba(255,255,255,0.45);">
          Frozen snapshot captured ${new Date(dataCenterPlatformSummary.captured_at).toLocaleString()}.
        </div>
      ` : ''}

      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        ${summaryBadges.map(item => `
          <span style="font-size: 12px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: ${item.color}; border: none; background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 5px 9px;">
            ${item.label}: ${item.value}
          </span>
        `).join('')}
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(255, 255, 255, 0.48); font-weight: 700;">
          Priority metrics for ${anchorId === 'ai_data_centers' ? 'AI data centers' : 'data centers'}
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${priorityMetrics.map(metric => `
            <span style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); border: none; background: rgba(var(--accent-color-rgb), 0.08); border-radius: 8px; padding: 5px 8px;">
              ${metric.label}
            </span>
          `).join('')}
        </div>
      </div>

      ${dataCenterPlatformSummary ? renderDataCenterGlobalBenchmark(dataCenterPlatformSummary, anchorId) : ''}
      ${dataCenterPlatformSummary ? renderDataCenterOperationalSnapshot(dataCenterPlatformSummary, anchorId) : ''}
      ${dataCenterPlatformSummary ? renderDataCenterAnnualBaselines(dataCenterPlatformSummary, anchorId) : ''}
      ${dataCenterPlatformSummary ? renderDisclosureLayer(dataCenterPlatformSummary) : ''}

      ${renderDataCenterSourceGroup('Ready now', readySources)}
      ${renderDataCenterSourceGroup('Needs derived mapping or server-side ETL', proxySources)}
      ${renderDataCenterSourceGroup('Reference and calibration sources', referenceSources)}
    </div>
  `;
}

// --- APP INITIALIZATION ---
function adjustScale() {
  const container = document.getElementById('app-container');
  if (!container) return;

  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth;
  const height = viewport?.height || window.innerHeight;
  const referenceWidth = 1920;
  const referenceHeight = 1080;

  if (width <= referenceWidth || height <= referenceHeight) {
    document.documentElement.style.removeProperty('--ui-scale');
    document.documentElement.style.removeProperty('--ui-scale-inverse');
    container.style.removeProperty('--ui-scale');
    container.style.transform = '';
    container.style.transformOrigin = '';
    container.style.width = '';
    container.style.height = '';
    return;
  }

  // Keep the platform at its intended 1920 × 1080 visual density on large
  // displays. Using both axes prevents ultrawide screens from over-scaling.
  const scale = Math.min(width / referenceWidth, height / referenceHeight);
  const clampedScale = Math.max(1, Math.min(2, scale));

  document.documentElement.style.setProperty('--ui-scale', clampedScale);
  document.documentElement.style.setProperty('--ui-scale-inverse', 1 / clampedScale);
  container.style.removeProperty('--ui-scale');
  container.style.transform = '';
  container.style.transformOrigin = '';
  container.style.width = '';
  container.style.height = '';
}

function init() {
  const canvas = document.getElementById('graph-canvas');
  if (!canvas) return;

  // Precalculate TULIP Score for all nodes so it is available in the graph engine and search suggestions
  NODES.forEach(node => {
    node.tulipScore = node.score.baseline;
  });

  // Limit eligible ambient highlights for "North Atlantic" nodes to 18
  const northAtlanticNodes = NODES.filter(n => n.name.startsWith('North Atlantic'));
  northAtlanticNodes.sort((a, b) => b.tulipScore - a.tulipScore);
  northAtlanticNodes.forEach((node, idx) => {
    node.isNorthAtlanticHighlightEligible = (idx < 18);
  });

  // Initialize Canvas Graph Engine
  // Publish the complete defensible three-connected core. All other nodes
  // remain in the research registry until they earn three valid relationships.
  graphInstance = new TulipGraph(canvas, PUBLISHED_NODES, PUBLISHED_EDGES, scheduleSelectNode, null, handleSelectEdge);
  window.graphInstance = graphInstance;

  // Generate and set procedural profile avatar
  if (authorAvatar) {
    authorAvatar.src = generateAvatarDataURL();
  }

  // Initialize Diagnostic Console & Navigation Overlay Cache
  studyConsole = document.getElementById('study-console');
  studyControlsOverlay = document.getElementById('study-controls-overlay');
  analyzeNodeKey = document.getElementById('analyze-node-key');
  focusStepBackBtn = document.getElementById('focus-step-back-btn');
  focusHistoryTree = document.getElementById('focus-history-tree');
  studyJourneyToggle = document.getElementById('study-journey-toggle');
  studyJourneyCurrent = document.getElementById('study-journey-current');
  studyHistoryPopover = document.getElementById('study-history-popover');
  studyHistoryReset = document.getElementById('study-history-reset');
  copyViewBtn = document.getElementById('copy-view-btn');
  studySharePopover = document.getElementById('study-share-popover');
  copyViewStatus = document.getElementById('copy-view-status');
  nodeSourceDate = document.getElementById('node-source-date');
  trailPromptPanel = document.getElementById('trail-prompt-panel');
  trailPromptKicker = document.getElementById('trail-prompt-kicker');
  trailPromptTitle = document.getElementById('trail-prompt-title');
  trailPromptBody = document.getElementById('trail-prompt-body');
  trailUpstreamBtn = document.getElementById('trail-upstream-btn');
  trailDownstreamBtn = document.getElementById('trail-downstream-btn');
  trailUnexpectedBtn = document.getElementById('trail-unexpected-btn');
  trailContinueBtn = document.getElementById('trail-continue-btn');
  trailHeroTitle = document.getElementById('trail-hero-title');
  trailHeroMeta = document.getElementById('trail-hero-meta');
  trailProgressLabel = document.getElementById('trail-progress-label');
  analyzeShowMoreBtn = document.getElementById('analyze-show-more-btn');
  analyzeShowMoreIcon = analyzeShowMoreBtn ? analyzeShowMoreBtn.querySelector('.layout-toggle-expand-icon') : null;
  setShellMode('explore');
  initEditorialArcs();
  let viewportResizeFrame = null;
  const handleViewportResize = () => {
    if (viewportResizeFrame !== null) {
      window.cancelAnimationFrame(viewportResizeFrame);
    }
    viewportResizeFrame = window.requestAnimationFrame(() => {
      viewportResizeFrame = null;
      adjustScale();
      if (graphInstance) {
        graphInstance.resizeCanvas();
      }
      updateGatewayArcLayout();
    });
  };
  window.addEventListener('resize', handleViewportResize);
  window.visualViewport?.addEventListener('resize', handleViewportResize);

  // Wire up step-back button for navigation history
  if (focusStepBackBtn) {
    focusStepBackBtn.addEventListener('click', undoLastSelection);
  }
  if (copyViewBtn && studySharePopover) {
    const closeStudySharePopover = ({ restoreFocus = false } = {}) => {
      studySharePopover.hidden = true;
      copyViewBtn.setAttribute('aria-expanded', 'false');
      if (restoreFocus) copyViewBtn.focus();
    };

    copyViewBtn.addEventListener('click', event => {
      event.stopPropagation();
      const willOpen = studySharePopover.hidden;
      studySharePopover.hidden = !willOpen;
      copyViewBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) studySharePopover.querySelector('[role="menuitem"]')?.focus();
    });

    studySharePopover.querySelectorAll('[data-study-share-action]').forEach(button => {
      button.addEventListener('click', async () => {
        const action = button.getAttribute('data-study-share-action');
        closeStudySharePopover();
        if (action === 'open') openCurrentViewInNewTab();
        if (action === 'copy') await copyCurrentViewUrl();
        if (action === 'pdf') await exportCurrentViewAsPdf();
      });
    });

    document.addEventListener('click', event => {
      if (studySharePopover.hidden || event.target.closest('.study-share-control')) return;
      closeStudySharePopover();
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || studySharePopover.hidden) return;
      closeStudySharePopover({ restoreFocus: true });
    });
  }
  if (studyJourneyToggle && studyHistoryPopover) {
    studyJourneyToggle.addEventListener('click', () => {
      const willOpen = studyHistoryPopover.hidden;
      studyHistoryPopover.hidden = !willOpen;
      studyJourneyToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) {
        window.requestAnimationFrame(() => {
          focusHistoryTree?.lastElementChild?.scrollIntoView?.({ block: 'nearest' });
        });
      }
    });

    document.addEventListener('click', event => {
      if (
        studyHistoryPopover.hidden ||
        studyJourneyToggle.contains(event.target) ||
        studyHistoryPopover.contains(event.target)
      ) return;
      studyHistoryPopover.hidden = true;
      studyJourneyToggle.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || studyHistoryPopover.hidden) return;
      studyHistoryPopover.hidden = true;
      studyJourneyToggle.setAttribute('aria-expanded', 'false');
      studyJourneyToggle.focus();
    });
  }
  if (studyHistoryReset) {
    studyHistoryReset.addEventListener('click', () => {
      if (studyHistoryPopover) studyHistoryPopover.hidden = true;
      if (studyJourneyToggle) studyJourneyToggle.setAttribute('aria-expanded', 'false');
      resetExplorationState();
    });
  }
  [trailUpstreamBtn, trailDownstreamBtn, trailUnexpectedBtn, trailContinueBtn].forEach(button => {
    if (!button) return;
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target-id');
      if (!targetId) return;
      const targetNode = NODE_BY_ID.get(targetId);
      if (targetNode) {
        targetAndSelectNode(targetNode);
      }
    });
  });

  if (analyzeShowMoreBtn) {
    analyzeShowMoreBtn.addEventListener('click', () => {
      if (!graphInstance || !currentSelectedNode) return;
      const nextExpanded = !graphInstance.showAllAnalyzeConnections;
      graphInstance.showAllAnalyzeConnections = nextExpanded;
      graphInstance.userCollapsedAnalyzeConnections = !nextExpanded;
      graphInstance.invalidateAnalyzeCaches();
      graphInstance.needsCentering = true;
      graphInstance.zoomToFit();
      updateCausalLists(currentSelectedNode);
      updateAnalyzeShowMoreButton(currentSelectedNode);
    });
  }

  // Initialize Layout Toggle click listeners
  const btnNetwork = document.getElementById('layout-toggle-network');
  const btnTree = document.getElementById('layout-toggle-tree');
  if (btnNetwork && btnTree) {
    btnNetwork.addEventListener('click', () => {
      if (graphInstance) {
        graphInstance.layoutMode = 'network';
        graphInstance.zoomToFit();
      }
      btnNetwork.classList.add('active');
      btnTree.classList.remove('active');
    });
    btnTree.addEventListener('click', () => {
      if (graphInstance) {
        graphInstance.layoutMode = 'tree';
        graphInstance.zoomToFit();
        setTimeout(() => {
          graphInstance.resizeCanvas();
          graphInstance.zoomToFit();
        }, 80);
      }
      btnTree.classList.add('active');
      btnNetwork.classList.remove('active');
    });
  }





  // Globe view back-navigation is handled by clicking the app logo in the top-left
  consoleNodeName = document.getElementById('console-node-name');
  consoleSphereBadge = document.getElementById('console-sphere-badge');
  consoleThreatPercentage = document.getElementById('console-threat-percentage');
  consoleThreatStatus = document.getElementById('console-threat-status');
  consoleNodeMeaning = document.getElementById('console-node-meaning');
  relationshipEvidencePickerSection = document.getElementById('relationship-evidence-picker-section');
  relationshipTriggerSelect = document.getElementById('relationship-trigger-select');
  relationshipEffectSelect = document.getElementById('relationship-effect-select');
  connectionDetailSection = document.getElementById('connection-detail-section');
  connectionDetailHeader = document.getElementById('connection-detail-header');
  connectionDetailReason = document.getElementById('connection-detail-reason');
  connectionDetailEvidence = document.getElementById('connection-detail-evidence');
  const handleRelationshipEvidenceChange = event => {
    const changedSelect = event.currentTarget;
    if (changedSelect.value) {
      [relationshipTriggerSelect, relationshipEffectSelect]
        .filter(select => select && select !== changedSelect)
        .forEach(select => { select.value = ''; });
    }
    const edgeKey = changedSelect.value;
    const edge = EDGES.find(candidate => `${candidate.source}->${candidate.target}` === edgeKey);
    if (edge) handleSelectEdge(edge);
    else clearSelectedEdgeDetail();
    syncRelationshipEvidenceStudyState();
  };
  relationshipTriggerSelect?.addEventListener('change', handleRelationshipEvidenceChange);
  relationshipEffectSelect?.addEventListener('change', handleRelationshipEvidenceChange);
  consoleNodeSensors = document.getElementById('console-node-sensors');
  consoleEarthdataCollections = document.getElementById('console-earthdata-collections');
  consoleGraceCollections = document.getElementById('console-grace-collections');
  consolePowerBaselines = document.getElementById('console-power-baselines');
  consoleDriversList = document.getElementById('console-drivers-list');
  consoleImpactsList = document.getElementById('console-impacts-list');
  humanImpactSeverity = document.getElementById('human-impact-severity');
  humanImpactReach = document.getElementById('human-impact-reach');
  humanImpactSummary = document.getElementById('human-impact-summary');
  humanImpactDomains = document.getElementById('human-impact-domains');
  humanImpactConsequences = document.getElementById('human-impact-consequences');
  humanImpactEconomic = document.getElementById('human-impact-economic');
  humanImpactHiddenCostItem = document.getElementById('human-impact-hidden-cost-item');
  humanImpactHiddenCost = document.getElementById('human-impact-hidden-cost');
  humanImpactWhoPaysItem = document.getElementById('human-impact-who-pays-item');
  humanImpactWhoPays = document.getElementById('human-impact-who-pays');
  planetImpactSeverity = document.getElementById('planet-impact-severity');
  planetImpactReach = document.getElementById('planet-impact-reach');
  planetImpactSummary = document.getElementById('planet-impact-summary');
  planetImpactDomains = document.getElementById('planet-impact-domains');
  planetImpactConsequences = document.getElementById('planet-impact-consequences');
  planetImpactEconomic = document.getElementById('planet-impact-economic');
  planetImpactPhysicalLimitItem = document.getElementById('planet-impact-physical-limit-item');
  planetImpactPhysicalLimit = document.getElementById('planet-impact-physical-limit');
  responseDefaultDriver = document.getElementById('response-default-driver');
  responseSystemLevers = document.getElementById('response-system-levers');
  phenomenonLensEyebrow = document.getElementById('phenomenon-lens-eyebrow');
  phenomenonLensTitle = document.getElementById('phenomenon-lens-title');
  phenomenonLensIntro = document.getElementById('phenomenon-lens-intro');
  phenomenonLensScale = document.getElementById('phenomenon-lens-scale');
  phenomenonLensSource = document.getElementById('phenomenon-lens-source');
  phenomenonLensAxis = document.getElementById('phenomenon-lens-axis');
  phenomenonLensRows = document.getElementById('phenomenon-lens-rows');
  phenomenonLensTakeaway = document.getElementById('phenomenon-lens-takeaway');
  phenomenaView = document.getElementById('phenomena-view');
  personalFootprintView = document.getElementById('personal-footprint-view');
  phenomenaSelector = document.getElementById('phenomena-selector');
  phenomenaAnalyzeBtn = document.getElementById('phenomena-analyze-btn');
  phenomenaFocusSphere = document.getElementById('phenomena-focus-sphere');
  phenomenaFocusName = document.getElementById('phenomena-focus-name');
  phenomenaFocusIcon = document.getElementById('phenomena-focus-icon');
  phenomenaFocusNameText = document.getElementById('phenomena-focus-name-text');
  phenomenaFocusDescription = document.getElementById('phenomena-focus-description');
  phenomenonModeFootprintBtn = document.getElementById('phenomena-mode-footprint');
  phenomenonModeActionsBtn = document.getElementById('phenomena-mode-actions');
  phenomenonLensPanel = document.getElementById('phenomenon-lens-panel');
  phenomenonActionsPanel = document.getElementById('phenomenon-actions-panel');
  phenomenonActionBridgeKicker = document.getElementById('phenomenon-action-bridge-kicker');
  phenomenonActionBridgeTitle = document.getElementById('phenomenon-action-bridge-title');
  phenomenonActionBridgeNote = document.getElementById('phenomenon-action-bridge-note');
  phenomenonActionBridgeBtn = document.getElementById('phenomenon-action-bridge-btn');
  actionsFocusConfidence = document.getElementById('actions-focus-confidence');
  actionsFocusStrongest = document.getElementById('actions-focus-strongest');
  actionsFocusWhy = document.getElementById('actions-focus-why');
  actionsFocusSystem = document.getElementById('actions-focus-system');
  actionsPersonalList = document.getElementById('actions-personal-list');
  actionsCommunityList = document.getElementById('actions-community-list');
  actionsPolicyList = document.getElementById('actions-policy-list');
  actionsImpactPersonalList = document.getElementById('actions-impact-personal-list');
  actionsImpactCommunityList = document.getElementById('actions-impact-community-list');
  actionsImpactPolicyList = document.getElementById('actions-impact-policy-list');
  personalFootprintFocusNameText = document.getElementById('personal-footprint-focus-name-text');
  personalFootprintGlobalRank = document.getElementById('personal-footprint-global-rank');
  personalFootprintFocusDescription = document.getElementById('personal-footprint-focus-description');
  personalFootprintSummaryTitle = document.getElementById('personal-footprint-summary-title');
  personalFootprintSummaryNote = document.getElementById('personal-footprint-summary-note');
  personalFootprintMetricStrip = document.getElementById('personal-footprint-metric-strip');
  personalFootprintQuestions = document.getElementById('personal-footprint-questions');
  personalFootprintDrivers = document.getElementById('personal-footprint-drivers');
  personalFootprintMethod = document.getElementById('personal-footprint-method');
  personalFootprintBreakdown = document.getElementById('personal-footprint-breakdown');
  monitoringSourceToggle = document.getElementById('monitoring-source-toggle');
  monitoringSourceContent = document.getElementById('monitoring-source-content');
  urgencyAxisInfoToggle = document.getElementById('urgency-axis-info-toggle');
  urgencyAxisPopover = document.getElementById('urgency-axis-popover');
  urgencyAxisInfoIcon = urgencyAxisInfoToggle ? urgencyAxisInfoToggle.querySelector('.urgency-axis-info-icon') : null;
  urgencyAxisInfoLabel = urgencyAxisInfoToggle ? urgencyAxisInfoToggle.querySelector('.urgency-axis-info-label') : null;

  const collapseMonitoringSource = () => {
    if (!monitoringSourceToggle || !monitoringSourceContent) return;
    monitoringSourceToggle.setAttribute('aria-expanded', 'false');
    monitoringSourceContent.hidden = true;
  };

  if (monitoringSourceToggle && monitoringSourceContent) {
    monitoringSourceToggle.addEventListener('click', () => {
      const expanded = monitoringSourceToggle.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !expanded;
      monitoringSourceToggle.setAttribute('aria-expanded', nextExpanded ? 'true' : 'false');
      monitoringSourceContent.hidden = !nextExpanded;

      if (nextExpanded) {
        const monitoringSection = document.getElementById('monitoring-source-section');
        if (monitoringSection) {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              const findScrollableAncestor = (element) => {
                let current = element.parentElement;
                while (current) {
                  const styles = window.getComputedStyle(current);
                  const canScroll =
                    (styles.overflowY === 'auto' || styles.overflowY === 'scroll')
                    && current.scrollHeight > current.clientHeight + 8;
                  if (canScroll) return current;
                  current = current.parentElement;
                }
                return null;
              };

              const scrollParent = findScrollableAncestor(monitoringSection);
              if (scrollParent) {
                const parentRect = scrollParent.getBoundingClientRect();
                const sectionRect = monitoringSection.getBoundingClientRect();
                const topInset = 18;
                const nextTop = scrollParent.scrollTop + (sectionRect.top - parentRect.top) - topInset;
                scrollParent.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
                return;
              }

              const sectionTop = monitoringSection.getBoundingClientRect().top + window.scrollY;
              const topOffset = 112;
              window.scrollTo({
                top: Math.max(0, sectionTop - topOffset),
                behavior: 'smooth'
              });
            });
          });
        }
      }
      if (!nextExpanded) {
        collapseMonitoringSource();
      }
    });
  }

  function setUrgencyAxisPopoverOpen(isOpen) {
    if (!urgencyAxisInfoToggle || !urgencyAxisPopover) return;
    urgencyAxisInfoToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    urgencyAxisInfoToggle.setAttribute('aria-label', isOpen ? 'Hide TULIP score chart axes info' : 'Show TULIP score chart axes info');
    urgencyAxisInfoToggle.title = isOpen ? 'Hide info' : 'Info';
    if (urgencyAxisInfoIcon) {
      urgencyAxisInfoIcon.src = '/urgency-axis-icon.png';
    }
    urgencyAxisPopover.hidden = !isOpen;
  }

  if (urgencyAxisInfoToggle && urgencyAxisPopover) {
    const toggleUrgencyAxisPopover = (event) => {
      event.preventDefault();
      event.stopPropagation();
      const isOpen = urgencyAxisInfoToggle.getAttribute('aria-expanded') === 'true';
      setUrgencyAxisPopoverOpen(!isOpen);
    };

    urgencyAxisInfoToggle.addEventListener('pointerdown', (event) => {
      lastUrgencyAxisPointerToggleAt = Date.now();
      toggleUrgencyAxisPopover(event);
    });

    urgencyAxisInfoToggle.addEventListener('click', (event) => {
      if (Date.now() - lastUrgencyAxisPointerToggleAt < 400) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      toggleUrgencyAxisPopover(event);
    });

    urgencyAxisInfoToggle.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        toggleUrgencyAxisPopover(event);
      }
    });

    urgencyAxisPopover.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    document.addEventListener('click', (event) => {
      if (
        !urgencyAxisPopover.hidden &&
        !urgencyAxisPopover.contains(event.target) &&
        !urgencyAxisInfoToggle.contains(event.target)
      ) {
        setUrgencyAxisPopoverOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !urgencyAxisPopover.hidden) {
        setUrgencyAxisPopoverOpen(false);
      }
    });
  }



  // TULIP Footer Event Bindings
  tulipScorePopup = document.getElementById('tulip-score-popup');
  const footerTulipScore = document.getElementById('tulip-score-btn');
  aboutPopup = document.getElementById('about-popup');
  const footerAbout = document.getElementById('about-btn');
  const contactPopup = document.getElementById('contact-popup');
  const footerContact = document.getElementById('contact-btn');
  const sourcesView = document.getElementById('sources-view');
  const sourcesTabBtn = document.getElementById('sources-tab-btn');
  const appContainer = document.getElementById('app-container');
  const appLogo = document.getElementById('app-logo');

  // Initialize Registries Dashboard elements
  registriesDashboard = document.getElementById('registries-dashboard');
  openRegistriesBtn = document.getElementById('open-registries-btn');
  dashboardActiveNodeName = document.getElementById('dashboard-active-node-name');

  footerExplore = document.getElementById('footer-btn-explore');
  footerAnalyse = document.getElementById('footer-btn-analyse');
  footerPhenomena = document.getElementById('footer-btn-phenomena');
  footerPersonalFootprint = document.getElementById('footer-btn-personal-footprint');
  footerRegistries = document.getElementById('registries-btn');

  renderSourcesCoverageCockpit();
  renderPersonalFootprint();

  let lastFooterOverlayTrigger = null;

  function getVisibleFooterOverlay() {
    return [sourcesView, registriesDashboard, tulipScorePopup, aboutPopup, contactPopup]
      .find(overlay => overlay && window.getComputedStyle(overlay).display !== 'none') || null;
  }

  function setBackgroundInert(active, overlay = null) {
    if (!appContainer) return;
    let exemptChild = overlay;
    while (exemptChild && exemptChild.parentElement !== appContainer) {
      exemptChild = exemptChild.parentElement;
    }
    [...appContainer.children].forEach(child => {
      if (active && child === exemptChild) return;
      child.inert = active;
    });
    const footerBar = document.getElementById('tulip-footer-bar');
    if (footerBar) footerBar.inert = active;
  }

  function focusFooterOverlay(overlay) {
    window.requestAnimationFrame(() => {
      overlay?.focus({ preventScroll: true });
    });
  }

  function isOutsideOverlayContent(event, contentSelector, safetyMargin = 25) {
    const contentElements = [...event.currentTarget.querySelectorAll(contentSelector)]
      .filter(element => element.getClientRects().length);
    if (!contentElements.length) return event.target === event.currentTarget;

    const contentBounds = contentElements.reduce((bounds, element) => {
      const rect = element.getBoundingClientRect();
      return {
        left: Math.min(bounds.left, rect.left),
        right: Math.max(bounds.right, rect.right),
        top: Math.min(bounds.top, rect.top),
        bottom: Math.max(bounds.bottom, rect.bottom)
      };
    }, { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });

    return (
      event.clientX < contentBounds.left - safetyMargin ||
      event.clientX > contentBounds.right + safetyMargin ||
      event.clientY < contentBounds.top - safetyMargin ||
      event.clientY > contentBounds.bottom + safetyMargin
    );
  }

  function setFooterOverlayActive(active, overlay = null) {
    document.body.classList.toggle('footer-overlay-active', active);
    setBackgroundInert(active, overlay);
    if (graphInstance) {
      if (active) graphInstance.pause();
      else if (['explore', 'study'].includes(appContainer?.dataset.viewMode || 'explore')) graphInstance.resume();
    }
    if (active && overlay) focusFooterOverlay(overlay);
  }

  let registriesInitialized = false;
  let registriesInitializationPending = false;

  function initializeRegistriesDashboard() {
    if (registriesInitialized || registriesInitializationPending) return;
    registriesInitializationPending = true;
    window.requestAnimationFrame(() => {
      renderRegistryDirectory();
      bindRegistryDirectoryTabs();
      setActiveRegistryTab('climate');
      registriesInitialized = true;
      registriesInitializationPending = false;
    });
  }

  function closeFooterOverlays() {
    setFooterOverlayActive(false);
    if (tulipScorePopup) tulipScorePopup.style.display = 'none';
    if (aboutPopup) aboutPopup.style.display = 'none';
    if (contactPopup) contactPopup.style.display = 'none';
    if (registriesDashboard) {
      registriesDashboard.classList.remove('active');
      registriesDashboard.style.display = 'none';
    }
    if (sourcesView) sourcesView.style.display = 'none';
    if (sourcesTabBtn) sourcesTabBtn.classList.remove('active');
    if (appContainer) appContainer.classList.remove('sources-active');
    const trigger = lastFooterOverlayTrigger;
    lastFooterOverlayTrigger = null;
    trigger?.focus({ preventScroll: true });
  }

  function closeSourcesOverlay() {
    setFooterOverlayActive(false);
    if (sourcesView) sourcesView.style.display = 'none';
    if (sourcesTabBtn) sourcesTabBtn.classList.remove('active');
    if (appContainer) appContainer.classList.remove('sources-active');

    const pills = filterBar?.querySelectorAll('.filter-pill');
    pills?.forEach(pill => pill.classList.toggle('active', pill.getAttribute('data-filter') === 'all'));
    if (graphInstance) setGraphFilter('all');
  }

  function closeRegistriesOverlay() {
    if (!registriesDashboard) return;
    setFooterOverlayActive(false);
    registriesDashboard.classList.remove('active');
    window.setTimeout(() => {
      if (!registriesDashboard.classList.contains('active')) registriesDashboard.style.display = 'none';
    }, 300);
  }

  function handleExploreClick(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    closeFooterOverlays();
    cancelPendingSelection();
    setShellMode('explore');
    graphInstance?.exitFocusMode();
    window.requestAnimationFrame(() => {
      graphInstance?.resizeCanvas();
      updateGatewayArcLayout();
      forceExploreTabState();
    });
  }

  function handleLogoClick(e) {
    handleExploreClick(e);
  }

  function handleAnalyseClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    if (currentSelectedNode) {
      if (appContainer?.dataset.viewMode === 'study') return;
      cancelPendingSelection();
      const workspace = studyWorkspaceState?.nodeId === currentSelectedNode.id
        ? studyWorkspaceState
        : null;
      if (graphInstance) {
        if (workspace) {
          graphInstance.layoutMode = workspace.layoutMode;
          graphInstance.showAllAnalyzeConnections = workspace.showAllAnalyzeConnections;
          graphInstance.showIncomingInfluences = workspace.showIncomingInfluences
            ?? workspace.showTriggers
            ?? true;
          graphInstance.showOutgoingInfluences = workspace.showOutgoingInfluences
            ?? workspace.showEffects
            ?? true;
        }
        graphInstance.isFocusMode = true;
        graphInstance.selectNode(currentSelectedNode, { instantSwap: true });
        if (workspace) {
          graphInstance.userCollapsedAnalyzeConnections = workspace.userCollapsedAnalyzeConnections;
          graphInstance.invalidateAnalyzeCaches();
        }
        if (currentSelectedEdge) graphInstance.setSelectedEdge(currentSelectedEdge);
      }
      setShellMode('study');
      updateSelectedEdgeDetail(currentSelectedEdge, currentSelectedNode);
      window.requestAnimationFrame(() => {
        if (graphInstance) {
          graphInstance.resizeCanvas();
          if (workspace) {
            graphInstance.camera = { ...workspace.camera };
            graphInstance.targetCamera = workspace.targetCamera ? { ...workspace.targetCamera } : null;
            graphInstance.requestRender();
          } else {
            graphInstance.zoomToFit();
          }
        }
        if (studyConsole && workspace) studyConsole.scrollTop = workspace.inspectorScrollTop;
        updateGatewayArcLayout();
      });
      return;
    }
    const defaultNode = NODE_BY_ID.get('temp');
    if (defaultNode) targetAndSelectNode(defaultNode);
  }

  async function handlePhenomenaClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    setShellMode('phenomena');

    const defaultNode = getDefaultPhenomenonNode();
    if (defaultNode) {
      await setActivePhenomenonNode(defaultNode);
    }
  }

  function handlePersonalFootprintClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    renderPersonalFootprint();
    setShellMode('personal-footprint');
  }

  function handleTulipScoreClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    if (tulipScorePopup) tulipScorePopup.style.display = 'flex';
    lastFooterOverlayTrigger = e?.currentTarget || null;
    setFooterOverlayActive(true, tulipScorePopup);
  }

  function handleAboutClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    if (aboutPopup) aboutPopup.style.display = 'flex';
    lastFooterOverlayTrigger = e?.currentTarget || null;
    setFooterOverlayActive(true, aboutPopup);
  }

  function handleContactClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    if (contactPopup) contactPopup.style.display = 'flex';
    lastFooterOverlayTrigger = e?.currentTarget || null;
    setFooterOverlayActive(true, contactPopup);
  }

  function handleRegistriesClick(e) {
    if (e) e.preventDefault();
    closeFooterOverlays();
    lastFooterOverlayTrigger = e?.currentTarget || null;
    if (dashboardActiveNodeName) {
      dashboardActiveNodeName.textContent = 'available across the platform';
    }
    if (registriesDashboard) {
      registriesDashboard.classList.add('active');
      registriesDashboard.style.display = 'flex';
    }
    setFooterOverlayActive(true, registriesDashboard);
    initializeRegistriesDashboard();
  }

  if (footerExplore) footerExplore.addEventListener('click', handleExploreClick);
  if (footerAnalyse) footerAnalyse.addEventListener('click', handleAnalyseClick);
  if (appLogo) appLogo.addEventListener('click', handleLogoClick);
  if (footerPhenomena) footerPhenomena.addEventListener('click', handlePhenomenaClick);
  if (footerPersonalFootprint) footerPersonalFootprint.addEventListener('click', handlePersonalFootprintClick);
  if (footerTulipScore) footerTulipScore.addEventListener('click', handleTulipScoreClick);
  if (footerRegistries) footerRegistries.addEventListener('click', handleRegistriesClick);
  if (openRegistriesBtn) openRegistriesBtn.addEventListener('click', handleRegistriesClick);
  if (footerAbout) footerAbout.addEventListener('click', handleAboutClick);
  if (footerContact?.getAttribute('aria-disabled') !== 'true') {
    footerContact.addEventListener('click', handleContactClick);
  }
  const contactForm = document.getElementById('contact-form');
  const contactFormStatus = document.getElementById('contact-form-status');
  if (contactForm && contactFormStatus) {
    contactForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;
      const submitButton = contactForm.querySelector('[type="submit"]');
      const formData = new FormData(contactForm);
      const payload = Object.fromEntries(formData.entries());
      submitButton.disabled = true;
      contactFormStatus.className = '';
      contactFormStatus.textContent = 'Sending…';
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'Message could not be sent.');
        contactForm.reset();
        contactFormStatus.className = 'is-success';
        contactFormStatus.textContent = 'Message sent. Thank you.';
        trackEvent('contact_submit_success');
      } catch {
        contactFormStatus.className = 'is-error';
        contactFormStatus.textContent = 'Message could not be sent. Please try again later.';
        trackEvent('contact_submit_failure');
      } finally {
        submitButton.disabled = false;
      }
    });
  }
  if (phenomenonModeFootprintBtn) {
    phenomenonModeFootprintBtn.addEventListener('click', () => setPhenomenonMode('footprint'));
  }
  if (phenomenonModeActionsBtn) {
    phenomenonModeActionsBtn.addEventListener('click', () => setPhenomenonMode('actions'));
  }
  if (phenomenonActionBridgeBtn) {
    phenomenonActionBridgeBtn.addEventListener('click', () => setPhenomenonMode('actions'));
  }
  if (phenomenaAnalyzeBtn) {
    phenomenaAnalyzeBtn.addEventListener('click', () => {
      if (!currentPhenomenonNode) return;
      targetAndSelectNode(currentPhenomenonNode);
    });
  }

  // Wire up Diagnostic Console Tab buttons
  const tabBtns = document.querySelectorAll('.console-tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tabId = e.currentTarget.getAttribute('data-tab');
      tabBtns.forEach(candidate => candidate.classList.remove('active'));
      document.querySelectorAll('.console-tab-content').forEach(panel => panel.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const panel = document.getElementById(tabId);
      if (panel) panel.classList.add('active');
    });
  });

  // Wire up filter pills
  if (filterBar) {
    const pills = filterBar.querySelectorAll('.filter-pill');

    pills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        const filterValue = e.currentTarget.getAttribute('data-filter');
        pills.forEach(p => {
          p.classList.remove('active');
          p.classList.remove('is-awakening');
        });
        e.currentTarget.classList.add('active');
        restartMotionClass(e.currentTarget, 'is-awakening', 680);

        if (sourcesView) sourcesView.style.display = 'none';
        if (sourcesTabBtn) sourcesTabBtn.classList.remove('active');
        if (appContainer) appContainer.classList.remove('sources-active');

        if (graphInstance) {
          setGraphFilter(filterValue);
        }
      });
    });

    if (sourcesTabBtn && sourcesView) {
      sourcesTabBtn.addEventListener('click', (e) => {
        e.preventDefault();
        requestSupportingCatalogs();
        pills.forEach(p => p.classList.remove('active'));
        closeFooterOverlays();
        sourcesView.style.display = 'flex';
        lastFooterOverlayTrigger = e.currentTarget;
        setFooterOverlayActive(true, sourcesView);
        sourcesTabBtn.classList.add('active');
        if (appContainer) appContainer.classList.add('sources-active');
      });
    }
  }

  if (tulipScorePopup) tulipScorePopup.addEventListener('click', e => {
    if (isOutsideOverlayContent(e, '.tulip-score-card')) closeFooterOverlays();
  });
  if (aboutPopup) aboutPopup.addEventListener('click', e => {
    if (isOutsideOverlayContent(e, '.about-card')) closeFooterOverlays();
  });
  if (contactPopup) contactPopup.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeFooterOverlays();
  });
  if (sourcesView) sourcesView.addEventListener('click', e => {
    if (isOutsideOverlayContent(e, '.sources-header, .sources-content-container')) closeFooterOverlays();
  });
  if (registriesDashboard) registriesDashboard.addEventListener('click', e => {
    if (isOutsideOverlayContent(e, '.dashboard-header, .dashboard-body')) closeFooterOverlays();
  });

  document.addEventListener('keydown', event => {
    const overlay = getVisibleFooterOverlay();
    if (!overlay) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeFooterOverlays();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...overlay.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter(element => !element.hidden && element.getClientRects().length);
    if (!focusable.length) {
      event.preventDefault();
      overlay.focus({ preventScroll: true });
      return;
    }
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Wire up search box
  const searchInput = document.getElementById('node-search-input');
  const searchResults = document.getElementById('search-results');

  if (searchInput && searchResults) {
    if (!searchInput.dataset.shortcutBound) {
      document.addEventListener('keydown', (event) => {
        if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
        event.preventDefault();
        searchInput.focus();
        searchInput.select();
      });
      searchInput.dataset.shortcutBound = 'true';
    }

    function nodeSearchTerms(node) {
      return [
        node.name,
        ...(node.semanticAliases || []).map(alias => alias.name),
        ...(node.metricAliases || []).map(alias => alias.name)
      ].filter(Boolean);
    }

    function handleSearch() {
      const query = searchInput.value.toLowerCase().trim();
      if (!query) {
        searchResults.style.display = 'none';
        searchResults.innerHTML = '';
        return;
      }

      // Tiered relevance scoring based on search query match quality
      const matchedWithScore = PUBLISHED_NODES.map((n, idx) => {
        const score = Math.max(...nodeSearchTerms(n).map(term => scoreSearchTerm(term, query)));
        return { node: n, index: idx, score };
      }).filter(item => item.score > 0);
      
      matchedWithScore.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score; // Primary sort: match quality score
        }
        if (b.node.tulipScore !== a.node.tulipScore) {
          return b.node.tulipScore - a.node.tulipScore; // Secondary sort: urgency/Tulip score
        }
        return b.index - a.index; // Tertiary sort: recency
      });

      const matches = matchedWithScore.slice(0, 15).map(item => item.node);

      if (matches.length === 0) {
        searchResults.style.display = 'block';
        searchResults.innerHTML = `<div style="padding: 12px; font-size: 13px; color: var(--text-muted); text-align: center;">No matching vectors found</div>`;
        return;
      }

      searchResults.style.display = 'block';
      searchResults.innerHTML = '';
      matches.forEach(node => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        
        const sphereKey = node.sphere ? node.sphere : 'core';
        const sphereLabel = SPHERE_LABELS[sphereKey] || sphereKey;
        
        item.innerHTML = `
          <span>${node.name}</span>
          <span style="display: flex; align-items: center; gap: 8px;">
            <span class="search-result-sphere-badge">${sphereLabel}</span>
            <strong style="color: var(--accent-color); font-weight: 700; font-size: 13px;">${node.tulipScore}</strong>
          </span>
        `;

        item.addEventListener('click', () => {
          targetAndSelectNode(node);
          closeSearch();
        });

        searchResults.appendChild(item);
      });
    }

    searchInput.addEventListener('input', handleSearch);

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const firstItem = searchResults.querySelector('.search-result-item');
        if (firstItem) {
          firstItem.click();
        }
      } else if (e.key === 'Escape') {
        closeSearch();
      }
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        closeSearch();
      }
    });

    function closeSearch() {
      searchResults.style.display = 'none';
      searchResults.innerHTML = '';
      searchInput.value = '';
      searchInput.blur();
    }
  }

  document.querySelectorAll('.suggested-journey-btn').forEach(button => {
    const trail = DISCOVERY_TRAILS[button.getAttribute('data-trail-id')];
    if (trail?.prompt) button.setAttribute('title', trail.prompt);
    button.addEventListener('click', () => {
      const trailId = button.getAttribute('data-trail-id');
      const journey = DISCOVERY_TRAILS[trailId];
      const entryNode = journey?.nodeIds?.length ? NODE_BY_ID.get(journey.nodeIds[0]) : null;
      if (entryNode) targetAndSelectNode(entryNode);
    });
  });

  // Wire up ECMWF API credentials panel
  const keyInput = document.getElementById('ecmwf-key-input');
  const copyBtn = document.getElementById('ecmwf-copy-btn');

  if (keyInput) {
    const storedKey = localStorage.getItem('ecmwf_key') || '';
    keyInput.value = storedKey;

    const handleInput = () => {
      localStorage.setItem('ecmwf_key', keyInput.value.trim());
      
      // Regenerate snippet if currently viewing code panel
      const codeGenPanel = document.getElementById('ecmwf-code-generator');
      if (codeGenPanel && codeGenPanel.style.display === 'block') {
        const activeItem = document.querySelector('.ecmwf-dataset-item.active-dataset');
        if (activeItem) {
          const dsId = activeItem.getAttribute('data-id');
          const dsTitle = activeItem.getAttribute('data-title');
          generateEcmwfPythonSnippet(dsId, dsTitle);
        }
      }
    };

    keyInput.addEventListener('input', handleInput);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const display = document.getElementById('ecmwf-code-display');
      if (!display) return;
      navigator.clipboard.writeText(display.textContent)
        .then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy code snippet:', err);
        });
    });
  }

  loadJsonWithApiFallback('/nature-climate-crosswalk.json', '/nature-climate-crosswalk.json', (data, mode) => {
    setNatureClimateCrosswalk(data);
    console.log(`[Nature Climate] Loaded ${data?.node_count || data?.nodes?.length || 0} node importance records via ${mode}.`);
  });
  scheduleBackgroundTask(() => {
    requestSupportingCatalogs();
  }, 3000);

  initializeNavigationHistory();
}

function sentenceCaseFirst(text = '') {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function getRelationshipLevelLabel(edge) {
  const relationshipLevel = edge?.evidence?.relationship_level || 'extrapolated';
  if (relationshipLevel === 'direct') return 'Direct relationship';
  if (relationshipLevel === 'indirect') return 'Indirect relationship';
  if (relationshipLevel === 'inferred') return 'Inferred relationship';
  return 'Extrapolated relationship';
}

function getRelationshipConfidenceLabel(edge) {
  const confidence = edge?.evidence?.confidence || '';
  if (!confidence) return '';
  if (confidence === 'moderate') return 'Medium confidence';
  return `${sentenceCaseFirst(confidence)} confidence`;
}

function formatRelationshipMeta(edge) {
  const relationshipLabel = getRelationshipLevelLabel(edge);
  const confidenceLabel = getRelationshipConfidenceLabel(edge);
  return confidenceLabel ? `${relationshipLabel} • ${confidenceLabel}` : relationshipLabel;
}

function setConnectionQuestionMarkup(edge, node = currentSelectedNode) {
  if (!connectionDetailHeader) return;
  connectionDetailHeader.replaceChildren();

  if (!edge || !node) return;

  const sourceName = NODE_BY_ID.get(edge.source)?.name || edge.source;
  const targetName = NODE_BY_ID.get(edge.target)?.name || edge.target;
  const leadingText = document.createTextNode(`How ${getRelationshipQuestionAuxiliary(NODE_BY_ID.get(edge.source) || edge.source)} `);
  const middleText = document.createTextNode(' affect ');
  const trailingText = document.createTextNode(' ?');
  const sourceSpan = document.createElement('span');
  const targetSpan = document.createElement('span');

  if (edge.target === node.id) {
    sourceSpan.className = 'connection-party-trigger';
    sourceSpan.textContent = sourceName;
    targetSpan.className = 'connection-party-selected';
    targetSpan.textContent = node.name;
  } else {
    sourceSpan.className = 'connection-party-selected';
    sourceSpan.textContent = node.name;
    targetSpan.className = 'connection-party-effect';
    targetSpan.textContent = targetName;
  }

  connectionDetailHeader.append(leadingText, sourceSpan, middleText, targetSpan, trailingText);
}

function getRelationshipDescription(edge, sourceName, targetName) {
  const relationshipDescription = edge?.relationship_description?.trim();
  const mechanism = edge?.evidence?.mechanism?.trim();
  const notes = edge?.evidence?.notes?.trim();
  return relationshipDescription
    || (mechanism ? sentenceCaseFirst(mechanism) : '')
    || (notes ? sentenceCaseFirst(notes) : '')
    || `${sourceName} affects ${targetName} through the reviewed relationship represented in this network.`;
}

function isSubstantiveCitationLocator(locator) {
  if (!locator?.url || !locator?.section?.trim()) return false;

  try {
    const url = new URL(locator.url);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();
    const rawEndpoint = host.startsWith('api.')
      || host.startsWith('developer.')
      || host.startsWith('developers.')
      || /\/(?:api|swagger|openapi)(?:\/|$)/.test(path)
      || /\/docs\/(?:services\/)?api(?:\/|$)/.test(path)
      || /\/(?:register|login|map_key)(?:\/|$)/.test(path)
      || /(?:capabilities\.xml|collections\.json)$/.test(path);
    return ['http:', 'https:'].includes(url.protocol) && !rawEndpoint;
  } catch {
    return false;
  }
}

function appendCollapsedSources(container, locators = []) {
  const availableSources = locators.filter((locator, index, items) => (
    isSubstantiveCitationLocator(locator)
    && items.findIndex(candidate => candidate?.url === locator.url) === index
  ));
  if (!availableSources.length) return;

  const disclosure = document.createElement('details');
  disclosure.className = 'connection-evidence-sources';
  const summary = document.createElement('summary');
  summary.textContent = `Sources (${availableSources.length})`;
  disclosure.appendChild(summary);

  const links = document.createElement('div');
  links.className = 'connection-evidence-source-links';
  for (const [index, locator] of availableSources.entries()) {
    const link = document.createElement('a');
    link.href = locator.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = locator.section || `Source ${index + 1}`;
    links.appendChild(link);
  }
  disclosure.appendChild(links);
  container.appendChild(disclosure);
}

function renderSelectedEdgeEvidence(edge) {
  if (!connectionDetailEvidence) return;
  connectionDetailEvidence.replaceChildren();

  const readback = edge?.evidence?.source_readback;
  const estimate = edge?.evidence?.quantitative_evidence
    ?.relationship_quantification?.scientific_effect_estimate;
  const locators = [
    ...(readback?.status === 'confirmed_bounded' ? readback.source_locators || [] : []),
    ...(estimate?.status === 'source_reported_estimate' && estimate.source_locator ? [estimate.source_locator] : [])
  ];
  connectionDetailEvidence.hidden = !locators.some(locator => locator?.url);
  if (!connectionDetailEvidence.hidden) appendCollapsedSources(connectionDetailEvidence, locators);
}

function updateSelectedEdgeDetail(edge, node = currentSelectedNode) {
  if (!connectionDetailSection || !connectionDetailHeader || !connectionDetailReason) return;

  const isSelectedNodeRelationship = Boolean(
    edge
    && node
    && (edge.source === node.id || edge.target === node.id)
  );

  connectionDetailSection.hidden = !isSelectedNodeRelationship;
  if (!isSelectedNodeRelationship) return;

  const sourceName = NODE_BY_ID.get(edge.source)?.name || edge.source;
  const targetName = NODE_BY_ID.get(edge.target)?.name || edge.target;
  setConnectionQuestionMarkup(edge, node);
  connectionDetailReason.textContent = getRelationshipDescription(edge, sourceName, targetName);
  renderSelectedEdgeEvidence(edge);
  const edgeKey = `${edge.source}->${edge.target}`;
  const isCausal = isCausalRelationship(edge);
  if (relationshipTriggerSelect) relationshipTriggerSelect.value = isCausal && edge.target === node.id ? edgeKey : '';
  if (relationshipEffectSelect) relationshipEffectSelect.value = isCausal && edge.source === node.id ? edgeKey : '';
  syncRelationshipEvidenceStudyState();
}

function syncRelationshipEvidenceStudyState() {
  [relationshipTriggerSelect, relationshipEffectSelect].forEach(select => {
    if (!select) return;
    const isStudying = Boolean(select.value);
    select.classList.toggle('is-studying', isStudying);
    select.closest('.relationship-evidence-field')?.classList.toggle('is-studying', isStudying);
  });
}

function clearSelectedEdgeDetail() {
  currentSelectedEdge = null;
  graphInstance?.setSelectedEdge?.(null);
  if (relationshipTriggerSelect) relationshipTriggerSelect.value = '';
  if (relationshipEffectSelect) relationshipEffectSelect.value = '';
  updateSelectedEdgeDetail(null, currentSelectedNode);
  syncRelationshipEvidenceStudyState();
}

function handleSelectEdge(edge) {
  if (!currentSelectedNode) return;
  if (!edge) {
    clearSelectedEdgeDetail();
    return;
  }
  currentSelectedEdge = edge;
  graphInstance?.setSelectedEdge?.(currentSelectedEdge);
  updateSelectedEdgeDetail(currentSelectedEdge, currentSelectedNode);
}

function populateRelationshipEvidencePicker(node) {
  if (!relationshipEvidencePickerSection || !relationshipTriggerSelect || !relationshipEffectSelect) return;
  relationshipTriggerSelect.replaceChildren();
  relationshipEffectSelect.replaceChildren();
  const triggerPlaceholder = document.createElement('option');
  triggerPlaceholder.value = '';
  triggerPlaceholder.textContent = 'Choose what influences this';
  relationshipTriggerSelect.appendChild(triggerPlaceholder);
  const effectPlaceholder = document.createElement('option');
  effectPlaceholder.value = '';
  effectPlaceholder.textContent = 'Choose what this influences';
  relationshipEffectSelect.appendChild(effectPlaceholder);
  if (!node) {
    relationshipEvidencePickerSection.hidden = true;
    syncRelationshipEvidenceStudyState();
    return;
  }

  const incoming = [...(INCOMING_EDGES_BY_TARGET.get(node.id) || [])]
    .filter(isCausalRelationship)
    .sort((a, b) => (NODE_BY_ID.get(a.source)?.name || a.source).localeCompare(NODE_BY_ID.get(b.source)?.name || b.source));
  const outgoing = [...(OUTGOING_EDGES_BY_SOURCE.get(node.id) || [])]
    .filter(isCausalRelationship)
    .sort((a, b) => (NODE_BY_ID.get(a.target)?.name || a.target).localeCompare(NODE_BY_ID.get(b.target)?.name || b.target));
  for (const edge of incoming) {
    const option = document.createElement('option');
    option.value = `${edge.source}->${edge.target}`;
    option.textContent = `${getRelationshipSemanticLabel(edge)} · ${NODE_BY_ID.get(edge.source)?.name || edge.source}`;
    relationshipTriggerSelect.appendChild(option);
  }
  for (const edge of outgoing) {
    const option = document.createElement('option');
    option.value = `${edge.source}->${edge.target}`;
    option.textContent = `${getRelationshipSemanticLabel(edge)} · ${NODE_BY_ID.get(edge.target)?.name || edge.target}`;
    relationshipEffectSelect.appendChild(option);
  }
  relationshipTriggerSelect.disabled = incoming.length === 0;
  relationshipEffectSelect.disabled = outgoing.length === 0;
  relationshipEvidencePickerSection.hidden = incoming.length + outgoing.length === 0;
  syncRelationshipEvidenceStudyState();
}

// --- CAUSAL PATHWAYS LIST UPDATE WITH LEGEND FILTERS ---
function updateCausalLists(node) {
  if (!node) return;
  
  if (consoleDriversList && consoleImpactsList) {
    consoleDriversList.innerHTML = '';
    consoleImpactsList.innerHTML = '';
    
    const showIncomingInfluences = graphInstance ? graphInstance.showIncomingInfluences : true;
    const showOutgoingInfluences = graphInstance ? graphInstance.showOutgoingInfluences : true;
    const focusData = graphInstance?.getAnalyzeFocusData(node) || null;
    const showAllConnections = !!focusData?.displayAllConnections;
    const shownDriverIds = new Set(focusData?.displayedDriverIds || []);
    const shownImpactIds = new Set(focusData?.displayedImpactIds || []);
    const drivers = (graphInstance?.incomingEdgesById.get(node.id) || EDGES
      .filter(e => e.target === node.id))
      .filter(isCausalRelationship)
      .filter(edge => showAllConnections || shownDriverIds.has(edge.source));
    const impacts = (graphInstance?.outgoingEdgesById.get(node.id) || EDGES
      .filter(e => e.source === node.id))
      .filter(isCausalRelationship)
      .filter(edge => showAllConnections || shownImpactIds.has(edge.target));
    
    if (!showIncomingInfluences) {
      consoleDriversList.innerHTML = '<div class="causal-empty">Filtered out</div>';
    } else if (drivers.length === 0) {
      consoleDriversList.innerHTML = '<div class="causal-empty">No incoming influences</div>';
    } else {
      drivers.forEach(edge => {
        const sourceNode = graphInstance?.nodeById.get(edge.source) || NODES.find(n => n.id === edge.source);
        if (sourceNode) {
          const item = document.createElement('div');
          item.className = 'causal-item';
          item.innerHTML = `
            <span class="causal-node-link">${sourceNode.name}</span>
            <span class="causal-relation">${edge.verb}</span>
            <span class="causal-evidence-meta">${formatRelationshipMeta(edge)}</span>
          `;
          item.querySelector('.causal-node-link').addEventListener('click', () => {
            targetAndSelectNode(sourceNode);
          });
          consoleDriversList.appendChild(item);
        }
      });
    }
    
    if (!showOutgoingInfluences) {
      consoleImpactsList.innerHTML = '<div class="causal-empty">Filtered out</div>';
    } else if (impacts.length === 0) {
      consoleImpactsList.innerHTML = '<div class="causal-empty">No outgoing influences</div>';
    } else {
      impacts.forEach(edge => {
        const targetNode = graphInstance?.nodeById.get(edge.target) || NODES.find(n => n.id === edge.target);
        if (targetNode) {
          const item = document.createElement('div');
          item.className = 'causal-item';
          item.innerHTML = `
            <span class="causal-node-link">${targetNode.name}</span>
            <span class="causal-relation">${edge.verb}</span>
            <span class="causal-evidence-meta">${formatRelationshipMeta(edge)}</span>
          `;
          item.querySelector('.causal-node-link').addEventListener('click', () => {
            targetAndSelectNode(targetNode);
          });
          consoleImpactsList.appendChild(item);
        }
      });
    }
  }
}

// --- NODE MEANINGS & MONITORING SENSORS GENERATORS ---
function getNodeMeaning(node) {
  if (!node) return "Awaiting description...";
  if (node.readerMeaning) return node.readerMeaning;
  if (node.node_kind === 'response') {
    return node.responseProfile?.summary || node.description || 'A reviewed climate response pathway.';
  }

  const customMeanings = {
    temp: "Rising long-term temperature changes the baseline that weather now operates on, making heat extremes, heavy rainfall, and stress on ice, crops, and ecosystems more likely.",
    methane: "Methane is a powerful heat-trapping gas, so leaks from fossil systems and emissions from agriculture can speed up near-term warming.",
    deforestation: "Forest loss removes carbon storage, dries out landscapes, weakens rainfall cycles, and leaves soils and species more exposed.",
    industry_farming: "Industrial farming drives up fertilizer use, water demand, and land stress, which can increase emissions, pollute waterways, and weaken soil health.",
    food: "Diet compares familiar foods directly, so users can see how beef, dairy, poultry, grains, and plant proteins differ on the same food-footprint scale.",
    urbanization: "Urban expansion replaces vegetated land with heat-absorbing surfaces, raising heat exposure, runoff, and flood risk.",
    fast_fashion: "Fast fashion combines high water use, petrochemical inputs, dye pollution, and waste, so its impact goes far beyond the store.",
    migration: "Climate-linked displacement does not directly warm the planet, but it can push people into places where housing, water, health systems, and infrastructure are already under stress.",
    resource_depletion: "Resource depletion matters when extraction outpaces recovery, lowering groundwater reserves, degrading soils, and weakening the buffers communities rely on.",
    carbon_emission: "Carbon dioxide from fossil fuels and land-use change stays in the atmosphere for a long time, driving warming, ocean acidification, and long-lived climate pressure.",
    personal_conveyance: "Heavy dependence on private vehicles raises oil demand and combustion emissions, adding both climate pollution and harmful local air pollution.",
    environ_anomalies: "Climate anomalies matter because they shift familiar seasonal patterns out of range, making floods, droughts, marine heat, and wildfire behavior harder to manage with historical expectations alone.",
    el_nino: "El Nino redistributes tropical Pacific heat and shifts atmospheric circulation, which can change storm tracks, suppress rainfall in some regions, and increase flood risk or heat risk in others.",
    la_nina: "La Nina cools the tropical Pacific surface while reorganizing circulation patterns, often strengthening rainfall in some basins, deepening drought in others, and changing the odds of seasonal extremes worldwide.",
    amoc: "The Atlantic Meridional Overturning Circulation helps move heat, salt, and nutrients through the ocean, so a slowdown can reshape rainfall belts, sea level patterns, and marine ecosystem conditions around the Atlantic basin.",
    wet_bulb_heat: "Wet-bulb heat is dangerous because high humidity makes it harder for the body to cool itself through sweat.",
    monsoon_volatility: "Monsoon volatility is about more than total rainfall. Shifts in timing and intensity can disrupt planting, reservoirs, flood control, and livelihoods.",
    permafrost_thaw: "Permafrost thaw destabilizes frozen ground and can release stored carbon and methane, linking local damage with larger climate feedbacks.",
    glacier_calving_events: "Glacier calving is the release of icebergs from a glacier front. At marine termini it transfers grounded ice toward the ocean; at some ice-contact lakes, rapid retreat and calving can also destabilize moraines or add to displacement waves, but only when local lake, slope, and dam conditions align.",
    data_centers: "Data centers matter when electricity demand, cooling loads, backup generation, and water use are concentrated in one place.",
    ai_data_centers: "AI compute can intensify those pressures because training and inference workloads often run at higher power density and for longer periods.",
    semiconductor_fabs: "Chip fabrication requires large amounts of electricity, ultrapure water, process chemicals, and fluorinated gases before the hardware ever reaches a server.",
    telecom_backbone: "Telecom backbone networks are the long-haul digital arteries that move traffic between cities, regions, and countries, tying physical connectivity to ongoing electricity demand and infrastructure fragility.",
    mobile_wireless_networks: "Mobile towers and wireless backhaul make the digital layer visible in everyday landscapes, but they also extend energy demand, backup-power dependence, and outage exposure across large geographies.",
    internet_exchange_points: "Internet exchange points are physical interconnection hubs where networks meet and swap traffic, so even though they are less energy-intensive than hyperscale campuses, they matter enormously for resilience and concentration risk.",
    subsea_cables: "Subsea cables carry most global internet traffic through a small number of routes and landing stations, creating real chokepoints for communication and trade."
  };

  const id = node.id;
  if (customMeanings[id]) return customMeanings[id];

  const readerDescription = String(node.description || '').trim();
  const isSyntheticDescription = /Earth system parameter calibrated|Northstar anchor covering|modelled in the .* sphere to widen causal coverage|anchor and .* domain profile/i.test(readerDescription);
  if (readerDescription && !isSyntheticDescription) return readerDescription;

  const nameLower = node.name.toLowerCase();

  // Keyword check
  if (nameLower.includes("acidification")) {
    return "Ocean acidification happens when seawater absorbs excess carbon dioxide and forms carbonic acid, lowering pH and making it harder for corals, shellfish, and other calcifying organisms to build and maintain their structures.";
  }
  if (nameLower.includes("la niña") || nameLower.includes("la nina")) {
    return "Cooling in the tropical Pacific shifts major rain belts and storm tracks, changing the odds of flood, drought, and cyclone patterns across multiple regions at once.";
  }
  if (nameLower.includes("amoc") || nameLower.includes("thermohaline") || nameLower.includes("overturning")) {
    return "Slower deep-ocean overturning redistributes heat and salinity, which can alter rainfall patterns, regional sea level, and marine productivity, especially around the North Atlantic.";
  }
  if (nameLower.includes("wet-bulb") || nameLower.includes("humidity")) {
    return "High humidity paired with extreme heat reduces the body’s ability to cool itself through sweat evaporation, raising mortality risk, labor losses, and emergency cooling demand.";
  }
  if (nameLower.includes("monsoon")) {
    return "Shifts in monsoon timing, duration, and intensity can destabilize planting calendars, reservoir operations, groundwater recharge, and flood control across densely populated regions.";
  }
  if (nameLower.includes("permafrost") || nameLower.includes("thermokarst") || nameLower.includes("talik")) {
    return "As Arctic warming deepens, formerly frozen ground can subside, fracture infrastructure, and release stored greenhouse gases through thawed soils, wetlands, and thermokarst features.";
  }
  if (nameLower.includes("data center") || nameLower.includes("server campus")) {
    return "High-density digital infrastructure concentrates electricity demand, cooling water use, and backup power needs in one place, making siting and grid mix critical to its emissions and resource footprint.";
  }
  if (nameLower.includes("telecom") || nameLower.includes("wireless") || nameLower.includes("internet exchange") || nameLower.includes("carrier hotel") || nameLower.includes("subsea cable")) {
    return "Physical digital networks depend on fiber routes, switching hubs, towers, and landing stations that consume power, concentrate risk, and make connectivity vulnerable to localized failures and chokepoints.";
  }
  if (nameLower.includes("semiconductor") || nameLower.includes("compute")) {
    return "Compute-intensive hardware production and operation carry significant electricity, ultrapure water, and fluorinated-gas burdens, especially when AI workloads expand faster than grid decarbonization and efficiency gains.";
  }
  if (nameLower.includes("bleaching") || nameLower.includes("coral")) {
    return "Coral bleaching occurs when heat stress causes corals to expel the algae they rely on for energy, weakening reefs that support fisheries, biodiversity, and coastal protection.";
  }
  if (nameLower.includes("sea level") || nameLower.includes("coastal") || nameLower.includes("erosion")) {
    return "Sea level rise raises the baseline for flooding and erosion, pushes saltwater farther inland, and increases the exposure of coasts, wetlands, aquifers, and built infrastructure.";
  }
  if (nameLower.includes("phytoplankton")) {
    return "Phytoplankton respond quickly to changes in heat, light, nutrients, and circulation, so disruptions can ripple through marine food webs and alter how the ocean absorbs carbon.";
  }
  if (nameLower.includes("marine heatwave") || nameLower.includes("heat content")) {
    return "Marine heatwaves are prolonged periods of unusually warm ocean temperatures that can disrupt fisheries, bleach corals, shift species ranges, and add energy to some storm environments.";
  }
  if (nameLower.includes("anoxic") || nameLower.includes("deoxygenation") || nameLower.includes("dead zone")) {
    return "Ocean deoxygenation lowers dissolved oxygen in marine waters, compressing habitable zones for fish and invertebrates and increasing the risk of ecological dead zones.";
  }
  if (nameLower.includes("ocean") || nameLower.includes("gulf stream") || nameLower.includes("thermohaline") || nameLower.includes("upwelling")) {
    return "Ocean circulation redistributes heat, carbon, oxygen, and nutrients, so changes in currents or upwelling can reshape regional climate, fisheries productivity, and coastal conditions.";
  }
  if (nameLower.includes("overfishing") || nameLower.includes("fishery")) {
    return "Excessive commercial harvesting collapses fish populations, disrupting marine food webs and threatening the food security of human communities reliant on ocean resources.";
  }
  if (nameLower.includes("desalination") || nameLower.includes("brine") || nameLower.includes("pollution")) {
    return "Toxic chemical runoff and industrial waste dump contaminants into marine habitats, poisoning marine organisms and bioaccumulating up the marine food chain.";
  }
  if (nameLower.includes("thaw") || nameLower.includes("permafrost") || nameLower.includes("defrosting")) {
    return "Thaw destabilizes frozen soils, damages roads and buildings, and can increase emissions from carbon-rich northern landscapes that were once locked in ice-bound ground.";
  }
  if (nameLower.includes("retreat") || nameLower.includes("melting") || nameLower.includes("calving")) {
    return "Retreat of glaciers and ice sheets adds water to the ocean, raises sea level over time, and can reduce the reliability of downstream meltwater supplies that many regions depend on seasonally.";
  }
  if (nameLower.includes("albedo")) {
    return "Albedo loss matters because darker land or ocean surfaces absorb more sunlight than snow and ice, increasing heat uptake and reinforcing additional warming.";
  }
  if (nameLower.includes("ice") || nameLower.includes("glaci") || nameLower.includes("snow")) {
    return "Loss of snow and ice changes how much sunlight Earth reflects, disrupts cold-region habitats, and alters meltwater timing that downstream communities use for water, energy, and agriculture.";
  }
  if (nameLower.includes("flood") || nameLower.includes("runoff") || nameLower.includes("outburst")) {
    return "Sudden releases of glacial meltwater inundate valley communities, causing severe erosion, destroying infrastructure, and altering freshwater chemistry in downstream basins.";
  }
  if (nameLower.includes("deforestation") || nameLower.includes("logging") || nameLower.includes("clearance")) {
    return "Industrial clearing of forests degrades vital carbon sinks, accelerates soil erosion, and destroys critical habitats, triggering local species extinctions and disrupting natural rainfall cycles.";
  }
  if (nameLower.includes("colony") || nameLower.includes("pollinator") || nameLower.includes("bee")) {
    return "Widespread declines in insect pollinators threaten agricultural reproduction and wild plant diversity, directly risking global food security and destabilizing terrestrial food webs.";
  }
  if (nameLower.includes("habitat") || nameLower.includes("fragmentation") || nameLower.includes("corridors")) {
    return "Splitting natural landscapes with roads and farms isolates wildlife populations, restricting genetic diversity and increasing vulnerability to local extinction events.";
  }
  if (nameLower.includes("wildfire") || nameLower.includes("scorched") || nameLower.includes("fire")) {
    return "Wildfire risk rises when heat, dryness, fuel loads, and ignition align, and severe fires can rapidly transform forests, soils, air quality, and watershed behavior.";
  }
  if (nameLower.includes("peat") || nameLower.includes("wetland") || nameLower.includes("marsh")) {
    return "Peatlands and wetlands store large amounts of carbon and water, so drainage, burning, or drying can turn them from long-term buffers into major emission sources and habitat losses.";
  }
  if (nameLower.includes("extinction") || nameLower.includes("red list") || nameLower.includes("decline")) {
    return "Species decline matters because biodiversity stabilizes food webs, pollination, nutrient cycling, and adaptation capacity; once losses accumulate, recovery becomes harder and ecosystem function weakens.";
  }
  if (nameLower.includes("invasive") || nameLower.includes("pathogen") || nameLower.includes("pest") || nameLower.includes("disease")) {
    return "Changing climate and disturbed ecosystems can help pests, pathogens, and invasive species spread into new ranges, where they can outcompete native species or intensify ecological damage.";
  }
  if (nameLower.includes("desert") || nameLower.includes("arid")) {
    return "Degradation of dryland soils from climate stress and overgrazing turns productive land into barren desert, causing dust storms and destroying agricultural livelihoods.";
  }
  if (nameLower.includes("coal") || nameLower.includes("fossil") || nameLower.includes("gas") || nameLower.includes("drilling") || nameLower.includes("petroleum")) {
    return "Fossil fuel extraction and combustion release long-lived greenhouse gases as well as harmful co-pollutants, linking global warming to local air, water, and health burdens.";
  }
  if (nameLower.includes("fracking") || nameLower.includes("wastewater") || nameLower.includes("spill")) {
    return "Extraction practices contaminate local groundwater aquifers and soil ecosystems with carcinogenic chemicals, threatening public health and surrounding agricultural productivity.";
  }
  if (nameLower.includes("solar") || nameLower.includes("wind") || nameLower.includes("refining") || nameLower.includes("battery") || nameLower.includes("lithium") || nameLower.includes("cobalt") || nameLower.includes("mining")) {
    return "Mining for transition metals creates toxic tailings and consumes vast water supplies, leaving heavy environmental footprints in local ecosystems despite clean energy benefits.";
  }
  if (nameLower.includes("grid") || nameLower.includes("transmission")) {
    return "Electric grids become climate-sensitive when demand spikes, generation constraints, heat losses, drought, storms, or wildfire damage reduce reliability across connected infrastructure.";
  }
  if (nameLower.includes("fertilizer") || nameLower.includes("runoff")) {
    return "Fertilizer runoff moves excess nitrogen and phosphorus into waterways, where it can fuel algal blooms, degrade water quality, and lower oxygen available to aquatic life.";
  }
  if (nameLower.includes("grazing") || nameLower.includes("livestock") || nameLower.includes("cattle")) {
    return "Overcompaction of soils by livestock destroys root systems and accelerates erosion, reducing the land's fertility and its capacity to absorb rainwater.";
  }
  if (nameLower.includes("demand") || nameLower.includes("food") || nameLower.includes("crop")) {
    return "Global food production pressures drive massive land conversion, accelerating biodiversity loss and freshwater depletion as natural habitats are cleared for pasture and monoculture crops.";
  }
  if (nameLower.includes("rice") || nameLower.includes("manure")) {
    return "Agricultural methane sources from flooded paddies and livestock waste trap atmospheric heat, accelerating short-term global warming and atmospheric instability.";
  }
  if (nameLower.includes("irrigation") || nameLower.includes("water table")) {
    return "Heavy irrigation can draw aquifers down faster than they recharge, weakening drought resilience and reducing water available for ecosystems, farms, and cities later in the season.";
  }
  if (nameLower.includes("monoculture") || nameLower.includes("maize") || nameLower.includes("soy")) {
    return "Massive fields of a single crop species replace diverse ecosystems, depleting soil nutrients, attracting pests, and requiring heavy chemical intervention to maintain yields.";
  }
  if (nameLower.includes("aviation") || nameLower.includes("jet") || nameLower.includes("fuel")) {
    return "High-altitude combustion of fossil fuels releases greenhouse gases and particulates, trapping heat directly in the upper troposphere and warming the global climate system.";
  }
  if (nameLower.includes("ship") || nameLower.includes("boat") || nameLower.includes("marine shipping")) {
    return "Heavy fuel burning by cargo vessels pollutes oceanic air corridors, while underwater acoustic noise disrupts marine mammal communications and navigation systems.";
  }
  if (nameLower.includes("truck") || nameLower.includes("traffic") || nameLower.includes("engine")) {
    return "Diesel combustion along cargo corridors releases toxic soot and nitrogen oxides, degrading urban air quality and contributing to warming atmospheric layers.";
  }
  if (nameLower.includes("road") || nameLower.includes("asphalt")) {
    return "Linear pavement corridors fragment native habitats, block rainwater infiltration, and absorb solar heat, creating elevated thermal bands across regional landscapes.";
  }
  if (nameLower.includes("tire") || nameLower.includes("brake")) {
    return "Friction from vehicle travel sheds microplastic dust and heavy metal particles, which wash into roadside soils and nearby aquatic systems, poisoning local food chains.";
  }
  if (nameLower.includes("e-waste") || nameLower.includes("landfill") || nameLower.includes("dump") || nameLower.includes("refuse")) {
    return "Discarded electronic hardware releases toxic heavy metals into surrounding soils and groundwater, posing severe health hazards to nearby communities and local food chains.";
  }
  if (nameLower.includes("plastic") || nameLower.includes("packaging")) {
    return "Non-biodegradable packaging waste accumulates in landfills and oceans, fragmenting into toxic microplastics that bioaccumulate across terrestrial and marine food webs.";
  }
  if (nameLower.includes("mill") || nameLower.includes("smelter") || nameLower.includes("refinery") || nameLower.includes("steel") || nameLower.includes("cement")) {
    return "Heavy industrial manufacturing processes release massive carbon emissions and chemical pollutants, degrading regional air quality and contaminating nearby aquatic systems.";
  }
  if (nameLower.includes("chemical") || nameLower.includes("dye") || nameLower.includes("acid")) {
    return "Industrial waste discharges dump toxic compounds into local rivers and soils, destroying aquatic ecosystems and threatening downstream human drinking water sources.";
  }
  if (nameLower.includes("refugee") || nameLower.includes("migration") || nameLower.includes("conflict")) {
    return "Displacement of populations driven by habitability loss shifts ecological pressures to receiving regions, stressing local water tables and expanding land clearing for shelter.";
  }
  if (nameLower.includes("insurance")) {
    return "Increasing frequency of natural disasters drives insurance rates upward, threatening economic stability and forcing the abandonment of vulnerable coastal or fire-prone regions.";
  }
  if (nameLower.includes("food price") || nameLower.includes("volatility") || nameLower.includes("famine")) {
    return "Crop failures from weather extremes spike food prices, triggering humanitarian crises and geopolitical instability in developing nations vulnerable to import dependency.";
  }
  if (nameLower.includes("water") || nameLower.includes("rationing")) {
    return "Water scarcity matters when supply, storage, quality, and timing no longer match demand, forcing tougher tradeoffs across households, agriculture, energy systems, and ecosystems.";
  }
  if (nameLower.includes("disease") || nameLower.includes("zoonotic") || nameLower.includes("outbreak")) {
    return "Disease risk can rise when warming, flooding, drought, or habitat disruption change where vectors, pathogens, and hosts can survive, increasing the chance of outbreaks and human exposure.";
  }

  // Fallback for general categories
  const sphere = node.sphere || 'atmosphere';
  if (sphere === 'atmosphere') {
    return "Atmospheric change matters because it shifts the energy balance, moisture content, and circulation patterns that shape temperature, precipitation, storms, and long-term climate risk.";
  }
  if (sphere === 'oceans') {
    return "Ocean changes affect heat storage, circulation, chemistry, and marine ecosystems, which is why they influence weather patterns, coastal risk, fisheries, and long-term climate feedbacks.";
  }
  if (sphere === 'cryosphere') {
    return "Cryosphere change alters reflectivity, freshwater storage, sea level, and frozen-ground stability, making snow, ice, and permafrost central to both local impacts and global feedbacks.";
  }
  if (sphere === 'biosphere') {
    return "Biosphere change affects how ecosystems store carbon, cycle water, support biodiversity, and buffer hazards, so damage here can amplify both ecological loss and human vulnerability.";
  }
  if (sphere === 'energy') {
    return "Energy-system choices determine a large share of emissions, air pollution, water demand, and infrastructure exposure, making them central to both climate pressure and adaptation risk.";
  }
  if (sphere === 'digital') {
    return "Digital infrastructure matters because the physical systems behind compute, storage, and connectivity concentrate electricity demand, cooling, water use, materials, and outage risk in ways that are increasingly large enough to shape the wider climate and infrastructure story.";
  }
  if (sphere === 'agriculture') {
    return "Agricultural change matters because farming links climate, land, water, fertilizer, methane, and food security, so stresses in one part of the system often spill into the others.";
  }
  if (sphere === 'transport') {
    return "Fossil-fueled transport networks release massive soot and carbon emissions, while structural pavement corridors fragment terrestrial ecosystems and generate heavy particulate runoff.";
  }
  if (sphere === 'economy') {
    return "Markets and money matter because prices, subsidies, insurance, procurement, and growth incentives can hide ecological damage, externalize risk, or accelerate extraction unless policy pushes the economy back inside physical limits.";
  }
  return "Socio-political pressures and environmental policy changes impact regional resource allocations, driving human migrations and shifting infrastructure resilience under climate change conditions.";
}

function getNodeSensors(node) {
  if (!node) return "<li>No sensors available</li>";
  const sphere = node.sphere || 'atmosphere';
  const metric = node.metric_contract;
  const metricContractItems = metric
    ? [
        `<li class="monitoring-method-item"><strong>Measurement</strong> — ${escapeHtml(metric.metric_name || node.name)}</li>`,
        `<li class="monitoring-method-item"><strong>Unit &amp; coverage</strong> — ${escapeHtml([metric.unit, metric.geography].filter(Boolean).join(' · '))}</li>`,
        metric.cadence
          ? `<li class="monitoring-method-item"><strong>Update cadence</strong> — ${escapeHtml(metric.cadence)}</li>`
          : '',
        metric.uncertainty
          ? `<li class="monitoring-method-item"><strong>Uncertainty</strong> — ${escapeHtml(metric.uncertainty)}</li>`
          : ''
      ].filter(Boolean)
    : [];
  const sensors = {
    atmosphere: [
      { name: "Sentinel-5P TROPOMI", desc: "Tropospheric gas spectrometer mapping ozone, NO2, and CO columns." },
      { name: "NASA OCO-2 & OCO-3", desc: "Spaceborne CO2 spectrometers tracking dry air mole fractions." },
      { name: "Aqua AIRS", desc: "Atmospheric infrared sounder measuring global temperature & humidity profiles." },
      { name: "Aura OMI", desc: "Ozone monitoring instrument tracking UV radiation and sulfur dioxide." }
    ],
    oceans: [
      { name: "Sentinel-6 Michael Freilich", desc: "Radar altimeter mapping sea surface height anomalies." },
      { name: "Terra/Aqua MODIS", desc: "Infrared radiometers tracking sea surface temperatures and coral stress." },
      { name: "Jason-3 Altimeter", desc: "Ocean surface topography scanner mapping currents & wave heights." },
      { name: "SMAP Radiometer", desc: "Active-passive microwave instrument monitoring ocean surface salinity." }
    ],
    cryosphere: [
      { name: "GRACE-FO Gravimetry", desc: "Gravity-based mass-change tracking for ice sheets, glaciers, and cryosphere water storage." },
      { name: "ICESat-2 ATLAS Laser", desc: "Spaceborne lidar profiling glacier elevations and sea ice thickness." },
      { name: "Sentinel-1 SAR", desc: "Synthetic Aperture Radar monitoring glacial velocities and sheet fractures." },
      { name: "Terra/Aqua MODIS", desc: "Multispectral radiometer measuring ice albedo feedback variations." }
    ],
    biosphere: [
      { name: "Landsat-8/9 OLI", desc: "Operational Land Imager mapping forest canopy loss and fragmentation." },
      { name: "Sentinel-2 MSI", desc: "Multispectral land imager tracking regional vegetation cover changes." },
      { name: "Terra/Aqua MODIS", desc: "Vegetation index sensor tracking global NDVI/EVI anomalies." },
      { name: "ECOSTRESS", desc: "Thermal radiometer tracking canopy water stress & transpiration." }
    ],
    energy: [
      { name: "Sentinel-5P TROPOMI", desc: "Plume tracker monitoring methane emissions and flaring SO2." },
      { name: "Suomi NPP VIIRS", desc: "Nighttime lights sensor tracking industrial energy footprint glow." },
      { name: "OCO-2 CO2 Sensor", desc: "Targeted spectrometer tracking point-source industrial CO2 outflow." },
      { name: "NASA TEMPO", desc: "Geostationary air spectrometer tracking refinery nitrogen oxide plumes." }
    ],
    digital: [
      { name: "Facility power meters", desc: "On-site interval electricity metering used to track data-center, fab, and network loads." },
      { name: "Cooling-water telemetry", desc: "Operational metering of water withdrawals, loops, and heat-rejection systems at dense digital facilities." },
      { name: "Network operations telemetry", desc: "Backbone and interconnection monitoring used to track traffic, outages, and routing stress across digital networks." },
      { name: "Grid interconnection monitors", desc: "Utility and substation monitoring that reveals concentrated digital load growth and reliability strain." }
    ],
    agriculture: [
      { name: "SMAP Radiometer", desc: "Soil moisture tracker measuring water availability in crop zones." },
      { name: "Landsat-8/9 TIRS", desc: "Thermal infrared sensor mapping cropland irrigation water depletion." },
      { name: "Terra/Aqua MODIS", desc: "Ecosystem sensor measuring crop growth curves and harvest yields." },
      { name: "GPM IMERG Rain", desc: "Precipitation scanner mapping rainfall anomalies in agricultural belts." }
    ],
    transport: [
      { name: "NASA TEMPO", desc: "Urban pollution scanner tracking localized traffic NOx and PM2.5." },
      { name: "Suomi NPP VIIRS", desc: "Nighttime lights tracking highway density and shipping lane glow." },
      { name: "Sentinel-5P", desc: "Atmospheric sensor tracking carbon monoxide and particulate corridors." },
      { name: "Aura OMI", desc: "Ozone monitoring instrument tracking sulfur dioxide shipping emissions." }
    ],
    economy: [
      { name: "Sentinel-5P TROPOMI", desc: "Industrial sensor tracking manufacturing gas outflows and soot." },
      { name: "Landsat-9 OLI-2", desc: "Operational Land Imager mapping landfills and factory footprints." },
      { name: "NASA OCO-3", desc: "Space station sensor mapping carbon emissions over urban industrial centers." },
      { name: "Aqua AIRS", desc: "Infrared sounder profiling thermal discharge from heavy industry zones." }
    ],
    sociopolitical: [
      { name: "GRACE-FO Gravimetry", desc: "Gravity-based tracking of groundwater depletion, basin stress, and drought-linked storage loss." },
      { name: "Sentinel-6 Altimeter", desc: "Radar mapping coastal flood threats and displacement risks." },
      { name: "Suomi NPP VIIRS", desc: "Nighttime lights tracking rapid population shifts and slum expansions." },
      { name: "Terra/Aqua MODIS", desc: "Thermal radiometers tracking heatwave intensities in urban zones." }
    ]
  };

  const sphereSensors = sensors[sphere] || sensors.atmosphere;
  const sensorItems = sphereSensors.map(s => {
    return `<li><strong>${s.name}</strong> — ${s.desc}</li>`;
  });
  return [...metricContractItems, ...sensorItems].join("");
}

function getEarthdataMatches(node, limit = 3) {
  if (!node || !earthdataCatalog || !Array.isArray(earthdataCatalog.collections)) {
    return [];
  }

  const normalizedName = String(node.name || '').toLowerCase();
  const normalizedSphere = String(node.sphere || '').toLowerCase();
  const nameTokens = normalizedName
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(token => token.length >= 4 && !['data', 'global', 'system', 'events', 'centers'].includes(token));

  return earthdataCatalog.collections
    .map(entry => {
      const haystack = [
        entry.title,
        entry.summary,
        entry.short_name,
        ...(entry.primary_spheres || []),
        ...(entry.match_terms || [])
      ].join(' ').toLowerCase();

      const exactNameMatch = Boolean(normalizedName && haystack.includes(normalizedName));
      const tokenHits = nameTokens.filter(token => haystack.includes(token)).length;
      let score = 0;
      if ((entry.primary_spheres || []).includes(node.sphere)) score += 8;
      if (exactNameMatch) score += 18;
      if (normalizedSphere && haystack.includes(normalizedSphere)) score += 6;

      nameTokens.forEach(token => {
        if (haystack.includes(token)) score += 3;
      });

      return { entry, score, strongMatch: exactNameMatch || tokenHits > 0 };
    })
    .filter(item => item.score > 0 && item.strongMatch)
    .sort((a, b) => b.score - a.score || String(a.entry.title).localeCompare(String(b.entry.title)))
    .slice(0, limit)
    .map(item => item.entry);
}

function renderEarthdataCollections(node) {
  if (!consoleEarthdataCollections) return;

  const matches = getEarthdataMatches(node, 3);
  const section = consoleEarthdataCollections.closest('.meta-desc-section');
  if (section) section.hidden = matches.length === 0;
  if (matches.length === 0) {
    consoleEarthdataCollections.innerHTML = '';
    return;
  }

  consoleEarthdataCollections.innerHTML = matches.map(entry => {
    const shortName = escapeHtml(entry.short_name || 'NASA Collection');
    const version = entry.version_id ? ` v${escapeHtml(entry.version_id)}` : '';
    const archiveCenter = entry.archive_center ? ` · ${escapeHtml(entry.archive_center)}` : '';
    const summary = escapeHtml(entry.summary || 'NASA Earth observation collection relevant to this node.');
    const href = escapeHtml(safeHttpsUrl(entry.search_url || entry.access_url, 'https://search.earthdata.nasa.gov/'));

    return `
      <div style="display:flex; flex-direction:column; gap:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px; color: rgba(255, 220, 174, 0.95); font-weight:600; letter-spacing:0.4px;">${shortName}${version}${archiveCenter}</div>
        <a href="${href}" target="_blank" rel="noopener noreferrer" style="font-size:13px; color:#ffffff; text-decoration:none; font-weight:500; line-height:1.4;">
          ${escapeHtml(entry.title)} ↗
        </a>
        <div style="font-size:12px; color:rgba(255,255,255,0.56); line-height:1.45;">${summary}</div>
      </div>
    `;
  }).join('');
}

function getGraceMatches(node, limit = 3) {
  if (!node || !graceCatalog || !Array.isArray(graceCatalog.collections)) {
    return [];
  }

  const normalizedName = String(node.name || '').toLowerCase();
  const normalizedSphere = String(node.sphere || '').toLowerCase();
  const nameTokens = normalizedName
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(token => token.length >= 4 && !['data', 'global', 'system', 'events'].includes(token));

  return graceCatalog.collections
    .map(entry => {
      const haystack = [
        entry.title,
        entry.summary,
        entry.short_name,
        ...(entry.primary_spheres || []),
        ...(entry.match_terms || []),
        ...(entry.node_hints || [])
      ].join(' ').toLowerCase();

      const nodeHintMatch = (entry.node_hints || []).includes(node.id);
      const exactNameMatch = Boolean(normalizedName && haystack.includes(normalizedName));
      const tokenHits = nameTokens.filter(token => haystack.includes(token)).length;
      const domainMatch = node.id === 'resource_depletion' && /groundwater|water storage|drought|hydrology/.test(haystack)
        || node.sphere === 'cryosphere' && /ice sheet|greenland|antarctica|mass anomaly|mascon/.test(haystack)
        || node.sphere === 'oceans' && /ocean mass|sea level|ocean bottom pressure/.test(haystack);
      let score = 0;
      if ((entry.primary_spheres || []).includes(node.sphere)) score += 10;
      if (nodeHintMatch) score += 20;
      if (exactNameMatch) score += 12;
      if (normalizedSphere && haystack.includes(normalizedSphere)) score += 6;

      nameTokens.forEach(token => {
        if (haystack.includes(token)) score += 3;
      });

      if (node.id === 'resource_depletion' && /groundwater|water storage|drought|hydrology/.test(haystack)) score += 14;
      if (node.sphere === 'cryosphere' && /ice sheet|greenland|antarctica|mass anomaly|mascon/.test(haystack)) score += 12;
      if (node.sphere === 'oceans' && /ocean mass|sea level|ocean bottom pressure/.test(haystack)) score += 10;

      return { entry, score, strongMatch: nodeHintMatch || exactNameMatch || tokenHits > 0 || domainMatch };
    })
    .filter(item => item.score > 0 && item.strongMatch)
    .sort((a, b) => b.score - a.score || String(a.entry.title).localeCompare(String(b.entry.title)))
    .slice(0, limit)
    .map(item => item.entry);
}

function renderGraceCollections(node) {
  if (!consoleGraceCollections) return;

  const matches = getGraceMatches(node, 3);
  const section = consoleGraceCollections.closest('.meta-desc-section');
  if (section) section.hidden = matches.length === 0;
  if (matches.length === 0) {
    consoleGraceCollections.innerHTML = '';
    return;
  }

  consoleGraceCollections.innerHTML = matches.map(entry => {
    const shortName = escapeHtml(entry.short_name || 'GRACE Collection');
    const version = entry.version_id ? ` v${escapeHtml(entry.version_id)}` : '';
    const archiveCenter = entry.archive_center ? ` · ${escapeHtml(entry.archive_center)}` : '';
    const summary = escapeHtml(entry.summary || 'GRACE/GRACE-FO collection relevant to this mass-change pathway.');
    const href = escapeHtml(safeHttpsUrl(entry.search_url || entry.access_url, 'https://grace.jpl.nasa.gov/'));

    return `
      <div style="display:flex; flex-direction:column; gap:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px; color: rgba(96, 165, 250, 0.95); font-weight:600; letter-spacing:0.4px;">${shortName}${version}${archiveCenter}</div>
        <a href="${href}" target="_blank" rel="noopener noreferrer" style="font-size:13px; color:#ffffff; text-decoration:none; font-weight:500; line-height:1.4;">
          ${escapeHtml(entry.title)} ↗
        </a>
        <div style="font-size:12px; color:rgba(255,255,255,0.56); line-height:1.45;">${summary}</div>
      </div>
    `;
  }).join('');
}

function getPowerMatches(node, limit = 2) {
  if (!node || !powerCatalog || !Array.isArray(powerCatalog.baselines)) {
    return [];
  }

  const normalizedName = String(node.name || '').toLowerCase();
  const normalizedSphere = String(node.sphere || '').toLowerCase();
  const nameTokens = normalizedName
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(token => token.length >= 4);

  return powerCatalog.baselines
    .map(entry => {
      const haystack = [
        entry.label,
        entry.location?.label,
        ...(entry.primary_spheres || []),
        ...(entry.match_terms || []),
        ...(entry.node_hints || [])
      ].join(' ').toLowerCase();

      let score = 0;
      if ((entry.primary_spheres || []).includes(node.sphere)) score += 12;
      if ((entry.node_hints || []).includes(node.id)) score += 18;
      if (normalizedSphere && haystack.includes(normalizedSphere)) score += 5;
      if (normalizedName && haystack.includes(normalizedName)) score += 8;

      nameTokens.forEach(token => {
        if (haystack.includes(token)) score += 3;
      });

      if (node.sphere === 'cryosphere' && /ice|glacier|snow|permafrost|thaw/.test(haystack)) score += 10;
      if ((node.sphere === 'agriculture' || node.sphere === 'biosphere') && /drought|water stress|fire|crop/.test(haystack)) score += 8;
      if (node.sphere === 'energy' && /data center|cooling load|grid/.test(haystack)) score += 10;
      if (node.sphere === 'atmosphere' && /heat|humidity|precipitation/.test(haystack)) score += 8;

      return { entry, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || String(a.entry.label).localeCompare(String(b.entry.label)))
    .slice(0, limit)
    .map(item => item.entry);
}

function renderPowerBaselines(node) {
  if (!consolePowerBaselines) return;

  const matches = getPowerMatches(node, 2);
  const section = consolePowerBaselines.closest('.meta-desc-section');
  if (section) section.hidden = matches.length === 0;
  if (matches.length === 0) {
    consolePowerBaselines.innerHTML = '';
    return;
  }

  consolePowerBaselines.innerHTML = matches.map(entry => {
    const metrics = entry.metrics || {};
    const parts = [
      Number.isFinite(metrics.annual_air_temperature_c) ? `Temp ${metrics.annual_air_temperature_c} C` : null,
      Number.isFinite(metrics.annual_relative_humidity_pct) ? `Humidity ${metrics.annual_relative_humidity_pct}%` : null,
      Number.isFinite(metrics.annual_precipitation_mm_day) ? `Precip ${metrics.annual_precipitation_mm_day} mm/day` : null,
      Number.isFinite(metrics.annual_surface_solar_kwh_m2_day) ? `Solar ${metrics.annual_surface_solar_kwh_m2_day} kWh/m2/day` : null
    ].filter(Boolean);

    return `
      <div style="display:flex; flex-direction:column; gap:4px; padding-top:8px; border-top:1px solid rgba(255,255,255,0.08);">
        <div style="font-size:12px; color: rgba(255, 176, 80, 0.95); font-weight:600; letter-spacing:0.4px;">${entry.label}</div>
        <a href="https://power.larc.nasa.gov/" target="_blank" rel="noopener noreferrer" style="font-size:13px; color:#ffffff; text-decoration:none; font-weight:500; line-height:1.4;">
          ${entry.location?.label || 'NASA POWER baseline'} ↗
        </a>
        <div style="font-size:12px; color:rgba(255,255,255,0.72); line-height:1.45;">
          Representative climatology baseline for this pathway, not a node-specific geolocation.
        </div>
        <div style="font-size:12px; color:rgba(255,255,255,0.56); line-height:1.45;">${parts.join(' · ')}</div>
      </div>
    `;
  }).join('');
}

const HUMAN_IMPACT_DOMAIN_RULES = [
  {
    key: 'health',
    label: 'Health',
    keywords: ['heat', 'wet-bulb', 'nocturnal', 'disease', 'pathogen', 'mortality', 'humidity', 'survivability', 'outbreak'],
    consequence: 'Raises illness or mortality exposure through the documented health pathway.'
  },
  {
    key: 'food',
    label: 'Food',
    keywords: ['crop', 'agric', 'farm', 'monsoon', 'yield', 'livestock', 'fish', 'fisher', 'food'],
    consequence: 'Disrupts crop yields, fisheries, livestock, and food affordability.'
  },
  {
    key: 'water',
    label: 'Water',
    keywords: ['drought', 'water', 'groundwater', 'rainfall', 'precip', 'flood', 'river', 'aquifer', 'irrigation', 'salinity'],
    consequence: 'Destabilizes drinking water, irrigation, reservoirs, and sanitation systems.'
  },
  {
    key: 'air',
    label: 'Air Quality',
    keywords: ['pollution', 'smoke', 'ozone', 'methane', 'pm2.5', 'particulate', 'nitrogen', 'sulfur', 'air quality'],
    consequence: 'Worsens toxic air exposure and the burden on lungs, hearts, and clinics.'
  },
  {
    key: 'homes',
    label: 'Habitability',
    keywords: ['sea level', 'coastal', 'habitab', 'livability', 'uninhabit', 'housing', 'permafrost', 'cooling water'],
    consequence: 'Makes homes, neighborhoods, or workplaces harder and costlier to inhabit safely.'
  },
  {
    key: 'displacement',
    label: 'Displacement',
    keywords: ['migration', 'displacement', 'conflict', 'relocation', 'refugee', 'evacuation'],
    consequence: 'Pushes people into migration, relocation, or conflict over viable land and services.'
  },
  {
    key: 'infrastructure',
    label: 'Infrastructure',
    keywords: ['grid', 'power', 'infrastructure', 'transport', 'data center', 'server', 'storm', 'blackout'],
    consequence: 'Strains grids, transport, cooling, and emergency-response systems.'
  },
  {
    key: 'livelihoods',
    label: 'Livelihoods',
    keywords: ['labor', 'economic', 'industry', 'tourism', 'insurance', 'price', 'supply', 'work'],
    consequence: 'Hits jobs, incomes, insurance access, and day-to-day affordability.'
  }
];

function getHumanImpactSeverityMeta(fallout) {
  if (fallout >= 0.9) return { label: 'Acute human toll', className: 'severity-acute' };
  if (fallout >= 0.75) return { label: 'High human exposure', className: 'severity-high' };
  if (fallout >= 0.55) return { label: 'Material human stress', className: 'severity-material' };
  return { label: 'Emerging human stress', className: 'severity-emerging' };
}

function getResponseBenefitSeverityMeta(score, audience = 'human') {
  const subject = audience === 'planet' ? 'planetary co-benefit' : 'protective benefit';
  if (score >= 8.5) return { label: `Transformative ${subject}`, className: 'severity-low' };
  if (score >= 7) return { label: `High ${subject}`, className: 'severity-emerging' };
  if (score >= 5) return { label: `Material ${subject}`, className: 'severity-material' };
  return { label: `Supporting ${subject}`, className: 'severity-high' };
}

function formatHumanImpactMode(confidence) {
  if (confidence === 'curated') return 'curated';
  if (confidence === 'inherited') return 'inherited';
  return 'heuristic';
}

function lowerFirst(text) {
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function joinWithAnd(items) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} and ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function buildInheritedHumanSummary(impact) {
  const pathways = (impact.primaryPathways || []).slice(0, 2).map(lowerFirst);
  const populations = (impact.affectedPopulations || []).slice(0, 2).map(item => item.toLowerCase());
  const leadPathways = joinWithAnd(pathways) || 'climate stress pathways';
  const leadPopulations = joinWithAnd(populations) || 'exposed communities';
  return `People are most exposed when ${leadPathways} intensify, especially for ${leadPopulations}.`;
}

function buildInheritedPlanetSummary(impact) {
  const pathways = (impact.primaryPathways || []).slice(0, 2).map(lowerFirst);
  const systems = (impact.affectedSystems || []).slice(0, 2).map(item => item.toLowerCase());
  const leadPathways = joinWithAnd(pathways) || 'Earth-system stress pathways';
  const leadSystems = joinWithAnd(systems) || 'connected ecosystems';
  return `Planetary stress rises when ${leadPathways} destabilize ${leadSystems}.`;
}

function simplifyImpactCopy(text) {
  if (!text) return text;

  const replacements = [
    [' matters to people because ', ' harms people because '],
    [' matter to people when ', ' hit people when '],
    [' matters to people when ', ' hits people when '],
    [' affect people when ', ' hit people when '],
    [' affects people when ', ' hits people when '],
    [' becomes a human crisis when ', ' becomes a crisis when '],
    [' becomes a human problem when ', ' becomes a problem when '],
    [' turns climate risk into visible human loss through ', ' shows up as human loss through '],
    [' translates into ', ' creates '],
    [' at global scale', ' globally'],
    [' across exposed regions', ' across exposed regions'],
    [' in exposed communities', ' in exposed communities'],
    [' raises baseline ', ' raises '],
    [' shrinks safe outdoor work hours', ' reduces safe outdoor work hours'],
    [' worsens ', ' increases '],
    [' steadily makes more neighborhoods expensive to cool or protect', ' makes more neighborhoods costly to cool or protect'],
    [' intensifies near-term warming quickly', ' speeds up near-term warming'],
    [' arrive sooner than CO2 alone would', ' arrive sooner'],
    [' externalizes ', ' shifts '],
    [' overdraw ', ' overuse '],
    [' less resilient to shocks', ' more fragile'],
    [' can trap people in hotter, flood-prone, and infrastructure-hungry environments', ' can trap people in hotter, flood-prone places'],
    [' load the climate system with long-lived warming that multiplies ', ' add long-lived warming that increases '],
    [' through air pollution, fuel-cost exposure, unsafe urban design, and high household transport burdens', ' through air pollution, fuel costs, unsafe streets, and high transport costs'],
    [' can quickly hit ', ' can quickly raise '],
    [' directly threatens human survivability', ' directly threatens survival'],
    [' becomes visible to people when ', ' shows up when '],
    [' turns climate risk into a household balance-sheet crisis when ', ' becomes a household financial crisis when '],
    [' is a direct human issue because it moves quickly from field losses into ', ' quickly moves from field losses into '],
    [' becomes a climate harm when families cannot pay for ', ' becomes harmful when families cannot afford '],
    [' destabilizes multiple Earth systems at once, accelerating ', ' destabilizes multiple Earth systems at once by accelerating '],
    [' accelerates near-term planetary heating, amplifying ', ' speeds up near-term planetary heating and increases '],
    [' weakens the ecological carrying capacity of land and water systems by exhausting the physical stocks they depend on', ' weakens land and water systems by exhausting the physical stocks they depend on'],
    [' are the core long-lived forcing that raises baseline planetary heat and shifts multiple Earth systems toward persistent destabilization', ' are a core long-lived force that raises planetary heat and pushes multiple Earth systems toward lasting instability'],
    [' affect the planet indirectly through ', ' affect the planet through '],
    [' raise planetary strain when ', ' increase planetary strain when '],
    [' stress the planet through ', ' strain the planet through '],
    [' extend the physical footprint of digital systems across landscapes through ', ' spread the physical footprint of digital systems across landscapes through '],
    [' create a global digital backbone whose environmental and systemic importance comes less from everyday emissions than from concentration, repair dependence, and geopolitical chokepoints', ' matter less for daily emissions than for concentration risk, repair dependence, and geopolitical chokepoints'],
    [' destabilizes the seasonal freshwater pulse that many terrestrial ecosystems rely on for reproduction, growth, and recovery', ' disrupts the seasonal freshwater pulse many ecosystems rely on for reproduction, growth, and recovery'],
    [' climate-linked stress pathways', ' climate-linked pressures'],
    [' interconnected ecological pathways', ' connected ecological pressures'],
    ['Earth-system stress pathways', 'Earth-system pressures']
  ];

  let simplified = text;
  replacements.forEach(([from, to]) => {
    simplified = simplified.replaceAll(from, to);
  });

  simplified = simplified
    .replace(/\bcan not\b/g, 'cannot')
    .replace(/\s+/g, ' ')
    .replace(/\s([,.;:!?])/g, '$1')
    .trim();

  return simplified;
}

function simplifyImpactList(items = []) {
  return items.map(item => simplifyImpactCopy(item));
}

function getHumanDisplaySummary(node, impact) {
  if (!impact) return 'Human exposure rises through climate-linked stress pathways.';
  if (impact.confidence === 'inherited') {
    return simplifyImpactCopy(buildInheritedHumanSummary(impact));
  }
  return simplifyImpactCopy(impact.summary || 'Human exposure rises through climate-linked stress pathways.');
}

function getPlanetDisplaySummary(node, impact) {
  if (!impact) return 'Earth-system strain rises through interconnected ecological pathways.';
  if (impact.confidence === 'inherited') {
    return simplifyImpactCopy(buildInheritedPlanetSummary(impact));
  }
  return simplifyImpactCopy(impact.summary || 'Earth-system strain rises through interconnected ecological pathways.');
}

const PLANET_IMPACT_DOMAIN_RULES = [
  { key: 'biodiversity', label: 'Biodiversity', keywords: ['species', 'biodiversity', 'habitat', 'pollinator', 'reef', 'forest'], consequence: 'Reduces ecological diversity and weakens habitat resilience.' },
  { key: 'oceans', label: 'Oceans', keywords: ['ocean', 'marine', 'acidification', 'deoxygenation', 'reef', 'salinity'], consequence: 'Destabilizes marine chemistry, habitat quality, or ocean food webs.' },
  { key: 'freshwater', label: 'Freshwater', keywords: ['river', 'aquifer', 'water', 'groundwater', 'basin', 'flood', 'drought'], consequence: 'Disrupts freshwater timing, quality, or ecological allocation.' },
  { key: 'cryosphere', label: 'Cryosphere', keywords: ['ice', 'glacier', 'permafrost', 'snow', 'cryosphere'], consequence: 'Accelerates ice loss, frozen-ground instability, or albedo decline.' },
  { key: 'soils', label: 'Soils & Land', keywords: ['soil', 'erosion', 'topsoil', 'desert', 'land', 'deforestation'], consequence: 'Weakens soil function, land productivity, or terrestrial stability.' },
  { key: 'atmosphere', label: 'Atmosphere', keywords: ['temperature', 'warming', 'methane', 'carbon', 'ozone', 'aerosol', 'heat', 'sulfur'], consequence: 'Alters atmospheric chemistry or radiative forcing.' },
  { key: 'resilience', label: 'Resilience', keywords: ['feedback', 'threshold', 'circulation', 'instability', 'collapse'], consequence: 'Pushes Earth systems closer to nonlinear change or lower resilience.' }
];

function getPlanetImpactSeverityMeta(node) {
  const ed = node?.vector?.ecological_damage ?? 0.5;
  const cf = node?.vector?.climate_forcing ?? 0.5;
  const pressure = (ed * 0.65) + (cf * 0.35);
  if (pressure >= 0.9) return { label: 'Acute Earth-system strain', className: 'severity-acute' };
  if (pressure >= 0.75) return { label: 'High ecological disruption', className: 'severity-high' };
  if (pressure >= 0.55) return { label: 'Material planetary stress', className: 'severity-material' };
  return { label: 'Emerging planetary stress', className: 'severity-emerging' };
}

function inferHumanImpactProfile(node) {
  if (!node) {
    populateRelationshipEvidencePicker(null);
    return {
      severity: getHumanImpactSeverityMeta(0.5),
      reach: 'Reach: ---',
      mode: 'heuristic',
      summary: 'Select a node to see how it affects people.',
      domains: [],
      populations: [],
      timeHorizon: null,
      basis: null,
      consequences: ['Human consequences will appear here.']
    };
  }

  const fallout = node.vector?.societal_fallout ?? 0.5;
  const reach = node.context?.reach || 'mixed';
  const severity = node.node_kind === 'response'
    ? getResponseBenefitSeverityMeta(node.responseProfile?.co_benefits || node.responseProfile?.overall || 5, 'human')
    : getHumanImpactSeverityMeta(fallout);
  const structuredImpact = node.humanImpact || null;

  if (structuredImpact) {
    return {
      severity,
      reach: `Reach: ${reach}`,
      mode: formatHumanImpactMode(structuredImpact.confidence),
      summary: getHumanDisplaySummary(node, structuredImpact),
      domains: structuredImpact.domains || [],
      populations: structuredImpact.affectedPopulations || [],
      timeHorizon: structuredImpact.timeHorizon || null,
      basis: structuredImpact.basis || null,
      consequences: simplifyImpactList((structuredImpact.consequences || []).slice(0, 4))
    };
  }

  // A canonical label, sphere, vector score, or metric name is not enough to
  // create a node-specific human-impact claim. Keep the visible inspector
  // honest until an authored profile is backed by sources and boundaries.
  return {
    severity: { label: 'Impact not yet characterized', className: 'severity-emerging' },
    reach: `Reach: ${reach}`,
    mode: 'research boundary',
    summary: `A node-specific human-impact synthesis has not yet been curated for ${node.name}.`,
    domains: [],
    populations: [],
    timeHorizon: null,
    basis: 'explicit_uncurated_profile_boundary',
    consequences: ['No impact domain, affected population, or severity is inferred from the node label or sphere.']
  };
}

function inferPlanetImpactProfile(node) {
  if (!node) {
    return {
      severity: getPlanetImpactSeverityMeta(null),
      reach: 'Reach: ---',
      mode: 'heuristic',
      summary: 'Select a node to see how it affects ecosystems and Earth systems directly.',
      domains: [],
      systems: [],
      timeHorizon: null,
      basis: null,
      consequences: ['Planet consequences will appear here.']
    };
  }

  const reach = node.context?.reach || 'mixed';
  const severity = node.node_kind === 'response'
    ? getResponseBenefitSeverityMeta(node.responseProfile?.co_benefits || node.responseProfile?.overall || 5, 'planet')
    : getPlanetImpactSeverityMeta(node);
  const structuredImpact = node.planetImpact || null;

  if (structuredImpact) {
    return {
      severity,
      reach: `Reach: ${reach}`,
      mode: formatHumanImpactMode(structuredImpact.confidence),
      summary: getPlanetDisplaySummary(node, structuredImpact),
      domains: structuredImpact.domains || [],
      systems: structuredImpact.affectedSystems || [],
      timeHorizon: structuredImpact.timeHorizon || null,
      basis: structuredImpact.basis || null,
      consequences: simplifyImpactList((structuredImpact.consequences || []).slice(0, 4))
    };
  }

  // Do not manufacture ecological domains from a label, sphere, or score.
  // Relationship evidence remains available elsewhere in the inspector.
  return {
    severity: { label: 'Impact not yet characterized', className: 'severity-emerging' },
    reach: `Reach: ${reach}`,
    mode: 'research boundary',
    summary: `A node-specific planetary-impact synthesis has not yet been curated for ${node.name}.`,
    domains: [],
    systems: [],
    timeHorizon: null,
    basis: 'explicit_uncurated_profile_boundary',
    consequences: ['No Earth-system domain, affected system, or severity is inferred from the node label or sphere.']
  };
}

function getHumanImpactIconSvg(text) {
  const normalized = (text || '').toLowerCase();

  if (/(illness|heat injury|mortality|health|hospital|clinic)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-4.35-8.5-8.2C1.9 9.9 3.55 6.5 7.1 6.5c1.96 0 3.06.98 4.9 3 1.84-2.02 2.94-3 4.9-3 3.55 0 5.2 3.4 3.6 6.3C18.5 16.65 12 21 12 21Z"/><path d="M8.25 12h2.3l1.05-2.1 1.7 4.2 1-2.1h1.45"/></svg>';
  }
  if (/(crop|food|fish|fisher|livestock|protein|diet)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V10"/><path d="M8 13c0-3 1.6-5.1 4-6.5"/><path d="M16 13c0-3-1.6-5.1-4-6.5"/><path d="M6.5 15.5c1.1-1.7 2.7-2.7 5.5-3"/><path d="M17.5 15.5c-1.1-1.7-2.7-2.7-5.5-3"/></svg>';
  }
  if (/(water|drinking|irrigation|reservoir|sanitation|aquifer)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.2 4.1 5.5 6.9 5.5 10A5.5 5.5 0 0 1 6.5 13c0-3.1 2.3-5.9 5.5-10Z"/></svg>';
  }
  if (/(air|lungs|respiratory|toxic|pollution|ozone|smoke)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.8 2"/><path d="M4 10c2.4 0 2.4-2 4.8-2s2.4 2 4.8 2 2.4-2 4.8-2 2.4 2 4.8 2"/></svg>';
  }
  if (/(home|homes|housing|neighborhood|workplace|inhabit)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-5h4v5"/></svg>';
  }
  if (/(migration|relocation|displaced|conflict|services)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h10"/><path d="m11 3 4 4-4 4"/><path d="M19 17H9"/><path d="m13 13-4 4 4 4"/></svg>';
  }
  if (/(grid|transport|cooling|emergency|power|outage|infrastructure)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 5 14h5l-1 8 8-12h-5l1-8Z"/></svg>';
  }
  if (/(jobs|incomes|insurance|affordability|debt|income|price)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-9Z"/><path d="M8 8.5V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5"/><path d="M4 12.5h16"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
}

function getPlanetImpactIconSvg(text) {
  const normalized = (text || '').toLowerCase();

  if (/(species|biodiversity|habitat|pollinator|forest|ecological diversity)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21c0-6.5 3.8-11.3 9-13-1.1 6-4.5 10.8-9 13Z"/><path d="M12 21C7.8 18.8 5 14.6 4 9c4.5.5 7.5 3.3 8 12Z"/></svg>';
  }
  if (/(ocean|marine|reef|salinity|food webs|deoxygenation|acidification)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14c1.4 0 1.9-.9 2.5-1.8.6.9 1.1 1.8 2.5 1.8s1.9-.9 2.5-1.8c.6.9 1.1 1.8 2.5 1.8s1.9-.9 2.5-1.8c.6.9 1.1 1.8 2.5 1.8"/><path d="M4 18c1.4 0 1.9-.9 2.5-1.8.6.9 1.1 1.8 2.5 1.8s1.9-.9 2.5-1.8c.6.9 1.1 1.8 2.5 1.8s1.9-.9 2.5-1.8c.6.9 1.1 1.8 2.5 1.8"/></svg>';
  }
  if (/(freshwater|river|aquifer|groundwater|basin|flood|drought|water timing|water quality)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c3.2 4.1 5.5 6.9 5.5 10A5.5 5.5 0 0 1 6.5 13c0-3.1 2.3-5.9 5.5-10Z"/></svg>';
  }
  if (/(ice|glacier|cryosphere|permafrost|albedo|snow)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2v20"/><path d="m7 5 10 14"/><path d="M17 5 7 19"/><path d="M4 12h16"/></svg>';
  }
  if (/(soil|land|erosion|topsoil|desert|terrestrial)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 18 6-7 4 4 4-6 4 9H3Z"/></svg>';
  }
  if (/(atmospheric|atmosphere|heat|warming|carbon|ozone|climate regulation)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v9"/><path d="M9 6.5a3 3 0 1 1 6 0v6.8a4.5 4.5 0 1 1-6 0Z"/></svg>';
  }
  if (/(nonlinear|resilience|collapse|threshold|circulation|instability)/.test(normalized)) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h5V2"/><path d="M17 17h-5v5"/><path d="M6 18a8 8 0 0 1 0-12"/><path d="M18 6a8 8 0 0 1 0 12"/></svg>';
  }

  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>';
}

function renderImpactConsequences(items, mode) {
  const iconFor = mode === 'planet' ? getPlanetImpactIconSvg : getHumanImpactIconSvg;
  return items
    .map(item => `
      <li>
        <span class="impact-consequence-icon" aria-hidden="true">${iconFor(item)}</span>
        <span>${escapeHtml(item)}</span>
      </li>
    `)
    .join('');
}

function renderHumanImpact(node) {
  if (!humanImpactSeverity || !humanImpactReach || !humanImpactSummary || !humanImpactDomains || !humanImpactConsequences) {
    return;
  }

  const profile = inferHumanImpactProfile(node);
  const sectionHeader = document.querySelector('.human-impact-section > .section-header');
  if (sectionHeader) sectionHeader.textContent = node?.node_kind === 'response' ? 'Benefits for Humans' : 'Impact on Humans';
  humanImpactSeverity.textContent = profile.severity.label.toUpperCase();
  humanImpactSeverity.className = `human-impact-severity ${profile.severity.className}`;
  humanImpactReach.textContent = `${profile.reach.toUpperCase()} | ${profile.mode.toUpperCase()}`;
  humanImpactReach.title = profile.timeHorizon || profile.basis
    ? `Time horizon: ${profile.timeHorizon || 'unspecified'} | Basis: ${profile.basis || 'unspecified'}`
    : 'Human impact profile metadata';
  humanImpactSummary.textContent = profile.summary;
  humanImpactDomains.hidden = profile.domains.length === 0;
  humanImpactDomains.innerHTML = profile.domains.length > 0
    ? `<strong class="impact-affects-label">AFFECTS:</strong> ${profile.domains
      .map((domain, index) => `${index > 0 ? ', ' : ''}<span class="human-impact-domain">${escapeHtml(domain)}</span>`)
      .join('')}`
    : '';
  humanImpactConsequences.innerHTML = renderImpactConsequences(profile.consequences, 'human');

  const economicContext = node?.economicContext || null;
  const hasHumanEconomic = Boolean(economicContext?.hiddenCost || economicContext?.whoPays);
  if (humanImpactEconomic) {
    humanImpactEconomic.hidden = !hasHumanEconomic;
  }
  if (humanImpactHiddenCostItem && humanImpactHiddenCost) {
    humanImpactHiddenCostItem.hidden = !economicContext?.hiddenCost;
    humanImpactHiddenCost.textContent = economicContext?.hiddenCost || '';
  }
  if (humanImpactWhoPaysItem && humanImpactWhoPays) {
    humanImpactWhoPaysItem.hidden = !economicContext?.whoPays;
    humanImpactWhoPays.textContent = economicContext?.whoPays || '';
  }
}

function renderPlanetImpact(node) {
  if (!planetImpactSeverity || !planetImpactReach || !planetImpactSummary || !planetImpactDomains || !planetImpactConsequences) {
    return;
  }

  const profile = inferPlanetImpactProfile(node);
  const sectionHeader = document.querySelector('.planet-impact-section > .section-header');
  if (sectionHeader) sectionHeader.textContent = node?.node_kind === 'response' ? 'Benefits for the Planet' : 'Impact on the Planet';
  planetImpactSeverity.textContent = profile.severity.label.toUpperCase();
  planetImpactSeverity.className = `planet-impact-severity ${profile.severity.className}`;
  planetImpactReach.textContent = `${profile.reach.toUpperCase()} | ${profile.mode.toUpperCase()}`;
  planetImpactReach.title = profile.timeHorizon || profile.basis
    ? `Time horizon: ${profile.timeHorizon || 'unspecified'} | Basis: ${profile.basis || 'unspecified'}`
    : 'Planet impact profile metadata';
  planetImpactSummary.textContent = profile.summary;
  planetImpactDomains.hidden = profile.domains.length === 0;
  planetImpactDomains.innerHTML = profile.domains.length > 0
    ? `<strong class="impact-affects-label">AFFECTS:</strong> ${profile.domains
      .map((domain, index) => `${index > 0 ? ', ' : ''}<span class="planet-impact-domain">${escapeHtml(domain)}</span>`)
      .join('')}`
    : '';
  planetImpactConsequences.innerHTML = renderImpactConsequences(profile.consequences, 'planet');

  const economicContext = node?.economicContext || null;
  const hasPlanetEconomic = Boolean(economicContext?.physicalLimit);
  if (planetImpactEconomic) {
    planetImpactEconomic.hidden = !hasPlanetEconomic;
  }
  if (planetImpactPhysicalLimitItem && planetImpactPhysicalLimit) {
    planetImpactPhysicalLimitItem.hidden = !economicContext?.physicalLimit;
    planetImpactPhysicalLimit.textContent = economicContext?.physicalLimit || '';
  }
}

function renderWhatCanBeDone(node) {
  if (!responseDefaultDriver || !responseSystemLevers) {
    return;
  }

  const economicContext = node?.economicContext || null;
  responseDefaultDriver.textContent = economicContext?.defaultDriver || 'Structural response guidance has not been curated for this node yet.';
  const levers = economicContext?.systemLevers || [];
  responseSystemLevers.innerHTML = levers.length > 0
    ? levers.map(item => `<li>${escapeHtml(item)}</li>`).join('')
    : '<li>Curated system levers will appear here as nodes are converted.</li>';

}

function renderPhenomenonLens(node) {
  if (!phenomenonLensEyebrow || !phenomenonLensTitle || !phenomenonLensIntro || !phenomenonLensScale || !phenomenonLensSource || !phenomenonLensAxis || !phenomenonLensRows || !phenomenonLensTakeaway) {
    return;
  }

  const lens = getSelectionPhenomenonLens(node);
  const theme = getPhenomenonTheme(node);

  if (!lens) {
    return;
  }

  const unitLabel = lens.unitLabel || 'relative value';
  const metricUnitLabel = unitLabel
    .replace(' per year', '/yr')
    .replace(' per kg food', '/kg');
  const getUnitExplanation = unit => {
    if (/MtCO2e per year/i.test(unit)) {
      return 'Measured in Megatonnes of CO2-equivalent per year. Bigger numbers = A larger annual climate burden.';
    }
    if (/MtCH4e per year/i.test(unit)) {
      return 'Measured in megatonnes of methane-equivalent per year. Bigger numbers mean a larger annual methane burden from that source.';
    }
    if (/TWh per year/i.test(unit)) {
      return 'Measured in terawatt-hours per year. Bigger numbers mean more annual electricity demand at system scale.';
    }
    if (/share of/i.test(unit) || /relative/i.test(unit)) {
      return 'Shown as a comparative share so you can read which drivers are bigger within this phenomenon, rather than as an absolute physical total.';
    }
    return `Measured in ${unit}. Higher values indicate a larger contribution within this view.`;
  };

  phenomenonLensEyebrow.textContent = lens.eyebrow || 'Standalone phenomenon lens';
  phenomenonLensTitle.textContent = lens.title || 'Phenomenon lens';
  phenomenonLensIntro.textContent = lens.intro || 'A separate visualization surface for phenomenon-specific data.';
  phenomenonLensScale.innerHTML = `
    <span class="phenomenon-lens-scale-unit">${escapeHtml(unitLabel)}</span>
    <span class="phenomenon-lens-scale-note">${escapeHtml(getUnitExplanation(unitLabel))}</span>
  `;
  phenomenonLensSource.textContent = '';
  phenomenonLensSource.hidden = true;
  phenomenonLensTakeaway.textContent = lens.takeaway || '';
  phenomenonLensAxis.style.display = 'grid';

  const items = Array.isArray(lens.items) ? lens.items : [];
  const fallbackGroupKey = node?.primaryNode?.id || node?.nodes?.[0]?.id || 'primary';
  const groups = Array.isArray(lens.groups) && lens.groups.length > 0
    ? lens.groups
    : [{ key: fallbackGroupKey, items }];
  const chartItems = groups
    .filter(group => Array.isArray(group.items) && group.items.length > 0)
    .flatMap(group => group.items.map(item => ({
      ...item,
      groupTitle: group.title || ''
    })));
  const scaleItems = chartItems.filter(item => !item.excludeFromScale);
  const maxItemValue = Math.max(...scaleItems.map(item => item.value || 0), 1);
  const configuredAxisTicks = Array.isArray(lens.axisTicks) && lens.axisTicks.length > 0
    ? lens.axisTicks
    : [];
  const configuredTickMax = configuredAxisTicks.length ? Math.max(...configuredAxisTicks) : 0;
  const axisMax = Math.max(lens.axisMax || 0, configuredTickMax, maxItemValue, 1);
  const axisTicks = configuredAxisTicks.length > 0
    ? (configuredAxisTicks[configuredAxisTicks.length - 1] < axisMax
      ? [...configuredAxisTicks, axisMax]
      : configuredAxisTicks)
    : [0, axisMax * 0.25, axisMax * 0.5, axisMax * 0.75, axisMax];
  const formatPhenomenonValue = value => {
    if (!Number.isFinite(value)) return '0';
    if (Math.abs(value) >= 100) return Math.round(value).toLocaleString('en-US');
    if (Math.abs(value) >= 10) return value.toFixed(1);
    return value.toFixed(1).replace(/\.0$/, '');
  };

  phenomenonLensAxis.innerHTML = axisTicks
    .map((tick, index) => {
      const pct = axisTicks.length === 1 ? 0 : (index / (axisTicks.length - 1)) * 100;
      const edgeClass = index === 0 ? 'is-start' : index === axisTicks.length - 1 ? 'is-end' : 'is-mid';
      return `<span class="${edgeClass}" style="left:${pct}%">${escapeHtml(formatPhenomenonValue(tick))}</span>`;
    })
    .join('');

  const renderPhenomenonRow = (item, index) => {
    const widthPct = Math.max(4, Math.min(100, ((item.value || 0) / axisMax) * 100));
    const components = Array.isArray(item.components) ? item.components : [];
    const componentTotal = components.reduce((sum, component) => sum + (component.value || 0), 0);
    const normalizedComponents = componentTotal > 0
      ? components.map(component => ({
        ...component,
        width: ((component.value || 0) / componentTotal) * 100
      }))
      : [];

    const barGradient = `linear-gradient(90deg, ${theme.start} 0%, ${theme.end} 100%)`;

    return `
      <article class="phenomenon-row ${item.emphasis ? 'is-emphasis' : ''} ${item.speculative ? 'is-speculative' : ''}">
        <div class="phenomenon-row-head">
          ${item.speculative
            ? `
              <div class="phenomenon-row-speculative-line">
                <span class="phenomenon-row-speculative-label">${escapeHtml(item.label)}</span>
                <span class="phenomenon-row-speculative-separator">-</span>
                <span class="phenomenon-row-speculative-number">${escapeHtml(formatPhenomenonValue(item.value || 0))}</span>
                <span class="phenomenon-row-speculative-unit">${escapeHtml(metricUnitLabel)}</span>
                <span class="phenomenon-row-speculative-separator">-</span>
                <span class="phenomenon-row-speculative-tag">speculative</span>
              </div>
            `
            : `
              <div class="phenomenon-row-title-wrap">
                <h4 class="phenomenon-row-title">${escapeHtml(item.label)}</h4>
              </div>
              <div class="phenomenon-row-value">
                <span class="phenomenon-row-value-number">${escapeHtml(formatPhenomenonValue(item.value || 0))}</span>
                <span class="phenomenon-row-value-unit">${escapeHtml(metricUnitLabel)}</span>
              </div>
            `}
        </div>
        ${item.hideBar
          ? ''
          : `
            <div class="phenomenon-bar-shell">
              <div class="phenomenon-bar-track">
                <div class="phenomenon-bar-fill" style="--bar-target:${widthPct}%; --bar-gradient:${barGradient}; --bar-glow:${theme.glow}; --bar-delay:${index * 110}ms;" title="${escapeHtml(item.label)}: ${escapeHtml(formatPhenomenonValue(item.value || 0))}${item.note ? ` • ${escapeHtml(item.note)}` : ''}">
                  ${normalizedComponents.length > 0
                    ? normalizedComponents.map(component => `
                      <span class="phenomenon-bar-segment" style="width:${component.width}%; background:${component.color || 'var(--accent-color)'}" title="${escapeHtml(component.label || '')}: ${escapeHtml(formatPhenomenonValue(component.value || 0))}"></span>
                    `).join('')
                    : '<span class="phenomenon-bar-glow"></span>'}
                </div>
              </div>
            </div>
          `}
      </article>
    `;
  };

  phenomenonLensRows.innerHTML = `
    <section class="phenomenon-list-chart">
      ${chartItems.map((item, index) => renderPhenomenonRow(item, index)).join('')}
    </section>
  `;
}

function getPhenomenonNodes() {
  return PHENOMENON_SELECTOR_ITEMS
    .map(item => buildPhenomenonSelection(item))
    .filter(Boolean);
}

function getDefaultPhenomenonNode() {
  return currentPhenomenonNode
    || (currentSelectedNode ? getPhenomenonNodes().find(item => item.nodeIds.includes(currentSelectedNode.id)) : null)
    || getPhenomenonNodes()[0]
    || null;
}

function renderPhenomenonSelector() {
  if (!phenomenaSelector) return;

  phenomenaSelector.innerHTML = getPhenomenonNodes().map(node => {
    const isActive = currentPhenomenonNode?.key === node.key;
    return `
      <button class="phenomena-selector-btn ${isActive ? 'active' : ''}" data-phenomenon-node="${node.key}" type="button" title="${escapeHtml(node.label)}">
        <span class="phenomena-selector-name">${escapeHtml(node.label)}</span>
      </button>
    `;
  }).join('');

  phenomenaSelector.querySelectorAll('[data-phenomenon-node]').forEach(button => {
    button.addEventListener('click', () => {
      const node = getPhenomenonNodes().find(entry => entry.key === button.getAttribute('data-phenomenon-node'));
      if (node) {
        setActivePhenomenonNode(node);
      }
    });
  });
}

function setPhenomenonMode(mode) {
  currentPhenomenonMode = mode === 'actions' ? 'actions' : 'footprint';

  if (phenomenonModeFootprintBtn) {
    const isActive = currentPhenomenonMode === 'footprint';
    phenomenonModeFootprintBtn.classList.toggle('active', isActive);
    phenomenonModeFootprintBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
  if (phenomenonModeActionsBtn) {
    const isActive = currentPhenomenonMode === 'actions';
    phenomenonModeActionsBtn.classList.toggle('active', isActive);
    phenomenonModeActionsBtn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  }
  if (phenomenonLensPanel) {
    phenomenonLensPanel.classList.toggle('phenomenon-panel-active', currentPhenomenonMode === 'footprint');
  }
  if (phenomenonActionsPanel) {
    phenomenonActionsPanel.classList.toggle('phenomenon-panel-active', currentPhenomenonMode === 'actions');
  }
}

async function setActivePhenomenonNode(node) {
  await ensureActivityModules();
  if (!node || !getSelectionPhenomenonLens(node)) return;

  currentPhenomenonNode = node;

  if (phenomenaFocusSphere) {
    const primarySphere = node.primaryNode?.sphere;
    phenomenaFocusSphere.textContent = (SPHERE_LABELS[primarySphere] || primarySphere || 'Core').toUpperCase();
  }
  if (phenomenaFocusIcon) {
    phenomenaFocusIcon.innerHTML = node.icon || '';
  }
  if (phenomenaFocusNameText) {
    phenomenaFocusNameText.textContent = node.label;
  } else if (phenomenaFocusName) {
    phenomenaFocusName.textContent = node.label;
  }
  if (phenomenaFocusDescription) {
    phenomenaFocusDescription.textContent = node.description || getNodeMeaning(node.primaryNode) || 'Footprint-specific explanation surface.';
  }

  renderPhenomenonSelector();
  renderPhenomenonLens(node);
  setActiveActionNode(node);
  setPhenomenonMode(currentPhenomenonMode);
}

function buildPhenomenonSelection(item) {
  const nodes = item.nodeIds
    .map(id => NODES.find(node => node.id === id))
    .filter(Boolean);

  if (!nodes.length) return null;

  const primaryNode = nodes[0];
  return {
    key: item.key,
    label: item.label,
    icon: item.icon,
    lensKey: item.lensKey || null,
    nodeIds: item.nodeIds,
    nodes,
    primaryNode,
    description: item.description || (item.nodeIds.length > 1
      ? `Combined footprint view for ${item.label}.`
      : (primaryNode.description || 'Footprint-specific explanation surface.'))
  };
}

function getSelectionPhenomenonLens(selection) {
  if (!selection?.nodes?.length) return null;
  if (selection.lensKey) return getPhenomenonLensById(selection.lensKey);
  if (selection.nodes.length === 1) return getPhenomenonLens(selection.nodes[0]);

  const sourceLenses = selection.nodes
    .map(node => ({ node, lens: getPhenomenonLens(node) }))
    .filter(entry => entry.lens);

  if (!sourceLenses.length) return null;

  const axisMax = Math.max(...sourceLenses.map(entry => entry.lens.axisMax || 0), 1);
  const axisTicks = Array.from(new Set(sourceLenses.flatMap(entry => entry.lens.axisTicks || [])))
    .sort((a, b) => a - b);

  return {
    title: `${selection.label} Footprint`,
    eyebrow: 'Combined footprint lens',
    intro: `Combined footprint comparison for ${selection.label}.`,
    unitLabel: 'relative value',
    axisMax,
    axisTicks: axisTicks.length ? axisTicks : [0, 10, 20, 30],
    scaleNote: 'Combined footprint view across related systems.',
    takeaway: '',
    groups: sourceLenses.map(entry => ({
      key: entry.node.id,
      title: entry.node.name,
      meta: `${(entry.lens.items || []).length} items`,
      items: entry.lens.items || []
    }))
  };
}

function renderActionList(target, items) {
  if (!target) return;
  target.innerHTML = (Array.isArray(items) ? items : [])
    .map(item => `<li>${getActionListIcon(item, target.id)}<span>${escapeHtml(item)}</span></li>`)
    .join('');
}

function getActionListIcon(item, targetId) {
  const text = String(item || '').toLowerCase();
  const isImpact = String(targetId || '').includes('impact');
  const iconClass = isImpact ? 'actions-list-icon-impact' : '';
  const wrap = paths => `<span class="actions-list-icon ${iconClass}" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none">${paths}</svg></span>`;

  if (text.includes('transit') || text.includes('rail') || text.includes('train')) {
    return wrap('<path d="M4.2 3.6h7.6c.7 0 1.2.5 1.2 1.2v4.6c0 1.7-1.4 3-3 3H6c-1.6 0-3-1.3-3-3V4.8c0-.7.5-1.2 1.2-1.2Z"/><path d="M5.5 12.4 4.4 13.7M10.5 12.4l1.1 1.3M5.7 6.3h.01M10.3 6.3h.01"/><path d="M4 9.3h8"/>');
  }
  if (text.includes('walk') || text.includes('walking') || text.includes('cycling') || text.includes('bike')) {
    return wrap('<circle cx="5" cy="11.2" r="1.8"/><circle cx="11.2" cy="11.2" r="1.8"/><path d="M5 11.2 7.2 7.3h2.1l1.9 3.9M7.6 5.4h1.3M8.1 3.8a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z"/>');
  }
  if (text.includes('electric') || text.includes('electrify') || text.includes('ev') || text.includes('charging')) {
    return wrap('<path d="M8.9 2.4 5.5 7.7h2.2L7 13.4l3.5-5.3H8.2l.7-5.7Z"/><path d="M11.9 4.7h1v3.1"/>');
  }
  if (text.includes('solar') || text.includes('clean power') || text.includes('renewable')) {
    return wrap('<circle cx="8" cy="5.5" r="2.1"/><path d="M8 1.8v1.4M8 7.7v1.4M4.9 5.5H3.5M12.5 5.5h-1.4M5.8 3.3l-1-1M10.2 7.7l1 1M10.2 3.3l1-1M5.8 7.7l-1 1"/><path d="M3.2 12.4h9.6"/>');
  }
  if (text.includes('food') || text.includes('meal') || text.includes('beef') || text.includes('lamb') || text.includes('cheese') || text.includes('dairy') || text.includes('protein')) {
    return wrap('<path d="M4.9 2.8v3.9M6.2 2.8v3.9M7.5 2.8v3.9M6.2 6.7V13"/><path d="M10.8 4.3c0-1.1-.8-1.9-1.9-1.9v1.9c0 1 .8 1.9 1.9 1.9V13"/>');
  }
  if (text.includes('waste') || text.includes('landfill') || text.includes('leftover') || text.includes('compost')) {
    return wrap('<path d="M5.3 4.3h5.4M6.2 4.3v-1h3.6v1m-4.1 0-.4 6.8c0 .7.5 1.2 1.1 1.2h3.1c.6 0 1.1-.5 1.1-1.2l-.4-6.8"/><path d="M7.4 6.1v3.9M8.9 6.1v3.9"/>');
  }
  if (text.includes('building') || text.includes('home') || text.includes('retrofit') || text.includes('campus') || text.includes('site')) {
    return wrap('<path d="M3.4 12.8V3.8h4.9v9M8.6 6.4h3.7v6.4"/><path d="M5.2 5.2h1.2M5.2 7.2h1.2M5.2 9.2h1.2M10 8.2h1.1M10 10.2h1.1"/>');
  }
  if (text.includes('forest') || text.includes('land') || text.includes('tree') || text.includes('deforestation')) {
    return wrap('<path d="M8 12.8V9.3"/><path d="M8 9.3c0-2.1 1.8-3.8 3.9-3.8v.8c0 2.1-1.8 3.8-3.9 3.8Zm0 0c0-2-1.6-3.6-3.6-3.6v.8c0 2 1.6 3.6 3.6 3.6Z"/><path d="M4.4 12.8h7.2"/>');
  }
  if (text.includes('policy') || text.includes('standard') || text.includes('mandate') || text.includes('guideline') || text.includes('rule') || text.includes('reform') || text.includes('procurement')) {
    return wrap('<path d="M3 6.2 8 3.3l5 2.9v6.1H3V6.2Z"/><path d="M5.5 6.8v4.6M8 6.8v4.6M10.5 6.8v4.6M2.4 12.7h11.2"/>');
  }
  if (text.includes('community') || text.includes('school') || text.includes('hospital') || text.includes('workplace') || text.includes('institution')) {
    return wrap('<circle cx="5.2" cy="5.5" r="1.6"/><circle cx="10.8" cy="5.3" r="1.4"/><path d="M3.5 12c.4-1.6 1.5-2.5 3-2.5 1.4 0 2.5.8 3 2.5M9 11.8c.3-1.1 1.1-1.8 2.2-1.8 1 0 1.8.6 2.1 1.8"/>');
  }
  if (text.includes('measure') || text.includes('report') || text.includes('monitor') || text.includes('disclose') || text.includes('audit')) {
    return wrap('<path d="M3.7 3.5h6.1l2.5 2.5v6.5H3.7z"/><path d="M9.8 3.5v2.7h2.5M5.3 8h5.2M5.3 10.1h3.8"/>');
  }
  if (text.includes('money') || text.includes('investment') || text.includes('fee') || text.includes('pricing')) {
    return wrap('<circle cx="8" cy="8" r="4.1"/><path d="M8 5.2v5.6M6.5 6.2c.3-.5.9-.8 1.5-.8 1 0 1.8.5 1.8 1.3 0 .8-.7 1.1-1.8 1.4-1 .2-1.7.6-1.7 1.4 0 .8.7 1.4 1.8 1.4.7 0 1.4-.2 1.8-.7"/>');
  }
  if (text.includes('delivery') || text.includes('shipping') || text.includes('freight') || text.includes('truck') || text.includes('warehouse')) {
    return wrap('<path d="M2.8 6.4h5.7v4.1H2.8V6.4Zm5.7 1.1h2l1.4 1.6v1.4H8.5V7.5Z"/><path d="M10.1 8.4h1.3"/><circle cx="5" cy="11.2" r=".85"/><circle cx="10.9" cy="11.2" r=".85"/>');
  }
  if (text.includes('impact')) {
    return wrap('<path d="M8.8 2.3 5.1 8h2.5L7 13.7 10.9 8H8.3l.5-5.7Z"/>');
  }
  if (isImpact) {
    return wrap('<path d="M8.8 2.3 5.1 8h2.5L7 13.7 10.9 8H8.3l.5-5.7Z"/>');
  }
  return wrap('<circle cx="8" cy="4.7" r="2.1"/><path d="M4.6 12.7c.5-2 1.9-3.2 3.4-3.2s2.9 1.2 3.4 3.2"/>');
}

function withTrailingPeriod(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildImpactContext(profile) {
  const metrics = Array.isArray(profile?.metrics) ? profile.metrics.filter(Boolean) : [];
  const personalMetric = metrics[2] || metrics[0] || 'household-scale demand and routine-use patterns';
  const communityMetric = metrics[1] || metrics[0] || 'institution-level operating and procurement metrics';
  const policyMetric = metrics[0] || metrics[metrics.length - 1] || 'sector-wide baseline performance metrics';

  return {
    personal: [
      'The first personal impact is lower day-to-day demand in the behaviors that most directly drive this footprint.',
      withTrailingPeriod(`You see it first in ${personalMetric} as repeated individual choices start changing`)
    ],
    community: [
      'The first community impact is a shift in shared defaults across institutions, campuses, workplaces, and local service systems.',
      withTrailingPeriod(`You see it first in ${communityMetric} once procurement and operating routines begin moving together`)
    ],
    policy: [
      'The first policy impact is a change in the rules, funding, and standards that reset the baseline for everyone else.',
      withTrailingPeriod(`You see it first in ${policyMetric} once system-level incentives and requirements start shifting the sector`)
    ]
  };
}

function buildActionSystemLogic(profileKey, node) {
  const normalizedKey = String(profileKey || '').toLowerCase();
  const sphere = String(node?.primaryNode?.sphere || '').toLowerCase();

  if (['carbon_emission', 'electricity_generation', 'methane', 'personal_conveyance', 'road_freight_logistics', 'aviation_shipping'].includes(normalizedKey)) {
    return 'Ecological-economics lens: fossil-heavy systems look cheaper than they really are when climate and health damages sit outside the price tag. Green tax reform, subsidy removal, standards, and infrastructure investment help move those hidden costs back into the decision.';
  }

  if (['food', 'industry_farming', 'food_waste'].includes(normalizedKey)) {
    return 'Ecological-economics lens: agricultural support, procurement defaults, and waste rules help decide what becomes cheap, abundant, or disposable. Changing the food system means changing those incentives, not only asking individuals to care harder.';
  }

  if (['resource_depletion', 'mining', 'fast_fashion', 'single_use_plastic', 'cement_steel', 'housing_sprawl'].includes(normalizedKey)) {
    return 'Ecological-economics lens: growth can look efficient on paper while soils, water, forests, and minerals are being drawn down. The real test is whether extraction stays inside recharge limits and whether producers pay for disposal, damage, and restoration.';
  }

  if (['insurance_retreat', 'adaptation_capital_shortfall', 'critical_infrastructure_fragility', 'climate_migration'].includes(normalizedKey)) {
    return 'Ecological-economics lens: markets eventually price physical reality, but usually late and unevenly. Public finance, disclosure, and resilience policy decide whether risk is reduced early or dumped onto the most exposed households.';
  }

  if (sphere === 'economy') {
    return 'Ecological-economics lens: markets can reward throughput even while waste, toxicity, and ecological damage are pushed off the balance sheet. The real question is whether prices, rules, and accountability keep production inside physical limits.';
  }

  if (sphere === 'sociopolitical') {
    return 'Ecological-economics lens: institutions decide who absorbs climate risk, who gets protected, and which losses stay invisible until they become crises.';
  }

  return 'System logic: this footprint persists because prices, procurement, rules, and hidden costs shape defaults long before an individual makes a choice inside them.';
}

function renderPhenomenonActionBridge(profile) {
  if (!phenomenonActionBridgeKicker || !phenomenonActionBridgeTitle || !phenomenonActionBridgeNote) return;

  phenomenonActionBridgeKicker.textContent = '';
  phenomenonActionBridgeTitle.textContent = profile?.strongestAction || 'See the linked action pathways for this footprint.';
  phenomenonActionBridgeNote.textContent = 'Switch to Actions for personal, community, and policy levers.';
}

function setActiveActionNode(node) {
  if (!node) return;

  const profileKey = node.lensKey || node.primaryNode?.id || node.key;
  const profile = getActionProfileById(profileKey);
  if (!profile) return;

  renderPhenomenonActionBridge(profile);
  if (actionsFocusConfidence) {
    actionsFocusConfidence.textContent = profile.confidenceNote || '';
  }
  if (actionsFocusStrongest) {
    actionsFocusStrongest.innerHTML = `<span class="actions-strongest-label">IMMEDIATE ACTION:</span> <span class="actions-strongest-text">${escapeHtml(profile.strongestAction || 'Explore the clearest high-impact lever.')}</span>`;
  }
  renderActionList(actionsPersonalList, profile.personal);
  renderActionList(actionsCommunityList, profile.community);
  renderActionList(actionsPolicyList, profile.policy);
  const impact = buildImpactContext(profile);
  renderActionList(actionsImpactPersonalList, impact.personal);
  renderActionList(actionsImpactCommunityList, impact.community);
  renderActionList(actionsImpactPolicyList, impact.policy);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundToTenths(value) {
  return Math.round(value * 10) / 10;
}

function formatSignedTenths(value) {
  const rounded = roundToTenths(value);
  if (rounded > 0) return `+${rounded.toFixed(1)}`;
  if (rounded < 0) return `-${Math.abs(rounded).toFixed(1)}`;
  return '0.0';
}

function getPersonalFootprintQuestion(key) {
  return PERSONAL_FOOTPRINT_QUESTIONS.find(question => question.key === key) || null;
}

function getPersonalFootprintOption(questionKey, optionValue) {
  const question = getPersonalFootprintQuestion(questionKey);
  if (!question || !optionValue) return null;
  return question.options.find(option => option.value === optionValue) || null;
}

function getPersonalFootprintResolvedValue(questionKey) {
  return personalFootprintState[questionKey] || PERSONAL_FOOTPRINT_BASELINE_SELECTIONS[questionKey] || null;
}

function formatProxyMetric(label, value) {
  return `${label} ${value}`;
}

function getPersonalFootprintMetricTrend(currentValue, previousValue) {
  if (typeof currentValue !== 'number' || typeof previousValue !== 'number') return 'neutral';
  if (currentValue > previousValue) return 'up';
  if (currentValue < previousValue) return 'down';
  return 'neutral';
}

function renderPersonalFootprintMetricChip(label, value, trend, colorClass = '', shouldAnimate = false) {
  const direction = trend === 'up' ? 'up' : trend === 'down' ? 'down' : 'neutral';
  const arrow = direction === 'up' ? '&uarr;' : direction === 'down' ? '&darr;' : '';
  const trendMarkup = arrow
    ? `<span class="personal-footprint-metric-trend" aria-hidden="true">${arrow}</span>`
    : '';
  return `<span class="personal-footprint-metric-chip is-${direction} ${shouldAnimate ? 'is-updated' : ''}">${trendMarkup}<span class="${colorClass}">${escapeHtml(`${label} ${value}`)}</span></span>`;
}

function calculatePersonalFootprint(state = personalFootprintState) {
  const getResolvedValue = questionKey => state[questionKey] || PERSONAL_FOOTPRINT_BASELINE_SELECTIONS[questionKey] || null;
  const geographyOption = getPersonalFootprintOption('geography', getResolvedValue('geography'));
  const hvacOption = getPersonalFootprintOption('hvac', getResolvedValue('hvac'));
  const householdOption = getPersonalFootprintOption('household_size', getResolvedValue('household_size'));
  const homeTypeOption = getPersonalFootprintOption('home_type', getResolvedValue('home_type'));
  const homeEnergyOption = getPersonalFootprintOption('home_energy', getResolvedValue('home_energy'));
  
  const householdMultiplier = householdOption?.homeMultiplier || 1;
  const hvacMultiplier = hvacOption?.hvacMultiplier || 1;
  const homeTypeMultiplier = homeTypeOption?.homeDemandMultiplier || 1;
  const homeUseMultiplier = homeEnergyOption?.homeUseMultiplier || 1;
  const regionHomeBaseline = geographyOption?.homeBaselineCarbon || 3.0;
  const totalHomeCarbon = regionHomeBaseline * homeTypeMultiplier * homeUseMultiplier * householdMultiplier * hvacMultiplier;
  const homeResourceFactor = householdMultiplier * hvacMultiplier;
  const regionTransportMultiplier = geographyOption?.transportMultiplier || 1;
  const regionFlightsMultiplier = geographyOption?.flightsMultiplier || 1;
  
  let totals = { carbon: 0, nature: 0, water: 0, material: 0 };
  let answeredCount = 0;
  let unsureCount = 0;
  let missingCount = 0;
  
  const breakdown = PERSONAL_FOOTPRINT_QUESTIONS
    .filter(q => q.role !== 'contextual')
    .map(question => {
      const selectedValue = state[question.key] || PERSONAL_FOOTPRINT_BASELINE_SELECTIONS[question.key];
      const option = getPersonalFootprintOption(question.key, selectedValue);
      const isAnswered = Boolean(state[question.key]);
      
      let co2 = 0;
      let nature = 0;
      let water = 0;
      let material = 0;

      if (question.key === 'home_type') {
        co2 = totalHomeCarbon * 0.55;
        nature = (option?.nature || 0) * homeResourceFactor;
        water = (option?.water || 0) * homeResourceFactor;
        material = (option?.material || 0) * householdMultiplier;
      } else if (question.key === 'home_energy') {
        co2 = totalHomeCarbon * 0.45;
        nature = (option?.nature || 0) * homeResourceFactor * homeUseMultiplier;
        water = (option?.water || 0) * homeResourceFactor * homeUseMultiplier;
        material = (option?.material || 0) * householdMultiplier;
      } else {
        let factor = 1;
        if (question.key === 'everyday_travel') factor = regionTransportMultiplier;
        else if (question.key === 'flights') factor = regionFlightsMultiplier;

        co2 = (option?.co2 || 0) * factor;
        nature = (option?.nature || 0) * factor;
        water = (option?.water || 0) * factor;
        material = (option?.material || 0) * factor;
      }
      
      if (isAnswered) {
        if (option?.isUnsure) unsureCount++;
        else answeredCount++;
      } else {
        missingCount++;
      }
      
      totals.carbon += co2;
      totals.nature += nature;
      totals.water += water;
      totals.material += material;
      
      return {
        key: question.key,
        module: question.module,
        answered: isAnswered,
        title: PERSONAL_FOOTPRINT_LABELS[question.key] || question.title,
        optionLabel: option?.label || '',
        note: option?.note || '',
        co2, nature, water, material
      };
    });
    
  const answeredTotalCount = PERSONAL_FOOTPRINT_QUESTIONS
    .filter(question => Boolean(state[question.key]))
    .length;
  const anyAnswers = answeredTotalCount > 0;
  const rankReady = answeredTotalCount === PERSONAL_FOOTPRINT_QUESTIONS.length;
  
  let confidence = 'High';
  const totalDirectQuestions = 8;
  if (answeredTotalCount < 5 || missingCount > 4 || unsureCount > 4 || answeredCount < 2) {
    confidence = 'Low';
  } else if (!rankReady || missingCount > 0 || unsureCount > 1 || answeredCount < totalDirectQuestions) {
    confidence = 'Medium';
  }
  
  const carbonTotal = roundToTenths(totals.carbon);
  const landTotalM2 = Math.round(
    (totals.nature * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.landM2PerPoint) / 10
  ) * 10;
  const waterTotalM3 = Math.round(
    (totals.water * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.waterM3PerPoint) / 10
  ) * 10;
  const materialTotalTonnes = roundToTenths(
    totals.material * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.materialTonnesPerPoint
  );
  const moduleSummaries = PERSONAL_FOOTPRINT_MODULES.map(module => {
    const items = breakdown.filter(item => item.module === module.key);
    const carbon = items.reduce((sum, item) => sum + (item.co2 || 0), 0);
    const nature = items.reduce((sum, item) => sum + (item.nature || 0), 0);
    const water = items.reduce((sum, item) => sum + (item.water || 0), 0);
    const material = items.reduce((sum, item) => sum + (item.material || 0), 0);
    const answeredItems = items.filter(item => item.answered).length;

    return {
      ...module,
      carbon: roundToTenths(carbon),
      landM2: Math.round(
        (nature * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.landM2PerPoint) / 10
      ) * 10,
      waterM3: Math.round(
        (water * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.waterM3PerPoint) / 10
      ) * 10,
      materialTonnes: roundToTenths(
        material * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.materialTonnesPerPoint
      ),
      carbonShare: totals.carbon > 0 ? Math.round((carbon / totals.carbon) * 100) : 0,
      natureShare: totals.nature > 0
        ? Math.round((items.reduce((sum, item) => sum + (item.nature || 0), 0) / totals.nature) * 100)
        : 0,
      waterShare: totals.water > 0
        ? Math.round((items.reduce((sum, item) => sum + (item.water || 0), 0) / totals.water) * 100)
        : 0,
      materialShare: totals.material > 0
        ? Math.round((items.reduce((sum, item) => sum + (item.material || 0), 0) / totals.material) * 100)
        : 0,
      answeredItems,
      totalItems: items.length
    };
  });
  
  return {
    anyAnswers,
    answeredCount: answeredCount + unsureCount,
    answeredTotalCount,
    totalQuestionCount: PERSONAL_FOOTPRINT_QUESTIONS.length,
    rankReady,
    carbonTotal,
    landTotalM2,
    waterTotalM3,
    materialTotalTonnes,
    confidence,
    regionLabel: geographyOption?.label || 'Average Grid',
    householdLabel: householdOption?.label || '2 people',
    breakdown,
    moduleSummaries
  };
}

function getPersonalFootprintOptionScore(question, option) {
  if (question.key === 'geography') {
    return ((((option.homeBaselineCarbon || 3) / 6) * 100) + ((option.transportMultiplier || 1) * 100) + ((option.flightsMultiplier || 1) * 100)) / 3;
  }
  if (question.key === 'hvac') {
    return (option.hvacMultiplier || 1) * 100;
  }
  if (question.key === 'household_size') {
    return (option.homeMultiplier || 1) * 100;
  }
  if (question.key === 'home_type') {
    return (option.homeDemandMultiplier || 1) * 100;
  }
  if (question.key === 'home_energy') {
    return (option.homeUseMultiplier || 1) * 100;
  }
  return ((option.co2 || 0) * 8) + ((option.nature || 0) * 1.4) + ((option.water || 0) * 1.4) + ((option.material || 0) * 1.4);
}

const PERSONAL_FOOTPRINT_VISUAL_COLORS = [
  '#60a5fa', '#22d3ee', '#4ade80', '#c4b5fd',
  '#fbbf24', '#fb7185', '#a3e635', '#f97316'
];

const PERSONAL_FOOTPRINT_BREAKDOWN_METRICS = Object.freeze({
  carbon: {
    label: 'Carbon',
    className: 'is-carbon',
    value: item => item.co2 || 0,
    format: value => `${value.toFixed(1)} tCO2e/yr`
  },
  water: {
    label: 'Water',
    className: 'is-water',
    value: item => (item.water || 0) * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.waterM3PerPoint,
    format: value => `${Math.round(value).toLocaleString('en-US')} m³/yr`
  },
  land: {
    label: 'Land',
    className: 'is-nature',
    value: item => (item.nature || 0) * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.landM2PerPoint,
    format: value => `${Math.round(value).toLocaleString('en-US')} m²·yr`
  },
  materials: {
    label: 'Materials',
    className: 'is-material',
    value: item => (item.material || 0) * PERSONAL_FOOTPRINT_PHYSICAL_FACTORS.materialTonnesPerPoint,
    format: value => `${value.toFixed(1)} t RME/yr`
  }
});

function renderPersonalFootprintStory(result) {
  if (!result?.anyAnswers) {
    return '';
  }

  const equivalencies = getFootprintEquivalencies(result);
  const breakdownMetric = PERSONAL_FOOTPRINT_BREAKDOWN_METRICS.carbon;
  const breakdownItems = result.breakdown
    .map(item => ({ ...item, physicalValue: breakdownMetric.value(item) }))
    .filter(item => item.physicalValue > 0)
    .sort((a, b) => b.physicalValue - a.physicalValue);
  const breakdownTotal = breakdownItems.reduce((sum, item) => sum + item.physicalValue, 0) || 1;
  let breakdownCumulative = 0;
  const waterfallItems = breakdownItems.map((item, index) => {
    const start = breakdownCumulative;
    breakdownCumulative += item.physicalValue;
    return {
      ...item,
      startPercent: (start / breakdownTotal) * 100,
      widthPercent: (item.physicalValue / breakdownTotal) * 100,
      color: PERSONAL_FOOTPRINT_VISUAL_COLORS[index % PERSONAL_FOOTPRINT_VISUAL_COLORS.length]
    };
  });

  const references = [
    {
      label: 'Carbon emissions',
      value: result.carbonTotal,
      reference: PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.carbonTonnes,
      valueText: `${result.carbonTotal.toFixed(1)} tCO2e/yr`,
      referenceText: `${PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.carbonTonnes.toFixed(1)} tCO2e/yr`,
      className: 'is-carbon'
    },
    {
      label: 'Water footprint',
      value: result.waterTotalM3,
      reference: PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.waterM3,
      valueText: `${result.waterTotalM3.toLocaleString('en-US')} m³/yr`,
      referenceText: `${PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.waterM3.toLocaleString('en-US')} m³/yr`,
      className: 'is-water'
    },
    {
      label: 'Land footprint',
      value: result.landTotalM2,
      reference: PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.landM2,
      valueText: `${result.landTotalM2.toLocaleString('en-US')} m²·yr`,
      referenceText: `${PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.landM2.toLocaleString('en-US')} m²·yr`,
      className: 'is-nature'
    },
    {
      label: 'Material footprint',
      value: result.materialTotalTonnes,
      reference: PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.materialTonnes,
      valueText: `${result.materialTotalTonnes.toFixed(1)} t RME/yr`,
      referenceText: `${PERSONAL_FOOTPRINT_ANNUAL_REFERENCES.materialTonnes.toFixed(1)} t RME/yr`,
      className: 'is-material'
    }
  ].map(item => ({
    ...item,
    referencePercent: Math.round((item.value / Math.max(item.reference, 0.01)) * 100)
  }));

  return `
    <section class="footprint-story-section footprint-equivalency-section" aria-labelledby="footprint-equivalency-title">
      <div class="footprint-story-heading-row is-compact">
        <div>
          <h3 id="footprint-equivalency-title">Your footprint in human terms</h3>
        </div>
      </div>
      <div class="footprint-equivalency-grid">
        ${equivalencies.map(item => `
          <article class="footprint-equivalency-card ${item.className}">
            <span class="footprint-equivalency-label">${escapeHtml(item.label)}</span>
            <div class="footprint-equivalency-value">
              <strong>${escapeHtml(item.headline)}</strong>
              <span>${escapeHtml(item.descriptor)}</span>
            </div>
            <small class="footprint-equivalency-evidence">${escapeHtml(item.evidence)}</small>
          </article>
        `).join('')}
      </div>
    </section>

    <section class="footprint-story-section" aria-labelledby="footprint-waterfall-title">
      <div class="footprint-story-heading-row">
        <div>
          <h3 id="footprint-waterfall-title">What builds your carbon footprint</h3>
        </div>
        <strong class="footprint-story-physical-total">${breakdownMetric.format(breakdownTotal)}</strong>
      </div>
      <div class="footprint-waterfall ${breakdownMetric.className}" role="img" aria-label="Carbon footprint contributions totaling ${breakdownMetric.format(breakdownTotal)}">
        ${waterfallItems.map((item, index) => `
          <div class="footprint-waterfall-row ${item.answered ? '' : 'is-assumed'}">
            <div class="footprint-waterfall-label">
              <span>${escapeHtml(item.title)}</span>
              <strong>${breakdownMetric.format(item.physicalValue)}</strong>
            </div>
            <div class="footprint-waterfall-track">
              <span
                class="footprint-waterfall-segment"
                style="--waterfall-start:${item.startPercent}%; --waterfall-width:${Math.max(item.widthPercent, 1)}%; --waterfall-color:${item.color}; --waterfall-delay:${index * 55}ms"
              ></span>
            </div>
          </div>
        `).join('')}
        <div class="footprint-waterfall-row is-total">
          <div class="footprint-waterfall-label">
            <span>Total carbon footprint</span>
            <strong>${breakdownMetric.format(breakdownTotal)}</strong>
          </div>
          <div class="footprint-waterfall-track">
            <span class="footprint-waterfall-total" style="--waterfall-total:100%"></span>
          </div>
        </div>
      </div>
    </section>

    <section class="footprint-story-section" aria-labelledby="footprint-physical-title">
      <div class="footprint-story-heading-row is-compact">
        <div>
          <h3 id="footprint-physical-title">Annual footprint by section</h3>
        </div>
      </div>
      <div class="footprint-physical-table-wrap">
        <div class="footprint-physical-table">
          <div class="footprint-physical-row is-header">
            <span>Section</span>
            <span>Carbon</span>
            <span>Water</span>
            <span>Land</span>
            <span>Materials</span>
          </div>
          ${result.moduleSummaries.map(module => `
            <div class="footprint-physical-row ${module.answeredItems < module.totalItems ? 'is-estimated' : ''}">
              <strong>${escapeHtml(module.label)}</strong>
              <span>${module.carbon.toFixed(1)} t</span>
              <span>${module.waterM3.toLocaleString('en-US')} m³</span>
              <span>${module.landM2.toLocaleString('en-US')} m²·yr</span>
              <span>${module.materialTonnes.toFixed(1)} t</span>
            </div>
          `).join('')}
          <div class="footprint-physical-row is-total">
            <strong>Total</strong>
            <span>${result.carbonTotal.toFixed(1)} tCO2e</span>
            <span>${result.waterTotalM3.toLocaleString('en-US')} m³</span>
            <span>${result.landTotalM2.toLocaleString('en-US')} m²·yr</span>
            <span>${result.materialTotalTonnes.toFixed(1)} t RME</span>
          </div>
        </div>
      </div>
      <p class="footprint-physical-note">Faded rows still include reference choices for unanswered questions.</p>
    </section>

    <section class="footprint-story-section" aria-labelledby="footprint-reference-title">
      <div class="footprint-story-heading-row is-compact">
        <div>
          <h3 id="footprint-reference-title">Against annual reference</h3>
        </div>
      </div>
      <div class="footprint-reference-grid">
        ${references.map(item => `
          <div class="footprint-reference-row ${item.className}">
            <div class="footprint-reference-label">
              <span>${item.label}</span>
              <strong>${item.valueText}</strong>
            </div>
            <div class="footprint-reference-track">
              <span style="--reference-fill:${Math.min(item.referencePercent, 100)}%"></span>
            </div>
            <small>${item.referencePercent}% of reference · Reference ${item.referenceText}</small>
          </div>
        `).join('')}
      </div>
      <p class="footprint-method-note">
        Land, water, and material figures are benchmark-calibrated estimates, not metered consumption.
        Land anchor: 1,900 m²/person/yr (JRC global-average cropland footprint).
        Water anchor: 1,385 m³/person/yr (Water Footprint Network global consumer average).
        Material anchor: about 12.3 t/person/yr (98.0 billion tonnes globally under UN SDG 12.2.1, 2022).
      </p>
      <details class="footprint-methodology-disclosure">
        <summary>How the percentile and comparisons are calculated</summary>
        <div class="footprint-methodology-content">
          <p>
            The carbon rank uses published 2019 World Inequality Lab thresholds at the 20th, 50th,
            90th, 99th, 99.9th, and 99.99th percentiles. TULIP interpolates between those cut points
            on a logarithmic emissions scale. Below 1.8 tCO2e, the source only supports the bounded
            label “below the 20th percentile.”
          </p>
          <p>
            Boundary caveat: the WID distribution allocates consumption, public, and investment
            emissions to individuals, while this short questionnaire estimates lifestyle-linked
            demand. Treat the result as context, not a measured inventory. Water, land, and material
            population percentiles remain disabled until compatible global distributions exist.
          </p>
          <p>
            Comparisons use EPA gasoline-vehicle emissions, 65.1 litres per average shower,
            436.64 m² per NBA-size basketball court, and a deliberately round 2-tonne car mass
            benchmark. They communicate scale; the scientific units and annual-reference section
            carry the measurement context.
          </p>
          <div class="footprint-methodology-links">
            <a href="https://wid.world/wp-content/uploads/2021/10/Chancel2022-20Feb22-14h25.pdf" target="_blank" rel="noopener noreferrer">WID carbon distribution</a>
            <a href="https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references" target="_blank" rel="noopener noreferrer">EPA vehicle equivalency</a>
            <a href="https://www.epa.gov/watersense/showerheads" target="_blank" rel="noopener noreferrer">EPA shower benchmark</a>
            <a href="/personal-footprint-claim-registry.json" target="_blank" rel="noopener noreferrer">Claim registry v${escapeHtml(PERSONAL_FOOTPRINT_CONTEXT_VERSION)}</a>
          </div>
        </div>
      </details>
    </section>
  `;
}

function renderPersonalFootprintQuestionDetail(question, currentOption, contribution) {
  if (!currentOption) {
    return '';
  }

  let impactMarkup = '';
  const selectedValue = personalFootprintState[question.key];
  const baselineValue = PERSONAL_FOOTPRINT_BASELINE_SELECTIONS[question.key];

  if (selectedValue && baselineValue) {
    const selectedResult = calculatePersonalFootprint({
      ...personalFootprintState,
      [question.key]: selectedValue
    });
    const baselineResult = calculatePersonalFootprint({
      ...personalFootprintState,
      [question.key]: baselineValue
    });

    const signedValue = (value, digits = 0) => {
      const rounded = digits === 0 ? Math.round(value) : roundToTenths(value);
      return `${rounded > 0 ? '+' : ''}${rounded.toFixed(digits)}`;
    };
    const deltas = [
      {
        label: 'carbon',
        value: selectedResult.carbonTotal - baselineResult.carbonTotal,
        threshold: 0.05,
        text: value => `${signedValue(value, 1)} tCO2e/yr`
      },
      {
        label: 'water',
        value: selectedResult.waterTotalM3 - baselineResult.waterTotalM3,
        threshold: 5,
        text: value => `${signedValue(value)} m³/yr`
      },
      {
        label: 'land',
        value: selectedResult.landTotalM2 - baselineResult.landTotalM2,
        threshold: 5,
        text: value => `${signedValue(value)} m²·yr`
      },
      {
        label: 'materials',
        value: selectedResult.materialTotalTonnes - baselineResult.materialTotalTonnes,
        threshold: 0.05,
        text: value => `${signedValue(value, 1)} t RME/yr`
      }
    ].filter(item => Math.abs(item.value) >= item.threshold);

    const impactCopy = deltas.length > 0
      ? `Compared with the reference choice: ${deltas.map(item => `${item.label} ${item.text(item.value)}`).join(' · ')}.`
      : 'This choice matches the reference estimate for the four annual metrics.';
    impactMarkup = `<p class="personal-footprint-question-impact is-neutral">${escapeHtml(impactCopy)}</p>`;
  }

  return `
    <div class="personal-footprint-question-detail">
      <p class="personal-footprint-question-note">
        <strong>${escapeHtml(currentOption.label)}:</strong> ${escapeHtml(currentOption.note || '')}.
      </p>
      ${impactMarkup}
    </div>
  `;
}

function renderPersonalFootprintModuleHeader(moduleSummary) {
  if (!moduleSummary) return '';

  const hasAnswers = moduleSummary.answeredItems > 0;
  const estimateLabel = moduleSummary.answeredItems < moduleSummary.totalItems
    ? 'Current estimate'
    : 'Estimated annual impact';
  const metrics = [
    {
      label: 'Carbon emissions',
      value: hasAnswers ? `${moduleSummary.carbon.toFixed(1)} tCO2e/yr` : '--',
      note: hasAnswers ? `${moduleSummary.carbonShare}% of total` : 'Awaiting answers',
      className: 'is-carbon'
    },
    {
      label: 'Water footprint',
      value: hasAnswers ? `${moduleSummary.waterM3.toLocaleString('en-US')} m³/yr` : '--',
      note: hasAnswers ? `${moduleSummary.waterShare}% of total` : 'Awaiting answers',
      className: 'is-water'
    },
    {
      label: 'Land footprint',
      value: hasAnswers ? `${moduleSummary.landM2.toLocaleString('en-US')} m²·yr` : '--',
      note: hasAnswers ? `${moduleSummary.natureShare}% of total` : 'Awaiting answers',
      className: 'is-nature'
    },
    {
      label: 'Material footprint',
      value: hasAnswers ? `${moduleSummary.materialTonnes.toFixed(1)} t RME/yr` : '--',
      note: hasAnswers ? `${moduleSummary.materialShare}% of total` : 'Awaiting answers',
      className: 'is-material'
    }
  ];

  return `
    <div class="personal-footprint-module-header">
      <div class="personal-footprint-module-title-row">
        <div>
          <span class="personal-footprint-module-kicker">Impact section</span>
          <h3>${escapeHtml(moduleSummary.label)}</h3>
        </div>
        <span class="personal-footprint-module-estimate-label">${estimateLabel}</span>
      </div>
      <div class="personal-footprint-module-metrics ${hasAnswers ? '' : 'is-empty'}">
        ${metrics.map(metric => `
          <div class="personal-footprint-module-metric ${metric.className}">
            <span>${metric.label}</span>
            <strong>${escapeHtml(metric.value)}</strong>
            <small>${escapeHtml(metric.note)}</small>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPersonalFootprint() {
  const result = calculatePersonalFootprint();
  const globalCarbonRank = result.rankReady
    ? estimateGlobalCarbonPercentile(result.carbonTotal)
    : null;
  const breakdownByKey = new Map(result.breakdown.map(item => [item.key, item]));
  const moduleSummariesByKey = new Map(result.moduleSummaries.map(item => [item.key, item]));

  if (personalFootprintFocusNameText) {
    personalFootprintFocusNameText.textContent = 'Your Annual Footprint';
  }

  if (personalFootprintGlobalRank) {
    if (!result.rankReady || !globalCarbonRank) {
      personalFootprintGlobalRank.className = 'personal-footprint-global-rank is-empty';
      personalFootprintGlobalRank.innerHTML = `
        <span class="personal-footprint-global-rank-label">Global carbon rank</span>
        <strong>${result.answeredTotalCount} of ${result.totalQuestionCount} questions answered</strong>
      `;
    } else {
      personalFootprintGlobalRank.className = 'personal-footprint-global-rank';
      personalFootprintGlobalRank.innerHTML = `
        <strong>${escapeHtml(globalCarbonRank.populationLabel)}</strong>
        <small>has a lower estimated annual carbon footprint · 2019 WID reference</small>
      `;
    }
  }
  
  if (personalFootprintFocusDescription) {
    personalFootprintFocusDescription.textContent =
      'Carbon, water, land, and materials are calculated independently.';
  }

  if (personalFootprintSummaryTitle) {
    personalFootprintSummaryTitle.textContent = '';
    personalFootprintSummaryTitle.hidden = true;
  }
  if (personalFootprintSummaryNote) {
    personalFootprintSummaryNote.textContent = '';
    personalFootprintSummaryNote.hidden = true;
  }
  
  if (personalFootprintMetricStrip) {
    const currentMetrics = result.anyAnswers
      ? {
          carbonTotal: result.carbonTotal,
          landTotalM2: result.landTotalM2,
          waterTotalM3: result.waterTotalM3,
          materialTotalTonnes: result.materialTotalTonnes,
        }
      : null;
    const previousMetrics = personalFootprintPreviousMetrics;
    const shouldAnimateMetrics = Boolean(currentMetrics);

    personalFootprintMetricStrip.innerHTML = [
      {
        label: 'Carbon Emissions',
        value: !result.anyAnswers ? '--' : `${result.carbonTotal.toFixed(1)} tCO2e/yr`,
        trend: currentMetrics && previousMetrics
          ? getPersonalFootprintMetricTrend(currentMetrics.carbonTotal, previousMetrics.carbonTotal)
          : 'neutral',
        colorClass: 'metric-carbon'
      },
      {
        label: 'Water Footprint',
        value: !result.anyAnswers ? '--' : `${result.waterTotalM3.toLocaleString('en-US')} m³/yr`,
        trend: currentMetrics && previousMetrics
          ? getPersonalFootprintMetricTrend(currentMetrics.waterTotalM3, previousMetrics.waterTotalM3)
          : 'neutral',
        colorClass: 'metric-water'
      },
      {
        label: 'Land Footprint',
        value: !result.anyAnswers ? '--' : `${result.landTotalM2.toLocaleString('en-US')} m²·yr`,
        trend: currentMetrics && previousMetrics
          ? getPersonalFootprintMetricTrend(currentMetrics.landTotalM2, previousMetrics.landTotalM2)
          : 'neutral',
        colorClass: 'metric-nature'
      },
      {
        label: 'Material Footprint',
        value: !result.anyAnswers ? '--' : `${result.materialTotalTonnes.toFixed(1)} t RME/yr`,
        trend: currentMetrics && previousMetrics
          ? getPersonalFootprintMetricTrend(currentMetrics.materialTotalTonnes, previousMetrics.materialTotalTonnes)
          : 'neutral',
        colorClass: 'metric-materials'
      }
    ].map(item => renderPersonalFootprintMetricChip(
      item.label,
      item.value,
      item.trend,
      item.colorClass,
      shouldAnimateMetrics
    )).join('');

    personalFootprintPreviousMetrics = currentMetrics;
  }

  if (personalFootprintQuestions) {
    personalFootprintQuestions.innerHTML = PERSONAL_FOOTPRINT_QUESTIONS.map((question, index) => {
      const currentOption = getPersonalFootprintOption(question.key, personalFootprintState[question.key]);
      const maxScore = Math.max(...question.options.map(option => getPersonalFootprintOptionScore(question, option)), 1);
      const contribution = breakdownByKey.get(question.key);
      const isModuleStart = Boolean(
        question.module &&
        PERSONAL_FOOTPRINT_QUESTIONS.findIndex(item => item.module === question.module) === index
      );

      return `
        ${isModuleStart ? renderPersonalFootprintModuleHeader(moduleSummariesByKey.get(question.module)) : ''}
        <section class="personal-footprint-question-card">
          <div class="personal-footprint-question-meta">
            <h3 class="personal-footprint-question-title">
              <span class="personal-footprint-question-count">${index + 1} -</span>
              ${escapeHtml(question.title)}
            </h3>
          </div>
          <div class="personal-footprint-question-options" role="group" aria-label="${escapeHtml(question.title)}">
            ${question.options.map(option => {
              const isActive = personalFootprintState[question.key] === option.value;
              const score = getPersonalFootprintOptionScore(question, option);
              const intensity = clamp((score / maxScore) * 100, 14, 100);

              return `
                ${question.key === 'geography' && option.value === 'fossil_transit' ? '<span class="personal-footprint-option-row-break" aria-hidden="true"></span>' : ''}
                <button class="personal-footprint-pill ${isActive ? 'active' : ''}" type="button" data-personal-footprint-question="${question.key}" data-personal-footprint-option="${option.value}" style="--pill-intensity:${intensity}%;">
                  ${escapeHtml(option.label)}
                </button>
              `;
            }).join('')}
          </div>
          ${renderPersonalFootprintQuestionDetail(question, currentOption, contribution)}
        </section>
      `;
    }).join('');

    personalFootprintQuestions.querySelectorAll('[data-personal-footprint-option]').forEach(button => {
      button.addEventListener('click', () => {
        const questionKey = button.getAttribute('data-personal-footprint-question');
        const optionValue = button.getAttribute('data-personal-footprint-option');
        if (!questionKey || !optionValue) return;
        personalFootprintLastInteraction = { questionKey, optionValue };
        personalFootprintState[questionKey] = optionValue;
        if (!personalFootprintStartedTracked) {
          personalFootprintStartedTracked = true;
          trackEvent('footprint_started');
        }
        if (!personalFootprintCompletedTracked && calculatePersonalFootprint().rankReady) {
          personalFootprintCompletedTracked = true;
          trackEvent('footprint_completed');
        }
        renderPersonalFootprint();
      });
    });

    if (personalFootprintLastInteraction) {
      const { questionKey, optionValue } = personalFootprintLastInteraction;
      const confirmedButton = personalFootprintQuestions.querySelector(
        `[data-personal-footprint-question="${CSS.escape(questionKey)}"][data-personal-footprint-option="${CSS.escape(optionValue)}"]`
      );
      restartMotionClass(confirmedButton, 'is-confirmed', 620);
      personalFootprintLastInteraction = null;
    }
  }

  if (personalFootprintBreakdown) {
    personalFootprintBreakdown.innerHTML = renderPersonalFootprintStory(result);
  }
}


// --- STEP JUMPING & NAVIGATION TREE WRITER ---
function jumpToHistoryStep(index) {
  if (index >= 0 && index < selectionHistory.length) {
    const pathNodes = [...selectionHistory, currentSelectedNode].filter(Boolean).slice(0, index + 1);
    if (studyHistoryPopover) studyHistoryPopover.hidden = true;
    if (studyJourneyToggle) studyJourneyToggle.setAttribute('aria-expanded', 'false');
    targetAndSelectNode(pathNodes.at(-1), { pathNodes, historyMode: 'push' });
  }
}

function updateHistoryTree(node) {
  if (!focusHistoryTree) return;

  if (!node) {
    focusHistoryTree.innerHTML = '';
    focusHistoryTree.style.display = 'none';
    if (studyHistoryPopover) studyHistoryPopover.hidden = true;
    if (studyJourneyToggle) {
      studyJourneyToggle.setAttribute('aria-expanded', 'false');
      studyJourneyToggle.disabled = true;
    }
    if (studyJourneyCurrent) studyJourneyCurrent.textContent = 'Current node';
    return;
  }

  focusHistoryTree.style.display = 'flex';
  focusHistoryTree.innerHTML = '';

  const historyNodes = [...selectionHistory, node];
  if (studyJourneyToggle) studyJourneyToggle.disabled = false;
  if (studyJourneyCurrent) studyJourneyCurrent.textContent = node.name;

  historyNodes.forEach((historyNode, idx) => {
    const isActive = idx === historyNodes.length - 1;
    const stepEl = document.createElement('button');
    stepEl.type = 'button';
    stepEl.className = isActive ? 'history-step active' : 'history-step';
    stepEl.disabled = isActive;
    stepEl.setAttribute('aria-current', isActive ? 'step' : 'false');

    const indexEl = document.createElement('span');
    indexEl.className = 'history-step-index';
    indexEl.textContent = String(idx + 1).padStart(2, '0');

    const nameEl = document.createElement('span');
    nameEl.className = 'history-step-name';
    nameEl.textContent = historyNode.name;

    stepEl.append(indexEl, nameEl);

    if (!isActive) {
      stepEl.addEventListener('click', () => {
        jumpToHistoryStep(idx);
      });
    }

    focusHistoryTree.appendChild(stepEl);
  });

}

function getDiscoveryMetric(node, key = 'score') {
  return Number.isFinite(node?.discovery?.[key]) ? node.discovery[key] : 0;
}

function humanizeTrailDirection(direction) {
  if (direction === 'upstream') return 'what influences this';
  if (direction === 'downstream') return 'what this influences';
  if (direction === 'surprise') return 'the unexpected connection';
  return 'the next connection';
}

function buildTrailCandidateMeta(candidate, fallback = '') {
  if (!candidate?.node) return fallback;
  if (candidate.via) {
    return `${candidate.node.name} via ${candidate.via.name}`;
  }
  if (candidate.edge?.verb) {
    return `${candidate.node.name} • ${candidate.edge.verb}`;
  }
  return candidate.node.name;
}

function buildSelectionPath(node) {
  return [...selectionHistory, node].filter(Boolean);
}

function findBestAuthoredTrailContext(node) {
  const guideTrailIds = node?.discoveryGuide?.trailIds || [];
  if (!node || guideTrailIds.length === 0) return null;

  const pathIds = buildSelectionPath(node).map(item => item.id);
  const seenIds = new Set(pathIds);
  const currentId = node.id;
  let best = null;

  guideTrailIds.forEach(trailId => {
    const trail = DISCOVERY_TRAILS[trailId];
    if (!trail?.nodeIds?.length) return;

    const currentIndex = trail.nodeIds.indexOf(currentId);
    if (currentIndex === -1) return;

    let overlap = 0;
    let orderedPrefix = 0;
    for (let i = 0; i < pathIds.length; i++) {
      if (trail.nodeIds.includes(pathIds[i])) overlap += 1;
      if (i < trail.nodeIds.length && trail.nodeIds[i] === pathIds[i]) {
        orderedPrefix += 1;
      }
    }

    const nextNodeId = trail.nodeIds.find((trailNodeId, idx) => idx > currentIndex && !seenIds.has(trailNodeId)) || null;
    const nextNode = nextNodeId ? NODE_BY_ID.get(nextNodeId) : null;
    const score =
      orderedPrefix * 8 +
      overlap * 4 +
      (nextNode ? 3 : 0) -
      currentIndex * 0.4;

    if (!best || score > best.score) {
      best = {
        trailId,
        trail,
        currentIndex,
        nextNode,
        score
      };
    }
  });

  return best;
}

function buildTrailHistorySet(node) {
  const seenIds = new Set(selectionHistory.map(item => item.id));
  if (node?.id) seenIds.add(node.id);
  return seenIds;
}

function getIncomingEdges(nodeId) {
  return (INCOMING_EDGES_BY_TARGET.get(nodeId) || []).filter(isCausalRelationship);
}

function getOutgoingEdges(nodeId) {
  return (OUTGOING_EDGES_BY_SOURCE.get(nodeId) || []).filter(isCausalRelationship);
}

function buildTrailCandidate(node, edge, direction, seenIds) {
  const targetId = direction === 'upstream' ? edge.source : edge.target;
  const targetNode = NODE_BY_ID.get(targetId);
  if (!targetNode || seenIds.has(targetNode.id)) return null;

  const crossSphere = targetNode.sphere !== node.sphere ? 1 : 0;
  const candidateScore =
    getDiscoveryMetric(targetNode, 'score') * 0.55 +
    getDiscoveryMetric(targetNode, 'connectivity') * 0.2 +
    getDiscoveryMetric(targetNode, 'explainability') * 0.15 +
    getDiscoveryMetric(targetNode, 'novelty') * 0.1 +
    Math.abs(edge.influence || 0) * 12 +
    crossSphere * 8;

  return {
    node: targetNode,
    edge,
    direction,
    crossSphere,
    score: candidateScore
  };
}

function pickBestTrailCandidate(candidates) {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (getDiscoveryMetric(b.node, 'score') !== getDiscoveryMetric(a.node, 'score')) {
      return getDiscoveryMetric(b.node, 'score') - getDiscoveryMetric(a.node, 'score');
    }
    return a.node.name.localeCompare(b.node.name);
  })[0];
}

function getUnexpectedTrailCandidate(node, seenIds) {
  const directCandidates = [
    ...getIncomingEdges(node.id).map(edge => buildTrailCandidate(node, edge, 'upstream', seenIds)),
    ...getOutgoingEdges(node.id).map(edge => buildTrailCandidate(node, edge, 'downstream', seenIds))
  ]
    .filter(Boolean)
    .filter(candidate => candidate.crossSphere === 1);

  const rankedDirect = directCandidates
    .map(candidate => ({
      ...candidate,
      score: candidate.score + getDiscoveryMetric(candidate.node, 'novelty') * 0.2
    }))
    .sort((a, b) => b.score - a.score);

  if (rankedDirect.length > 0) {
    return rankedDirect[0];
  }

  const secondHopCandidates = [];
  const firstHopEdges = [...getIncomingEdges(node.id), ...getOutgoingEdges(node.id)];
  firstHopEdges.forEach(firstEdge => {
    const neighborId = firstEdge.source === node.id ? firstEdge.target : firstEdge.source;
    const neighborNode = NODE_BY_ID.get(neighborId);
    if (!neighborNode) return;
    const secondHopEdges = [...getIncomingEdges(neighborId), ...getOutgoingEdges(neighborId)];
    secondHopEdges.forEach(secondEdge => {
      const secondId = secondEdge.source === neighborId ? secondEdge.target : secondEdge.source;
      const secondNode = NODE_BY_ID.get(secondId);
      if (!secondNode || seenIds.has(secondId) || secondId === node.id) return;
      if (secondNode.sphere === node.sphere) return;

      secondHopCandidates.push({
        node: secondNode,
        edge: secondEdge,
        direction: 'surprise',
        crossSphere: 1,
        via: neighborNode,
        score:
          getDiscoveryMetric(secondNode, 'score') * 0.5 +
          getDiscoveryMetric(secondNode, 'novelty') * 0.25 +
          getDiscoveryMetric(secondNode, 'connectivity') * 0.15 +
          Math.abs(secondEdge.influence || 0) * 10 +
          12
      });
    });
  });

  return pickBestTrailCandidate(secondHopCandidates);
}

function getTrailRecommendations(node) {
  if (!node) return null;

  const seenIds = buildTrailHistorySet(node);
  const upstream = pickBestTrailCandidate(
    getIncomingEdges(node.id)
      .map(edge => buildTrailCandidate(node, edge, 'upstream', seenIds))
      .filter(Boolean)
      .map(candidate => ({
        ...candidate,
        score: candidate.score + Math.abs(candidate.edge.influence || 0) * 8
      }))
  );

  const downstream = pickBestTrailCandidate(
    getOutgoingEdges(node.id)
      .map(edge => buildTrailCandidate(node, edge, 'downstream', seenIds))
      .filter(Boolean)
      .map(candidate => ({
        ...candidate,
        score: candidate.score + Math.abs(candidate.edge.influence || 0) * 8
      }))
  );

  const unexpected = getUnexpectedTrailCandidate(node, seenIds);

  const excludedIds = new Set(
    [upstream?.node?.id, downstream?.node?.id, unexpected?.node?.id].filter(Boolean)
  );

  const continuationPool = [
    ...getIncomingEdges(node.id).map(edge => buildTrailCandidate(node, edge, 'upstream', seenIds)),
    ...getOutgoingEdges(node.id).map(edge => buildTrailCandidate(node, edge, 'downstream', seenIds))
  ]
    .filter(Boolean)
    .filter(candidate => !excludedIds.has(candidate.node.id))
    .map(candidate => ({
      ...candidate,
      score:
        candidate.score +
        getDiscoveryMetric(candidate.node, 'connectivity') * 0.2 +
        (candidate.crossSphere ? 6 : 0)
    }));

  const continuation = pickBestTrailCandidate(continuationPool) || upstream || downstream || unexpected || null;

  return { upstream, downstream, unexpected, continuation };
}

function setTrailActionButton(button, candidate, label, fallback, metaSelector = '.trail-action-meta', labelSelector = '.trail-action-label') {
  if (!button) return;
  const meta = button.querySelector(metaSelector);
  const labelEl = button.querySelector(labelSelector);
  if (labelEl) labelEl.innerHTML = label;

  if (candidate?.node) {
    button.disabled = false;
    button.setAttribute('data-target-id', candidate.node.id);
    if (meta) meta.textContent = buildTrailCandidateMeta(candidate);
  } else {
    button.disabled = true;
    button.removeAttribute('data-target-id');
    if (meta) meta.textContent = fallback;
  }
}

function updateTrailPrompts(node) {
  if (!trailPromptPanel || !trailProgressLabel) return;

  if (!node || !graphInstance?.isFocusMode) {
    trailPromptPanel.style.display = 'none';
    return;
  }

  const recommendations = getTrailRecommendations(node);
  const authoredTrail = findBestAuthoredTrailContext(node);
  const trailLength = selectionHistory.length + 1;
  const progress = `${Math.min(trailLength, TRAIL_TARGET_LENGTH)} of ${TRAIL_TARGET_LENGTH}`;
  trailProgressLabel.textContent = progress;
  trailPromptPanel.style.display = 'grid';

  const heroCandidate = authoredTrail?.nextNode
    ? {
        node: authoredTrail.nextNode,
        direction: 'downstream',
        edge: getOutgoingEdges(node.id).find(edge => edge.target === authoredTrail.nextNode.id)
          || getIncomingEdges(node.id).find(edge => edge.source === authoredTrail.nextNode.id)
          || null
      }
    : recommendations?.continuation;

  if (trailPromptKicker) {
    trailPromptKicker.textContent = authoredTrail?.trail?.title || 'Continue this trail';
  }
  if (trailPromptTitle) {
    trailPromptTitle.textContent = heroCandidate?.node
      ? `Stay with ${node.name} and follow the next meaningful step`
      : `You've reached the end of this branch from ${node.name}`;
  }
  if (trailPromptBody) {
    if (authoredTrail?.trail?.prompt) {
      trailPromptBody.textContent = authoredTrail.trail.prompt;
    } else if (heroCandidate?.node) {
      trailPromptBody.textContent = `Instead of jumping to another random dot, keep going through ${humanizeTrailDirection(heroCandidate.direction)}.`;
    } else {
      trailPromptBody.textContent = 'There is no stronger continuation from this branch right now, but you can still pivot to a related angle below.';
    }
  }

  setTrailActionButton(
    trailContinueBtn,
    heroCandidate,
    'Continue this trail',
    'Trail complete for this branch',
    '.trail-hero-meta',
    '.trail-hero-title'
  );
  if (trailHeroTitle) {
    trailHeroTitle.textContent = heroCandidate?.node
      ? `Next: ${heroCandidate.node.name}`
      : 'Trail complete for this branch';
  }
  if (trailHeroMeta) {
    const heroMetaText = authoredTrail?.trail?.title
      ? `${authoredTrail.trail.title} • ${progress}`
      : heroCandidate?.node
        ? `${buildTrailCandidateMeta(heroCandidate)} • ${progress}`
        : `Progress ${progress}`;
    trailHeroMeta.textContent = heroMetaText;
  }

  setTrailActionButton(trailUpstreamBtn, recommendations?.upstream, 'What influences this?', 'No incoming influence available', '.trail-branch-meta', '.trail-branch-label');
  setTrailActionButton(trailDownstreamBtn, recommendations?.downstream, 'What does this influence?', 'No outgoing influence available', '.trail-branch-meta', '.trail-branch-label');
  setTrailActionButton(trailUnexpectedBtn, recommendations?.unexpected, 'Show the unexpected connection', 'No cross-system jump available', '.trail-branch-meta', '.trail-branch-label');
}

function updateAnalyzeShowMoreButton(node) {
  if (!analyzeShowMoreBtn) return;
  const setExpandBadge = (badge = '') => {
    analyzeShowMoreBtn.dataset.badge = badge ? String(badge) : '';
  };
  const setExpandIcon = (isExpanded) => {
    if (!analyzeShowMoreIcon) return;
    analyzeShowMoreIcon.src = isExpanded ? '/urgency-simplify-icon.svg' : '/urgency-expand-icon.svg';
    analyzeShowMoreBtn.dataset.tooltip = isExpanded ? 'Simplify' : 'Expand';
  };

  if (!node || !graphInstance?.isFocusMode) {
    analyzeShowMoreBtn.style.display = 'none';
    analyzeShowMoreBtn.classList.remove('active');
    analyzeShowMoreBtn.disabled = true;
    setExpandIcon(false);
    setExpandBadge();
    return;
  }

  const focusData = graphInstance.getAnalyzeFocusData(node);
  const hiddenCount = focusData?.hiddenConnectionCount || 0;
  if (focusData?.autoExpandAllConnections) {
    analyzeShowMoreBtn.style.display = 'none';
    analyzeShowMoreBtn.disabled = true;
    analyzeShowMoreBtn.classList.remove('active');
    setExpandIcon(false);
    setExpandBadge();
  } else if (graphInstance.showAllAnalyzeConnections) {
    analyzeShowMoreBtn.setAttribute('aria-label', 'Simplify incoming and outgoing influences');
    analyzeShowMoreBtn.style.display = 'inline-flex';
    analyzeShowMoreBtn.disabled = false;
    analyzeShowMoreBtn.classList.add('active');
    setExpandIcon(true);
    setExpandBadge();
  } else if (hiddenCount > 0) {
    analyzeShowMoreBtn.setAttribute('aria-label', `Expand to show ${hiddenCount} more secondary-tier influences`);
    analyzeShowMoreBtn.style.display = 'inline-flex';
    analyzeShowMoreBtn.disabled = false;
    analyzeShowMoreBtn.classList.remove('active');
    setExpandIcon(false);
    setExpandBadge(hiddenCount);
  } else {
    analyzeShowMoreBtn.style.display = 'none';
    analyzeShowMoreBtn.disabled = true;
    analyzeShowMoreBtn.classList.remove('active');
    setExpandIcon(false);
    setExpandBadge();
  }
}

function getNodeByName(name) {
  if (!name) return null;
  const normalized = String(name).trim().toLowerCase();
  return PUBLISHED_NODES.find(node => [
    node.name,
    ...(node.semanticAliases || []).map(alias => alias.name),
    ...(node.metricAliases || []).map(alias => alias.name)
  ].some(term => String(term || '').trim().toLowerCase() === normalized)) || null;
}

function updateGatewayArcLayout() {
  if (!editorialArcsLayer || !graphInstance) return;

  const width = Number.isFinite(graphInstance.width) ? graphInstance.width : editorialArcsLayer.clientWidth;
  const height = Number.isFinite(graphInstance.height) ? graphInstance.height : editorialArcsLayer.clientHeight;
  const radius = Number.isFinite(graphInstance.sphereRadius)
    ? graphInstance.sphereRadius
    : Math.min(width, height) * 0.58;
  const centerX = Number.isFinite(graphInstance.camera?.x) ? graphInstance.camera.x : width / 2;
  const centerY = Number.isFinite(graphInstance.camera?.y) ? graphInstance.camera.y : (height / 2 + 45);
  const compact = width < 1320 || height < 820;
  const triggerOffset = radius * (compact ? 0.9 : 1.04);
  const itemRadius = compact ? 88 : 116;
  const arcAngle = compact ? 36 : 42;

  editorialArcsLayer.classList.remove('is-compact');
  editorialArcsSvg?.classList.add('hidden');
  editorialArcTriggers.forEach((trigger, side) => {
    const sideSign = side === 'right' ? 1 : -1;
    const triggerX = centerX + sideSign * triggerOffset;
    trigger.style.left = `${triggerX}px`;
    trigger.style.top = `${centerY}px`;
    const hoverZone = editorialArcHoverZones.get(side);
    if (hoverZone) {
      hoverZone.style.left = `${triggerX + sideSign * (itemRadius / 2)}px`;
      hoverZone.style.top = `${centerY}px`;
      hoverZone.style.width = `${itemRadius + 210}px`;
      hoverZone.style.height = `${Math.sin(arcAngle * Math.PI / 180) * itemRadius * 2 + 78}px`;
    }
  });
  editorialArcButtons.forEach(button => {
    const side = button.getAttribute('data-side') || 'left';
    const index = GATEWAY_TOPIC_ORDER[button.getAttribute('data-topic-key')] ?? 0;
    const sideSign = side === 'right' ? 1 : -1;
    const triggerX = centerX + sideSign * triggerOffset;
    const triggerY = centerY;
    const theta = (index - 1) * arcAngle * Math.PI / 180;
    const itemX = triggerX + sideSign * Math.cos(theta) * itemRadius;
    const itemY = triggerY + Math.sin(theta) * itemRadius;
    button.style.left = `${itemX}px`;
    button.style.top = `${itemY}px`;
    button.style.setProperty('--gateway-closed-x', `${triggerX - itemX}px`);
    button.style.setProperty('--gateway-closed-y', `${triggerY - itemY}px`);
    button.style.width = compact ? '36px' : '40px';
    button.style.height = compact ? '36px' : '40px';
  });
  return;

  editorialArcsLayer.classList.toggle('is-compact', compact);
  if (editorialArcsSvg) {
    editorialArcsSvg.classList.toggle('hidden', compact);
    editorialArcsSvg.setAttribute('viewBox', `0 0 ${Math.max(width, 1)} ${Math.max(height, 1)}`);
  }

  if (compact) return;

  const offsetRadius = radius * 0.90;
  const angleSpread = 32 * Math.PI / 180; // 32 degrees spread
  const buttonPositions = new Map();

  editorialArcButtons.forEach(button => {
    const side = button.getAttribute('data-side') || 'left';
    const position = button.getAttribute('data-position') || 'middle';
    const sideSign = side === 'right' ? 1 : -1;

    let theta = 0;
    if (position === 'top') {
      theta = -angleSpread;
    } else if (position === 'bottom') {
      theta = angleSpread;
    }

    const x = centerX + sideSign * offsetRadius * Math.cos(theta);
    const y = centerY + offsetRadius * Math.sin(theta);

    button.style.left = `${x}px`;
    button.style.top = `${y}px`;
    buttonPositions.set(button.getAttribute('data-topic-key'), { x, y, sideSign });

    const topicKey = button.getAttribute('data-topic-key');
    const iconWrap = button.querySelector('.gateway-topic-icon-wrap');
    const iconSvg = button.querySelector('.gateway-topic-icon');

    if (topicKey === 'global-warming' || topicKey === 'melting-glaciers') {
      button.style.width = `28px`;
      button.style.height = `28px`;
      if (iconWrap) {
        iconWrap.style.width = `25px`;
        iconWrap.style.height = `25px`;
      }
      if (iconSvg) {
        iconSvg.style.width = `25px`;
        iconSvg.style.height = `25px`;
      }
    } else {
      button.style.width = `24px`;
      button.style.height = `24px`;
      if (iconWrap) {
        iconWrap.style.width = `21px`;
        iconWrap.style.height = `21px`;
      }
      if (iconSvg) {
        iconSvg.style.width = `21px`;
        iconSvg.style.height = `21px`;
      }
    }
  });

  if (!editorialArcPaths.leftTop || !editorialArcPaths.leftBottom || !editorialArcPaths.rightTop || !editorialArcPaths.rightBottom) return;

  const buildSideArc = side => {
    const topics = GATEWAY_TOPICS
      .filter(topic => topic.side === side)
      .map(topic => buttonPositions.get(topic.key))
      .filter(Boolean);
    if (topics.length !== 3) return { top: '', bottom: '' };

    const [top, middle, bottom] = topics;
    const ax = top.x;
    const ay = top.y;
    const bx = middle.x;
    const by = middle.y;
    const cx = bottom.x;
    const cy = bottom.y;
    const gapPx = 20;

    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
    if (Math.abs(d) < 0.001) {
      return { top: '', bottom: '' };
    }

    const ax2ay2 = ax * ax + ay * ay;
    const bx2by2 = bx * bx + by * by;
    const cx2cy2 = cx * cx + cy * cy;
    const centerArcX = (
      ax2ay2 * (by - cy) +
      bx2by2 * (cy - ay) +
      cx2cy2 * (ay - by)
    ) / d;
    const centerArcY = (
      ax2ay2 * (cx - bx) +
      bx2by2 * (ax - cx) +
      cx2cy2 * (bx - ax)
    ) / d;

    const radiusArc = Math.hypot(ax - centerArcX, ay - centerArcY);
    const startAngle = Math.atan2(ay - centerArcY, ax - centerArcX);
    const middleAngle = Math.atan2(by - centerArcY, bx - centerArcX);
    const endAngle = Math.atan2(cy - centerArcY, cx - centerArcX);

    const normalizeAngle = angle => {
      let normalized = angle;
      while (normalized < 0) normalized += Math.PI * 2;
      while (normalized >= Math.PI * 2) normalized -= Math.PI * 2;
      return normalized;
    };
    const angleDistance = (from, to, clockwise) => {
      const a = normalizeAngle(from);
      const b = normalizeAngle(to);
      return clockwise ? (a - b + Math.PI * 2) % (Math.PI * 2) : (b - a + Math.PI * 2) % (Math.PI * 2);
    };

    const ccwSpan = angleDistance(startAngle, endAngle, false);
    const ccwMidSpan = angleDistance(startAngle, middleAngle, false);
    const useCounterClockwise = ccwMidSpan <= ccwSpan;
    const sweepFlag = useCounterClockwise ? 1 : 0;
    const direction = useCounterClockwise ? 1 : -1;
    const trimAngle = Math.min(gapPx / Math.max(radiusArc, 1), Math.PI / 8);

    const pointAtAngle = angle => ({
      x: centerArcX + Math.cos(angle) * radiusArc,
      y: centerArcY + Math.sin(angle) * radiusArc
    });

    const buildArcSegment = (fromAngle, toAngle) => {
      const start = pointAtAngle(fromAngle);
      const end = pointAtAngle(toAngle);
      const span = direction === 1
        ? angleDistance(fromAngle, toAngle, false)
        : angleDistance(fromAngle, toAngle, true);
      const largeArcFlag = span > Math.PI ? 1 : 0;
      return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radiusArc.toFixed(2)} ${radiusArc.toFixed(2)} 0 ${largeArcFlag} ${sweepFlag} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
    };

    const topStartAngle = startAngle + direction * trimAngle;
    const topEndAngle = middleAngle - direction * trimAngle;
    const bottomStartAngle = middleAngle + direction * trimAngle;
    const bottomEndAngle = endAngle - direction * trimAngle;

    return {
      top: buildArcSegment(topStartAngle, topEndAngle),
      bottom: buildArcSegment(bottomStartAngle, bottomEndAngle)
    };
  };

  const leftArcs = buildSideArc('left');
  const rightArcs = buildSideArc('right');

  editorialArcPaths.leftTop.setAttribute('d', leftArcs.top);
  editorialArcPaths.leftBottom.setAttribute('d', leftArcs.bottom);
  editorialArcPaths.rightTop.setAttribute('d', rightArcs.top);
  editorialArcPaths.rightBottom.setAttribute('d', rightArcs.bottom);
}

function renderGatewayIcon(topic) {
  const viewBox = topic.viewBox || "0 0 64 64";
  const extraClass = topic.filled ? " filled-icon" : "";
  return `
    <svg class="gateway-topic-icon${extraClass}" viewBox="${viewBox}" aria-hidden="true" focusable="false">
      ${topic.iconSvg}
    </svg>
  `;
}

function syncEditorialArcState() {
  if (!editorialArcButtons.length) return;
  const activeId = currentSelectedNode?.id || null;
  editorialArcButtons.forEach(button => {
    const isActive = activeId && button.getAttribute('data-node-id') === activeId;
    button.classList.toggle('is-active', Boolean(isActive));
  });
}

function setGraphFilter(filterValue) {
  if (!graphInstance) return;
  graphInstance.setFilter(filterValue);
  if (editorialArcsLayer) {
    editorialArcsLayer.classList.toggle('hidden', filterValue !== 'all');
  }
}

function setEditorialArcHover(node) {
  if (!graphInstance || graphInstance.isFocusMode) return;
  graphInstance.hoveredNode = node || null;
  graphInstance.autoRotatePausedUntil = Date.now() + 1200;
  if (node) {
    graphInstance.needsCentering = true;
  }
}

function clearEditorialArcHover(button) {
  if (button) button.classList.remove('is-hovered');
  if (!graphInstance || graphInstance.isFocusMode) return;
  graphInstance.hoveredNode = null;
  graphInstance.needsCentering = false;
}

function setEditorialArcsExpanded(side, expanded) {
  if (!editorialArcsLayer) return;
  window.clearTimeout(editorialArcCloseTimers.get(side));
  editorialArcsLayer.classList.toggle(`is-expanded-${side}`, expanded);
  editorialArcTriggers.get(side)?.setAttribute('aria-expanded', String(expanded));
}

function scheduleEditorialArcsCollapse(side) {
  window.clearTimeout(editorialArcCloseTimers.get(side));
  const timer = window.setTimeout(() => {
    const sideHasFocus = editorialArcsLayer?.querySelector(`.editorial-arcs-trigger[data-side="${side}"]:focus, .editorial-arc-topic[data-side="${side}"]:focus`);
    if (!sideHasFocus) setEditorialArcsExpanded(side, false);
  }, 180);
  editorialArcCloseTimers.set(side, timer);
}

function createEditorialArcButton(topic, node) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'editorial-arc-topic';
  button.setAttribute('data-side', topic.side);
  button.setAttribute('data-position', topic.position);
  button.setAttribute('data-topic-key', topic.key);
  button.setAttribute('data-node-id', node.id);
  button.setAttribute('aria-label', `Explore ${topic.label}`);
  button.style.setProperty('--gateway-accent', topic.color);
  button.innerHTML = `
    <span class="gateway-topic-visual">
      <span class="gateway-topic-icon-wrap">
        ${renderGatewayIcon(topic)}
      </span>
      <span class="editorial-arc-topic-copy">${GATEWAY_TOPIC_LABELS[topic.key] || topic.label}</span>
    </span>
  `;

  button.addEventListener('mouseenter', () => {
    setEditorialArcsExpanded(topic.side, true);
    button.classList.add('is-hovered');
    setEditorialArcHover(node);
  });
  button.addEventListener('mouseleave', () => {
    clearEditorialArcHover(button);
    scheduleEditorialArcsCollapse(topic.side);
  });
  button.addEventListener('focus', () => {
    setEditorialArcsExpanded(topic.side, true);
    button.classList.add('is-hovered');
    setEditorialArcHover(node);
  });
  button.addEventListener('blur', () => {
    clearEditorialArcHover(button);
  });
  button.addEventListener('click', () => {
    clearEditorialArcHover(button);
    targetAndSelectNode(node);
  });

  return button;
}

function initEditorialArcs() {
  editorialArcsLayer = document.getElementById('editorial-arcs-layer');
  editorialArcButtons = [];
  editorialArcPaths = { leftTop: null, leftBottom: null, rightTop: null, rightBottom: null };
  if (!editorialArcsLayer) return;

  editorialArcsLayer.innerHTML = '';

  editorialArcTriggers = new Map();
  editorialArcHoverZones = new Map();
  ['left', 'right'].forEach(side => {
    const hoverZone = document.createElement('div');
    hoverZone.className = 'editorial-arcs-hover-zone';
    hoverZone.setAttribute('data-side', side);
    hoverZone.addEventListener('mouseenter', () => setEditorialArcsExpanded(side, true));
    hoverZone.addEventListener('mouseleave', () => scheduleEditorialArcsCollapse(side));
    editorialArcHoverZones.set(side, hoverZone);
    editorialArcsLayer.appendChild(hoverZone);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'editorial-arcs-trigger';
    trigger.setAttribute('data-side', side);
    trigger.setAttribute('aria-label', `Explore ${side} featured phenomena`);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.innerHTML = '<span aria-hidden="true"></span>';
    trigger.addEventListener('mouseenter', () => setEditorialArcsExpanded(side, true));
    trigger.addEventListener('mouseleave', () => scheduleEditorialArcsCollapse(side));
    trigger.addEventListener('focus', () => setEditorialArcsExpanded(side, true));
    trigger.addEventListener('blur', () => scheduleEditorialArcsCollapse(side));
    trigger.addEventListener('click', () => {
      setEditorialArcsExpanded(side, !editorialArcsLayer.classList.contains(`is-expanded-${side}`));
    });
    editorialArcTriggers.set(side, trigger);
    editorialArcsLayer.appendChild(trigger);
  });

  editorialArcsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  editorialArcsSvg.classList.add('editorial-arcs-svg');
  editorialArcsSvg.setAttribute('aria-hidden', 'true');

  const leftTopPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  leftTopPath.classList.add('editorial-arc-connector');
  editorialArcsSvg.appendChild(leftTopPath);
  editorialArcPaths.leftTop = leftTopPath;

  const leftBottomPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  leftBottomPath.classList.add('editorial-arc-connector');
  editorialArcsSvg.appendChild(leftBottomPath);
  editorialArcPaths.leftBottom = leftBottomPath;

  const rightTopPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  rightTopPath.classList.add('editorial-arc-connector');
  editorialArcsSvg.appendChild(rightTopPath);
  editorialArcPaths.rightTop = rightTopPath;

  const rightBottomPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  rightBottomPath.classList.add('editorial-arc-connector');
  editorialArcsSvg.appendChild(rightBottomPath);
  editorialArcPaths.rightBottom = rightBottomPath;

  editorialArcsLayer.appendChild(editorialArcsSvg);

  GATEWAY_TOPICS.forEach(topic => {
    const node = NODE_BY_ID.get(topic.nodeId) || getNodeByName(topic.label);
    if (!node) return;
    const button = createEditorialArcButton(topic, node);
    editorialArcsLayer.appendChild(button);
    editorialArcButtons.push(button);
  });

  syncEditorialArcState();
  updateGatewayArcLayout();
}

// --- NODE SELECTION & DYNAMIC CONTENT WRITER ---
function selectNode(node, { historyMode = 'push', pathNodes = null, motionOrigin = null } = {}) {
  const isNewSelection = Boolean(node && (!currentSelectedNode || currentSelectedNode.id !== node.id));

  if (isNewSelection || !node) {
    clearSelectedEdgeDetail();
  }

  if (isNewSelection && monitoringSourceToggle && monitoringSourceContent) {
    monitoringSourceToggle.setAttribute('aria-expanded', 'false');
    monitoringSourceContent.hidden = true;
  }

  // Navigation history tracking
  if (Array.isArray(pathNodes)) {
    const normalizedPath = normalizeNavigationPath(pathNodes.map(pathNode => pathNode.id), node?.id || null);
    selectionHistory = node ? normalizedPath.slice(0, -1) : [];
  } else if (node) {
    if (currentSelectedNode && currentSelectedNode.id !== node.id) {
      selectionHistory.push(currentSelectedNode);
    }
  } else {
    selectionHistory = [];
  }
  updateHistoryTree(node);

  if (graphInstance) {
    graphInstance.selectionHistory = selectionHistory;
  }

  // Auto-close sources view if open
  const sourcesView = document.getElementById('sources-view');
  const sourcesTabBtn = document.getElementById('sources-tab-btn');
  const appContainer = document.getElementById('app-container');
  if (sourcesTabBtn) sourcesTabBtn.classList.remove('active');
  if (sourcesView) sourcesView.style.display = 'none';
  if (appContainer) appContainer.classList.remove('sources-active');

  currentSelectedNode = node;
  fetchDataCenterIntelligence(node);
  writeNavigationHistory(historyMode);
  updateSelectedEdgeDetail(currentSelectedEdge, currentSelectedNode);
  syncEditorialArcState();
  const mainContent = document.getElementById('main-content');

  if (!node) {
    if (focusStepBackBtn) focusStepBackBtn.disabled = true;
    if (registriesDashboard) {
      registriesDashboard.classList.remove('active');
      registriesDashboard.style.display = 'none';
    }
    updateGatewayArcLayout();
    updateAnalyzeShowMoreButton(null);
    setShellMode('explore');
    renderPhenomenonLens(null);
    
    // Hide all dynamic dataset cards
    const cards = [
      'nasa-datasets-card', 'noaa-datasets-card', 'cds-datasets-card',
      'ecmwf-datasets-card', 'gcp-datasets-card', 'gcb-datasets-card',
      'edgar-datasets-card', 'wri-datasets-card', 'gfw-datasets-card',
      'faostat-datasets-card', 'gbif-datasets-card', 'unep-datasets-card',
      'informea-datasets-card', 'openaq-datasets-card', 'owid-datasets-card',
      'src-datasets-card', 'adb-datasets-card', 'escap-datasets-card', 'rds-datasets-card', 'asmc-datasets-card', 'mrc-datasets-card', 'servir-datasets-card', 'apcc-datasets-card', 'jma-datasets-card', 'wmo-datasets-card', 'sahf-datasets-card', 'mosdac-datasets-card', 'drawdown-datasets-card',
      'pik-wb-datasets-card', 'kma-imd-datasets-card', 'iucn-unbl-datasets-card', 'unep-wesr-datasets-card', 'undrr-emdat-datasets-card', 'iea-cr-transition-card', 'ipcc-scenarios-card', 'data-center-intel-card'
    ];
    cards.forEach(id => {
      const card = document.getElementById(id);
      if (card) card.style.display = 'none';
    });
    
    const codeGen = document.getElementById('ecmwf-code-generator');
    if (codeGen) codeGen.style.display = 'none';

    // Hide causal legend key when exiting study mode
    const legendContainer = document.getElementById('c-legend-container');
    if (legendContainer) legendContainer.style.display = 'none';

    if (graphInstance) {
      graphInstance.showAllAnalyzeConnections = false;
      graphInstance.showIncomingInfluences = true;
      graphInstance.showOutgoingInfluences = true;
      graphInstance.invalidateAnalyzeCaches();
    }

    if (graphInstance) {
      graphInstance.layoutMode = 'network'; // Reset to default layout
      graphInstance.exitFocusMode();

      const toggleNetwork = document.getElementById('layout-toggle-network');
      const toggleTree = document.getElementById('layout-toggle-tree');
      if (toggleNetwork) {
        toggleNetwork.classList.add('active');
      }
      if (toggleTree) {
        toggleTree.classList.remove('active');
      }

      // Defer canvas resizing slightly to allow the layout grid to settle
      setTimeout(() => {
        graphInstance.resizeCanvas();
        updateGatewayArcLayout();
      }, 50);
    }

    window.requestAnimationFrame(() => forceExploreTabState());
    return;
  }

  if (graphInstance && !graphInstance.isFocusMode) {
    setShellMode('explore');
    updateGatewayArcLayout();
    return;
  }

  // Active node case: reveal simulation dashboard details
  setShellMode('study');
  if (graphInstance && isNewSelection) {
    graphInstance.showAllAnalyzeConnections = false;
    graphInstance.invalidateAnalyzeCaches();
  }


  if (focusStepBackBtn) {
    focusStepBackBtn.disabled = (selectionHistory.length === 0);
  }

  const legendContainer = document.getElementById('c-legend-container');

  // Sync layout toggle state
  const toggleNetwork = document.getElementById('layout-toggle-network');
  const toggleTree = document.getElementById('layout-toggle-tree');
  if (toggleNetwork && toggleTree && graphInstance) {
    if (graphInstance.layoutMode === 'tree') {
      toggleTree.classList.add('active');
      toggleNetwork.classList.remove('active');
    } else {
      toggleNetwork.classList.add('active');
      toggleTree.classList.remove('active');
    }
  }
  
  setActiveTab('study');

  if (graphInstance) {
    // Defer canvas resizing slightly to allow the layout grid to settle, then zoom to fit
    setTimeout(() => {
      graphInstance.resizeCanvas();
      graphInstance.zoomToFit();
    }, 50);
  }

  // Reset active tab to default first tab (Climate & Atmosphere)
  const defaultTabBtn = document.querySelector('.console-tab-btn[data-tab="tab-climate"]');
  if (defaultTabBtn) {
    defaultTabBtn.click();
  }

  // Populate Simulation intervention dials
  if (consoleNodeName) consoleNodeName.textContent = node.name;
  if (nodeSourceDate) nodeSourceDate.textContent = formatNodeSourceDate(node);
  if (motionOrigin) {
    window.requestAnimationFrame(() => playNodeBridgeTransition(node, motionOrigin));
  }
  if (dashboardActiveNodeName) dashboardActiveNodeName.textContent = 'available across the platform';
  if (consoleSphereBadge) {
    const sphereKey = node.sphere || 'core';
    consoleSphereBadge.textContent = (SPHERE_LABELS[sphereKey] || sphereKey).toUpperCase();
    consoleSphereBadge.className = `sphere-badge ${graphInstance ? graphInstance.getNodeColorType(node) : 'grey'}`;
  }
  const consoleImpactBadge = document.getElementById('console-impact-badge');
  if (consoleImpactBadge) {
    const badgeLabel = node.node_kind === 'response' ? 'LEVERAGE' : 'IMPACT';
    consoleImpactBadge.textContent = `${badgeLabel}: ${node.impactScore || 50}/100`;
  }
  if (consoleNodeMeaning) {
    consoleNodeMeaning.innerHTML = getNodeMeaning(node);
  }
  populateRelationshipEvidencePicker(node);
  if (consoleNodeSensors) {
    consoleNodeSensors.innerHTML = getNodeSensors(node);
  }
  renderEarthdataCollections(node);
  renderGraceCollections(node);
  renderPowerBaselines(node);
  renderHumanImpact(node);
  renderPlanetImpact(node);
  renderWhatCanBeDone(node);
  renderPhenomenonLens(node);

  // Update TULIP Urgency Score & Profile
  updateTulipUrgencyProfile(node);

  // Populate Causal Pathways (Drivers & Impacts)
  updateCausalLists(node);
  updateAnalyzeShowMoreButton(node);

  // Populate Self-Reinforcing Loops
  renderFeedbackLoops(node);

  // Registries now live in a shared footer directory rather than a node-scoped loader surface.









}
function findFeedbackLoops(nodeId) {
  const maxLoopLength = 5;
  const loops = [];
  const seenSignatures = new Set();
  const outgoingBySource = new Map();

  EDGES.filter(isCausalRelationship).forEach(edge => {
    if (!outgoingBySource.has(edge.source)) {
      outgoingBySource.set(edge.source, []);
    }
    outgoingBySource.get(edge.source).push(edge);
  });

  function recordLoop(nodes, edges, netInfluence) {
    const signature = edges.map(edge => `${edge.source}->${edge.target}`).join('|');
    if (seenSignatures.has(signature)) return;
    seenSignatures.add(signature);
    loops.push({
      nodes,
      edges,
      netInfluence: parseFloat(netInfluence.toFixed(4)),
      length: edges.length
    });
  }

  function walk(currentId, pathNodes, pathEdges, influenceProduct, visited) {
    if (pathEdges.length >= maxLoopLength) return;

    const outgoing = outgoingBySource.get(currentId) || [];
    outgoing.forEach(edge => {
      const nextId = edge.target;
      const nextInfluence = influenceProduct * edge.influence;

      if (nextId === nodeId && pathEdges.length >= 1 && nextInfluence > 0) {
        recordLoop([...pathNodes], [...pathEdges, edge], nextInfluence);
        return;
      }

      if (visited.has(nextId) || nextId === nodeId) return;

      visited.add(nextId);
      pathNodes.push(nextId);
      pathEdges.push(edge);
      walk(nextId, pathNodes, pathEdges, nextInfluence, visited);
      pathEdges.pop();
      pathNodes.pop();
      visited.delete(nextId);
    });
  }

  walk(nodeId, [nodeId], [], 1, new Set([nodeId]));

  loops.sort((a, b) => b.netInfluence - a.netInfluence || a.length - b.length);
  return loops;
}

function renderFeedbackLoops(node) {
  const loopsList = document.getElementById('console-feedback-loops-list');
  const loopsSection = loopsList ? loopsList.closest('.feedback-loops-section') : null;
  if (!loopsList) return;
  
  loopsList.innerHTML = '';
  const activeLoops = findFeedbackLoops(node.id);
  
  if (activeLoops.length === 0) {
    if (loopsSection) loopsSection.style.display = 'none';
    return;
  }

  if (loopsSection) loopsSection.style.display = 'flex';
  
  const topLoops = activeLoops.slice(0, 1);
  topLoops.forEach(loop => {
    const card = document.createElement('div');
    card.className = 'loop-card';
    
    let chainHtml = '';
    loop.nodes.forEach((nodeId, idx) => {
      const n = NODES.find(item => item.id === nodeId);
      const name = n ? n.name : nodeId;
      const isCurrent = nodeId === node.id;
      
      chainHtml += `<span class="loop-node-link ${isCurrent ? 'current' : ''}" data-node-id="${nodeId}">${name}</span>`;
      chainHtml += ` <span class="loop-arrow">➔</span> `;
    });
    chainHtml += `<span class="loop-node-link current" data-node-id="${node.id}">${node.name}</span>`;
    
    let detailsHtml = '';
    if (loop.length === 2) {
      const e1 = loop.edges[0];
      const e2 = loop.edges[1];
      const nB = NODES.find(item => item.id === loop.nodes[1]);
      const nameB = nB ? nB.name : loop.nodes[1];
      detailsHtml = `Rising <strong>${node.name}</strong> ${e1.verb} <strong>${nameB}</strong> (+${e1.influence}), which in turn ${e2.verb} <strong>${node.name}</strong> (+${e2.influence}), compounding the original issue.`;
    } else if (loop.length === 3) {
      const e1 = loop.edges[0];
      const e2 = loop.edges[1];
      const e3 = loop.edges[2];
      const nB = NODES.find(item => item.id === loop.nodes[1]);
      const nC = NODES.find(item => item.id === loop.nodes[2]);
      const nameB = nB ? nB.name : loop.nodes[1];
      const nameC = nC ? nC.name : loop.nodes[2];
      detailsHtml = `Rising <strong>${node.name}</strong> ${e1.verb} <strong>${nameB}</strong> (+${e1.influence}), driving <strong>${nameC}</strong> (+${e2.influence}), which ultimately ${e3.verb} <strong>${node.name}</strong> (+${e3.influence}).`;
    }
    
    card.innerHTML = `
      <div class="loop-chain">${chainHtml}</div>
    `;
    
    card.querySelectorAll('.loop-node-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const clickedId = e.currentTarget.getAttribute('data-node-id');
        const targetNode = NODES.find(n => n.id === clickedId);
        if (targetNode) {
          targetAndSelectNode(targetNode);
        }
      });
    });
    
    loopsList.appendChild(card);
  });
}

// --- NASA EARTHDATA API REGISTRY FETCH ---
function fetchNasaDatasets(node) {
  const listContainer = document.getElementById('nasa-datasets-list');
  const cardContainer = document.getElementById('nasa-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching NASA CMR registry...</div>`;

  // Search GCMD dataset collections in NASA registry by node name
  const url = `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=${encodeURIComponent(node.name)}&page_size=3`;
  
  fetch(url)
    .then(res => res.json())
    .then(data => {
      let entries = data?.feed?.entry || [];
      
      // Fallback to sphere keyword if no results found
      if (entries.length === 0) {
        const fallbackUrl = `https://cmr.earthdata.nasa.gov/search/collections.json?keyword=${encodeURIComponent(node.sphere)}&page_size=3`;
        return fetch(fallbackUrl)
          .then(res => res.json())
          .then(fallbackData => {
            return fallbackData?.feed?.entry || [];
          });
      }
      return entries;
    })
    .then(entries => {
      if (entries.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No NASA datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      entries.forEach(entry => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = entry.title || 'Unknown Dataset';
        const shortName = entry.short_name || 'N/A';
        const version = entry.version_id ? ` v${entry.version_id}` : '';
        const searchUrl = `https://search.earthdata.nasa.gov/search?q=${encodeURIComponent(shortName)}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(255, 220, 174, 0.95); font-weight: 500; letter-spacing: 0.5px;">${shortName}${version}</div>
          <a href="${searchUrl}" target="_blank" class="nasa-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(255, 220, 174, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching NASA datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load Earthdata registries.</div>`;
    });
}

// --- NASA EONET LIVE EVENTS FETCH ---
function fetchEonetEvents(node) {
  const listContainer = document.getElementById('eonet-events-list');
  const cardContainer = document.getElementById('eonet-events-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Polling NASA EONET tracker...</div>`;

  // Map node to EONET categories
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  let categories = [];
  if (name.includes('fire') || name.includes('burn') || name.includes('forest') || sphere === 'biosphere') {
    categories.push('wildfires');
  }
  if (name.includes('storm') || name.includes('cyclone') || name.includes('hurricane') || name.includes('typhoon') || name.includes('wind')) {
    categories.push('severeStorms');
  }
  if (name.includes('flood') || name.includes('rain') || name.includes('precipitation') || sphere === 'oceans') {
    categories.push('floods');
  }
  if (name.includes('ice') || name.includes('glacier') || name.includes('snow') || sphere === 'cryosphere') {
    categories.push('seaLakeIce');
    categories.push('snow');
  }
  if (name.includes('volcano') || name.includes('ash') || name.includes('eruption')) {
    categories.push('volcanoes');
  }
  if (name.includes('earthquake') || name.includes('seismic') || name.includes('tremor')) {
    categories.push('earthquakes');
  }
  if (name.includes('landslide') || name.includes('avalanche') || name.includes('mudslide')) {
    categories.push('landslides');
  }
  if (name.includes('drought') || name.includes('arid') || name.includes('heat') || name.includes('temperature')) {
    categories.push('drought');
    categories.push('tempExtremes');
  }
  if (name.includes('dust') || name.includes('haze') || name.includes('aerosol') || name.includes('smog') || name.includes('plume')) {
    categories.push('dustHaze');
  }

  // Fallback to active events if no specific category matched
  let url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=10';
  if (categories.length > 0) {
    url = `https://eonet.gsfc.nasa.gov/api/v3/events?category=${categories.join(',')}&status=open&limit=5`;
  }

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const events = data.events || [];
      if (events.length === 0) {
        if (categories.length > 0) {
          return fetch('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=5')
            .then(res => res.json())
            .then(globalData => globalData.events || []);
        }
        return [];
      }
      return events;
    })
    .then(events => {
      if (events.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No active EONET events tracked for this category.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      events.slice(0, 3).forEach(event => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const date = event.geometry && event.geometry[0] ? new Date(event.geometry[0].date).toLocaleDateString() : 'N/A';
        const categoryLabel = event.categories && event.categories[0] ? event.categories[0].title : 'Event';
        const coordinates = event.geometry && event.geometry[0] && event.geometry[0].coordinates ? 
          `[${event.geometry[0].coordinates.join(', ')}]` : 'N/A';

        item.innerHTML = `
          <div style="font-size: 12px; color: #ff5252; font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>EONET LIVE EVENT: ${categoryLabel.toUpperCase()}</span>
            <span>${date}</span>
          </div>
          <div style="font-size: 13px; color: #ffffff; font-weight: 500; line-height: 1.3;">${event.title}</div>
          <div style="font-size: 12px; color: var(--text-muted); display: flex; justify-content: space-between; margin-top: 2px;">
            <span>ID: ${event.id}</span>
            <span style="font-family: monospace;">Coords: ${coordinates}</span>
          </div>
          <div style="margin-top: 4px;">
            <a href="${event.sources && event.sources[0] ? event.sources[0].url : '#'}" target="_blank" style="font-size: 12px; color: #ff5252; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 500;">
              SOURCE DATA ENTRY <span style="font-size: 9pt;">↗</span>
            </a>
          </div>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching EONET events:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: #ff5252;">Failed to load NASA EONET data.</div>`;
    });
}

// --- NOAA NCEI API REGISTRY FETCH ---
function fetchNoaaDatasets(node) {
  const listContainer = document.getElementById('noaa-datasets-list');
  const cardContainer = document.getElementById('noaa-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching NOAA NCEI registry...</div>`;

  const url = `https://www.ncei.noaa.gov/metadata/granule/geoportal/opensearch?q=${encodeURIComponent(node.name)}&f=json`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      let results = data?.results || [];

      // Fallback to sphere keyword if no results found
      if (results.length === 0 && node.sphere) {
        const fallbackUrl = `https://www.ncei.noaa.gov/metadata/granule/geoportal/opensearch?q=${encodeURIComponent(node.sphere)}&f=json`;
        return fetch(fallbackUrl)
          .then(res => res.json())
          .then(fallbackData => {
            return fallbackData?.results || [];
          });
      }
      return results;
    })
    .then(results => {
      if (results.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No NOAA datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      results.slice(0, 3).forEach(entry => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = entry.title || 'Unknown Dataset';
        const identifier = entry.id || 'N/A';

        // Find alternate html link or fall back to canonical metadata REST html page
        let alternateLink = `https://www.ncei.noaa.gov/metadata/granule/geoportal/rest/metadata/item/${encodeURIComponent(entry.id)}/html`;
        if (entry.links && Array.isArray(entry.links)) {
          const htmlLinkObj = entry.links.find(l => l.type === 'text/html' || l.rel === 'alternate');
          if (htmlLinkObj && htmlLinkObj.href) {
            alternateLink = htmlLinkObj.href;
          }
        }

        // Ensure link is HTTPS to prevent mixed content
        if (alternateLink.startsWith('http://')) {
          alternateLink = alternateLink.replace('http://', 'https://');
        }

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(226, 217, 255, 0.95); font-weight: 500; letter-spacing: 0.5px;">${identifier}</div>
          <a href="${alternateLink}" target="_blank" class="noaa-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(226, 217, 255, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching NOAA datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load NCEI registries.</div>`;
    });
}

// --- COPERNICUS CLIMATE DATA STORE API REGISTRY FETCH ---
function fetchCdsDatasets(node) {
  const listContainer = document.getElementById('cds-datasets-list');
  const cardContainer = document.getElementById('cds-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching Climate Data Store...</div>`;

  const url = `https://cds.climate.copernicus.eu/api/catalogue/v1/datasets?q=${encodeURIComponent(node.name)}&limit=3`;

  fetch(url)
    .then(res => {
      if (res.status === 404) {
        return { collections: [] };
      }
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      let collections = data?.collections || [];

      // Fallback to sphere keyword if no results found
      if (collections.length === 0 && node.sphere) {
        const fallbackUrl = `https://cds.climate.copernicus.eu/api/catalogue/v1/datasets?q=${encodeURIComponent(node.sphere)}&limit=3`;
        return fetch(fallbackUrl)
          .then(fallbackRes => {
            if (fallbackRes.status === 404) {
              return { collections: [] };
            }
            if (!fallbackRes.ok) {
              throw new Error(`Invalid HTTP status: ${fallbackRes.status}`);
            }
            return fallbackRes.json();
          })
          .then(fallbackData => {
            return fallbackData?.collections || [];
          });
      }
      return collections;
    })
    .then(collections => {
      if (collections.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No CDS datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      collections.slice(0, 3).forEach(entry => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = entry.title || 'Unknown Dataset';
        const identifier = entry.id || 'N/A';
        const landingUrl = `https://cds.climate.copernicus.eu/datasets/${encodeURIComponent(entry.id)}?tab=overview`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px;">${identifier}</div>
          <a href="${landingUrl}" target="_blank" class="cds-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching CDS datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load Climate Data Store.</div>`;
    });
}

// --- ECMWF ARCHIVE & PROJECTIONS API RETRIEVAL ---
function fetchEcmwfDatasets(node) {
  const listContainer = document.getElementById('ecmwf-datasets-list');
  const cardContainer = document.getElementById('ecmwf-datasets-card');
  const codeGenPanel = document.getElementById('ecmwf-code-generator');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  if (codeGenPanel) codeGenPanel.style.display = 'none';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching ECMWF catalogue...</div>`;

  // Query ECMWF collections via the Climate Data Store datasets catalog API
  const url = `https://cds.climate.copernicus.eu/api/catalogue/v1/datasets?q=${encodeURIComponent(node.name)}&limit=3`;

  fetch(url)
    .then(res => {
      if (res.status === 404) {
        return { collections: [] };
      }
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      let collections = data?.collections || [];

      // Fallback to sphere keyword if no results found
      if (collections.length === 0 && node.sphere) {
        const fallbackUrl = `https://cds.climate.copernicus.eu/api/catalogue/v1/datasets?q=${encodeURIComponent(node.sphere)}&limit=3`;
        return fetch(fallbackUrl)
          .then(fallbackRes => {
            if (fallbackRes.status === 404) {
              return { collections: [] };
            }
            if (!fallbackRes.ok) {
              throw new Error(`Invalid HTTP status: ${fallbackRes.status}`);
            }
            return fallbackRes.json();
          })
          .then(fallbackData => {
            return fallbackData?.collections || [];
          });
      }
      return collections;
    })
    .then(collections => {
      if (collections.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No ECMWF datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      collections.slice(0, 3).forEach((entry, idx) => {
        const item = document.createElement('div');
        item.className = 'ecmwf-dataset-item';
        item.setAttribute('data-id', entry.id);
        item.setAttribute('data-title', entry.title);
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.padding = '8px 0';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';
        item.style.cursor = 'pointer';
        item.style.transition = 'background 0.2s';

        const titleText = entry.title || 'Unknown Dataset';
        const identifier = entry.id || 'N/A';

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>${identifier}</span>
            <span style="font-size: 9pt; color: rgba(255,255,255,0.4); text-transform: uppercase;">Get API Request ↗</span>
          </div>
          <div class="ecmwf-dataset-title" style="font-size: 13px; color: #ffffff; font-weight: 500; line-height: 1.4; transition: color 0.24s;">
            ${titleText}
          </div>
        `;

        item.addEventListener('click', () => {
          // Highlight active dataset
          const allItems = listContainer.querySelectorAll('.ecmwf-dataset-item');
          allItems.forEach(i => {
            i.classList.remove('active-dataset');
            i.style.background = 'transparent';
            const titles = i.querySelectorAll('.ecmwf-dataset-title');
            titles.forEach(t => t.style.color = '#ffffff');
          });

          item.classList.add('active-dataset');
          item.style.background = 'rgba(255,255,255,0.03)';
          const activeTitle = item.querySelector('.ecmwf-dataset-title');
          if (activeTitle) activeTitle.style.color = 'rgba(var(--accent-color-rgb), 0.95)';

          generateEcmwfPythonSnippet(entry.id, titleText);
        });

        listContainer.appendChild(item);
        if (idx === 0) {
          item.click();
        }
      });
    })
    .catch(err => {
      console.error('Error fetching ECMWF datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load ECMWF registries.</div>`;
    });
}

// --- HELPERS FOR ECMWF/CDS DATASETS RETRIEVAL CONFIGS ---
function getEcmwfParams(datasetId) {
  let activeId = datasetId;
  if (activeId.startsWith('derived-')) {
    activeId = activeId.replace('derived-', 'reanalysis-');
  }
  
  if (activeId.includes('carbon-dioxide')) {
    return {
      "processing_level": "level_2",
      "variable": "xco2",
      "year": "2023",
      "month": "01",
      "day": "01",
      "format": "zip"
    };
  }
  if (activeId.includes('humidity')) {
    return {
      "variable": "specific_humidity",
      "year": "2023",
      "month": "01",
      "format": "netcdf"
    };
  }
  if (activeId.includes('era5-land') && activeId.includes('daily')) {
    return {
      "variable": "2m_temperature",
      "year": "2023",
      "month": "01",
      "day": "01",
      "daily_statistic": "daily_mean",
      "time_zone": "utc+00:00",
      "format": "netcdf"
    };
  }
  if (activeId.includes('single-levels') && activeId.includes('daily')) {
    return {
      "variable": "2m_temperature",
      "year": "2023",
      "month": "01",
      "day": "01",
      "daily_statistic": "daily_mean",
      "time_zone": "utc+00:00",
      "format": "netcdf"
    };
  }
  
  // Fallback for reanalysis-era5-land / other ERA5 reanalysis datasets
  return {
    "variable": "2m_temperature",
    "year": "2023",
    "month": "01",
    "day": "01",
    "time": "00:00",
    "format": "netcdf"
  };
}

// --- GENERATE ECMWF PYTHON CLIENT SNIPPET ---
function generateEcmwfPythonSnippet(datasetId, datasetTitle) {
  return;

  const keyVal = document.getElementById('ecmwf-key-input')?.value.trim() || 'YOUR_CDS_API_KEY';
  
  let activeId = datasetId;
  if (activeId.startsWith('derived-')) {
    activeId = activeId.replace('derived-', 'reanalysis-');
  }
  
  const paramsObj = getEcmwfParams(activeId);
  const ext = paramsObj.format === 'zip' ? 'zip' : 'nc';

  // Construct standard cdsapi Python call
  const snippet = `# 1. Configure credentials (~/.cdsapirc)
# url: https://cds.climate.copernicus.eu/api
# key: ${keyVal}

# 2. Python client retrieval code
import cdsapi

client = cdsapi.Client()

client.retrieve(
    "${activeId}",
    ${JSON.stringify(paramsObj, null, 4)},
    "download_${activeId}.${ext}"
)`;

  codeDisplay.textContent = snippet;
}

// --- GLOBAL CARBON PROJECT (GCP) DATASETS VIA ZENODO API ---
function fetchGcpDatasets(node) {
  const listContainer = document.getElementById('gcp-datasets-list');
  const cardContainer = document.getElementById('gcp-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching Global Carbon Project...</div>`;

  const url = `https://zenodo.org/api/records?q=%22Global%20Carbon%20Project%22%20AND%20${encodeURIComponent(node.name)}&size=3`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      let hits = data?.hits?.hits || [];

      // Fallback 1: Search by sphere keyword if no direct name results
      if (hits.length === 0 && node.sphere) {
        const fallbackUrl = `https://zenodo.org/api/records?q=%22Global%20Carbon%20Project%22%20AND%20${encodeURIComponent(node.sphere)}&size=3`;
        return fetch(fallbackUrl)
          .then(res => res.ok ? res.json() : { hits: { hits: [] } })
          .then(fallbackData => {
            return fallbackData?.hits?.hits || [];
          });
      }
      return hits;
    })
    .then(hits => {
      // Fallback 2: Search for general GCP Global Carbon Budget if both return zero
      if (hits.length === 0) {
        const globalUrl = `https://zenodo.org/api/records?q=%22Global%20Carbon%20Budget%22&size=3`;
        return fetch(globalUrl)
          .then(res => res.ok ? res.json() : { hits: { hits: [] } })
          .then(globalData => {
            return globalData?.hits?.hits || [];
          });
      }
      return hits;
    })
    .then(hits => {
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No Global Carbon Project datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = hit.metadata?.title || 'Unknown Dataset';
        const doi = hit.doi || 'N/A';
        const year = hit.metadata?.publication_date ? hit.metadata.publication_date.substring(0, 4) : 'N/A';
        
        // Use self_html or doi_url or doi links
        let landingUrl = hit.links?.self_html || hit.doi_url || `https://zenodo.org/records/${hit.id}`;
        if (landingUrl.startsWith('http://')) {
          landingUrl = landingUrl.replace('http://', 'https://');
        }

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(255, 174, 174, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>DOI: ${doi}</span>
            <span>${year}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="gcp-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(255, 174, 174, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching GCP datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load GCP datasets.</div>`;
    });
}

// --- GLOBAL CARBON BUDGET (GCB) DATASETS VIA ZENODO API ---
function fetchGcbDatasets(node) {
  const listContainer = document.getElementById('gcb-datasets-list');
  const cardContainer = document.getElementById('gcb-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching Global Carbon Budget...</div>`;

  const url = `https://zenodo.org/api/records?q=title:%22Global%20Carbon%20Budget%22%20AND%20${encodeURIComponent(node.name)}&size=3`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      let hits = data?.hits?.hits || [];

      // Fallback 1: Search by sphere keyword if no direct name results
      if (hits.length === 0 && node.sphere) {
        const fallbackUrl = `https://zenodo.org/api/records?q=title:%22Global%20Carbon%20Budget%22%20AND%20${encodeURIComponent(node.sphere)}&size=3`;
        return fetch(fallbackUrl)
          .then(res => res.ok ? res.json() : { hits: { hits: [] } })
          .then(fallbackData => {
            return fallbackData?.hits?.hits || [];
          });
      }
      return hits;
    })
    .then(hits => {
      // Fallback 2: Search for general Global Carbon Budget if both return zero
      if (hits.length === 0) {
        const globalUrl = `https://zenodo.org/api/records?q=title:%22Global%20Carbon%20Budget%22&size=3`;
        return fetch(globalUrl)
          .then(res => res.ok ? res.json() : { hits: { hits: [] } })
          .then(globalData => {
            return globalData?.hits?.hits || [];
          });
      }
      return hits;
    })
    .then(hits => {
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No Global Carbon Budget datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = hit.metadata?.title || 'Unknown Dataset';
        const doi = hit.doi || 'N/A';
        const year = hit.metadata?.publication_date ? hit.metadata.publication_date.substring(0, 4) : 'N/A';
        
        // Use self_html or doi_url or doi links
        let landingUrl = hit.links?.self_html || hit.doi_url || `https://zenodo.org/records/${hit.id}`;
        if (landingUrl.startsWith('http://')) {
          landingUrl = landingUrl.replace('http://', 'https://');
        }

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(168, 230, 180, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>DOI: ${doi}</span>
            <span>${year}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="gcb-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(168, 230, 180, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching GCB datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load GCB datasets.</div>`;
    });
}

// --- EDGAR EMISSIONS DATASETS VIA DATA.EUROPA.EU SEARCH API ---
function fetchEdgarDatasets(node) {
  const listContainer = document.getElementById('edgar-datasets-list');
  const cardContainer = document.getElementById('edgar-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching EDGAR emissions...</div>`;

  const url = `https://data.europa.eu/api/hub/search/search?q=EDGAR%20AND%20${encodeURIComponent(node.name)}&filters=dataset&limit=3`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      let hits = data?.result?.results || [];

      // Fallback 1: Search by sphere keyword if no direct name results
      if (hits.length === 0 && node.sphere) {
        const fallbackUrl = `https://data.europa.eu/api/hub/search/search?q=EDGAR%20AND%20${encodeURIComponent(node.sphere)}&filters=dataset&limit=3`;
        return fetch(fallbackUrl)
          .then(res => res.ok ? res.json() : { result: { results: [] } })
          .then(fallbackData => {
            return fallbackData?.result?.results || [];
          });
      }
      return hits;
    })
    .then(hits => {
      // Fallback 2: Search for general EDGAR emissions if both return zero
      if (hits.length === 0) {
        const globalUrl = `https://data.europa.eu/api/hub/search/search?q=EDGAR%20emissions&filters=dataset&limit=3`;
        return fetch(globalUrl)
          .then(res => res.ok ? res.json() : { result: { results: [] } })
          .then(globalData => {
            return globalData?.result?.results || [];
          });
      }
      return hits;
    })
    .then(hits => {
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No EDGAR datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        // Extract localized title
        const titleText = hit.title?.en || hit.title?.de || (hit.title ? Object.values(hit.title)[0] : 'Unknown Dataset');
        
        // Extract format and access URL
        let formatStr = 'N/A';
        let landingUrl = `https://data.europa.eu/data/datasets/${hit.id}?locale=en`;

        if (hit.distributions && hit.distributions.length > 0) {
          const dist = hit.distributions[0];
          formatStr = dist.format?.id || dist.format?.label || 'N/A';
          const link = dist.access_url?.[0] || dist.download_url?.[0];
          if (link) {
            landingUrl = link;
          }
        }
        
        // Fallback to landing_page if available
        if (hit.landing_page?.[0]?.resource) {
          landingUrl = hit.landing_page[0].resource;
        }

        if (landingUrl.startsWith('http://')) {
          landingUrl = landingUrl.replace('http://', 'https://');
        }

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(255, 204, 102, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>FORMAT: ${formatStr}</span>
            <span>ID: ${hit.id.substring(0, 8)}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="edgar-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(255, 204, 102, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching EDGAR datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load EDGAR datasets.</div>`;
    });
}

// --- WRI RESOURCE WATCH DATASETS VIA RESOURCE WATCH API ---
function fetchWriDatasets(node) {
  const listContainer = document.getElementById('wri-datasets-list');
  const cardContainer = document.getElementById('wri-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching WRI Resource Watch...</div>`;

  const url = `https://api.resourcewatch.org/v1/dataset?app=rw&includes=metadata&search=${encodeURIComponent(node.name)}&page[size]=3`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      let hits = data?.data || [];

      // Fallback 1: Search by sphere keyword if no direct name results
      if (hits.length === 0 && node.sphere) {
        const fallbackUrl = `https://api.resourcewatch.org/v1/dataset?app=rw&includes=metadata&search=${encodeURIComponent(node.sphere)}&page[size]=3`;
        return fetch(fallbackUrl)
          .then(res => res.ok ? res.json() : { data: [] })
          .then(fallbackData => {
            return fallbackData?.data || [];
          });
      }
      return hits;
    })
    .then(hits => {
      // Fallback 2: Search for general emissions if both return zero
      if (hits.length === 0) {
        const globalUrl = `https://api.resourcewatch.org/v1/dataset?app=rw&includes=metadata&search=emissions&page[size]=3`;
        return fetch(globalUrl)
          .then(res => res.ok ? res.json() : { data: [] })
          .then(globalData => {
            return globalData?.data || [];
          });
      }
      return hits;
    })
    .then(hits => {
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No WRI datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const name = hit.attributes?.name || 'Unnamed Dataset';
        const metadata = hit.attributes?.metadata?.[0]?.attributes || {};
        const titleText = metadata.info?.name || name;
        const source = metadata.source || 'WRI';
        const provider = hit.attributes?.provider || 'cartodb';

        let landingUrl = `https://resourcewatch.org/data/explore?dataset=${hit.id}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(140, 240, 220, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>SOURCE: ${source}</span>
            <span>PROVIDER: ${provider}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="wri-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(140, 240, 220, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching WRI datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load WRI datasets.</div>`;
    });
}

// --- GLOBAL FOREST WATCH DATASETS VIA GFW DATA API ---
function fetchGfwDatasets(node) {
  const listContainer = document.getElementById('gfw-datasets-list');
  const cardContainer = document.getElementById('gfw-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching Global Forest Watch...</div>`;

  const url = `https://data-api.globalforestwatch.org/datasets`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const allDatasets = data?.data || [];
      const query = node.name.toLowerCase();

      // Filter in-memory by node name first
      let matches = allDatasets.filter(ds => {
        const title = (ds.metadata?.title || '').toLowerCase();
        const dataset = (ds.dataset || '').toLowerCase();
        return title.includes(query) || dataset.includes(query);
      });

      // Fallback 1: Filter by sphere keyword if no direct name results
      if (matches.length === 0 && node.sphere) {
        const sphereQuery = node.sphere.toLowerCase();
        matches = allDatasets.filter(ds => {
          const title = (ds.metadata?.title || '').toLowerCase();
          const dataset = (ds.dataset || '').toLowerCase();
          return title.includes(sphereQuery) || dataset.includes(sphereQuery);
        });
      }

      // Fallback 2: General "forest" keyword filter if both return zero
      if (matches.length === 0) {
        matches = allDatasets.filter(ds => {
          const title = (ds.metadata?.title || '').toLowerCase();
          const dataset = (ds.dataset || '').toLowerCase();
          return title.includes('forest') || dataset.includes('forest');
        });
      }

      return matches.slice(0, 3);
    })
    .then(hits => {
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No Global Forest Watch datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = hit.metadata?.title || hit.dataset;
        const source = hit.metadata?.source || 'GFW';
        const datasetName = hit.dataset;

        // Use GFW search link or direct dataset Open Data page
        let landingUrl = `https://data.globalforestwatch.org/datasets/gfw::${datasetName}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(170, 240, 130, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>SOURCE: ${source}</span>
            <span>NAME: ${datasetName.substring(0, 15)}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="gfw-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(170, 240, 130, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching GFW datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load GFW datasets.</div>`;
    });
}

// --- FAOSTAT DATASETS VIA FAOSTAT CATALOG JSON ---
function fetchFaostatDatasets(node) {
  const listContainer = document.getElementById('faostat-datasets-list');
  const cardContainer = document.getElementById('faostat-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching FAOSTAT...</div>`;

  loadDatasetWithUpdateCheck(
    'faostat_datasets',
    '/faostat-datasets.json',
    'http://fenixservices.fao.org/faostat/api/v1/en/search/datasets',
    data => {
      const allDatasets = data?.Datasets?.Dataset || [];
      const query = node.name.toLowerCase();

      // Filter in-memory by node name first
      let matches = allDatasets.filter(ds => {
        const title = (ds.DatasetName || '').toLowerCase();
        const desc = (ds.DatasetDescription || '').toLowerCase();
        return title.includes(query) || desc.includes(query);
      });

      // Fallback 1: Filter by sphere keyword if no direct name results
      if (matches.length === 0 && node.sphere) {
        const sphereQuery = node.sphere.toLowerCase();
        matches = allDatasets.filter(ds => {
          const title = (ds.DatasetName || '').toLowerCase();
          const desc = (ds.DatasetDescription || '').toLowerCase();
          return title.includes(sphereQuery) || desc.includes(sphereQuery);
        });
      }

      // Fallback 2: General "agriculture" keyword filter if both return zero
      if (matches.length === 0) {
        matches = allDatasets.filter(ds => {
          const title = (ds.DatasetName || '').toLowerCase();
          const desc = (ds.DatasetDescription || '').toLowerCase();
          return title.includes('agriculture') || desc.includes('agriculture') || title.includes('food') || desc.includes('food');
        });
      }

      const hits = matches.slice(0, 3);
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No FAOSTAT datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = hit.DatasetName || 'Unnamed Dataset';
        const code = hit.DatasetCode || hit.DatasetName.substring(0, 3);
        const formatStr = hit.FileType || 'csv';
        const sizeStr = hit.FileSize || 'N/A';

        // Use FAOSTAT specific dataset URL
        let landingUrl = `https://www.fao.org/faostat/en/#data/${code}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(240, 190, 100, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>FORMAT: ${formatStr.toUpperCase()} (${sizeStr})</span>
            <span>CODE: ${code}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="faostat-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(240, 190, 100, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    }
  );
}

// --- GBIF DATASETS VIA GBIF REGISTRY API ---
function fetchGbifDatasets(node) {
  const listContainer = document.getElementById('gbif-datasets-list');
  const cardContainer = document.getElementById('gbif-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching GBIF...</div>`;

  const query = node.name.toLowerCase();
  const url = `https://api.gbif.org/v1/dataset/search?q=${encodeURIComponent(query)}&limit=3`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Invalid HTTP status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data?.results?.length > 0) {
        return data.results.slice(0, 3);
      }
      // Fallback 1: Query by sphere
      if (node.sphere) {
        const sphereQuery = node.sphere.toLowerCase();
        const fallbackUrl = `https://api.gbif.org/v1/dataset/search?q=${encodeURIComponent(sphereQuery)}&limit=3`;
        return fetch(fallbackUrl)
          .then(res => {
            if (!res.ok) throw new Error(`Invalid HTTP status: ${res.status}`);
            return res.json();
          })
          .then(fallbackData => {
            if (fallbackData?.results?.length > 0) {
              return fallbackData.results.slice(0, 3);
            }
            return fetchGeneralFallback();
          });
      }
      return fetchGeneralFallback();
    })
    .then(hits => {
      if (!hits || hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No GBIF datasets found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const titleText = hit.title || 'Unnamed Dataset';
        const key = hit.key || '';
        const typeStr = hit.type || 'METADATA';
        const recordCount = hit.recordCount || 0;

        let recordText = '';
        if (recordCount > 0) {
          recordText = ` (${recordCount.toLocaleString()} RECORDS)`;
        }

        let landingUrl = `https://www.gbif.org/dataset/${key}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(215, 170, 255, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>TYPE: ${typeStr.toUpperCase()}${recordText}</span>
            <span>KEY: ${key.substring(0, 8)}...</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="gbif-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(215, 170, 255, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching GBIF datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load GBIF datasets.</div>`;
    });

  function fetchGeneralFallback() {
    const fallbackUrl = `https://api.gbif.org/v1/dataset/search?q=biodiversity&limit=3`;
    return fetch(fallbackUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Invalid HTTP status: ${res.status}`);
        return res.json();
      })
      .then(d => d?.results?.slice(0, 3) || []);
  }
}

// --- UNEP ENVIRONMENTAL INDICATORS VIA UNSD SDG API ---
function fetchUnepDatasets(node) {
  const listContainer = document.getElementById('unep-datasets-list');
  const cardContainer = document.getElementById('unep-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching UNEP SDG portal...</div>`;

  // Get mapped search terms based on node name/sphere
  const searchTerms = getUnepSdgSearchTerms(node);
  const url = `https://unstats.un.org/SDGAPI/v1/sdg/Indicator/List`;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Invalid HTTP status: ${res.status}`);
      return res.json();
    })
    .then(indicators => {
      // 1. Filter by mapped search terms
      let matches = indicators.filter(ind => {
        const desc = (ind.description || '').toLowerCase();
        const matchesDesc = searchTerms.some(term => desc.includes(term));
        const matchesSeries = ind.series?.some(s => {
          const sDesc = (s.description || '').toLowerCase();
          return searchTerms.some(term => sDesc.includes(term));
        });
        return matchesDesc || matchesSeries;
      });

      // 2. Fallback: general "environment" / "sustainable" search
      if (matches.length === 0) {
        matches = indicators.filter(ind => {
          const desc = (ind.description || '').toLowerCase();
          return desc.includes('environment') || desc.includes('sustainable') || desc.includes('biodiversity');
        });
      }

      return matches.slice(0, 3);
    })
    .then(hits => {
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No UNEP indicators found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const code = hit.code || 'N/A';
        const tier = hit.tier || 'I';
        const descText = hit.description || 'Unnamed Indicator';
        const landingUrl = `https://unstats.un.org/sdgs/dataportal/database?indicator=${encodeURIComponent(code)}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(100, 220, 150, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>INDICATOR ${code}</span>
            <span>TIER ${tier}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="unep-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(100, 220, 150, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${descText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching UNEP datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">Failed to load UNEP indicators.</div>`;
    });
}

function getUnepSdgSearchTerms(node) {
  const name = node.name.toLowerCase();
  const sphere = (node.sphere || '').toLowerCase();

  // Try to match name keywords first
  if (name.includes('forest') || name.includes('deforestation') || name.includes('timber') || name.includes('canopy')) {
    return ['forest', 'land'];
  }
  if (name.includes('methane') || name.includes('carbon') || name.includes('emission') || name.includes('greenhouse') || name.includes('warming') || name.includes('temperature')) {
    return ['emission', 'greenhouse', 'co2'];
  }
  if (name.includes('ocean') || name.includes('marine') || name.includes('sea') || name.includes('acid') || name.includes('coral') || name.includes('reef') || name.includes('fish')) {
    return ['marine', 'acid', 'ocean'];
  }
  if (name.includes('water') || name.includes('river') || name.includes('lake') || name.includes('aquifer') || name.includes('groundwater') || name.includes('rain') || name.includes('precipitation')) {
    return ['water', 'ecosystem'];
  }
  if (name.includes('land') || name.includes('soil') || name.includes('farming') || name.includes('agriculture') || name.includes('crop') || name.includes('cultivation')) {
    return ['land', 'agricultural', 'agriculture'];
  }
  if (name.includes('biodiversity') || name.includes('species') || name.includes('wildlife') || name.includes('ecosystem') || name.includes('habitat') || name.includes('extinction')) {
    return ['biodiversity', 'species', 'protected area'];
  }
  if (name.includes('material') || name.includes('footprint') || name.includes('resource') || name.includes('consumption') || name.includes('depletion') || name.includes('fashion')) {
    return ['material', 'footprint', 'consumption'];
  }
  if (name.includes('waste') || name.includes('pollution') || name.includes('chemical') || name.includes('hazardous') || name.includes('recycl') || name.includes('trash')) {
    return ['waste', 'chemical', 'hazardous'];
  }

  // Fallback to sphere
  if (sphere.includes('water') || sphere.includes('ocean') || sphere.includes('marine')) {
    return ['water', 'marine'];
  }
  if (sphere.includes('land') || sphere.includes('biosphere') || sphere.includes('forest')) {
    return ['land', 'forest', 'biodiversity'];
  }
  if (sphere.includes('atmosphere') || sphere.includes('energy') || sphere.includes('climate')) {
    return ['emission', 'greenhouse'];
  }
  if (sphere.includes('agriculture') || sphere.includes('food')) {
    return ['agricultural', 'land'];
  }

  // General fallback
  return ['environment', 'sustainable', 'biodiversity'];
}

// --- INFORMEA MEA TREATIES VIA INFORMEA ODATA API ---
function fetchInformeaDatasets(node) {
  const listContainer = document.getElementById('informea-datasets-list');
  const cardContainer = document.getElementById('informea-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';
  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Searching InforMEA...</div>`;

  const searchTerms = getInformeaSearchTerms(node);
  loadDatasetWithUpdateCheck(
    'informea_treaties',
    '/informea-treaties.json',
    'https://www.informea.org/api/v1/treaties',
    data => {
      const treaties = data.d?.results || data.d || [];
      
      // 1. Filter by mapped search terms
      let matches = treaties.filter(tr => {
        const title = (tr.titleEnglish || '').toLowerCase();
        const official = (tr.officialNameEnglish || '').toLowerCase();
        return searchTerms.some(term => title.includes(term) || official.includes(term));
      });

      // 2. Fallback: general "climate" or "biodiversity" search
      if (matches.length === 0) {
        matches = treaties.filter(tr => {
          const title = (tr.titleEnglish || '').toLowerCase();
          const official = (tr.officialNameEnglish || '').toLowerCase();
          return title.includes('climate') || official.includes('climate') || title.includes('biodiversity') || official.includes('biodiversity');
        });
      }

      const hits = matches.slice(0, 3);
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No MEA treaties found.</div>`;
        return;
      }

      listContainer.innerHTML = '';
      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const code = (hit.id || 'MEA').toUpperCase();
        const titleText = hit.titleEnglish || 'Unnamed Treaty';
        const landingUrl = hit.url || `https://www.informea.org/treaties/${hit.id}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(255, 120, 150, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>TREATY / PROTOCOL</span>
            <span>ID: ${code}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="informea-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(255, 120, 150, 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${titleText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    }
  );
}

function getInformeaSearchTerms(node) {
  const name = node.name.toLowerCase();
  const sphere = (node.sphere || '').toLowerCase();

  // Try to match name keywords first
  if (name.includes('forest') || name.includes('deforestation') || name.includes('timber') || name.includes('canopy')) {
    return ['biological', 'species', 'biodiversity', 'desertification'];
  }
  if (name.includes('methane') || name.includes('carbon') || name.includes('emission') || name.includes('greenhouse') || name.includes('warming') || name.includes('temperature')) {
    return ['climate', 'unfccc', 'kyoto', 'ozone'];
  }
  if (name.includes('ocean') || name.includes('marine') || name.includes('sea') || name.includes('acid') || name.includes('coral') || name.includes('reef') || name.includes('fish')) {
    return ['marine', 'sea', 'pollution'];
  }
  if (name.includes('water') || name.includes('river') || name.includes('lake') || name.includes('aquifer') || name.includes('groundwater') || name.includes('rain') || name.includes('precipitation')) {
    return ['wetlands', 'water', 'ramsar'];
  }
  if (name.includes('land') || name.includes('soil') || name.includes('farming') || name.includes('agriculture') || name.includes('crop') || name.includes('cultivation')) {
    return ['desertification', 'land', 'agriculture'];
  }
  if (name.includes('biodiversity') || name.includes('species') || name.includes('wildlife') || name.includes('ecosystem') || name.includes('habitat') || name.includes('extinction')) {
    return ['biodiversity', 'biological', 'species', 'cites'];
  }
  if (name.includes('material') || name.includes('footprint') || name.includes('resource') || name.includes('consumption') || name.includes('depletion') || name.includes('fashion')) {
    return ['biological', 'desertification', 'species'];
  }
  if (name.includes('waste') || name.includes('pollution') || name.includes('chemical') || name.includes('hazardous') || name.includes('recycl') || name.includes('trash')) {
    return ['pollution', 'hazardous', 'waste', 'chemical'];
  }

  // Fallback to sphere
  if (sphere.includes('water') || sphere.includes('ocean') || sphere.includes('marine')) {
    return ['marine', 'wetlands', 'water'];
  }
  if (sphere.includes('land') || sphere.includes('biosphere') || sphere.includes('forest')) {
    return ['biodiversity', 'biological', 'desertification'];
  }
  if (sphere.includes('atmosphere') || sphere.includes('energy') || sphere.includes('climate')) {
    return ['climate', 'unfccc', 'kyoto'];
  }
  if (sphere.includes('agriculture') || sphere.includes('food')) {
    return ['desertification', 'agriculture'];
  }

  // General fallback
  return ['climate', 'biodiversity', 'biological'];
}

function clearOpenaqKey() {
  localStorage.setItem('openaq_key_cleared', 'true');
  localStorage.removeItem('openaq_api_key');
}

// --- OPENAQ AIR QUALITY PORTAL VIA OPENAQ API V3 ---
function fetchOpenaqDatasets(node) {
  const listContainer = document.getElementById('openaq-datasets-list');
  const cardContainer = document.getElementById('openaq-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  // OpenAQ keys are user-supplied and remain only in this browser.
  const apiKey = localStorage.getItem('openaq_api_key');

  if (!apiKey) {
    listContainer.innerHTML = `
      <div style="font-size: 13px; color: var(--text-muted); display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
        <div>A free OpenAQ API key is required to retrieve real-time air monitoring stations.</div>
        <div style="display: flex; gap: 8px; margin-top: 4px;">
          <input type="password" id="openaq-key-input" placeholder="Enter OpenAQ API Key..." style="flex: 1; padding: 6px 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.2); background: rgba(0, 0, 0, 0.3); color: #fff; font-size: 12px;" />
          <button id="openaq-save-key-btn" style="padding: 6px 12px; border-radius: 8px; border: none; background: rgba(var(--accent-color-rgb), 0.25); color: #fff; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid rgba(var(--accent-color-rgb), 0.4); transition: background 0.24s;" onmouseover="this.style.background='rgba(var(--accent-color-rgb), 0.45)'" onmouseout="this.style.background='rgba(var(--accent-color-rgb), 0.25)'">Save</button>
        </div>
      </div>
    `;
    
    const saveBtn = document.getElementById('openaq-save-key-btn');
    const keyInput = document.getElementById('openaq-key-input');
    if (saveBtn && keyInput) {
      saveBtn.addEventListener('click', () => {
        const val = keyInput.value.trim();
        if (val) {
          localStorage.setItem('openaq_api_key', val);
          localStorage.removeItem('openaq_key_cleared');
          fetchOpenaqDatasets(node);
        }
      });
      keyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const val = keyInput.value.trim();
          if (val) {
            localStorage.setItem('openaq_api_key', val);
            localStorage.removeItem('openaq_key_cleared');
            fetchOpenaqDatasets(node);
          }
        }
      });
    }
    return;
  }

  listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0; display: flex; justify-content: space-between; align-items: center;">
    <span>Searching OpenAQ...</span>
    <button id="openaq-change-key-btn" style="background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; text-decoration: underline; cursor: pointer;" onmouseover="this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">Change Key</button>
  </div>`;

  const changeBtn = document.getElementById('openaq-change-key-btn');
  if (changeBtn) {
    changeBtn.addEventListener('click', () => {
      clearOpenaqKey();
      fetchOpenaqDatasets(node);
    });
  }

  const query = getOpenaqSearchTerm(node);
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const openaqBase = isLocal ? '/api-openaq/v3' : 'https://api.openaq.org/v3';
  const parametersUrl = `${openaqBase}/parameters?limit=100`;

  fetch(parametersUrl, {
    headers: {
      'X-API-Key': apiKey
    }
  })
    .then(res => {
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearOpenaqKey();
          throw new Error('Unauthorized/Invalid API Key');
        }
        throw new Error(`Invalid HTTP status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      const params = data?.results || [];
      const match = params.find(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(query) || desc.includes(query);
      });

      let locationsUrl = `${openaqBase}/locations?limit=3`;
      if (match) {
        locationsUrl += `&parameters_id=${match.id}`;
      }
      return fetch(locationsUrl, {
        headers: {
          'X-API-Key': apiKey
        }
      });
    })
    .then(res => {
      if (!res.ok) throw new Error(`Invalid HTTP status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      const hits = data?.results || [];
      if (hits.length === 0) {
        listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
          <span>No active stations found.</span>
          <button id="openaq-change-key-btn" style="background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; text-decoration: underline; cursor: pointer;">Change Key</button>
        </div>`;
        const cb = document.getElementById('openaq-change-key-btn');
        if (cb) cb.addEventListener('click', () => { clearOpenaqKey(); fetchOpenaqDatasets(node); });
        return;
      }

      listContainer.innerHTML = '';
      
      const actionsDiv = document.createElement('div');
      actionsDiv.style.display = 'flex';
      actionsDiv.style.justifyContent = 'flex-end';
      actionsDiv.innerHTML = `<button id="openaq-change-key-btn" style="background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; text-decoration: underline; cursor: pointer; margin-bottom: 4px;" onmouseover="this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">Change Key</button>`;
      listContainer.appendChild(actionsDiv);
      const cb = actionsDiv.querySelector('#openaq-change-key-btn');
      if (cb) cb.addEventListener('click', () => { clearOpenaqKey(); fetchOpenaqDatasets(node); });

      hits.forEach(hit => {
        const item = document.createElement('div');
        item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
        item.style.paddingTop = '8px';
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.gap = '4px';

        const nameText = hit.name || `Station #${hit.id}`;
        const countryName = hit.country?.name || 'Global';
        const sensorCount = hit.sensors?.length || 0;
        const landingUrl = `https://explore.openaq.org/locations/${hit.id}`;

        item.innerHTML = `
          <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
            <span>LOCATION: ${countryName.toUpperCase()}</span>
            <span>SENSORS: ${sensorCount}</span>
          </div>
          <a href="${landingUrl}" target="_blank" class="openaq-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
            ${nameText} ↗
          </a>
        `;
        listContainer.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error fetching OpenAQ datasets:', err);
      listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); display: flex; justify-content: space-between; align-items: center;">
        <span>Failed to load stations (${err.message}).</span>
        <button id="openaq-change-key-btn" style="background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; text-decoration: underline; cursor: pointer;">Change Key</button>
      </div>`;
      const cb = document.getElementById('openaq-change-key-btn');
      if (cb) cb.addEventListener('click', () => { clearOpenaqKey(); fetchOpenaqDatasets(node); });
    });
}

function getOpenaqSearchTerm(node) {
  const name = node.name.toLowerCase();
  if (name.includes('methane') || name.includes('carbon') || name.includes('co2')) {
    return 'co2';
  }
  if (name.includes('conveyance') || name.includes('vehicle') || name.includes('nitrogen') || name.includes('no2')) {
    return 'no2';
  }
  if (name.includes('farming') || name.includes('industry') || name.includes('pesticide')) {
    return 'pm25';
  }
  if (name.includes('ozone') || name.includes('o3') || name.includes('stratosphere')) {
    return 'o3';
  }
  if (name.includes('coal') || name.includes('sulfur') || name.includes('so2')) {
    return 'so2';
  }
  return 'pm25';
}

// --- OUR WORLD IN DATA CO2 & GHG DATABASE ---
function getOwidMatchedIndicators(node) {
  const name = node.name.toLowerCase();
  
  if (name.includes('methane')) {
    return [
      { key: 'methane', title: 'Global Methane Emissions', unit: 'million tonnes CO₂e' },
      { key: 'methane_per_capita', title: 'Global Methane per Capita', unit: 'tonnes CO₂e' }
    ];
  }
  if (name.includes('nitrous') || name.includes('farming') || name.includes('pesticide') || name.includes('agricultural') || name.includes('fao')) {
    return [
      { key: 'nitrous_oxide', title: 'Global Nitrous Oxide Emissions', unit: 'million tonnes CO₂e' },
      { key: 'methane', title: 'Global Methane Emissions', unit: 'million tonnes CO₂e' }
    ];
  }
  if (name.includes('deforestation') || name.includes('forestry') || name.includes('land cover') || name.includes('land use') || name.includes('forest')) {
    return [
      { key: 'land_use_change_co2', title: 'Global CO₂ from Land-Use Change', unit: 'million tonnes (Mt)' },
      { key: 'co2_including_luc', title: 'Annual Global CO₂ including Land-Use', unit: 'million tonnes (Mt)' }
    ];
  }
  if (name.includes('coal')) {
    return [
      { key: 'coal_co2', title: 'Global CO₂ Emissions from Coal', unit: 'million tonnes (Mt)' },
      { key: 'cumulative_coal_co2', title: 'Cumulative Coal CO₂ Emissions', unit: 'million tonnes (Mt)' }
    ];
  }
  if (name.includes('oil') || name.includes('conveyance') || name.includes('vehicle') || name.includes('transport') || name.includes('aviation') || name.includes('shipping')) {
    return [
      { key: 'oil_co2', title: 'Global CO₂ Emissions from Oil', unit: 'million tonnes (Mt)' },
      { key: 'co2', title: 'Annual Global CO₂ (excluding Land-Use)', unit: 'million tonnes (Mt)' }
    ];
  }
  if (name.includes('gas') || name.includes('flaring') || name.includes('methane emissions')) {
    return [
      { key: 'gas_co2', title: 'Global CO₂ Emissions from Gas', unit: 'million tonnes (Mt)' },
      { key: 'flaring_co2', title: 'Global CO₂ Emissions from Flaring', unit: 'million tonnes (Mt)' }
    ];
  }
  if (name.includes('cement') || name.includes('urbanization') || name.includes('concrete') || name.includes('infrastructure') || name.includes('materials')) {
    return [
      { key: 'cement_co2', title: 'Global CO₂ Emissions from Cement', unit: 'million tonnes (Mt)' },
      { key: 'co2', title: 'Annual Global CO₂ (excluding Land-Use)', unit: 'million tonnes (Mt)' }
    ];
  }
  if (name.includes('energy') || name.includes('power') || name.includes('electricity') || name.includes('heating')) {
    return [
      { key: 'primary_energy_consumption', title: 'Global Primary Energy Consumption', unit: 'TWh' },
      { key: 'energy_per_capita', title: 'Energy Consumption per Capita', unit: 'kWh' }
    ];
  }
  if (name.includes('gdp') || name.includes('economy') || name.includes('growth') || name.includes('wealth') || name.includes('industr')) {
    return [
      { key: 'gdp', title: 'World Gross Domestic Product (GDP)', unit: 'international-$ (2011 prices)' },
      { key: 'co2_per_gdp', title: 'Global CO₂ Emissions per GDP', unit: 'kg per international-$' }
    ];
  }
  if (name.includes('population') || name.includes('society') || name.includes('migration') || name.includes('consumer') || name.includes('waste')) {
    return [
      { key: 'population', title: 'World Population', unit: 'people' },
      { key: 'co2_per_capita', title: 'Global CO₂ Emissions per Capita', unit: 'tonnes per person' }
    ];
  }
  
  // Default fallback (CO2 & Total GHG)
  return [
    { key: 'co2', title: 'Annual Global CO₂ (excluding Land-Use)', unit: 'million tonnes (Mt)' },
    { key: 'total_ghg', title: 'Global Greenhouse Gas Emissions', unit: 'million tonnes CO₂e' }
  ];
}

const OWID_FALLBACK_INDICATOR_META = {
  co2: {
    title: 'Annual Global CO2 (excluding Land-Use)',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/grapher/annual-co2-emissions-per-country?tab=chart&country=~OWID_WRL'
  },
  total_ghg: {
    title: 'Global Greenhouse Gas Emissions',
    unit: 'million tonnes CO2e',
    ourworldindata_url: 'https://ourworldindata.org/grapher/total-ghg-emissions?tab=chart&country=~OWID_WRL'
  },
  methane: {
    title: 'Global Methane Emissions',
    unit: 'million tonnes CO2e',
    ourworldindata_url: 'https://ourworldindata.org/grapher/methane-emissions?tab=chart&country=~OWID_WRL'
  },
  methane_per_capita: {
    title: 'Global Methane per Capita',
    unit: 'tonnes CO2e',
    ourworldindata_url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions'
  },
  nitrous_oxide: {
    title: 'Global Nitrous Oxide Emissions',
    unit: 'million tonnes CO2e',
    ourworldindata_url: 'https://ourworldindata.org/grapher/nitrous-oxide-emissions?tab=chart&country=~OWID_WRL'
  },
  land_use_change_co2: {
    title: 'Global CO2 from Land-Use Change',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/grapher/annual-co2-emissions-from-land-use-change?tab=chart&country=~OWID_WRL'
  },
  co2_including_luc: {
    title: 'Annual Global CO2 including Land-Use',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions'
  },
  coal_co2: {
    title: 'Global CO2 Emissions from Coal',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/grapher/annual-co-emissions-by-fuel-line?tab=chart&country=~OWID_WRL'
  },
  cumulative_coal_co2: {
    title: 'Cumulative Coal CO2 Emissions',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions'
  },
  oil_co2: {
    title: 'Global CO2 Emissions from Oil',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/grapher/annual-co-emissions-by-fuel-line?tab=chart&country=~OWID_WRL'
  },
  gas_co2: {
    title: 'Global CO2 Emissions from Gas',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/grapher/annual-co-emissions-by-fuel-line?tab=chart&country=~OWID_WRL'
  },
  flaring_co2: {
    title: 'Global CO2 Emissions from Flaring',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions'
  },
  cement_co2: {
    title: 'Global CO2 Emissions from Cement',
    unit: 'million tonnes (Mt)',
    ourworldindata_url: 'https://ourworldindata.org/grapher/annual-co-emissions-by-fuel-line?tab=chart&country=~OWID_WRL'
  },
  primary_energy_consumption: {
    title: 'Global Primary Energy Consumption',
    unit: 'TWh',
    ourworldindata_url: 'https://ourworldindata.org/grapher/primary-energy-cons?tab=chart&country=~OWID_WRL'
  },
  energy_per_capita: {
    title: 'Energy Consumption per Capita',
    unit: 'kWh',
    ourworldindata_url: 'https://ourworldindata.org/grapher/primary-energy-cons-per-capita?tab=chart&country=~OWID_WRL'
  },
  gdp: {
    title: 'World Gross Domestic Product (GDP)',
    unit: 'international-$ (2011 prices)',
    ourworldindata_url: 'https://ourworldindata.org/economic-growth'
  },
  co2_per_gdp: {
    title: 'Global CO2 Emissions per GDP',
    unit: 'kg per international-$',
    ourworldindata_url: 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions'
  },
  population: {
    title: 'World Population',
    unit: 'people',
    ourworldindata_url: 'https://ourworldindata.org/world-population-growth'
  },
  co2_per_capita: {
    title: 'Global CO2 Emissions per Capita',
    unit: 'tonnes per person',
    ourworldindata_url: 'https://ourworldindata.org/grapher/co-emissions-per-capita?tab=chart&country=~OWID_WRL'
  }
};

function getOwidIndicatorMeta(key, fallbackMatch = {}) {
  const catalogEntry = owidCatalog?.indicator_summaries?.find(entry => entry.key === key);
  if (catalogEntry) {
    return catalogEntry;
  }
  return {
    key,
    ...OWID_FALLBACK_INDICATOR_META[key],
    title: fallbackMatch.title,
    unit: fallbackMatch.unit
  };
}

function fetchOwidDatasets(node) {
  const listContainer = document.getElementById('owid-datasets-list');
  const cardContainer = document.getElementById('owid-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!owidGlobalData || owidGlobalData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Our World in Data CO2 Index...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchOwidDatasets(node);
      }
    }, 200);
    return;
  }

  const matches = getOwidMatchedIndicators(node);
  listContainer.innerHTML = '';

  if (owidCatalog?.learnings?.length) {
    const summary = document.createElement('div');
    summary.style.fontSize = '12px';
    summary.style.lineHeight = '1.45';
    summary.style.color = 'rgba(255,255,255,0.62)';
    summary.style.paddingBottom = '8px';
    summary.textContent = owidCatalog.learnings[0];
    listContainer.appendChild(summary);
  }

  matches.forEach(match => {
    const indicatorMeta = getOwidIndicatorMeta(match.key, match);
    // Extract timeseries for this specific key
    const timeseries = owidGlobalData
      .map(d => ({ year: d.year, val: d[match.key] }))
      .filter(d => d.val !== null && d.val !== undefined);

    if (timeseries.length === 0) {
      return; // Skip if no data for this column
    }

    // Sort by year ascending
    timeseries.sort((a, b) => a.year - b.year);

    const latestPoint = timeseries[timeseries.length - 1];
    const latestVal = latestPoint.val;
    const latestYear = latestPoint.year;

    // Find point from 10 years ago (or closest available prior to that)
    const tenYearsAgoYear = latestYear - 10;
    const tenYearsAgoPoint = timeseries.find(d => d.year === tenYearsAgoYear) || 
                            timeseries.find(d => d.year >= tenYearsAgoYear - 2 && d.year <= tenYearsAgoYear + 2) ||
                            timeseries[0];

    let trendHtml = '';
    if (tenYearsAgoPoint && tenYearsAgoPoint !== latestPoint) {
      const oldVal = tenYearsAgoPoint.val;
      const pctChange = ((latestVal - oldVal) / oldVal) * 100;
      const sign = pctChange >= 0 ? '+' : '';
      const isNegativeMetric = match.key !== 'gdp' && match.key !== 'population';
      const trendColor = isNegativeMetric ? (pctChange >= 0 ? '#ff6b6b' : '#51cf66') : (pctChange >= 0 ? '#51cf66' : '#ff6b6b');
      
      trendHtml = `<span style="font-size: 12px; color: ${trendColor}; font-weight: 600; margin-left: 6px;">${sign}${pctChange.toFixed(1)}% (10y)</span>`;
    }

    // Format value with abbreviation if very large
    let formattedVal = '';
    if (match.key === 'population') {
      formattedVal = (latestVal / 1000000000).toFixed(2) + ' B';
    } else if (match.key === 'gdp') {
      formattedVal = (latestVal / 1000000000000).toFixed(2) + ' T';
    } else {
      formattedVal = latestVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    // Generate sparkline values
    const sparklineVals = timeseries.slice(-20).map(d => d.val);
    const sparklineSvg = generateOwidSparklineSvg(sparklineVals);

    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.gap = '10px';

    const redirectUrl = indicatorMeta.ourworldindata_url || 'https://ourworldindata.org/co2-and-greenhouse-gas-emissions';

    item.innerHTML = `
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 12px; color: rgba(64, 224, 208, 0.95); font-weight: 500; letter-spacing: 0.5px;">${match.key.toUpperCase()}</div>
        <div style="font-size: 13px; color: #ffffff; font-weight: 500; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${indicatorMeta.title || match.title}">
          ${indicatorMeta.title || match.title}
        </div>
        <div style="font-size: 12px; color: rgba(255, 255, 255, 0.55); margin-top: 2px;">
          ${formattedVal} <span style="font-size: 9pt; color: rgba(255,255,255,0.4);">${indicatorMeta.unit || match.unit}</span> (${latestYear})${trendHtml}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
        ${sparklineSvg}
        <a href="${redirectUrl}" target="_blank" style="font-size: 9pt; color: rgba(255,255,255,0.4); text-decoration: none; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; transition: color 0.24s;" onmouseover="this.style.color='rgba(64, 224, 208, 0.95)'" onmouseout="this.style.color='rgba(255,255,255,0.4)'">
          OWID Chart ↗
        </a>
      </div>
    `;

    listContainer.appendChild(item);
  });

  if (listContainer.children.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No matching OWID CO2 indicators available.</div>`;
  }
}

function generateOwidSparklineSvg(dataPoints, width = 70, height = 22) {
  if (dataPoints.length < 2) return '';
  const minVal = Math.min(...dataPoints);
  const maxVal = Math.max(...dataPoints);
  const range = maxVal - minVal || 1;
  
  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * width;
    const y = height - ((val - minVal) / range) * height;
    const clampedY = Math.max(1, Math.min(height - 1, y));
    return `${x.toFixed(1)},${clampedY.toFixed(1)}`;
  });
  
  return `
    <svg width="${width}" height="${height}" style="overflow: visible; display: block;">
      <polyline points="${points.join(' ')}" fill="none" stroke="rgba(64, 224, 208, 0.85)" stroke-width="1.5" />
      <circle cx="${points[points.length - 1].split(',')[0]}" cy="${points[points.length - 1].split(',')[1]}" r="2" fill="rgba(64, 224, 208, 0.95)" />
    </svg>
  `;
}

// --- STOCKHOLM RESILIENCE CENTRE (PLANETARY BOUNDARIES) ---
function getSrcMatchedBoundaries(node) {
  const name = node.name.toLowerCase();
  
  if (name.includes('carbon') || name.includes('emission') || name.includes('methane') || name.includes('greenhouse') || name.includes('climate') || name.includes('co2')) {
    return ['climate_change'];
  }
  if (name.includes('deforestation') || name.includes('forest') || name.includes('land cover') || name.includes('land use') || name.includes('soil')) {
    return ['land_system_change', 'biosphere_integrity'];
  }
  if (name.includes('farming') || name.includes('pesticide') || name.includes('agricultural') || name.includes('nitrous') || name.includes('nitrogen') || name.includes('phosphorus') || name.includes('fao')) {
    return ['biogeochemical_flows', 'novel_entities'];
  }
  if (name.includes('aquifer') || name.includes('irrigation') || name.includes('freshwater') || name.includes('water') || name.includes('river') || name.includes('streamflow')) {
    return ['freshwater_change'];
  }
  if (name.includes('extinction') || name.includes('species') || name.includes('biodiversity') || name.includes('integrity') || name.includes('habitat') || name.includes('fauna') || name.includes('flora')) {
    return ['biosphere_integrity'];
  }
  if (name.includes('ozone') || name.includes('stratosphere') || name.includes('uv') || name.includes('cfc')) {
    return ['stratospheric_ozone'];
  }
  if (name.includes('acidification') || name.includes('acidity') || name.includes('ph') || name.includes('aragonite') || name.includes('ocean')) {
    return ['ocean_acidification'];
  }
  if (name.includes('aerosol') || name.includes('dust') || name.includes('particulate') || name.includes('pm25') || name.includes('pm10') || name.includes('air quality') || name.includes('so2') || name.includes('no2')) {
    return ['atmospheric_aerosols', 'climate_change'];
  }
  if (name.includes('chemical') || name.includes('pollution') || name.includes('plastic') || name.includes('synthetic') || name.includes('toxin') || name.includes('metal') || name.includes('waste')) {
    return ['novel_entities'];
  }
  
  // Default fallbacks based on node sphere
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  if (sphere.includes('atmosphere')) {
    return ['climate_change'];
  }
  if (sphere.includes('ocean')) {
    return ['ocean_acidification', 'climate_change'];
  }
  if (sphere.includes('biosphere') || sphere.includes('land')) {
    return ['biosphere_integrity', 'land_system_change'];
  }
  
  return ['climate_change', 'biosphere_integrity'];
}

function fetchSrcDatasets(node) {
  const listContainer = document.getElementById('src-datasets-list');
  const cardContainer = document.getElementById('src-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!srcBoundariesData || srcBoundariesData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Planetary Boundaries...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchSrcDatasets(node);
      }
    }, 200);
    return;
  }

  const matches = getSrcMatchedBoundaries(node);
  listContainer.innerHTML = '';

  matches.forEach(boundaryId => {
    const boundary = srcBoundariesData.find(b => b.id === boundaryId);
    if (!boundary) return;

    // Calculate indicator layout position
    let basePct = 0;
    let safePct = 50;
    let currPct = 0;

    const isDecreasing = boundary.pre_industrial > boundary.safe_boundary;
    
    if (isDecreasing) {
      const maxVal = boundary.pre_industrial; 
      const minVal = Math.min(boundary.current_value, boundary.safe_boundary) - 10; 
      const range = maxVal - minVal;
      
      basePct = 100;
      safePct = ((boundary.safe_boundary - minVal) / range) * 100;
      currPct = ((boundary.current_value - minVal) / range) * 100;
    } else {
      const minVal = boundary.pre_industrial; 
      const maxVal = Math.max(boundary.current_value, boundary.safe_boundary) * 1.1; 
      const range = maxVal - minVal;
      
      basePct = 0;
      safePct = ((boundary.safe_boundary - minVal) / range) * 100;
      currPct = ((boundary.current_value - minVal) / range) * 100;
    }

    safePct = Math.max(0, Math.min(100, safePct));
    currPct = Math.max(0, Math.min(100, currPct));

    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '6px';

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 12px; color: ${boundary.status_color}; font-weight: 500; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;">
            <span>${boundary.id.toUpperCase().replace(/_/g, ' ')}</span>
            <span style="font-size: 9pt; padding: 2px 6px; border-radius: 4px; background: ${boundary.status_color}25; border: 1px solid ${boundary.status_color}50; font-weight: 600; text-transform: uppercase;">${boundary.status}</span>
          </div>
          <a href="${boundary.link}" target="_blank" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='${boundary.status_color}'" onmouseout="this.style.color='#ffffff'">
            ${boundary.name} ↗
          </a>
          <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3; margin-top: 2px;">
            ${boundary.description}
          </div>
        </div>
      </div>

      <div style="margin-top: 4px; padding: 0 4px;">
        <div style="display: flex; justify-content: space-between; font-size: 9pt; color: rgba(255,255,255,0.4); margin-bottom: 3px;">
          <span>Baseline: ${boundary.pre_industrial} ${boundary.unit}</span>
          <span>Boundary Limit: ${boundary.safe_boundary}</span>
        </div>
        <div style="position: relative; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: visible; margin-bottom: 15px;">
          <div style="position: absolute; left: ${isDecreasing ? currPct : 0}%; right: ${isDecreasing ? 100 - basePct : 100 - currPct}%; height: 100%; background: ${boundary.status_color}; opacity: 0.75; border-radius: 3px;"></div>
          
          <div style="position: absolute; left: ${safePct}%; width: 2px; height: 10px; background: #fff; top: -2px; z-index: 2;" title="Safe Boundary Limit: ${boundary.safe_boundary}">
            <div style="position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); font-size: 9pt; color: #fff; font-weight: 500; white-space: nowrap; text-transform: uppercase;">SAFE LIMIT</div>
          </div>
          
          <div style="position: absolute; left: ${currPct}%; width: 6px; height: 6px; border-radius: 50%; background: ${boundary.status_color}; top: 0px; box-shadow: 0 0 8px ${boundary.status_color}; z-index: 3;" title="Current Value: ${boundary.current_value}">
            <div style="position: absolute; top: 8px; left: 50%; transform: translateX(-50%); font-size: 9pt; color: ${boundary.status_color}; font-weight: 600; white-space: nowrap;">CURRENT: ${boundary.current_value}</div>
          </div>
        </div>
      </div>
    `;

    listContainer.appendChild(item);
  });

  if (listContainer.children.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted);">No matching Planetary Boundaries.</div>`;
  }
}

// --- ASIAN DEVELOPMENT BANK (ADB) PROGRAMS ---
function fetchAdbDatasets(node) {
  const listContainer = document.getElementById('adb-datasets-list');
  const cardContainer = document.getElementById('adb-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!adbDatasetsData || adbDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading ADB Programs...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchAdbDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter programs based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedPrograms = adbDatasetsData.filter(program => {
    return program.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default to climate change program if none matched
  const finalPrograms = matchedPrograms.length > 0 ? matchedPrograms : [adbDatasetsData[1]];

  listContainer.innerHTML = '';

  finalPrograms.slice(0, 2).forEach(program => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(255, 193, 7, 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between;">
        <span>PROGRAM: ${program.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>${program.funding_allocated}</span>
      </div>
      <a href="${program.link}" target="_blank" class="adb-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(255, 193, 7, 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${program.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${program.description}
      </div>
      <div style="font-size: 12px; color: rgba(255, 193, 7, 0.85); font-style: italic; margin-top: 2px;">
        Target: ${program.target}
      </div>
    `;
    listContainer.appendChild(item);
  });

  // Append a beautiful vertical bar chart representing ADB Climate Finance Commitments (2019-2024)
  const chartDiv = document.createElement('div');
  chartDiv.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
  chartDiv.style.paddingTop = '10px';
  chartDiv.style.marginTop = '6px';
  chartDiv.style.display = 'flex';
  chartDiv.style.flexDirection = 'column';
  chartDiv.style.gap = '8px';

  // Commitments timeseries data
  const commitments = [
    { year: '2019', val: 6.1 },
    { year: '2020', val: 5.3 },
    { year: '2021', val: 4.8 },
    { year: '2022', val: 6.7 },
    { year: '2023', val: 9.8 },
    { year: '2024', val: 12.3 }
  ];

  const chartWidth = 220;
  const chartHeight = 60;
  const barWidth = 20;
  const spacing = 15;
  const maxVal = 14;

  const barsSvg = commitments.map((c, idx) => {
    const x = idx * (barWidth + spacing) + 10;
    const barHeight = (c.val / maxVal) * chartHeight;
    const y = chartHeight - barHeight;
    return `
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="rgba(255, 193, 7, 0.15)" stroke="rgba(255, 193, 7, 0.95)" stroke-width="1" rx="2" ry="2">
        <title>${c.year}: $${c.val} Billion</title>
      </rect>
      <text x="${x + barWidth/2}" y="${y - 4}" font-size="9pt" fill="#ffffff" font-weight="500" text-anchor="middle">$${c.val}B</text>
      <text x="${x + barWidth/2}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.4)" text-anchor="middle">${c.year}</text>
    `;
  }).join('');

  chartDiv.innerHTML = `
    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.45); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;">
      ADB Climate Finance Commitments (USD Billion)
    </div>
    <div style="display: flex; justify-content: center; align-items: center; margin-top: 5px; margin-bottom: 5px;">
      <svg width="${chartWidth}" height="${chartHeight + 16}" style="overflow: visible; display: block;">
        ${barsSvg}
      </svg>
    </div>
    <div style="font-size: 12px; color: rgba(255,255,255,0.4); line-height: 1.3; font-style: italic; border-top: 1px dotted rgba(255,255,255,0.08); padding-top: 4px; display: flex; justify-content: space-between; align-items: center;">
      <span>Target: $100B Cumulative (2019-2030)</span>
      <a href="https://data.adb.org" target="_blank" style="color: rgba(255,193,7,0.95); text-decoration: none; font-weight: 500;" onmouseover="this.style.color='rgba(255, 193, 7, 0.95)'" onmouseout="this.style.color='rgba(255, 193, 7, 0.85)'">ADB Data Library ↗</a>
    </div>
  `;

  listContainer.appendChild(chartDiv);
}

// --- UN ESCAP DATASETS & API FETCH ---
function fetchEscapDatasets(node) {
  const listContainer = document.getElementById('escap-datasets-list');
  const cardContainer = document.getElementById('escap-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!escapDatasetsData || escapDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading ESCAP Indicators...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchEscapDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter ESCAP indicators based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedIndicators = escapDatasetsData.filter(indicator => {
    return indicator.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default to Real GDP growth and GHG emissions if none matched
  const finalIndicators = matchedIndicators.length > 0 ? matchedIndicators : [escapDatasetsData[0], escapDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render the matched indicators (limit to 2 for side console clean layout)
  finalIndicators.slice(0, 2).forEach(indicator => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `http://api-dataexplorer.unescap.org/rest/v2/data/DF_ESCAP_SDG/.${indicator.id.toUpperCase()}...`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API BLOCKED (CORS/MIXED CONTENT)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>INDICATOR: ${indicator.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${indicator.timeseries[indicator.timeseries.length - 1].value}${indicator.unit}</span>
      </div>
      <a href="${indicator.link}" target="_blank" class="escap-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${indicator.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${indicator.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = indicator.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val}${indicator.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="escap-grad-${indicator.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#escap-grad-${indicator.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.text())
      .catch(err => {
        console.warn(`Live ESCAP API fetch failed as expected (Mixed Content / CORS / Sandbox):`, err);
      });
  });
}

// --- ICIMOD RDS DATASETS & API FETCH ---
function fetchRdsDatasets(node) {
  const listContainer = document.getElementById('rds-datasets-list');
  const cardContainer = document.getElementById('rds-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!rdsDatasetsData || rdsDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading RDS Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchRdsDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter RDS datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = rdsDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default to Glacial Lake Inventory if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [rdsDatasetsData[0], rdsDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render the matched datasets (limit to 2)
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API endpoint using GeoNetwork metadata services (usually port 8080)
    const apiEndpoint = `http://rds.icimod.org:8080/geonetwork/srv/api/records/${dataset.id}`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API BLOCKED (CORS/PORT 8080)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>STATUS: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="rds-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="rds-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#rds-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn(`Live ICIMOD RDS API fetch failed as expected (Mixed Content / CORS / Port 8080):`, err);
      });
  });
}

// --- ASMC DATASETS & API FETCH ---
function fetchAsmcDatasets(node) {
  const listContainer = document.getElementById('asmc-datasets-list');
  const cardContainer = document.getElementById('asmc-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!asmcDatasetsData || asmcDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading ASMC Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchAsmcDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter ASMC datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = asmcDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default to Northern Hotspots if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [asmcDatasetsData[0], asmcDatasetsData[2]];

  listContainer.innerHTML = '';

  // Render the matched datasets (limit to 2)
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://asmc.asean.org/api/v1/hazemonitoring/${dataset.id}`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/WIS 2.0 ACCESS)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="asmc-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="asmc-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#asmc-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live ASMC API fetch failed as expected (Mixed Content / CORS / WIS 2.0 Access):", err);
      });
  });
}

// --- MRC DATASETS & API FETCH ---
function fetchMrcDatasets(node) {
  const listContainer = document.getElementById('mrc-datasets-list');
  const cardContainer = document.getElementById('mrc-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!mrcDatasetsData || mrcDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading MRC Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchMrcDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter MRC datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = mrcDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default to Water Levels if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [mrcDatasetsData[0], mrcDatasetsData[2]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://portal.mrcmekong.org/api/v1/hydromet/station/${dataset.id}`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/SIGN-IN REQUIRED)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="mrc-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="mrc-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#mrc-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live MRC API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- SERVIR DATASETS & API FETCH ---
function fetchServirDatasets(node) {
  const listContainer = document.getElementById('servir-datasets-list');
  const cardContainer = document.getElementById('servir-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!servirDatasetsData || servirDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading SERVIR Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchServirDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter SERVIR datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = servirDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [servirDatasetsData[0], servirDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://climateserv.servirglobal.net/api/v1/request/submitDataRequest/?datatype=0&begintime=01/01/2015&endtime=12/31/2024&intervaltype=0&operationtype=5&geometry={"type":"Polygon","coordinates":[[[100,10],[108,10],[108,20],[100,20],[100,10]]]}&id=${dataset.id}`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/CLIMATESERV)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="servir-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="servir-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#servir-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live ClimateSERV API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- APCC DATASETS & API FETCH ---
function fetchApccDatasets(node) {
  const listContainer = document.getElementById('apcc-datasets-list');
  const cardContainer = document.getElementById('apcc-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!apccDatasetsData || apccDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading APCC Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchApccDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter APCC datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = apccDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [apccDatasetsData[0], apccDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://clik.apcc21.org/api/v1/mme/forecast?dataset=${dataset.id}&lat=15.0&lon=101.0&forecast_run=latest`;

    const apiCallStatusHtml = ``;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <div class="apcc-dataset-link" style="font-size: 13px; color: #ffffff; font-weight: 500; line-height: 1.4;">
        ${dataset.name}
      </div>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="apcc-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#apcc-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live CLIK API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- JMA DATASETS & API FETCH ---
function fetchJmaDatasets(node) {
  const listContainer = document.getElementById('jma-datasets-list');
  const cardContainer = document.getElementById('jma-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!jmaDatasetsData || jmaDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading JMA Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchJmaDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter JMA datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = jmaDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [jmaDatasetsData[0], jmaDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator (station 47662 is Tokyo)
    const apiEndpoint = `https://ds.data.jma.go.jp/tcc/tcc/api/v1/climatview?station=47662&element=${dataset.id}`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/JMA TCC)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="jma-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="jma-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#jma-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live JMA TCC API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live JMA TCC API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- WMO DATASETS & API FETCH ---
function fetchWmoDatasets(node) {
  const listContainer = document.getElementById('wmo-datasets-list');
  const cardContainer = document.getElementById('wmo-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!wmoDatasetsData || wmoDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading WMO Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchWmoDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter WMO datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = wmoDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [wmoDatasetsData[0], wmoDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://wis2.wmo.int/api/v1/gdc/collections/datasets/items?id=${dataset.id}`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/WIS 2.0)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="wmo-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="wmo-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#wmo-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live WMO WIS 2.0 API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- SAHF DATASETS & API FETCH ---
function fetchSahfDatasets(node) {
  const listContainer = document.getElementById('sahf-datasets-list');
  const cardContainer = document.getElementById('sahf-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!sahfDatasetsData || sahfDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading SAHF Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchSahfDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter SAHF datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = sahfDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [sahfDatasetsData[0], sahfDatasetsData[1]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://www.sahf.info/api/v1/sascof/outlook?indicator=${dataset.id}&forecast_run=latest`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/SAHF PORTAL)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="sahf-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="sahf-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#sahf-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live SAHF / SASCOF API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- MOSDAC DATASETS & API FETCH ---
function fetchMosdacDatasets(node) {
  const listContainer = document.getElementById('mosdac-datasets-list');
  const cardContainer = document.getElementById('mosdac-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!mosdacDatasetsData || mosdacDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading MOSDAC Datasets...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchMosdacDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter MOSDAC datasets based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = mosdacDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [mosdacDatasetsData[0], mosdacDatasetsData[2]];

  listContainer.innerHTML = '';

  // Render matched datasets
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for this indicator
    const apiEndpoint = `https://mosdac.gov.in/api/v1/download/search?datasetId=${dataset.id.toUpperCase()}&startTime=2015-01-01T00:00:00Z&endTime=2024-12-31T23:59:59Z`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/SSO REQUIRED)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>DATASET: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="mosdac-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255, 255, 255, 0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="mosdac-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#mosdac-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    // Background call to demonstrate API request attempt
    fetch(apiEndpoint, { mode: 'cors' })
      .then(res => res.json())
      .catch(err => {
        console.warn("Live MOSDAC API fetch failed as expected (Mixed Content / CORS / Credentials Required):", err);
      });
  });
}

// --- PROJECT DRAWDOWN DATASETS & API FETCH ---
function fetchDrawdownDatasets(node) {
  const listContainer = document.getElementById('drawdown-datasets-list');
  const cardContainer = document.getElementById('drawdown-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!drawdownDatasetsData || drawdownDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Drawdown Solutions...</div>`;
    
    // Check back in 200ms if data hasn't loaded yet
    setTimeout(() => {
      if (currentSelectedNode === node) {
        fetchDrawdownDatasets(node);
      }
    }, 200);
    return;
  }

  // Filter solutions based on keywords
  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  
  const matchedDatasets = drawdownDatasetsData.filter(dataset => {
    return dataset.keywords.some(kw => name.includes(kw) || sphere.includes(kw));
  });

  // Default if none matched
  const finalDatasets = matchedDatasets.length > 0 ? matchedDatasets : [drawdownDatasetsData[0], drawdownDatasetsData[2]];

  listContainer.innerHTML = '';

  // Render matched solutions
  finalDatasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    // Simulated API Endpoint for Drawdown Solutions
    const apiEndpoint = `https://api.drawdown.org/v1/solutions/${dataset.id.replace('drawdown_', '')}?scenario=plausible`;

    const apiCallStatusHtml = `
      <div style="font-size: 12px; color: rgba(255, 107, 107, 0.9); font-weight: 500; font-family: monospace; display: flex; align-items: center; gap: 4px; padding: 2px 4px; background: rgba(255, 107, 107, 0.08); border-radius: 4px; border: 1px solid rgba(255, 107, 107, 0.15); width: fit-content;">
        <span>API RESTRICTED (CORS/EXPLORER ONLY)</span>
      </div>
    `;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>SOLUTION: ${dataset.id.toUpperCase().replace('DRAWDOWN_', '').replace(/_/g, ' ')}</span>
        <span>LATEST: ${dataset.timeseries[dataset.timeseries.length - 1].value} ${dataset.unit.split('/')[0]}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="drawdown-dataset-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    listContainer.appendChild(item);

    // Draw time-series SVG area/line chart
    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="drawdown-grad-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          
          <polygon points="${areaPoints}" fill="url(#drawdown-grad-${dataset.id})" />
          
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          
          ${circlesSvg}
          
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    listContainer.appendChild(chartDiv);

    fetch(apiEndpoint, { mode: 'cors' })
      .catch(err => {
        console.warn("Live Drawdown API fetch failed as expected (CORS / Explorer Only):", err);
      });
  });
}

// --- PIK POTSDAM & WORLD BANK CCKP PROJECTIONS ---
function fetchPikWbDatasets(node) {
  const listContainer = document.getElementById('pik-wb-datasets-list');
  const cardContainer = document.getElementById('pik-wb-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!pikWbDatasetsData || pikWbDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Projections...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchPikWbDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = pikWbDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [pikWbDatasetsData[0], pikWbDatasetsData[1]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'pik-wb-grad', 'https://www.pik-potsdam.de/api/v1/projections', 'API RESTRICTED (CORS/PIK-WB PORTAL)');
}

// --- KMA & IMD NATIONAL CLIMATE SERVICES ---
function fetchKmaImdDatasets(node) {
  const listContainer = document.getElementById('kma-imd-datasets-list');
  const cardContainer = document.getElementById('kma-imd-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!kmaImdDatasetsData || kmaImdDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Met Services...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchKmaImdDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = kmaImdDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [kmaImdDatasetsData[0], kmaImdDatasetsData[1]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'kma-imd-grad', 'https://dsp.imdpune.gov.in/api/v1/indices', 'API RESTRICTED (CORS/KMA-IMD SERVICES)');
}

// --- IUCN RED LIST & UN BIODIVERSITY LAB ---
function fetchIucnUnblDatasets(node) {
  const listContainer = document.getElementById('iucn-unbl-datasets-list');
  const cardContainer = document.getElementById('iucn-unbl-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!iucnUnblDatasetsData || iucnUnblDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Biodiversity Data...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchIucnUnblDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = iucnUnblDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [iucnUnblDatasetsData[0], iucnUnblDatasetsData[2]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'iucn-unbl-grad', 'https://api.iucnredlist.org/api/v4/assessments', 'API RESTRICTED (CORS/TOKEN REQUIRED)');
}

// --- UNEP WESR & EARTH.ORG SENSING ---
function fetchUnepWesrDatasets(node) {
  const listContainer = document.getElementById('unep-wesr-datasets-list');
  const cardContainer = document.getElementById('unep-wesr-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!unepWesrDatasetsData || unepWesrDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Sensing Data...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchUnepWesrDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = unepWesrDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [unepWesrDatasetsData[0], unepWesrDatasetsData[2]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'unep-wesr-grad', 'https://wesr.unep.org/api/v1/sensing', 'API RESTRICTED (CORS/WESR SENSING)');
}

// --- GLOBAL DISASTER RISK REGISTRY (UNDRR & EM-DAT) ---
function fetchUndrrEmdatDatasets(node) {
  const listContainer = document.getElementById('undrr-emdat-datasets-list');
  const cardContainer = document.getElementById('undrr-emdat-datasets-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!undrrEmdatDatasetsData || undrrEmdatDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Hazard Data...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchUndrrEmdatDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = undrrEmdatDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [undrrEmdatDatasetsData[0], undrrEmdatDatasetsData[1]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'undrr-emdat-grad', 'https://api.emdat.be/v1/disasters', 'API RESTRICTED (CORS/EM-DAT PORTAL)');
}

// --- IEA ENERGY & CLIMATE REALITY TRANSITION ---
function fetchIeaCrDatasets(node) {
  const listContainer = document.getElementById('iea-cr-transition-list');
  const cardContainer = document.getElementById('iea-cr-transition-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!ieaCrDatasetsData || ieaCrDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading Energy Data...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchIeaCrDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = ieaCrDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [ieaCrDatasetsData[0], ieaCrDatasetsData[2]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'iea-cr-grad', 'https://api.iea.org/v1/transition', 'API RESTRICTED (CORS/IEA DATA)');
}

// --- IPCC SCIENTIFIC SCENARIO PORTAL ---
function fetchIpccScenariosDatasets(node) {
  const listContainer = document.getElementById('ipcc-scenarios-list');
  const cardContainer = document.getElementById('ipcc-scenarios-card');
  if (!listContainer || !cardContainer) return;

  cardContainer.style.display = 'block';

  if (!ipccScenariosDatasetsData || ipccScenariosDatasetsData.length === 0) {
    listContainer.innerHTML = `<div style="font-size: 13px; color: var(--text-muted); padding: 5px 0;">Loading IPCC Scenarios...</div>`;
    setTimeout(() => { if (currentSelectedNode === node) fetchIpccScenariosDatasets(node); }, 200);
    return;
  }

  const name = node.name.toLowerCase();
  const sphere = node.sphere ? node.sphere.toLowerCase() : '';
  const matched = ipccScenariosDatasetsData.filter(d => d.keywords.some(kw => name.includes(kw) || sphere.includes(kw)));
  const final = matched.length > 0 ? matched : [ipccScenariosDatasetsData[2], ipccScenariosDatasetsData[3]];

  listContainer.innerHTML = '';
  renderStandardTimeseriesList(final, listContainer, 'ipcc-scenarios-grad', 'https://api.ipcc.ch/v1/scenarios', 'API RESTRICTED (CORS/IPCC PORTAL)');
}

// Reusable timeseries formatter and sparkline SVG renderer
function renderStandardTimeseriesList(datasets, container, gradPrefix, apiRoot, warningMsg) {
  datasets.slice(0, 2).forEach(dataset => {
    const item = document.createElement('div');
    item.style.borderTop = '1px solid rgba(255, 255, 255, 0.08)';
    item.style.paddingTop = '8px';
    item.style.display = 'flex';
    item.style.flexDirection = 'column';
    item.style.gap = '4px';

    const apiEndpoint = `${apiRoot}?indicator=${dataset.id}`;
    const latestVal = dataset.timeseries[dataset.timeseries.length - 1].value;

    item.innerHTML = `
      <div style="font-size: 12px; color: rgba(var(--accent-color-rgb), 0.95); font-weight: 500; letter-spacing: 0.5px; display: flex; justify-content: space-between; align-items: center;">
        <span>INDICATOR: ${dataset.id.toUpperCase().replace(/_/g, ' ')}</span>
        <span>LATEST: ${latestVal} ${dataset.unit.split('/')[0]}</span>
      </div>
      <a href="${dataset.link}" target="_blank" class="${gradPrefix}-link" style="font-size: 13px; color: #ffffff; text-decoration: none; font-weight: 500; line-height: 1.4; transition: color 0.24s;" onmouseover="this.style.color='rgba(var(--accent-color-rgb), 0.95)'" onmouseout="this.style.color='#ffffff'">
        ${dataset.name} ↗
      </a>
      <div style="font-size: 12px; color: rgba(255, 255, 255, 0.5); line-height: 1.3;">
        ${dataset.description}
      </div>
    `;
    container.appendChild(item);

    const chartDiv = document.createElement('div');
    chartDiv.style.paddingBottom = '8px';
    chartDiv.style.display = 'flex';
    chartDiv.style.flexDirection = 'column';
    chartDiv.style.gap = '6px';

    const tData = dataset.timeseries;
    const values = tData.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const chartWidth = 420;
    const chartHeight = 50;

    const points = tData.map((d, idx) => {
      const x = (idx / (tData.length - 1)) * (chartWidth - 20) + 10;
      const y = chartHeight - ((d.value - minVal) / range) * (chartHeight - 14) - 7;
      return { x, y, year: d.year, val: d.value };
    });

    const polylinePoints = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

    const areaPoints = [
      `${points[0].x.toFixed(1)},${chartHeight}`,
      ...points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${points[points.length - 1].x.toFixed(1)},${chartHeight}`
    ].join(' ');

    const circlesSvg = points.map((p, idx) => {
      const isLatest = idx === points.length - 1;
      const r = isLatest ? 3.5 : 2;
      const fill = isLatest ? 'rgba(var(--accent-color-rgb), 0.95)' : 'rgba(var(--accent-color-rgb), 0.4)';
      const stroke = isLatest ? '#ffffff' : 'rgba(var(--accent-color-rgb), 0.8)';
      return `
        <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1">
          <title>${p.year}: ${p.val} ${dataset.unit}</title>
        </circle>
      `;
    }).join('');

    const textLabelsSvg = `
      <text x="${points[0].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[0].year}</text>
      <text x="${points[Math.floor(points.length / 2)].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[Math.floor(points.length / 2)].year}</text>
      <text x="${points[points.length - 1].x}" y="${chartHeight + 11}" font-size="9pt" fill="rgba(255,255,255,0.3)" text-anchor="middle">${points[points.length - 1].year}</text>
    `;

    chartDiv.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; margin-top: 2px;">
        <svg width="100%" height="${chartHeight + 16}" style="overflow: visible; display: block;" viewBox="0 0 ${chartWidth} ${chartHeight + 16}">
          <defs>
            <linearGradient id="${gradPrefix}-${dataset.id}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="rgba(var(--accent-color-rgb), 0.35)" />
              <stop offset="100%" stop-color="rgba(var(--accent-color-rgb), 0)" />
            </linearGradient>
          </defs>
          <line x1="10" y1="${chartHeight/2}" x2="${chartWidth-10}" y2="${chartHeight/2}" stroke="rgba(255,255,255,0.03)" stroke-dasharray="2 2" />
          <line x1="10" y1="${chartHeight}" x2="${chartWidth-10}" y2="${chartHeight}" stroke="rgba(255,255,255,0.05)" />
          <polygon points="${areaPoints}" fill="url(#${gradPrefix}-${dataset.id})" />
          <polyline points="${polylinePoints}" fill="none" stroke="rgba(var(--accent-color-rgb), 0.85)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
          ${circlesSvg}
          ${textLabelsSvg}
        </svg>
      </div>
    `;
    container.appendChild(chartDiv);

    // Simulated fetch hook to demonstrate request attempt
    fetch(apiEndpoint, { mode: 'cors' }).catch(err => {
      console.warn(`Live API fetch failed for ${dataset.id} as expected (CORS / restricted access):`, err);
    });
  });
}









// --- FADE HELPER ---
function fadeElement(el, updateCallback) {
  if (!el) return;
  el.style.opacity = 0.2;
  setTimeout(() => {
    updateCallback();
    el.style.opacity = 1;
  }, 100);
}



// --- TULIP URGENCY SCORE ---
function getScoreBandDetails(score) {
  const band = getActiveTulipUrgencyBand(score);
  const classByBand = {
    'Low Concern': 'rating-low',
    Low: 'rating-low',
    Elevated: 'rating-elevated',
    Rising: 'rating-significant',
    Concerning: 'rating-concerning',
    'High Risk': 'rating-high-risk',
    Severe: 'rating-severe',
    Critical: 'rating-critical',
    Extreme: 'rating-extreme'
  };
  return { label: band, className: `urgency-status-tag ${classByBand[band] ?? 'rating-critical'}` };
}

function urgencyScalePosition(score) {
  return ((Math.max(1, Math.min(10, score)) - 1) / 9) * 100;
}

function updateTulipUrgencyProfile(node) {
  const receipt = tulipUrgencyByNodeId.get(node.id) ?? node.tulipUrgencyReceipt ?? null;
  const registryIsActive = tulipUrgencyStatus === 'approved' || tulipUrgencyV3ShadowPreview;
  const useReceipt = registryIsActive && receipt?.method_version === tulipUrgencyMethodVersion;
  const baselineScore = useReceipt ? receipt.value : node.score.baseline;
  const isResponseNode = node.node_kind === 'response';
  const urgencySection = document.querySelector('.urgency-section');
  const sectionHeading = document.querySelector('.urgency-section .section-header');
  if (urgencySection) urgencySection.style.display = isResponseNode ? 'none' : '';
  if (isResponseNode) return;
  if (sectionHeading) {
    sectionHeading.textContent = tulipUrgencyV3ShadowPreview
      ? 'TULIP Urgency - v3 shadow'
      : tulipUrgencyHistoricalV2Preview
        ? 'TULIP Urgency - v2 historical'
        : 'TULIP Urgency';
  }

  const scoreEl = document.getElementById('console-urgency-score');
  const ratingEl = document.getElementById('console-urgency-rating');
  const modeledTag = document.getElementById('console-urgency-modeled');
  const bandDetails = getScoreBandDetails(baselineScore);
  if (scoreEl) scoreEl.textContent = baselineScore.toFixed(1);
  if (ratingEl) {
    ratingEl.textContent = bandDetails.label;
    ratingEl.className = bandDetails.className;
  }
  if (modeledTag) modeledTag.hidden = !(useReceipt && receipt.method === 'modeled');

  const scoreMarker = document.getElementById('urgency-score-marker');
  const markerValue = document.getElementById('urgency-marker-value');
  if (scoreMarker) scoreMarker.style.left = `${Math.max(4, Math.min(96, urgencyScalePosition(baselineScore)))}%`;
  if (markerValue) markerValue.textContent = baselineScore.toFixed(1);
  document.querySelectorAll('[data-urgency-band]').forEach(label => {
    label.classList.toggle('is-active', label.dataset.urgencyBand === bandDetails.label);
  });
  const urgencyScale = document.getElementById('tulip-urgency-scale');
  if (urgencyScale) {
    urgencyScale.setAttribute('aria-label', `TULIP urgency score ${baselineScore.toFixed(1)}, in the ${bandDetails.label} band, on a scale from 1 to 10.`);
  }
}

function playWelcomeSplash() {
  const splash = document.getElementById('quote-splash');
  if (!splash) return;
  graphInstance?.pause();
  const splashVisitCountKey = 'tulip_welcome_splash_visit_count_v2';
  const splashHoldMs = 10000;
  const splashDemoRequested = new URLSearchParams(window.location.search).get('demoSplash') === '1';
  let dismissed = false;
  let splashTimerId = null;

  const getSplashVisitCount = () => {
    try {
      return Number(window.localStorage.getItem(splashVisitCountKey)) || 0;
    } catch {
      return 0;
    }
  };

  const recordSplashVisit = visitCount => {
    try {
      window.localStorage.setItem(splashVisitCountKey, String(visitCount + 1));
    } catch {
      // Storage can be unavailable in private or restricted browsing modes.
    }
  };

  const finishSplash = () => {
    splash.setAttribute('aria-hidden', 'true');
  };

  const dismissSplash = (method = 'timer') => {
    if (dismissed) return;
    dismissed = true;
    if (splashTimerId) {
      window.clearTimeout(splashTimerId);
      splashTimerId = null;
    }
    if (!splashDemoRequested) recordSplashVisit(splashVisitCount);
    document.body.classList.remove('splash-active');
    splash.classList.add('is-hidden');
    graphInstance?.resume();
    trackEvent('splash_enter', { method });
  };

  const splashVisitCount = getSplashVisitCount();
  if (!splashDemoRequested && splashVisitCount >= 2) {
    document.body.classList.remove('splash-active');
    splash.classList.add('is-hidden');
    finishSplash();
    graphInstance?.resume();
    return;
  }

  splash.setAttribute('aria-hidden', 'false');
  splash.addEventListener('click', () => dismissSplash('splash'), { once: true });
  splash.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    dismissSplash('keyboard');
  });
  splashTimerId = window.setTimeout(() => dismissSplash('timer'), splashHoldMs);
  splash.addEventListener('transitionend', (event) => {
    if (event.target !== splash || event.propertyName !== 'opacity') return;
    if (!splash.classList.contains('is-hidden')) return;
    finishSplash();
  });
}

function shouldGateTouchDevices() {
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const noHover = window.matchMedia?.('(hover: none)').matches ?? false;
  const touchPoints = navigator.maxTouchPoints || 0;
  return (coarsePointer && noHover) || (coarsePointer && touchPoints > 0);
}

function showTouchDeviceGate() {
  const gate = document.getElementById('touch-device-gate');
  const splash = document.getElementById('quote-splash');
  const appContainer = document.getElementById('app-container');
  const footerBar = document.getElementById('tulip-footer-bar');
  if (!gate) return;

  gate.hidden = false;
  gate.setAttribute('aria-hidden', 'false');
  gate.classList.add('is-visible');

  if (splash) {
    splash.classList.add('is-hidden');
    splash.setAttribute('aria-hidden', 'true');
  }
  if (appContainer) {
    appContainer.style.display = 'none';
    appContainer.setAttribute('aria-hidden', 'true');
  }
  if (footerBar) {
    footerBar.style.display = 'none';
    footerBar.setAttribute('aria-hidden', 'true');
  }
}

function bindTouchDeviceGateShareActions() {
  const gate = document.getElementById('touch-device-gate');
  if (!gate || gate.dataset.shareBound === 'true') return;

  const shareUrl = 'https://tulip-project-six.vercel.app';
  const shareTitle = 'TULIP';
  const shareText = 'Explore TULIP on desktop: https://tulip-project-six.vercel.app';
  const shareNote = document.getElementById('touch-device-gate-share-note');

  gate.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-share-action]');
    if (!button) return;

    const action = button.getAttribute('data-share-action');
    if (!action) return;

    if (action === 'native' && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: 'Explore TULIP on desktop', url: shareUrl });
      } catch {
        // Ignore aborted native share sheets.
      }
      return;
    }

    if (action === 'native') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        if (shareNote) {
          shareNote.hidden = false;
          window.setTimeout(() => {
            shareNote.hidden = true;
          }, 1800);
        }
      } catch {
        window.prompt('Copy this link', shareUrl);
      }
    }
  });

  gate.dataset.shareBound = 'true';
}

function hardenExternalLinks(root = document) {
  root.querySelectorAll?.('a[target="_blank"]').forEach(link => {
    link.setAttribute('rel', 'noopener noreferrer');
  });
}

// Start application
window.onload = () => {
  initTelemetry();
  hardenExternalLinks();
  new MutationObserver(mutations => {
    mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) hardenExternalLinks(node);
    }));
  }).observe(document.body, { childList: true, subtree: true });
  bindTouchDeviceGateShareActions();
  if (shouldGateTouchDevices()) {
    showTouchDeviceGate();
    return;
  }
  adjustScale();
  init();
  if (graphInstance) {
    graphInstance.resizeCanvas();
    updateGatewayArcLayout();
  }
  playWelcomeSplash();
};
