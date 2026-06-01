import {
  t2iModels,
  t2vModels,
  i2iModels,
  i2vModels,
  v2vModels,
  audioModels,
  getModelById,
  getI2IModelById,
} from './models.js';
import { resolveMuapiIdForRunwareCatalog } from './runwareMuapiIds.js';
import { runwareT2iModels } from './models.runware.js';
import { runwareVideoModels } from './models.runware.video.js';
import { runwareAudioModels } from './models.runware.audio.js';
import { runwareI2iModels } from './models.runware.i2i.js';
import { runwareI2vModels } from './models.runware.i2v.js';
import { runwareV2vModels } from './models.runware.v2v.js';
import { processCatalogModels } from './modelReleaseMeta.js';
import { isRunwareParityI2iEnabled, isRunwareParityI2vEnabled } from './runwareParityFlags.js';
import {
  getModelInputOptions,
  getModelInputDefault,
  getModelInputFieldName,
  getQualityOptionsForModel,
  getModelInputOptionsForField,
  modelHasCatalogInput,
  getReferenceInputLimits,
  clampModelInputSelection,
  getModelInputLabel,
  getEffectsForModelRegistry,
  getDefaultEffectForModelRegistry,
  getModesForModelRegistry,
  getModelInputSchema,
  isRangeModelInput,
} from './modelInputResolver.js';

/** @typedef {'muapi' | 'runware'} CloudProviderId */

/**
 * @param {CloudProviderId} [provider]
 * @returns {CloudProviderId}
 */
export function normalizeCloudProvider(provider) {
  return provider === 'runware' ? 'runware' : 'muapi';
}

/**
 * @param {CloudProviderId} [provider]
 */
export function getT2iModelsForProvider(provider = 'muapi') {
  const p = normalizeCloudProvider(provider);
  const raw = p === 'runware' ? runwareT2iModels : t2iModels;
  return processCatalogModels(raw, p);
}

/**
 * @param {CloudProviderId} [provider]
 */
export function getI2iModelsForProvider(provider = 'muapi') {
  const p = normalizeCloudProvider(provider);
  if (p === 'runware' && !isRunwareParityI2iEnabled()) return [];
  const raw = p === 'runware' ? runwareI2iModels : i2iModels;
  return processCatalogModels(raw, p);
}

/**
 * @param {CloudProviderId} [provider]
 */
export function getI2vModelsForProvider(provider = 'muapi') {
  const p = normalizeCloudProvider(provider);
  if (p === 'runware' && !isRunwareParityI2vEnabled()) return [];
  const raw = p === 'runware' ? runwareI2vModels : i2vModels;
  return processCatalogModels(raw, p);
}

/**
 * @param {CloudProviderId} [provider]
 */
export function getV2vModelsForProvider(provider = 'muapi') {
  const p = normalizeCloudProvider(provider);
  const raw = p === 'runware' ? runwareV2vModels : v2vModels;
  return processCatalogModels(raw, p);
}

/**
 * @param {string} id
 * @param {CloudProviderId} [provider]
 */
export function getT2iModelById(id, provider = 'muapi') {
  return getT2iModelsForProvider(provider).find((m) => m.id === id) || null;
}

/**
 * @param {string} id
 * @param {CloudProviderId} [provider]
 */
export function getI2iModelById(id, provider = 'muapi') {
  return getI2iModelsForProvider(provider).find((m) => m.id === id) || null;
}

/**
 * @param {string} id
 * @param {CloudProviderId} [provider]
 */
export function getI2vModelById(id, provider = 'muapi') {
  return getI2vModelsForProvider(provider).find((m) => m.id === id) || null;
}

/**
 * @param {string} id
 * @param {CloudProviderId} [provider]
 */
export function getV2vModelById(id, provider = 'muapi') {
  return getV2vModelsForProvider(provider).find((m) => m.id === id) || null;
}

/**
 * @param {string} id
 * @param {CloudProviderId} [provider]
 */
export function resolveT2iModelForProvider(id, provider = 'muapi') {
  return getT2iModelById(id, provider);
}

