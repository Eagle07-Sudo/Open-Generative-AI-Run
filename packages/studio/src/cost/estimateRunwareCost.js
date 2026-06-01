/**
 * @typedef {Object} PricingHints
 * @property {number} baseUsd
 * @property {number} [baseDurationSec]
 * @property {string} [baseResolution]
 * @property {number} [perExtraSecondUsd]
 * @property {Record<string, number>} [resolutionMultipliers]
 * @property {{ perRefImage?: number, perRefVideo?: number, perRefAudio?: number }} [multimodalExtraUsd]
 */

/**
 * @typedef {Object} CostEstimateParams
 * @property {number} [duration]
 * @property {string} [resolution]
 * @property {number} [refImageCount]
 * @property {number} [refVideoCount]
 * @property {number} [refAudioCount]
 */

/**
 * @param {number} n
 * @returns {number}
 */
export function roundCostUsd(n) {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n < 0.01) return 0.01;
  return Math.round(n * 100) / 100;
}

/**
 * @param {PricingHints | null | undefined} hints
 * @param {CostEstimateParams} [params]
 * @returns {number | null}
 */
export function estimateRunwareCost(hints, params = {}) {
  if (!hints?.baseUsd) return null;

  let cost = hints.baseUsd;

  const baseDur = hints.baseDurationSec ?? 0;
  const dur = Number(params.duration) || baseDur || 0;
  if (baseDur > 0 && dur > baseDur && hints.perExtraSecondUsd) {
    cost += (dur - baseDur) * hints.perExtraSecondUsd;
  }

  const res = params.resolution || hints.baseResolution;
  const mult = hints.resolutionMultipliers?.[res];
  if (mult != null && mult > 0) {
    cost *= mult;
  }

  const extra = hints.multimodalExtraUsd;
  if (extra) {
    cost += (params.refImageCount || 0) * (extra.perRefImage ?? 0);
    cost += (params.refVideoCount || 0) * (extra.perRefVideo ?? 0);
    cost += (params.refAudioCount || 0) * (extra.perRefAudio ?? 0);
  }

  return roundCostUsd(cost);
}

/**
 * @param {object | null | undefined} catalogEntry
 * @param {CostEstimateParams} [params]
 * @returns {number | null}
 */
export function estimateFromCatalogEntry(catalogEntry, params = {}) {
  return estimateRunwareCost(catalogEntry?.pricingHints, params);
}
