/**
 * Model Input Resolver — single source of truth for studio control lists (ADR-008).
 */

import {
  t2iModels,
  t2vModels,
  getModelById,
  getI2IModelById,
  getI2VModelById,
  getVideoModelById,
  getAspectRatiosForModel,
  getAspectRatiosForI2IModel,
  getAspectRatiosForI2VModel,
  getAspectRatiosForVideoModel,
  getDurationsForModel,
  getDurationsForI2VModel,
  getResolutionsForModel,
  getResolutionsForI2IModel,
  getResolutionsForI2VModel,
  getResolutionsForVideoModel,
  getQualityFieldForModel,
  getQualityFieldForI2IModel,
  getEffectsForI2IModel,
  getEffectsForI2VModel,
  getDefaultEffectForI2IModel,
  getDefaultEffectForI2VModel,
  getModesForModel,
} from './models.js';
import { runwareT2iModels } from './models.runware.js';
import { runwareVideoModels } from './models.runware.video.js';
import { runwareI2iModels } from './models.runware.i2i.js';
import { runwareI2vModels } from './models.runware.i2v.js';
import { runwareV2vModels } from './models.runware.v2v.js';
import { resolveMuapiIdForRunwareCatalog } from './runwareMuapiIds.js';

/** @typedef {'muapi' | 'runware'} CloudProviderId */
/** @typedef {'t2i' | 'i2i' | 't2v' | 'i2v' | 'v2v'} CatalogMode */

function normalizeProvider(provider) {
  return provider === 'runware' ? 'runware' : 'muapi';
}

const MAX_EXPAND_RANGE = 512;

export function expandModelInput(input) {
  if (!input) return [];
  if (Array.isArray(input.enum) && input.enum.length > 0) return [...input.enum];
  const min = input.minValue;
  const max = input.maxValue;
  const step = input.step ?? 1;
  if (typeof min === 'number' && typeof max === 'number' && step > 0) {
    const count = Math.floor((max - min) / step) + 1;
    if (count > MAX_EXPAND_RANGE) return [];
    const vals = [];
    for (let v = min; v <= max; v += step) vals.push(v);
    return vals;
  }
  if (input.default != null) return [input.default];
  return [];
}

/**
 * Resolved catalog input schema for a field (ADR-008).
 * @param {string} modelId
 * @param {string} field
 * @param {string} [provider]
 * @param {string} [catalogMode]
 * @returns {object | null}
 */
export function getModelInputSchema(modelId, field, provider = 'muapi', catalogMode = 't2i') {
  const model = resolveCatalogModel(modelId, normalizeProvider(provider), catalogMode);
  return resolveModelInputFromModel(model, field, catalogMode);
}

/**
 * True when UI should use a range slider (min/max) instead of enum dropdown.
 * @param {object | null | undefined} schema
 */
export function isRangeModelInput(schema) {
  if (!schema) return false;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return false;
  return typeof schema.minValue === 'number' && typeof schema.maxValue === 'number';
}

function getMuapiModelByMode(muapiId, catalogMode) {
  if (catalogMode === 'i2i') return getI2IModelById(muapiId);
  if (catalogMode === 'i2v') return getI2VModelById(muapiId);
  if (catalogMode === 't2v') return getVideoModelById(muapiId);
  if (catalogMode === 't2i') return getModelById(muapiId);
  return null;
}

function resolveCatalogModel(modelId, provider, catalogMode) {
  const p = normalizeProvider(provider);
  if (catalogMode === 't2i') {
    const list = p === 'runware' ? runwareT2iModels : t2iModels;
    return list.find((m) => m.id === modelId) || null;
  }
  if (catalogMode === 'i2i') {
    if (p === 'runware') return runwareI2iModels.find((m) => m.id === modelId) || null;
    return getI2IModelById(modelId);
  }
  if (catalogMode === 'i2v') {
    if (p === 'runware') return runwareI2vModels.find((m) => m.id === modelId) || null;
    return getI2VModelById(modelId);
  }
  if (catalogMode === 't2v') {
    const list = p === 'runware' ? runwareVideoModels : t2vModels;
    return list.find((m) => m.id === modelId) || null;
  }
  if (catalogMode === 'v2v') {
    return runwareV2vModels.find((m) => m.id === modelId) || null;
  }
  return null;
}

function inputFromModel(model, field) {
  return model?.inputs?.[field] ?? null;
}

function resolveModelInputFromModel(model, field, catalogMode) {
  const direct = inputFromModel(model, field);
  const muapiId = model?.muapiId || resolveMuapiIdForRunwareCatalog(model?.id);
  const muapi = muapiId ? getMuapiModelByMode(muapiId, catalogMode) : null;
  const muapiInput = inputFromModel(muapi, field);

  if (direct && muapiInput?.enum?.length) {
    const directEnum = expandModelInput(direct);
    const muapiEnum = expandModelInput(muapiInput);
    if (muapiEnum.length > directEnum.length) return muapiInput;
  }
  if (direct) return direct;
  if (muapiInput) return muapiInput;
  return null;
}