/**
 * Cinema model ids — provider-aware (ADR-005).
 * @param {boolean} hasReferenceImage
 * @param {CloudProviderId} [provider]
 */
export function resolveCinemaModelId(hasReferenceImage, provider = 'muapi') {
  const p = normalizeCloudProvider(provider);
  if (p === 'runware') {
    return hasReferenceImage ? 'rw-nano-banana-pro-i2i' : 'rw-nano-banana-pro';
  }
  return hasReferenceImage ? 'nano-banana-pro-edit' : 'nano-banana-pro';
}

/**
 * @param {string} modelId
 * @param {CloudProviderId} [provider]
 */
export function getAspectRatiosForT2iModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'aspect_ratio', provider, 't2i');
}

export function getAspectRatiosForI2iModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'aspect_ratio', provider, 'i2i');
}

export function getAspectRatiosForT2vModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'aspect_ratio', provider, 't2v');
}

export function getAspectRatiosForI2vModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'aspect_ratio', provider, 'i2v');
}

export function getDurationsForT2vModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'duration', provider, 't2v');
}

export function getDurationsForI2vModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'duration', provider, 'i2v');
}

/**
 * Max reference images for I2I (Muapi parity via muapiId for Runware ids).
 * @param {string} modelId
 * @param {CloudProviderId} [provider]
 */
export function getMaxImagesForI2IModel(modelId, provider = 'muapi') {
  const p = normalizeCloudProvider(provider);
  let muapiId = modelId;
  if (p === 'runware') {
    const rw = getI2iModelById(modelId, 'runware');
    muapiId = rw?.muapiId || resolveMuapiIdForRunwareCatalog(modelId) || modelId;
  }
  const muapi = getI2IModelById(muapiId, 'muapi');
  return muapi?.maxImages || 1;
}

/**
 * @param {string} modelId
 * @param {CloudProviderId} [provider]
 */
export function getResolutionsForT2iModel(modelId, provider = 'muapi') {
  return getQualityOptionsForModel(modelId, provider, 't2i');
}

export function getResolutionsForT2vModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'resolution', provider, 't2v');
}

export function getResolutionsForI2vModel(modelId, provider = 'muapi') {
  return getModelInputOptions(modelId, 'resolution', provider, 'i2v');
}

export function getResolutionsForI2iModel(modelId, provider = 'muapi') {
  return getQualityOptionsForModel(modelId, provider, 'i2i');
}

/**
 * @param {string} modelId
 * @param {CloudProviderId} [provider]
 */
export function getQualityFieldForT2iModel(modelId, provider = 'muapi') {
  return getModelInputFieldName(modelId, provider, 't2i');
}

export function getQualityFieldForI2iModel(modelId, provider = 'muapi') {
  return getModelInputFieldName(modelId, provider, 'i2i');
}

/**
 * @param {string} modelId
 * @param {CloudProviderId} [provider]
 */
export function getQualityOptionsForT2iModel(modelId, provider = 'muapi') {
  return getQualityOptionsForModel(modelId, provider, 't2i');
}

export function getQualityEnumOptionsForT2iModel(modelId, provider = 'muapi') {
  return getModelInputOptionsForField(modelId, 'quality', provider, 't2i');
}

export function getResolutionTierOptionsForT2iModel(modelId, provider = 'muapi') {
  return getModelInputOptionsForField(modelId, 'resolution', provider, 't2i');
}

export function modelHasT2iQualityInput(modelId, provider = 'muapi') {
  return modelHasCatalogInput(modelId, 'quality', provider, 't2i');
}

export function modelHasT2iResolutionInput(modelId, provider = 'muapi') {
  return modelHasCatalogInput(modelId, 'resolution', provider, 't2i');
}

/** @typedef {'image'|'video'|'audio'|'clipping'|'vibe-motion'|'lipsync'|'cinema'|'marketing'} MediaStudioId */

const STUDIO_TO_T2I = new Set(['image', 'cinema']);

/**
 * @param {string} studioId
 * @param {CloudProviderId} [provider]
 * @param {{ catalogMode?: string }} [opts]
 */
