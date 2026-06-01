/**

 * Studio operation availability — UI gate from resolveProviderForOp (ADR-001).

 * Studios must not use isRunware / provider name checks for enable/disable.

 */



import { resolveProviderForOp, providerDisplayLabel } from './studioCloud.js';

import { getUnsupportedReason } from './providers/capabilities.js';



/**

 * @param {string} studioId

 * @param {import('./providers/studioOps.js').StudioOp | string} op

 * @param {import('./providers/types.js').CloudProviderId} providerId

 */

export function buildMissingKeyMessage(studioId, op, providerId) {

  const label = providerDisplayLabel(providerId);

  return `Add API key for ${label} in API Settings`;

}



/**

 * @param {string} studioId

 * @param {import('./providers/studioOps.js').StudioOp | string} op

 * @param {import('./studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} routing

 */

export function getStudioOpAvailability(studioId, op, routing) {

  if (op === 'upload') {

    return {

      canRun: true,

      message: 'Local preview ready; cloud upload runs when you generate',

      hintAction: null,

      providerId: null,

      usedFallback: false,

      blockReason: null,

      resolved: null,

    };

  }

  const resolved = resolveProviderForOp(studioId, op, routing);

  const label = providerDisplayLabel(resolved.providerId);



  if (resolved.blockReason === 'missing_key') {

    return {

      canRun: false,

      message: buildMissingKeyMessage(studioId, op, resolved.providerId),

      hintAction: 'open_api_settings',

      providerId: resolved.providerId,

      usedFallback: resolved.usedFallback,

      blockReason: resolved.blockReason,

      resolved,

    };

  }



  if (resolved.blockReason === 'unsupported') {

    const reason = getUnsupportedReason(resolved.providerId, op);

    return {

      canRun: false,

      message: reason || `Not available on ${label}`,

      hintAction: 'open_api_settings',

      providerId: resolved.providerId,

      usedFallback: resolved.usedFallback,

      blockReason: resolved.blockReason,

      resolved,

    };

  }



  const fallbackNote = resolved.usedFallback ? ' (fallback)' : '';

  return {

    canRun: true,

    message: `Will run via ${label}${fallbackNote}`,

    hintAction: null,

    providerId: resolved.providerId,

    usedFallback: resolved.usedFallback,

    blockReason: null,

    resolved,

  };

}


