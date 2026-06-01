/**
 * Build routing context passed to studioGenerate helpers.
 * @param {{
 *   apiKey?: string | null,
 *   muapiKey?: string | null,
 *   runwareApiKey?: string | null,
 *   routingPrefs?: {
 *     routingMode?: string,
 *     perStudioRouting?: Record<string, string>,
 *     allowMuapiFallback?: boolean,
 *   },
 *   providerOverride?: 'muapi' | 'runware',
 * }} props
 */
export function buildRoutingContext({
  apiKey,
  muapiKey,
  runwareApiKey,
  routingPrefs = {},
  providerOverride,
}) {
  return {
    muapiKey: (muapiKey ?? apiKey ?? '').trim() || '',
    runwareApiKey: (runwareApiKey ?? '').trim() || '',
    routingMode: routingPrefs.routingMode || 'runware-first',
    perStudioRouting: routingPrefs.perStudioRouting || {},
    allowMuapiFallback: routingPrefs.allowMuapiFallback !== false,
    providerOverride: providerOverride || routingPrefs.providerOverride,
  };
}

import { resolveProviderForOp, providerDisplayLabel } from './studioCloud.js';

/**
 * @param {ReturnType<typeof buildRoutingContext>} routing
 * @param {string} studioId
 * @param {string} op
 */
export function previewProviderLabel(routing, studioId, op) {
  const resolved = resolveProviderForOp(studioId, op, routing);
  if (resolved.blockReason === 'missing_key') {
    return 'Add the required API key in API Settings';
  }
  if (resolved.blockReason === 'unsupported') {
    return 'Not available on the selected provider';
  }
  const label = providerDisplayLabel(resolved.providerId);
  return `Will run via ${label}${resolved.usedFallback ? ' (fallback)' : ''}`;
}
