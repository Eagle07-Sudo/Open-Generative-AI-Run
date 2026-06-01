import { getCloudApiKey, providerLabel } from './providerFactory.js';
import { supportsStudioOp } from './providers/capabilities.js';
import {
  MUAPI_LOCKED_STUDIOS,
  defaultOpForTab,
  studioIdFromTab,
} from './providers/studioOps.js';

/** @typedef {import('./providers/types.js').CloudProviderId} CloudProviderId */
/** @typedef {import('./providers/studioOps.js').StudioOp} StudioOp */

/** @typedef {'runware-first' | 'muapi-only' | 'runware-only'} RoutingMode */
/** @typedef {'auto' | 'runware' | 'muapi'} PerStudioRoute */

/**
 * @typedef {Object} RoutingPrefs
 * @property {RoutingMode} [routingMode]
 * @property {Record<string, PerStudioRoute>} [perStudioRouting]
 * @property {boolean} [allowMuapiFallback]
 * @property {CloudProviderId} [providerOverride] — explicit model pick in unified picker (ADR-002)
 */

/**
 * @typedef {Object} ResolveResult
 * @property {CloudProviderId} providerId — on block: provider that needs a key (missing_key) or was attempted (unsupported)
 * @property {string} apiKey
 * @property {boolean} usedFallback
 * @property {string} [requestId]
 * @property {'missing_key' | 'unsupported' | null} [blockReason]
 */

function hasKey(provider, muapiKey, runwareApiKey) {
  const key = getCloudApiKey(provider, { muapiKey, runwareApiKey });
  return Boolean(key?.trim());
}

/**
 * @param {string} studioId
 */
function isMuapiLockedStudio(studioId) {
  return MUAPI_LOCKED_STUDIOS.includes(studioId);
}

/**
 * @param {string} studioId
 * @param {RoutingPrefs} prefs
 * @returns {PerStudioRoute | null}
 */
function getStudioOverride(studioId, prefs) {
  const route = prefs.perStudioRouting?.[studioId];
  if (route && route !== 'auto') return route;
  return null;
}

/**
 * Which provider lacks a key for this op (for missing_key blocks).
 * @param {StudioOp} op
 * @param {string | null | undefined} muapiKey
 * @param {string | null | undefined} runwareApiKey
 * @param {CloudProviderId} [fallback]
 * @returns {CloudProviderId}
 */
function providerMissingKeyForOp(op, muapiKey, runwareApiKey, fallback = 'runware') {
  if (supportsStudioOp('runware', op) && !hasKey('runware', muapiKey, runwareApiKey)) {
    return 'runware';
  }
  if (supportsStudioOp('muapi', op) && !hasKey('muapi', muapiKey, runwareApiKey)) {
    return 'muapi';
  }
  return fallback;
}

/**
 * @typedef {{ providerId: CloudProviderId, usedFallback: boolean }} ResolveSuccess
 * @typedef {{ blockReason: 'missing_key' | 'unsupported', providerId: CloudProviderId }} ResolveBlocked
 */

/**
 * @param {RoutingMode} mode
 * @param {CloudProviderId} preferred
 * @param {StudioOp} op
 * @param {string | null | undefined} muapiKey
 * @param {string | null | undefined} runwareApiKey
 * @param {boolean} allowMuapiFallback
 * @returns {ResolveSuccess | ResolveBlocked}
 */
function resolveByMode(mode, preferred, op, muapiKey, runwareApiKey, allowMuapiFallback) {
  const tryProvider = (providerId) => {
    if (!supportsStudioOp(providerId, op)) return null;
    if (!hasKey(providerId, muapiKey, runwareApiKey)) return null;
    return providerId;
  };

  if (mode === 'muapi-only') {
    const p = tryProvider('muapi');
    return p
      ? { providerId: p, usedFallback: false }
      : { blockReason: 'missing_key', providerId: 'muapi' };
  }

  if (mode === 'runware-only') {
    const rw = tryProvider('runware');
    if (rw) return { providerId: rw, usedFallback: false };
    if (allowMuapiFallback) {
      const mu = tryProvider('muapi');
      if (mu) return { providerId: mu, usedFallback: true };
    }
    if (supportsStudioOp('runware', op)) {
      return { blockReason: 'missing_key', providerId: 'runware' };
    }
    if (allowMuapiFallback && supportsStudioOp('muapi', op)) {
      return { blockReason: 'missing_key', providerId: 'muapi' };
    }
    return { blockReason: 'unsupported', providerId: 'runware' };
  }

  // runware-first
  const rw = tryProvider('runware');
  if (rw) return { providerId: rw, usedFallback: false };
  if (allowMuapiFallback) {
    const mu = tryProvider('muapi');
    if (mu) return { providerId: mu, usedFallback: true };
  }
  if (!supportsStudioOp('runware', op) && supportsStudioOp('muapi', op)) {
    return hasKey('muapi', muapiKey, runwareApiKey)
      ? { providerId: 'muapi', usedFallback: false }
      : { blockReason: 'missing_key', providerId: 'muapi' };
  }
  return {
    blockReason: 'missing_key',
    providerId: providerMissingKeyForOp(op, muapiKey, runwareApiKey, preferred),
  };
}

