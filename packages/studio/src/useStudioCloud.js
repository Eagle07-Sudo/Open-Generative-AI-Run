'use client';

import { useMemo } from 'react';
import { getProvider } from './providerFactory.js';
import {
  getModelsForStudio,
  getUnifiedModelSections,
  normalizeCloudProvider,
} from './modelRegistry.js';
import { supportsStudioOp } from './providers/capabilities.js';
import {
  resolveProviderForOp,
  providerDisplayLabel,
  toGenerationContext,
} from './studioCloud.js';
import { studioIdFromTab, defaultOpForTab } from './providers/studioOps.js';

/**
 * @param {{
 *   studioId?: string,
 *   tabId?: string,
 *   op?: string,
 *   muapiKey?: string | null,
 *   runwareApiKey?: string | null,
 *   routingPrefs?: import('./studioCloud.js').RoutingPrefs,
 *   providerOverride?: import('./studioCloud.js').RoutingPrefs['providerOverride'],
 *   catalogMode?: string,
 * }} params
 */
export function useStudioCloud({
  studioId: studioIdProp,
  tabId,
  op: opProp,
  muapiKey,
  runwareApiKey,
  routingPrefs = {},
  providerOverride,
  catalogMode,
}) {
  const studioId = studioIdProp || (tabId ? studioIdFromTab(tabId) : 'image');
  const op = opProp || (tabId ? defaultOpForTab(tabId) : 'imageT2i');
  const routingMode = routingPrefs.routingMode || 'runware-first';

  const resolved = useMemo(
    () =>
      resolveProviderForOp(studioId, op, {
        ...routingPrefs,
        providerOverride: providerOverride ?? routingPrefs.providerOverride,
        muapiKey,
        runwareApiKey,
      }),
    [studioId, op, routingPrefs, muapiKey, runwareApiKey, routingMode, providerOverride]
  );

  const modelSections = useMemo(
    () =>
      getUnifiedModelSections(studioId, {
        routingMode,
        allowMuapiFallback: routingPrefs.allowMuapiFallback !== false,
        muapiKey: muapiKey || '',
        runwareApiKey: runwareApiKey || '',
        catalogMode,
      }),
    [studioId, routingMode, routingPrefs.allowMuapiFallback, muapiKey, runwareApiKey, catalogMode]
  );

  const provider = useMemo(
    () => getProvider(resolved.providerId),
    [resolved.providerId]
  );

  const models = useMemo(
    () => getModelsForStudio(studioId, resolved.providerId),
    [studioId, resolved.providerId]
  );

  const generationContext = useMemo(
    () =>
      toGenerationContext(
        resolved,
        studioId,
        op,
        routingMode,
        providerOverride ?? routingPrefs.providerOverride
      ),
    [resolved, studioId, op, routingMode, providerOverride, routingPrefs.providerOverride]
  );

  const resolvedProviderLabel = providerDisplayLabel(resolved.providerId);
  const previewLabel =
    resolved.blockReason === 'missing_key'
      ? 'Add the required API key in settings'
      : resolved.blockReason === 'unsupported'
        ? 'Not available on selected provider'
        : `Will run via ${resolvedProviderLabel}${resolved.usedFallback ? ' (fallback)' : ''}`;

  return {
    provider,
    apiKey: resolved.apiKey,
    providerId: resolved.providerId,
    usedFallback: resolved.usedFallback,
    blockReason: resolved.blockReason,
    models,
    modelSections,
    supports: (o) => supportsStudioOp(resolved.providerId, o),
    resolved,
    generationContext,
    resolvedProviderLabel,
    previewLabel,
    providerForOp: (nextOp) =>
      resolveProviderForOp(studioId, nextOp, {
        ...routingPrefs,
        muapiKey,
        runwareApiKey,
      }),
  };
}

export { normalizeCloudProvider };
