/** Generation snapshot + Recreate event bus (ADR-012). */

import { parseMentionLabels } from './media/mentionParse.js';

export const STUDIO_RECREATE_EVENT = 'studio:recreate';
export const STUDIO_RETRY_EVENT = 'studio:retry-generation';
export const SNAPSHOT_VERSION = 1;

/**
 * @typedef {import('./media/studioAssetPersist.js').StudioAssetManifestEntry} StudioAssetManifestEntry
 * @typedef {Object} GenerationSnapshot
 * @property {number} snapshotVersion
 * @property {'image' | 'video' | 'marketing'} studioId
 * @property {'t2i' | 'i2i' | 't2v' | 'i2v' | 'v2v'} catalogMode
 * @property {string} modelId
 * @property {'runware' | 'muapi'} providerId
 * @property {string} prompt
 * @property {Record<string, unknown>} controls
 * @property {string[]} assetLabels
 * @property {StudioAssetManifestEntry[]} [assetManifest]
 * @property {boolean} [imageMode]
 * @property {boolean} [v2vMode]
 * @property {number} [batchSize]
 * @property {string} [format]
 * @property {string} [avatarId]
 * @property {string} [ugcId]
 * @property {string} [restoreImageUrl]
 * @property {string} [restoreVideoUrl]
 */

/**
 * @param {object} args
 * @returns {GenerationSnapshot}
 */
/**
 * Best-effort snapshot for persisted gallery rows saved before ADR-012 snapshots.
 * @param {object} entry
 * @param {'image' | 'video' | 'marketing'} studioId
 * @returns {GenerationSnapshot | null}
 */
export function snapshotFromHistoryEntry(entry, studioId) {
  if (entry?.snapshot?.snapshotVersion === SNAPSHOT_VERSION) return entry.snapshot;
  if (!entry?.model || !entry?.url) return null;
  const catalogMode =
    studioId === 'video'
      ? entry.v2vMode
        ? 'v2v'
        : entry.imageMode
          ? 'i2v'
          : 't2v'
      : entry.imageMode
        ? 'i2i'
        : 't2i';
  const controls = {};
  if (entry.aspect_ratio) controls.aspect_ratio = entry.aspect_ratio;
  if (entry.resolution) controls.resolution = entry.resolution;
  if (entry.quality) controls.quality = entry.quality;
  if (entry.duration != null) controls.duration = entry.duration;
  const assetLabels = Array.isArray(entry.assetLabels)?.length
    ? entry.assetLabels
    : parseMentionLabels(entry.prompt || '');
  return buildGenerationSnapshot({
    studioId,
    catalogMode,
    modelId: String(entry.model),
    providerId: entry.providerId === 'runware' ? 'runware' : 'muapi',
    prompt: entry.prompt || '',
    controls,
    assetLabels,
    assetManifest: entry.snapshot?.assetManifest,
    imageMode: entry.imageMode,
    v2vMode: entry.v2vMode,
    batchSize: entry.batchSize,
    restoreImageUrl: entry.restoreImageUrl,
    restoreVideoUrl: entry.restoreVideoUrl,
  });
}

export function buildGenerationSnapshot({
  studioId,
  catalogMode,
  modelId,
  providerId,
  prompt,
  controls = {},
  assetLabels = [],
  assetManifest,
  imageMode,
  v2vMode,
  batchSize,
  format,
  avatarId,
  ugcId,
  restoreImageUrl,
  restoreVideoUrl,
}) {
  return {
    snapshotVersion: SNAPSHOT_VERSION,
    studioId,
    catalogMode,
    modelId,
    providerId: providerId === 'runware' ? 'runware' : 'muapi',
    prompt: prompt || '',
    controls: { ...controls },
    assetLabels: [...assetLabels],
    ...(assetManifest?.length ? { assetManifest: [...assetManifest] } : {}),
    ...(imageMode != null ? { imageMode } : {}),
    ...(v2vMode != null ? { v2vMode } : {}),
    ...(batchSize != null ? { batchSize } : {}),
    ...(format != null ? { format } : {}),
    ...(avatarId != null ? { avatarId } : {}),
    ...(ugcId != null ? { ugcId } : {}),
    ...(restoreImageUrl ? { restoreImageUrl } : {}),
    ...(restoreVideoUrl ? { restoreVideoUrl } : {}),
  };
}

/**
 * @param {GenerationSnapshot} snapshot
 */
export function dispatchStudioRecreate(snapshot) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(STUDIO_RECREATE_EVENT, { detail: { snapshot } }),
  );
}

/**
 * @param {(snapshot: GenerationSnapshot) => void} handler
 */
export function subscribeStudioRecreate(handler) {
  if (typeof window === 'undefined') return () => {};
  const fn = (e) => {
    const snap = e?.detail?.snapshot;
    if (snap?.snapshotVersion === SNAPSHOT_VERSION) handler(snap);
  };
  window.addEventListener(STUDIO_RECREATE_EVENT, fn);
  return () => window.removeEventListener(STUDIO_RECREATE_EVENT, fn);
}

/**
 * @param {GenerationSnapshot} snapshot
 * @param {string} [pendingId]
 */
export function dispatchStudioRetry(snapshot, pendingId) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(STUDIO_RETRY_EVENT, { detail: { snapshot, pendingId } }),
  );
}

/**
 * @param {(detail: { snapshot: GenerationSnapshot, pendingId?: string }) => void} handler
 */
export function subscribeStudioRetry(handler) {
  if (typeof window === 'undefined') return () => {};
  const fn = (e) => {
    const snap = e?.detail?.snapshot;
    if (snap?.snapshotVersion === SNAPSHOT_VERSION) handler(e.detail);
  };
  window.addEventListener(STUDIO_RETRY_EVENT, fn);
  return () => window.removeEventListener(STUDIO_RETRY_EVENT, fn);
}