/**
 * @param {ResolveSuccess | ResolveBlocked} inner
 * @param {CloudProviderId} fallbackProviderId
 * @returns {CloudProviderId}
 */
function blockedProviderId(inner, fallbackProviderId) {
  return 'providerId' in inner && inner.providerId ? inner.providerId : fallbackProviderId;
}

/**
 * Central routing resolver — single source of truth for provider selection.
 * @param {string} studioId
 * @param {StudioOp} op
 * @param {RoutingPrefs & { muapiKey?: string | null, runwareApiKey?: string | null }} options
 * @returns {ResolveResult}
 */
export function resolveProviderForOp(studioId, op, options = {}) {
  const {
    routingMode = 'runware-first',
    perStudioRouting = {},
    muapiKey,
    runwareApiKey,
    allowMuapiFallback = true,
    requestId,
  } = options;

  const rid = requestId || (typeof crypto !== 'undefined' ? crypto.randomUUID() : `req-${Date.now()}`);

  if (isMuapiLockedStudio(studioId)) {
    if (!supportsStudioOp('muapi', op)) {
      return { providerId: 'muapi', apiKey: '', usedFallback: false, requestId: rid, blockReason: 'unsupported' };
    }
    if (!hasKey('muapi', muapiKey, runwareApiKey)) {
      return { providerId: 'muapi', apiKey: '', usedFallback: false, requestId: rid, blockReason: 'missing_key' };
    }
    return {
      providerId: 'muapi',
      apiKey: getCloudApiKey('muapi', { muapiKey, runwareApiKey }),
      usedFallback: false,
      requestId: rid,
      blockReason: null,
    };
  }

  const { providerOverride } = options;
  if (providerOverride === 'muapi' || providerOverride === 'runware') {
    if (!supportsStudioOp(providerOverride, op)) {
      return {
        providerId: providerOverride,
        apiKey: '',
        usedFallback: false,
        requestId: rid,
        blockReason: 'unsupported',
      };
    }
    if (!hasKey(providerOverride, muapiKey, runwareApiKey)) {
      return {
        providerId: providerOverride,
        apiKey: '',
        usedFallback: false,
        requestId: rid,
        blockReason: 'missing_key',
      };
    }
    return {
      providerId: providerOverride,
      apiKey: getCloudApiKey(providerOverride, { muapiKey, runwareApiKey }),
      usedFallback: false,
      requestId: rid,
      blockReason: null,
    };
  }

  const override = getStudioOverride(studioId, { perStudioRouting });
  if (override === 'muapi' || override === 'runware') {
    const mode = override === 'muapi' ? 'muapi-only' : 'runware-only';
    const inner = resolveByMode(mode, override, op, muapiKey, runwareApiKey, allowMuapiFallback);
    if ('blockReason' in inner) {
      return {
        providerId: blockedProviderId(inner, override),
        apiKey: '',
        usedFallback: false,
        requestId: rid,
        blockReason: inner.blockReason,
      };
    }
    return {
      providerId: inner.providerId,
      apiKey: getCloudApiKey(inner.providerId, { muapiKey, runwareApiKey }),
      usedFallback: inner.usedFallback,
      requestId: rid,
      blockReason: null,
    };
  }

  const inner = resolveByMode(routingMode, 'runware', op, muapiKey, runwareApiKey, allowMuapiFallback);
  if ('blockReason' in inner) {
    const fallbackId = routingMode === 'muapi-only' ? 'muapi' : 'runware';
    return {
      providerId: blockedProviderId(inner, fallbackId),
      apiKey: '',
      usedFallback: false,
      requestId: rid,
      blockReason: inner.blockReason,
    };
  }

  return {
    providerId: inner.providerId,
    apiKey: getCloudApiKey(inner.providerId, { muapiKey, runwareApiKey }),
    usedFallback: inner.usedFallback,
    requestId: rid,
    blockReason: null,
  };
}

/**
 * @param {string} tabId
 * @param {RoutingPrefs & { muapiKey?: string | null, runwareApiKey?: string | null }} options
 */
export function resolveProviderForTab(tabId, options) {
  const studioId = studioIdFromTab(tabId);
  const op = defaultOpForTab(tabId);
  return resolveProviderForOp(studioId, op, options);
}

/**
 * @param {CloudProviderId} providerId
 */
export function providerDisplayLabel(providerId) {
  return providerLabel(providerId);
}

/**
 * @typedef {Object} GenerationContext
 * @property {string} requestId
 * @property {CloudProviderId} providerId
 * @property {RoutingMode} routingMode
 * @property {boolean} usedFallback
 * @property {string} studioId
 * @property {StudioOp} op
 * @property {CloudProviderId} [providerOverride]
 */

/**
 * @param {ResolveResult} resolved
 * @param {string} studioId
 * @param {StudioOp} op
 * @param {RoutingMode} routingMode
 * @returns {GenerationContext}
 */
export function toGenerationContext(resolved, studioId, op, routingMode, providerOverride) {
  return {
    requestId: resolved.requestId || '',
    providerId: resolved.providerId,
    routingMode,
    usedFallback: resolved.usedFallback,
    studioId,
    op,
    providerOverride: providerOverride || undefined,
  };
}
