/**
 * Studio generation entry — resolves provider then delegates to adapter or Muapi.
 * Studios must import from here instead of muapi.js directly.
 */

import { getProvider } from './providerFactory.js';
import { resolveProviderForOp, providerDisplayLabel } from './studioCloud.js';
import * as muapi from './muapi.js';
import { finalizeParamsAssets } from './media/finalizeParamsAssets.js';
import { stageLocalAsset } from './media/stageLocalAsset.js';
import {
  isPermanentApiError,
  isProviderCircuitOpen,
  recordProviderFailure,
  recordProviderSuccess,
} from './cloudRoutingResilience.js';

/**
 * @param {string} studioId
 * @param {string} op
 * @param {import('./studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} options
 */
export function resolveForGeneration(studioId, op, options) {
  return resolveProviderForOp(studioId, op, options);
}

function notifyFallback(usedFallback, providerId) {
  if (!usedFallback || typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('cloud:fallback-used', {
      detail: { providerId, label: providerDisplayLabel(providerId) },
    })
  );
}

/**
 * @param {string} studioId
 * @param {string} op
 * @param {import('./studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} routing
 * @param {(provider: object, apiKey: string) => Promise<any>} run
 * @param {(apiKey: string) => Promise<any>} muapiFallback
 */
async function withResolvedProvider(studioId, op, routing, run, muapiFallback) {
  const resolved = resolveProviderForOp(studioId, op, routing);
  if (resolved.blockReason === 'missing_key') {
    throw new Error(`Missing API key for ${providerDisplayLabel(resolved.providerId)}`);
  }
  if (resolved.blockReason === 'unsupported') {
    throw new Error(`Operation not supported on ${providerDisplayLabel(resolved.providerId)}`);
  }

  if (
    resolved.providerId === 'runware' &&
    isProviderCircuitOpen('runware') &&
    !routing.providerOverride &&
    routing.allowMuapiFallback !== false &&
    routing.routingMode !== 'runware-only'
  ) {
    const muKey = routing.muapiKey || '';
    if (muKey.trim()) {
      notifyFallback(true, 'muapi');
      const result = await muapiFallback(muKey);
      return { ...result, _providerId: 'muapi', _usedFallback: true };
    }
  }

  const provider = getProvider(resolved.providerId);
  try {
    const result = await run(provider, resolved.apiKey, resolved);
    recordProviderSuccess(resolved.providerId);
    if (resolved.usedFallback) notifyFallback(true, resolved.providerId);
    return { ...result, _providerId: resolved.providerId, _usedFallback: resolved.usedFallback };
  } catch (err) {
    if (resolved.providerId === 'runware') recordProviderFailure('runware', err);
    if (isPermanentApiError(err)) throw err;
    const status = err?.status;
    if (status === 401 || status === 403) throw err;
    if (
      !routing.providerOverride &&
      resolved.providerId === 'runware' &&
      routing.allowMuapiFallback !== false &&
      routing.routingMode !== 'runware-only'
    ) {
      const muKey = routing.muapiKey || '';
      if (muKey.trim()) {
        notifyFallback(true, 'muapi');
        const result = await muapiFallback(muKey);
        return { ...result, _providerId: 'muapi', _usedFallback: true };
      }
    }
    throw err;
  }
}

export async function generateImageForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('image', 'imageT2i', routing, params, opts);
  return withResolvedProvider(
    'image',
    'imageT2i',
    routing,
    (provider, key) => provider.generateImage(key, resolved),
    (key) => muapi.generateImage(key, resolved)
  );
}

export async function generateI2IForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('image', 'imageI2i', routing, params, opts);
  return withResolvedProvider(
    'image',
    'imageI2i',
    routing,
    (provider, key) => {
      if (typeof provider.generateI2I === 'function') {
        return provider.generateI2I(key, resolved);
      }
      return muapi.generateI2I(key, resolved);
    },
    (key) => muapi.generateI2I(key, resolved)
  );
}

