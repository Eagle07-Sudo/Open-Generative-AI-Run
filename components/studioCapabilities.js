/**
 * Capability-aware banner context (hybrid routing).
 * Complements studioProviderRequirements (missing keys).
 */

import { resolveProviderForTab } from '../packages/studio/src/studioCloud.js';
import { MUAPI_LOCKED_STUDIOS, studioIdFromTab } from '../packages/studio/src/providers/studioOps.js';
import { getStudioLabelForTab } from './studioProviderRequirements.js';

/**
 * @param {string} tabId
 * @param {{ routingMode?: string, perStudioRouting?: Record<string, string>, allowMuapiFallback?: boolean }} routingPrefs
 * @param {string | null | undefined} muapiKey
 * @param {string | null | undefined} runwareApiKey
 */
export function getRoutingBannerContext(tabId, routingPrefs, muapiKey, runwareApiKey) {
  const resolved = resolveProviderForTab(tabId, {
    ...routingPrefs,
    muapiKey,
    runwareApiKey,
  });

  if (!resolved.blockReason) {
    return { show: false };
  }

  const studioId = studioIdFromTab(tabId);
  const requiredProvider =
    MUAPI_LOCKED_STUDIOS.includes(studioId) || resolved.blockReason === 'missing_key'
      ? resolved.providerId
      : resolved.providerId;

  if (resolved.blockReason === 'unsupported') {
    return {
      show: true,
      requiredProvider: resolved.providerId,
      studioLabel: getStudioLabelForTab(tabId),
      reason: 'unsupported',
    };
  }

  return {
    show: true,
    requiredProvider: MUAPI_LOCKED_STUDIOS.includes(studioId) ? 'muapi' : requiredProvider,
    studioLabel: getStudioLabelForTab(tabId),
    reason: 'missing_key',
  };
}

/**
 * Merge key banner (legacy) with routing resolver — routing takes precedence when v2 enabled.
 * @param {import('./studioProviderRequirements.js').getBannerContext extends Function ? ReturnType<import('./studioProviderRequirements.js').getBannerContext> : never} legacyContext
 * @param {ReturnType<typeof getRoutingBannerContext>} routingContext
 * @param {boolean} routingV2
 */
export function mergeBannerContexts(legacyContext, routingContext, routingV2) {
  if (routingV2 && routingContext.show) return routingContext;
  if (legacyContext.show) return legacyContext;
  if (!routingV2 && routingContext.show) return routingContext;
  return { show: false };
}
