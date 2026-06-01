import { getModelInputSchema } from '../modelInputResolver.js';

/** Muapi convention: -1 means random / omit on some endpoints. */
export const SEED_RANDOM = -1;

const SEED_MAX = 2147483646;

/**
 * @returns {number}
 */
export function randomSeed() {
  return Math.floor(Math.random() * (SEED_MAX + 1));
}

/**
 * @param {unknown} uiSeed null | '' | number
 * @param {object | null} [schema]
 * @returns {number | undefined} fixed seed for API, undefined = random
 */
export function resolveSeedForGenerate(uiSeed, schema) {
  if (uiSeed == null || uiSeed === '') return undefined;
  const n = Number(uiSeed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  const min = schema?.minValue ?? 0;
  const max = schema?.maxValue ?? SEED_MAX;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/**
 * @param {unknown} uiSeed
 * @returns {number | undefined}
 */
export function seedForSnapshot(uiSeed) {
  return resolveSeedForGenerate(uiSeed);
}

/**
 * @param {number | undefined} usedSeed
 * @returns {number}
 */
export function advanceSeed(usedSeed) {
  if (usedSeed == null || !Number.isFinite(Number(usedSeed)) || Number(usedSeed) < 0) {
    return randomSeed();
  }
  return Number(usedSeed) + 1;
}

/**
 * @param {number | null | undefined} baseSeed UI seed (fixed or empty)
 * @param {number} count
 * @returns {number[]}
 */
export function seedsForBatch(baseSeed, count) {
  const n = Math.max(1, count);
  const fixed = resolveSeedForGenerate(baseSeed);
  if (fixed == null) {
    const start = randomSeed();
    return Array.from({ length: n }, (_, i) => start + i);
  }
  return Array.from({ length: n }, (_, i) => fixed + i);
}

/**
 * @param {string} modelId
 * @param {string} providerId
 * @param {string} catalogMode
 */
export function modelSupportsSeed(modelId, providerId, catalogMode) {
  if (getModelInputSchema(modelId, 'seed', providerId, catalogMode)) return true;
  if (providerId === 'muapi' && (catalogMode === 't2i' || catalogMode === 'i2i')) return true;
  return false;
}

/**
 * @param {number | undefined} sentSeed
 * @param {{ seed?: number, providerMeta?: { seed?: number } }} [res]
 * @returns {number}
 */
export function usedSeedFromResponse(sentSeed, res) {
  const echo = res?.seed ?? res?.providerMeta?.seed;
  if (echo != null && Number.isFinite(Number(echo))) return Number(echo);
  if (sentSeed != null && Number.isFinite(Number(sentSeed)) && Number(sentSeed) >= 0) {
    return Number(sentSeed);
  }
  return randomSeed();
}

/**
 * @param {Record<string, unknown>} params
 * @param {unknown} uiSeed
 * @param {string} modelId
 * @param {string} providerId
 * @param {string} catalogMode
 */
export function applySeedToParams(params, uiSeed, modelId, providerId, catalogMode) {
  const schema = getModelInputSchema(modelId, 'seed', providerId, catalogMode);
  const n = resolveSeedForGenerate(uiSeed, schema);
  if (n != null) params.seed = n;
}

/**
 * Clone snapshot with per-card seed (batch gallery + Recreate).
 * @param {import('../studioRecreate.js').GenerationSnapshot | undefined} snapshot
 * @param {number | undefined} seed
 */
export function snapshotWithCardSeed(snapshot, seed) {
  if (!snapshot) return snapshot;
  const n = resolveSeedForGenerate(seed);
  const controls = { ...(snapshot.controls || {}) };
  if (n != null) controls.seed = n;
  else delete controls.seed;
  return { ...snapshot, controls };
}
