/** Runware catalog pricing estimates — sync with Runware model pages periodically. */

/** @typedef {import('./estimateRunwareCost.js').PricingHints} PricingHints */

/** @type {PricingHints} */
export const RUNWARE_SEEDANCE_PRICING_HINTS = {
  baseUsd: 0.14,
  baseDurationSec: 5,
  baseResolution: '720p',
  perExtraSecondUsd: 0.02,
  resolutionMultipliers: { '480p': 0.8, '720p': 1 },
  multimodalExtraUsd: { perRefImage: 0.01, perRefVideo: 0.02, perRefAudio: 0.02 },
};

/** @type {PricingHints} */
export const RUNWARE_IMAGE_DEFAULT_PRICING_HINTS = {
  baseUsd: 0.003,
  baseDurationSec: 0,
  baseResolution: '1k',
  perExtraSecondUsd: 0,
  resolutionMultipliers: { '1k': 1, '2k': 1.5, '4k': 2.5 },
};

/** @type {PricingHints} */
export const RUNWARE_OPENAI_IMAGE_PRICING_HINTS = {
  baseUsd: 0.04,
  baseDurationSec: 0,
  baseResolution: '1k',
  perExtraSecondUsd: 0,
  resolutionMultipliers: { '1k': 1, '2k': 1.2, '4k': 1.8 },
};
