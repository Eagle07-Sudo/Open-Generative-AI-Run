/** Runware catalog id → Muapi id for control parity fallback (ADR-008). */

/** @type {Record<string, string>} */
const RUNWARE_TO_MUAPI = {
  'rw-gpt-image-2': 'gpt-image-2',
  'rw-gpt-image-1-5': 'gpt-image-1.5',
  'rw-nano-banana-2': 'nano-banana-2',
  'rw-nano-banana-pro': 'nano-banana-pro',
  'rw-seedance-2': 'seedance-v2.0-t2v',
  'rw-seedance-2-fast': 'seedance-v2.0-fast-t2v',
  'rw-veo-3-1': 'veo3.1-text-to-video',
  'rw-veo-3-1-fast': 'veo3.1-fast-text-to-video',
  'rw-veo-3-1-lite': 'veo3.1-lite-text-to-video',
  'rw-gpt-image-2-i2i': 'gpt-image-2-edit',
  'rw-gpt-image-1-5-i2i': 'gpt-image-1.5-edit',
  'rw-nano-banana-2-i2i': 'nano-banana-2-edit',
  'rw-nano-banana-pro-i2i': 'nano-banana-pro-edit',
  'rw-flux-2-dev-i2i': 'flux-2-dev-edit',
  'rw-flux-2-pro-i2i': 'flux-2-pro-edit',
  'rw-flux-2-flex-i2i': 'flux-2-flex-edit',
  'rw-flux-2-klein-9b-i2i': 'flux-2-klein-9b-edit',
  'rw-seedream-5-lite-i2i': 'seedream-5.0-edit',
  'rw-kling-image-o3-i2i': 'kling-o1-edit-image',
  'rw-veo-3-1-i2v': 'veo3.1-image-to-video',
  'rw-veo-3-1-fast-i2v': 'veo3.1-fast-image-to-video',
  'rw-veo-3-1-lite-i2v': 'veo3.1-lite-image-to-video',
  'rw-seedance-2-i2v': 'seedance-v2.0-i2v',
  'rw-seedance-2-fast-i2v': 'seedance-v2.0-fast-i2v',
};

/**
 * @param {string} runwareCatalogId
 * @returns {string | undefined}
 */
export function resolveMuapiIdForRunwareCatalog(runwareCatalogId) {
  return RUNWARE_TO_MUAPI[runwareCatalogId];
}