export async function generateVideoForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('video', 'videoT2i', routing, params, opts);
  return withResolvedProvider(
    'video',
    'videoT2i',
    routing,
    (provider, key) => {
      if (provider.generateVideo) return provider.generateVideo(key, resolved);
      return muapi.generateVideo(key, resolved);
    },
    (key) => muapi.generateVideo(key, resolved)
  );
}

export async function generateI2VForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('video', 'videoI2v', routing, params, opts);
  return withResolvedProvider(
    'video',
    'videoI2v',
    routing,
    (provider, key) => {
      if (typeof provider.generateI2V === 'function') {
        return provider.generateI2V(key, resolved);
      }
      return muapi.generateI2V(key, resolved);
    },
    (key) => muapi.generateI2V(key, resolved)
  );
}

export async function processV2VForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('video', 'videoV2v', routing, params, opts);
  return withResolvedProvider(
    'video',
    'videoV2v',
    routing,
    (provider, key) => {
      if (typeof provider.processV2V === 'function') {
        return provider.processV2V(key, resolved);
      }
      return muapi.processV2V(key, resolved);
    },
    (key) => muapi.processV2V(key, resolved)
  );
}

export async function generateAudioForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('audio', 'audioT2a', routing, params, opts);
  return withResolvedProvider(
    'audio',
    'audioT2a',
    routing,
    (provider, key) => {
      if (provider.generateAudio) return provider.generateAudio(key, resolved);
      return muapi.generateAudio(key, resolved);
    },
    (key) => muapi.generateAudio(key, resolved)
  );
}

/**
 * Stage file locally (no cloud). Returns StudioAsset.
 * @param {string} studioId
 * @param {File} file
 * @param {{ label?: string, slotKind?: 'image'|'video'|'audio' }} [opts]
 */
export async function stageFileForStudio(studioId, file, opts) {
  return stageLocalAsset(studioId, file, opts);
}

/**
 * @deprecated Use stageFileForStudio. Returns preview blob URL for legacy callers during migration.
 */
export async function uploadFileForStudio(routing, file, onProgress, studioId = 'image') {
  const asset = await stageLocalAsset(studioId, file);
  if (onProgress) onProgress(100);
  return asset.thumbUrl;
}

export { finalizeParamsAssets } from './media/finalizeParamsAssets.js';

export { getUserBalance } from './muapi.js';

export async function generateMarketingStudioAdForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('marketing', 'marketingAd', routing, params, {
    imageLabels: opts.imageLabels || ['image1', 'image2'],
    ...opts,
  });
  const key = routing.muapiKey || '';
  if (!key.trim()) throw new Error('Missing API key for Muapi');
  return muapi.generateMarketingStudioAd(key, resolved);
}

export async function processLipSyncForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('lipsync', 'lipSync', routing, params, opts);
  const key = routing.muapiKey || '';
  if (!key.trim()) throw new Error('Missing API key for Muapi');
  return muapi.processLipSync(key, resolved);
}

export async function runClippingForStudio(routing, params, opts = {}) {
  const resolved = await finalizeParamsAssets('clipping', 'clipping', routing, params, {
    videoLabel: opts.videoLabel,
    ...opts,
  });
  const key = routing.muapiKey || '';
  if (!key.trim()) throw new Error('Missing API key for Muapi');
  return muapi.runClipping(key, resolved);
}

export {
  generateI2I,
  processLipSync,
  runClipping,
  runMotionGraphics,
  runMotionGraphicsEdit,
  generateMarketingStudioAd,
  getTemplateWorkflows,
  getUserWorkflows,
  getPublishedWorkflows,
  createWorkflow,
  updateWorkflowName,
  deleteWorkflow,
  getWorkflowInputs,
  executeWorkflow,
  getAllNodeSchemas,
  getWorkflowData,
  getTemplateAgents,
  getUserAgents,
  getPublishedAgents,
  getUserConversations,
  registerAppInterest,
  getAppInterests,
} from './muapi.js';