export function getModelInputOptions(modelId, field, provider = 'muapi', catalogMode = 't2i') {
  const p = normalizeProvider(provider);
  const model = resolveCatalogModel(modelId, p, catalogMode);
  const input = resolveModelInputFromModel(model, field, catalogMode);
  const expanded = expandModelInput(input);
  if (expanded.length > 0) return expanded;

  if (p === 'muapi') {
    if (field === 'aspect_ratio') {
      if (catalogMode === 'i2i') return getAspectRatiosForI2IModel(modelId);
      if (catalogMode === 'i2v') return getAspectRatiosForI2VModel(modelId);
      if (catalogMode === 't2v') return getAspectRatiosForVideoModel(modelId);
      return getAspectRatiosForModel(modelId);
    }
    if (field === 'duration') {
      if (catalogMode === 'i2v') return getDurationsForI2VModel(modelId);
      if (catalogMode === 't2v') return getDurationsForModel(modelId);
    }
    if (field === 'resolution' || field === 'quality') {
      if (catalogMode === 'i2i') return getResolutionsForI2IModel(modelId);
      if (catalogMode === 'i2v') return getResolutionsForI2VModel(modelId);
      if (catalogMode === 't2v') return getResolutionsForVideoModel(modelId);
      return getResolutionsForModel(modelId);
    }
  }
  return [];
}

export function getModelInputDefault(modelId, field, provider = 'muapi', catalogMode = 't2i') {
  const p = normalizeProvider(provider);
  const model = resolveCatalogModel(modelId, p, catalogMode);
  const input = resolveModelInputFromModel(model, field, catalogMode);
  if (input?.default != null) return input.default;
  const options = getModelInputOptions(modelId, field, provider, catalogMode);
  return options.length > 0 ? options[0] : null;
}

export function getModelInputFieldName(modelId, provider = 'muapi', catalogMode = 't2i') {
  const p = normalizeProvider(provider);
  const model = resolveCatalogModel(modelId, p, catalogMode);
  if (model?.inputs?.resolution) return 'resolution';
  if (model?.inputs?.quality) return 'quality';
  const muapiId = model?.muapiId || resolveMuapiIdForRunwareCatalog(model?.id);
  if (muapiId) {
    if (catalogMode === 'i2i') return getQualityFieldForI2IModel(muapiId);
    return getQualityFieldForModel(muapiId);
  }
  if (catalogMode === 'i2i') return getQualityFieldForI2IModel(modelId);
  return getQualityFieldForModel(modelId);
}

export function getQualityOptionsForModel(modelId, provider = 'muapi', catalogMode = 't2i') {
  const field = getModelInputFieldName(modelId, provider, catalogMode);
  if (!field) return [];
  return getModelInputOptions(modelId, field, provider, catalogMode);
}

/**
 * Options for a specific catalog input field (e.g. quality vs resolution).
 * @param {string} modelId
 * @param {string} field
 * @param {string} [provider]
 * @param {string} [catalogMode]
 */
export function getModelInputOptionsForField(modelId, field, provider = 'muapi', catalogMode = 't2i') {
  return getModelInputOptions(modelId, field, provider, catalogMode);
}

/**
 * @param {string} modelId
 * @param {string} field
 * @param {string} [provider]
 * @param {string} [catalogMode]
 */
export function modelHasCatalogInput(modelId, field, provider = 'muapi', catalogMode = 't2i') {
  const model = resolveCatalogModel(modelId, normalizeProvider(provider), catalogMode);
  return Boolean(model?.inputs?.[field]);
}

export function getReferenceInputLimits(modelId, provider = 'muapi', catalogMode = 't2v') {
  const model = resolveCatalogModel(modelId, normalizeProvider(provider), catalogMode);
  const refs = model?.referenceInputs;
  if (refs) {
    return {
      images: refs.images ?? 0,
      videos: refs.videos ?? 0,
      audios: refs.audios ?? 0,
    };
  }
  return { images: 0, videos: 0, audios: 0 };
}

export function clampModelInputSelection(value, options, fallback) {
  if (options.length === 0) return fallback ?? null;
  if (options.some((o) => o === value)) return value;
  return fallback ?? options[0];
}

export function getModelInputLabel(modelId, field, provider = 'muapi', catalogMode = 't2i') {
  const model = resolveCatalogModel(modelId, normalizeProvider(provider), catalogMode);
  const input = resolveModelInputFromModel(model, field, catalogMode);
  return input?.title || field;
}

export function getEffectsForModelRegistry(modelId, provider, catalogMode) {
  if (normalizeProvider(provider) === 'runware') {
    const model = resolveCatalogModel(modelId, 'runware', catalogMode);
    return expandModelInput(model?.inputs?.name);
  }
  if (catalogMode === 'i2i') return getEffectsForI2IModel(modelId);
  if (catalogMode === 'i2v') return getEffectsForI2VModel(modelId);
  return [];
}

export function getDefaultEffectForModelRegistry(modelId, provider, catalogMode) {
  if (normalizeProvider(provider) === 'runware') {
    return getModelInputDefault(modelId, 'name', provider, catalogMode);
  }
  if (catalogMode === 'i2i') return getDefaultEffectForI2IModel(modelId);
  if (catalogMode === 'i2v') return getDefaultEffectForI2VModel(modelId);
  return null;
}

export function getModesForModelRegistry(modelId, provider = 'muapi', catalogMode = 't2v') {
  if (normalizeProvider(provider) === 'runware') {
    return getModelInputOptions(modelId, 'mode', provider, catalogMode);
  }
  return getModesForModel(modelId);
}
