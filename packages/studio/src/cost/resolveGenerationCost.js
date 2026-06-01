import { calculateDynamicCost } from '../muapi.js';
import { resolveProviderForOp } from '../studioCloud.js';
import { getModelByIdForStudio } from '../modelRegistry.js';
import { estimateFromCatalogEntry } from './estimateRunwareCost.js';
import { buildCostPayload } from './buildCostPayload.js';

/** @typedef {'muapi' | 'runware-estimate'} CostSource */

/**
 * @typedef {Object} GenerationCostResult
 * @property {number | null} unitCostUsd
 * @property {CostSource | null} source
 */

/**
 * @param {unknown} data
 * @returns {number | null}
 */
function parseMuapiCost(data) {
  if (!data || typeof data !== 'object') return null;
  const c = /** @type {{ cost?: unknown, data?: { cost?: unknown } }} */ (data).cost;
  if (typeof c === 'number' && Number.isFinite(c)) return c;
  const nested = /** @type {{ data?: { cost?: unknown } }} */ (data).data?.cost;
  if (typeof nested === 'number' && Number.isFinite(nested)) return nested;
  return null;
}

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
 *   signal?: AbortSignal,
 * }} opts
 * @returns {Promise<GenerationCostResult>}
 */
export async function resolveGenerationCost(opts) {
  const {
    studioId,
    op,
    routing,
    modelId,
    providerId = 'muapi',
    catalogMode,
    payload = {},
    costParams = {},
    signal,
  } = opts;

  const model = getModelByIdForStudio(modelId, studioId, providerId, { catalogMode });
  const taskName = model?.muapiId || modelId;

  const muapiKey = routing.muapiKey?.trim();
  if (muapiKey && taskName) {
    try {
      const data = await calculateDynamicCost(muapiKey, taskName, buildCostPayload(payload));
      if (signal?.aborted) return { unitCostUsd: null, source: null };
      const cost = parseMuapiCost(data);
      if (cost != null) {
        return { unitCostUsd: cost, source: 'muapi' };
      }
    } catch {
      /* fall through to catalog estimate */
    }
  }

  const resolved = resolveProviderForOp(studioId, op, routing);
  const catalogEntry =
    model ||
    getModelByIdForStudio(modelId, studioId, resolved.providerId, { catalogMode }) ||
    getModelByIdForStudio(modelId, studioId, 'runware', { catalogMode });

  const estimate = estimateFromCatalogEntry(catalogEntry, costParams);
  if (estimate != null) {
    return { unitCostUsd: estimate, source: 'runware-estimate' };
  }

  return { unitCostUsd: null, source: null };
}
