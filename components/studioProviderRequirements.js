/**
 * Which cloud API key each studio tab requires (Shell-level banner logic).
 * With routing v2, use studioCapabilities + resolveProviderForTab as source of truth.
 */

import { normalizeCloudProvider } from './cloudSession.js';
import { resolveProviderForTab } from '../packages/studio/src/studioCloud.js';
import { MUAPI_LOCKED_STUDIOS, studioIdFromTab } from '../packages/studio/src/providers/studioOps.js';

/** @typedef {'muapi' | 'runware'} CloudProviderId */

/** Tab ids aligned with StandaloneShell TABS */
export const STUDIO_TAB_LABELS = {
  image: 'Image Studio',
  video: 'Video Studio',
  audio: 'Audio Studio',
  clipping: 'AI Clipping',
  'vibe-motion': 'Vibe Motion',
  lipsync: 'Lip Sync',
  cinema: 'Cinema Studio',
  marketing: 'Marketing Studio',
  workflows: 'Workflows',
  agents: 'Agents',
  'design-agent': 'Design Agent',
  apps: 'Explore Apps',
};

/**
 * @param {string} tabId
 * @param {string} cloudProvider
 * @param {{ routingMode?: string, perStudioRouting?: Record<string, string>, allowMuapiFallback?: boolean } | null} [routingPrefs]
 * @param {string | null} [muapiKey]
 * @param {string | null} [runwareKey]
 * @returns {CloudProviderId}
 */
export function getRequiredProviderForTab(tabId, cloudProvider, routingPrefs = null, muapiKey = null, runwareKey = null) {
  if (routingPrefs) {
    const resolved = resolveProviderForTab(tabId, {
      ...routingPrefs,
      muapiKey,
      runwareApiKey: runwareKey,
    });
    return resolved.providerId;
  }
  const studioId = studioIdFromTab(tabId);
  if (MUAPI_LOCKED_STUDIOS.includes(studioId)) return 'muapi';
  const normalized = normalizeCloudProvider(cloudProvider);
  if (tabId === 'image') {
    return normalized === 'runware' ? 'runware' : 'muapi';
  }
  return 'muapi';
}

/**
 * @param {CloudProviderId} provider
 * @param {string | null | undefined} muapiKey
 * @param {string | null | undefined} runwareKey
 */
export function hasKeyForProvider(provider, muapiKey, runwareKey) {
  const p = normalizeCloudProvider(provider);
  if (p === 'runware') return Boolean(runwareKey?.trim());
  return Boolean(muapiKey?.trim());
}

/**
 * @param {string} tabId
 * @param {string} cloudProvider
 * @param {string | null | undefined} muapiKey
 * @param {string | null | undefined} runwareKey
 * @param {{ routingMode?: string, perStudioRouting?: Record<string, string>, allowMuapiFallback?: boolean } | null} [routingPrefs]
 */
export function needsStudioProviderBanner(tabId, cloudProvider, muapiKey, runwareKey, routingPrefs = null) {
  if (routingPrefs) {
    const resolved = resolveProviderForTab(tabId, {
      ...routingPrefs,
      muapiKey,
      runwareApiKey: runwareKey,
    });
    if (resolved.blockReason === 'missing_key') return true;
    if (resolved.blockReason === 'unsupported') return true;
    return false;
  }
  const required = getRequiredProviderForTab(tabId, cloudProvider);
  if (tabId === 'image' && required === 'runware') {
    return !hasKeyForProvider('runware', muapiKey, runwareKey);
  }
  return !hasKeyForProvider(required, muapiKey, runwareKey);
}

/**
 * @param {string} tabId
 * @returns {string}
 */
export function getStudioLabelForTab(tabId) {
  return STUDIO_TAB_LABELS[tabId] || 'This studio';
}

/**
 * @param {string} tabId
 * @param {string} cloudProvider
 * @param {string | null | undefined} muapiKey
 * @param {string | null | undefined} runwareKey
 * @returns {{ show: true, requiredProvider: CloudProviderId, studioLabel: string } | { show: false }}
 */
export function getBannerContext(tabId, cloudProvider, muapiKey, runwareKey, routingPrefs = null) {
  if (!needsStudioProviderBanner(tabId, cloudProvider, muapiKey, runwareKey, routingPrefs)) {
    return { show: false };
  }
  const studioId = studioIdFromTab(tabId);
  const resolved = routingPrefs
    ? resolveProviderForTab(tabId, { ...routingPrefs, muapiKey, runwareApiKey: runwareKey })
    : null;
  const requiredProvider = resolved
    ? MUAPI_LOCKED_STUDIOS.includes(studioId)
      ? 'muapi'
      : resolved.providerId
    : getRequiredProviderForTab(tabId, cloudProvider);
  return {
    show: true,
    requiredProvider,
    studioLabel: getStudioLabelForTab(tabId),
    reason: resolved?.blockReason || 'missing_key',
  };
}
