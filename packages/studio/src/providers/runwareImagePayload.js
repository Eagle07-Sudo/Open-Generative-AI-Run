/**
 * Runware imageInference payload contract — all image / i2i tasks (not Nano Banana only).
 * @see https://runware.ai/docs/models/google-nano-banana-2
 */

import { isImageResolutionTier, normalizeImageTier } from './runwareImageTier.js';
import { isAssetLabel } from '../media/previewSrc.js';

/** @type {Record<string, string>} */
const TIER_TO_RUNWARE_RESOLUTION = {
  '1k': '1K',
  '2k': '2K',
  '4k': '4K',
};

/** Runware models that accept 1K/2K/4K `resolution` instead of width/height (when refs present). */
const TIER_PRESET_MODEL_PATTERNS = [
  /^google:/i,
  /nano-banana/i,
  /seedream/i,
  /imagen/i,
  /gemini/i,
];

/**
 * @param {string} [tier]
 * @returns {string | undefined}
 */
export function tierToRunwareResolution(tier) {
  if (!tier || typeof tier !== 'string') return undefined;
  const n = normalizeImageTier(tier);
  return TIER_TO_RUNWARE_RESOLUTION[n];
}

/**
 * @param {string} [runwareModel]
 * @returns {'google' | 'openai' | 'flux'}
 */
export function detectImageModelFamily(runwareModel) {
  if (typeof runwareModel !== 'string') return 'flux';
  if (runwareModel.startsWith('openai:')) return 'openai';
  if (TIER_PRESET_MODEL_PATTERNS.some((re) => re.test(runwareModel))) {
    return 'google';
  }
  return 'flux';
}

/**
 * Catalog declares 1k/2k/4k resolution chips (RUNWARE_TIER_RESOLUTION_INPUT).
 * @param {object | null | undefined} catalog
 * @returns {boolean}
 */
export function catalogSupportsTierResolutionPreset(catalog) {
  const input = catalog?.inputs?.resolution;
  if (!input?.enum || !Array.isArray(input.enum)) return false;
  const values = new Set(input.enum.map((v) => String(v).toLowerCase()));
  return values.has('1k') && values.has('2k') && values.has('4k');
}

/**
 * @param {string} [runwareModel]
 * @returns {boolean}
 */
export function modelIdSupportsTierResolutionPreset(runwareModel) {
  const m = String(runwareModel || '');
  return TIER_PRESET_MODEL_PATTERNS.some((re) => re.test(m));
}

/**
 * OpenAI image uses pixel sizes + providerSettings; Flux/Recraft use width/height only.
 * @param {object | null | undefined} catalog
 * @param {string} [runwareModel]
 * @returns {boolean}
 */
export function shouldUseTierResolutionPreset(catalog, runwareModel) {
  if (detectImageModelFamily(runwareModel) === 'openai') return false;
  if (catalogSupportsTierResolutionPreset(catalog)) return true;
  return modelIdSupportsTierResolutionPreset(runwareModel);
}

/**
 * @param {object} params
 * @returns {boolean}
 */
export function hasImageReferenceParams(params) {
  return Boolean(
    params?.images_list?.length > 0 ||
      params?.image_url ||
      params?.referenceImages?.length > 0,
  );
}

/**
 * @param {object} task
 * @returns {boolean}
 */
export function hasTaskReferenceImages(task) {
  const nested = task?.inputs?.referenceImages;
  const top = task?.referenceImages;
  return Boolean(
    (Array.isArray(nested) && nested.length > 0) ||
      (Array.isArray(top) && top.length > 0),
  );
}

/**
 * When reference images exist and the UI sent a tier (1k/2k/4k), use Runware `resolution`
 * preset and omit width/height (all preset-capable models, catalog-driven).
 * @param {object} task
 * @param {object} params
 * @param {object | null | undefined} [catalog]
 */
export function applyImageInferenceDimensions(task, params, catalog = null) {
  if (!isImageResolutionTier(params?.resolution)) return;
  if (!hasTaskReferenceImages(task) && !hasImageReferenceParams(params)) return;
  if (!shouldUseTierResolutionPreset(catalog, task.model)) return;

  const preset = tierToRunwareResolution(params.resolution);
  if (!preset) return;

  task.resolution = preset;
  delete task.width;
  delete task.height;
}

/** @deprecated Use applyImageInferenceDimensions */
export function applyGoogleClassDimensions(task, params, catalog = null) {
  applyImageInferenceDimensions(task, params, catalog);
}

/**
 * @param {object} task
 * @throws {Error}
 */
export function assertRunwareImagePayload(task) {
  if (!task || task.taskType !== 'imageInference') return;

  const prompt = task.positivePrompt;
  if (typeof prompt === 'string' && /@(?:image|video|audio)\d+/i.test(prompt)) {
    throw new Error(
      'Runware image request is invalid: remove @mentions from the prompt (references go in inputs.referenceImages).',
    );
  }

  if (task.resolution != null && (task.width != null || task.height != null)) {
    throw new Error(
      'Runware image request is invalid: use resolution (1K/2K/4K) or width/height, not both.',
    );
  }

  const refs = task.inputs?.referenceImages || task.referenceImages || [];
  for (const ref of refs) {
    const s = String(ref);
    if (isAssetLabel(s) || /^image\d+$/i.test(s)) {
      throw new Error(
        'Reference image was not uploaded yet. Wait for upload to finish, then Generate again.',
      );
    }
  }
}

/**
 * @param {Error & { status?: number, code?: string }} err
 * @returns {string}
 */
export function formatRunwareErrorForStudio(err) {
  const status = err?.status;
  const code = err?.code;

  if (status === 401 || status === 403) {
    return 'Runware API key missing or invalid. Open API Settings.';
  }

  const msg = err?.message || '';
  if (msg.includes('not uploaded yet') || msg.includes('inferenceRef')) {
    return 'Reference image is not ready. Re-upload and try Generate again.';
  }
  if (msg.includes('@mentions')) {
    return 'Remove @tags from the text sent to Runware; use the image circle only.';
  }
  if (msg.includes('resolution') && msg.includes('width')) {
    return 'Internal request error (dimensions). Refresh and try again.';
  }

  if (
    code === 'thirdPartyInsufficientCredits' ||
    /paid invoice|at least \$5 credit|my\.runware\.ai\/wallet/i.test(msg)
  ) {
    return 'Runware billing required: add a card and top up at least $5 at https://my.runware.ai/wallet';
  }

  if (status === 400) {
    const suffix = code ? ` (${code})` : '';
    return `Runware rejected this image request${suffix}. Re-upload references and check resolution settings.`;
  }

  if (status === 429) {
    return 'Runware rate limit. Wait a moment and try again.';
  }

  return (msg || 'Generation failed.').slice(0, 120);
}
