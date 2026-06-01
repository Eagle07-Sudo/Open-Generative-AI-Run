/** @typedef {import('./types.js').CloudProviderId} CloudProviderId */

/** Closed list of studio operations — new ops require PR checklist. */
export const STUDIO_OPS = Object.freeze([
  'imageT2i',
  'imageI2i',
  'videoT2i',
  'videoI2v',
  'videoV2v',
  'audioT2a',
  'lipSync',
  'upload',
  'clipping',
  'motionGraphics',
  'marketingAd',
  'workflow',
  'agents',
  'appsInterest',
]);

/** @typedef {(typeof STUDIO_OPS)[number]} StudioOp */

/** Shell tab id → studio id for routing (same as tab id today). */
export const TAB_TO_STUDIO = Object.freeze({
  image: 'image',
  video: 'video',
  audio: 'audio',
  clipping: 'clipping',
  'vibe-motion': 'vibe-motion',
  lipsync: 'lipsync',
  cinema: 'cinema',
  marketing: 'marketing',
  workflows: 'workflows',
  agents: 'agents',
  'design-agent': 'design-agent',
  apps: 'apps',
});

/** Default op per studio tab for resolver / banners. */
export const DEFAULT_OP_FOR_TAB = Object.freeze({
  image: 'imageT2i',
  video: 'videoT2i',
  audio: 'audioT2a',
  clipping: 'clipping',
  'vibe-motion': 'motionGraphics',
  lipsync: 'lipSync',
  cinema: 'imageT2i',
  marketing: 'marketingAd',
  workflows: 'workflow',
  agents: 'agents',
  'design-agent': 'agents',
  apps: 'appsInterest',
});

/** Studios locked to Muapi regardless of routingMode. */
export const MUAPI_LOCKED_STUDIOS = Object.freeze(['agents', 'workflows', 'design-agent']);

/**
 * @param {string} tabId
 * @returns {string}
 */
export function studioIdFromTab(tabId) {
  return TAB_TO_STUDIO[tabId] || tabId;
}

/**
 * @param {string} tabId
 * @returns {StudioOp}
 */
export function defaultOpForTab(tabId) {
  return DEFAULT_OP_FOR_TAB[tabId] || 'imageT2i';
}