export function getModelsForStudio(studioId, provider = 'muapi', opts = {}) {
  const p = normalizeCloudProvider(provider);
  const mode = opts.catalogMode;

  if (studioId === 'image' && mode === 'i2i') {
    return getI2iModelsForProvider(p);
  }

  if (STUDIO_TO_T2I.has(studioId)) {
    return getT2iModelsForProvider(p);
  }

  if (studioId === 'video') {
    if (mode === 'i2v') return getI2vModelsForProvider(p);
    if (mode === 'v2v') return getV2vModelsForProvider(p);
    const raw = p === 'runware' ? runwareVideoModels : t2vModels;
    return processCatalogModels(raw, p);
  }

  if (studioId === 'audio') {
    const raw = p === 'runware' ? runwareAudioModels : audioModels;
    return processCatalogModels(raw, p);
  }

  return getT2iModelsForProvider(p);
}

/**
 * @param {string} id
 * @param {string} studioId
 * @param {CloudProviderId} [provider]
 * @param {{ catalogMode?: string }} [opts]
 */
export function getModelByIdForStudio(id, studioId, provider = 'muapi', opts = {}) {
  const models = getModelsForStudio(studioId, provider, opts);
  return models.find((m) => m.id === id) || null;
}

/**
 * @typedef {Object}        ModelSection
 * @property {CloudProviderId} providerId
 * @property {string} label
 * @property {object[]} models
 * @property {string} [disabledReason]
 * @property {string} [hint]
 */

/**
 * @typedef {Object} UnifiedPickerPrefs
 * @property {import('./studioCloud.js').RoutingMode} [routingMode]
 * @property {boolean} [allowMuapiFallback]
 * @property {string} [muapiKey]
 * @property {string} [runwareApiKey]
 * @property {'t2i' | 'i2i' | 't2v' | 'i2v' | 'v2v'} [catalogMode]
 */

function hasProviderKey(providerId, muapiKey, runwareApiKey) {
  if (providerId === 'runware') return Boolean(runwareApiKey?.trim());
  return Boolean(muapiKey?.trim());
}

function runwareCatalogCount(studioId, catalogMode) {
  return getModelsForStudio(studioId, 'runware', { catalogMode }).length;
}

/**
 * Section headers to show in picker (includes locked sections without keys).
 * ADR-005: omit Runware when catalog empty for mode.
 * @param {UnifiedPickerPrefs} prefs
 * @param {string} [studioId]
 * @returns {CloudProviderId[]}
 */
export function getCatalogSectionIds(prefs, studioId = 'image') {
  const mode = prefs.routingMode || 'runware-first';
  const hasMuapi = hasProviderKey('muapi', prefs.muapiKey, prefs.runwareApiKey);
  const hasRunware = hasProviderKey('runware', prefs.muapiKey, prefs.runwareApiKey);
  const catalogMode = prefs.catalogMode;
  const runwareCount = runwareCatalogCount(studioId, catalogMode);
  const showRunware = runwareCount > 0;

  if (mode === 'muapi-only') {
    return hasMuapi || !showRunware ? ['muapi'] : ['muapi'];
  }

  if (catalogMode === 'i2i') {
    if (showRunware && mode !== 'muapi-only') {
      return mode === 'runware-only' ? ['runware'] : ['runware', 'muapi'];
    }
    return ['muapi'];
  }

  if (catalogMode === 'i2v' || catalogMode === 'v2v') {
    if (showRunware && mode !== 'muapi-only') {
      return mode === 'runware-only' ? ['runware'] : ['runware', 'muapi'];
    }
    return hasMuapi ? ['muapi'] : [];
  }

  if (mode === 'runware-only') {
    if (showRunware) return ['runware'];
    return hasMuapi && prefs.allowMuapiFallback !== false ? ['muapi'] : ['runware'];
  }

  if (showRunware) return ['runware', 'muapi'];
  return ['muapi'];
}

/**
 * Which provider sections have selectable models (requires API key).
 * @param {UnifiedPickerPrefs} prefs
 * @param {string} [studioId]
 * @returns {CloudProviderId[]}
 */
