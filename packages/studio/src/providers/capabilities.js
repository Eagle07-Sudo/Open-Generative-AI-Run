/** @typedef {import('./types.js').CloudProviderId} CloudProviderId */
/** @typedef {import('./studioOps.js').StudioOp} StudioOp */

/**
 * Provider capability matrix — update when adapters land (P2+).
 * @type {Record<CloudProviderId, Partial<Record<StudioOp, boolean>>>}
 */
export const PROVIDER_CAPABILITIES = {
  muapi: {
    imageT2i: true,
    imageI2i: true,
    videoT2i: true,
    videoI2v: true,
    videoV2v: true,
    audioT2a: true,
    lipSync: true,
    upload: true,
    clipping: true,
    motionGraphics: true,
    marketingAd: true,
    workflow: true,
    agents: true,
    appsInterest: true,
  },
  runware: {
    imageT2i: true,
    imageI2i: true,
    videoT2i: true,
    videoI2v: true,
    videoV2v: true,
    audioT2a: true,
    lipSync: false,
    upload: true,
    clipping: false,
    motionGraphics: false,
    marketingAd: false,
    workflow: false,
    agents: false,
    appsInterest: false,
  },
};

/**
 * @param {CloudProviderId} provider
 * @param {StudioOp | string} op
 */
export function supportsStudioOp(provider, op) {
  const id = provider === 'runware' ? 'runware' : 'muapi';
  return Boolean(PROVIDER_CAPABILITIES[id]?.[op]);
}

/**
 * @param {CloudProviderId} provider
 * @param {StudioOp | string} op
 * @returns {string | null}
 */
export function getUnsupportedReason(provider, op) {
  if (supportsStudioOp(provider, op)) return null;
  const name = provider === 'runware' ? 'Runware' : 'Muapi';
  return `${name} does not support this operation yet.`;
}
