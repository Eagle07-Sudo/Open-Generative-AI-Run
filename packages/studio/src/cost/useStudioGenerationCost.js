'use client';

import { useEffect, useState, useRef } from 'react';
import { resolveGenerationCost } from './resolveGenerationCost.js';

const DEBOUNCE_MS = 700;

/**
 * @param {{
 *   studioId: string,
 *   op: import('../providers/studioOps.js').StudioOp,
 *   routing: import('../studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string },
 *   modelId: string,
 *   providerId?: string,
 *   catalogMode?: string,
 *   payload?: Record<string, unknown>,
 *   costParams?: import('./estimateRunwareCost.js').CostEstimateParams,
 *   enabled?: boolean,
 * }} config
 */
export function useStudioGenerationCost(config) {
  const {
    studioId,
    op,
    routing,
    modelId,
    providerId,
    catalogMode,
    payload = {},
    costParams = {},
    enabled = true,
  } = config;

  const [unitCostUsd, setUnitCostUsd] = useState(/** @type {number | null} */ (null));
  const [source, setSource] = useState(/** @type {import('./resolveGenerationCost.js').CostSource | null} */ (null));
  const [isLoadingCost, setIsLoadingCost] = useState(false);
  const abortRef = useRef(/** @type {AbortController | null} */ (null));

  const payloadKey = JSON.stringify(payload);
  const costParamsKey = JSON.stringify(costParams);

  useEffect(() => {
    if (!enabled || !modelId) {
      setUnitCostUsd(null);
      setSource(null);
      setIsLoadingCost(false);
      return;
    }

    const ac = new AbortController();
    abortRef.current?.abort();
    abortRef.current = ac;

    const timer = setTimeout(async () => {
      setIsLoadingCost(true);
      try {
        const result = await resolveGenerationCost({
          studioId,
          op,
          routing,
          modelId,
          providerId,
          catalogMode,
          payload: JSON.parse(payloadKey),
          costParams: JSON.parse(costParamsKey),
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setUnitCostUsd(result.unitCostUsd);
        setSource(result.source);
      } catch {
        if (!ac.signal.aborted) {
          setUnitCostUsd(null);
          setSource(null);
        }
      } finally {
        if (!ac.signal.aborted) setIsLoadingCost(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      ac.abort();
    };
  }, [
    enabled,
    studioId,
    op,
    modelId,
    providerId,
    catalogMode,
    payloadKey,
    costParamsKey,
    routing.muapiKey,
    routing.runwareApiKey,
    routing.routingMode,
    routing.allowMuapiFallback,
  ]);

  return { unitCostUsd, source, isLoadingCost };
}