export function getVisibleProviderIdsForPicker(prefs, studioId = 'image') {
  const mode = prefs.routingMode || 'runware-first';
  const hasMuapi = hasProviderKey('muapi', prefs.muapiKey, prefs.runwareApiKey);
  const hasRunware = hasProviderKey('runware', prefs.muapiKey, prefs.runwareApiKey);
  const runwareCount = runwareCatalogCount(studioId, prefs.catalogMode);
  const showRunware = runwareCount > 0;

  if (prefs.catalogMode === 'i2i' || prefs.catalogMode === 'i2v' || prefs.catalogMode === 'v2v') {
    const ids = [];
    if (showRunware && hasRunware && mode !== 'muapi-only') ids.push('runware');
    if (hasMuapi) ids.push('muapi');
    if (mode === 'runware-only' && showRunware && hasRunware) return ['runware'];
    return ids;
  }

  if (mode === 'muapi-only') {
    return hasMuapi ? ['muapi'] : [];
  }
  if (mode === 'runware-only') {
    if (showRunware && hasRunware) return ['runware'];
    return hasMuapi && prefs.allowMuapiFallback !== false ? ['muapi'] : [];
  }

  const ids = [];
  if (showRunware && hasRunware) ids.push('runware');
  if (hasMuapi) ids.push('muapi');
  return ids;
}

/**
 * @param {string} studioId
 * @param {CloudProviderId} [providerId]
 * @param {{ catalogMode?: string }} [opts]
 */
function visibleMuapiCatalogCount(studioId, providerId = 'muapi', opts = {}) {
  return getModelsForStudio(studioId, providerId, opts).length;
}

/**
 * @param {string} studioId
 * @param {{ catalogMode?: string }} [opts]
 */
function muapiCatalogCount(studioId, opts = {}) {
  return visibleMuapiCatalogCount(studioId, 'muapi', opts);
}

/**
 * @param {CloudProviderId} providerId
 * @param {UnifiedPickerPrefs} prefs
 * @param {string} studioId
 */
function lockedSectionReason(providerId, prefs, studioId) {
  const opts = { catalogMode: prefs.catalogMode };
  if (providerId === 'muapi' && !hasProviderKey('muapi', prefs.muapiKey, prefs.runwareApiKey)) {
    const n = muapiCatalogCount(studioId, opts);
    return `Add Muapi API key in API Settings to unlock ${n}+ models (2025+)`;
  }
  if (providerId === 'runware' && !hasProviderKey('runware', prefs.muapiKey, prefs.runwareApiKey)) {
    return 'Add Runware API key in API Settings to see Runware models';
  }
  return undefined;
}

/**
 * @param {string} studioId
 * @param {UnifiedPickerPrefs} prefs
 * @returns {ModelSection[]}
 */
export function getUnifiedModelSections(studioId, prefs = {}) {
  const sectionIds = getCatalogSectionIds(prefs, studioId);
  const activeIds = new Set(getVisibleProviderIdsForPicker(prefs, studioId));
  const labels = { runware: 'Runware', muapi: 'Muapi' };

  return sectionIds.map((providerId) => {
    const models = activeIds.has(providerId)
      ? getModelsForStudio(studioId, providerId, {
          catalogMode: prefs.catalogMode,
        }).map((m) => ({
          ...m,
          providerId,
        }))
      : [];
    const disabledReason = lockedSectionReason(providerId, prefs, studioId);
    return {
      providerId,
      label: labels[providerId],
      models,
      disabledReason,
      hint:
        providerId === 'runware' && models.length > 0
          ? 'Often lower cost for supported models'
          : undefined,
    };
  });
}

/**
 * @param {ModelSection[]} sections
 */
export function flattenModelSections(sections) {
  return sections.flatMap((s) => s.models);
}

// Re-export Muapi lookup for code that still needs it
export { getModelById };

export {
  getModelInputOptions,
  getModelInputOptionsForField,
  getModelInputDefault,
  getModelInputFieldName,
  getReferenceInputLimits,
  clampModelInputSelection,
  getModelInputLabel,
  getEffectsForModelRegistry,
  getDefaultEffectForModelRegistry,
  getModesForModelRegistry,
  getModelInputSchema,
  isRangeModelInput,
  modelHasCatalogInput,
};
