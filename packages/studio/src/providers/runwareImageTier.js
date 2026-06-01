/**
 * Map image resolution tiers (1k/2k/4k) + aspect ratio → Runware pixel dimensions.
 * Verified for Nano Banana / Seedream-class models per Runware docs.
 */

import { aspectRatioToRunwareSize } from './runwareAspect.js';

/** @type {Record<string, number>} */
const TIER_SHORT_SIDE = {
  '1k': 1024,
  '1K': 1024,
  '2k': 2048,
  '2K': 2048,
  '4k': 4096,
  '4K': 4096,
};

/**
 * @param {string} tier
 * @returns {string}
 */
export function normalizeImageTier(tier) {
  if (!tier || typeof tier !== 'string') return '1k';
  const lower = tier.toLowerCase();
  if (lower === '1k' || lower === '2k' || lower === '4k') return lower;
  return tier;
}

/**
 * @param {number} width
 * @param {number} height
 * @param {number} targetShort
 */
function scaleToTier(width, height, targetShort) {
  const short = Math.min(width, height);
  if (short <= 0) return { width: targetShort, height: targetShort };
  const scale = targetShort / short;
  const round64 = (n) => Math.max(64, Math.round(n / 64) * 64);
  return { width: round64(width * scale), height: round64(height * scale) };
}

/**
 * @param {string} [tier]
 * @param {string} [aspectRatio]
 * @returns {{ width: number, height: number }}
 */
export function imageTierToRunwareSize(tier = '1k', aspectRatio = '1:1') {
  const normalized = normalizeImageTier(tier);
  const targetShort = TIER_SHORT_SIDE[normalized] || TIER_SHORT_SIDE['1k'];
  const base = aspectRatioToRunwareSize(aspectRatio === 'auto' ? '1:1' : aspectRatio);
  return scaleToTier(base.width, base.height, targetShort);
}

/**
 * @param {string} [tier]
 * @returns {boolean}
 */
export function isImageResolutionTier(tier) {
  if (!tier || typeof tier !== 'string') return false;
  const n = normalizeImageTier(tier);
  return n === '1k' || n === '2k' || n === '4k';
}
