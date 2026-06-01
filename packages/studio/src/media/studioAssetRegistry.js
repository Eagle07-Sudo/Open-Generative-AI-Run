import { deleteAssetBlob, clearStudioBlobs } from './studioAssetBlobStore.js';

/** @typedef {import('./studioAssetTypes.js').StudioAsset} StudioAsset */
/** @typedef {import('./studioAssetTypes.js').StudioAssetKind} StudioAssetKind */

/** @type {Map<string, Map<string, StudioAsset>>} */
const registries = new Map();

/**
 * @param {string} studioId
 */
function getMap(studioId) {
  if (!registries.has(studioId)) {
    registries.set(studioId, new Map());
  }
  return registries.get(studioId);
}

/**
 * @param {string} studioId
 * @param {StudioAssetKind} kind
 */
export function nextLabel(studioId, kind) {
  const map = getMap(studioId);
  let n = 1;
  while (map.has(`${kind}${n}`)) n += 1;
  return `${kind}${n}`;
}

/**
 * @param {StudioAsset} asset
 */
function revokeBlobUrls(asset) {
  if (asset.previewUrl?.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(asset.previewUrl);
    } catch {
      /* ignore */
    }
  }
  if (asset.thumbUrl && asset.thumbUrl !== asset.previewUrl && asset.thumbUrl.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(asset.thumbUrl);
    } catch {
      /* ignore */
    }
  }
}

/**
 * @param {string} studioId
 * @param {StudioAsset} asset
 */
export function registerStudioAsset(studioId, asset) {
  getMap(studioId).set(asset.label, asset);
}

/**
 * @param {string} studioId
 * @param {string} label
 * @returns {StudioAsset | undefined}
 */
export function getStudioAsset(studioId, label) {
  return getMap(studioId).get(label);
}

/**
 * @param {string} studioId
 * @returns {StudioAsset[]}
 */
export function listStudioAssets(studioId) {
  return [...getMap(studioId).values()];
}

/**
 * @param {string} studioId
 * @param {string} label
 */
export function removeStudioAsset(studioId, label) {
  const map = getMap(studioId);
  const existing = map.get(label);
  if (existing) revokeBlobUrls(existing);
  map.delete(label);
  deleteAssetBlob(studioId, label).catch(() => {});
}

/**
 * @param {string} studioId
 */
export function clearStudioRegistry(studioId) {
  for (const asset of getMap(studioId).values()) {
    revokeBlobUrls(asset);
  }
  registries.delete(studioId);
  clearStudioBlobs(studioId).catch(() => {});
}

/** Tests only */
export function clearAllStudioRegistriesForTests() {
  for (const studioId of [...registries.keys()]) {
    clearStudioRegistry(studioId);
  }
}

/**
 * @param {string} studioId
 * @param {string} label
 * @param {Partial<StudioAsset>} patch
 */
export function patchStudioAsset(studioId, label, patch) {
  const existing = getMap(studioId).get(label);
  if (!existing) return;
  getMap(studioId).set(label, { ...existing, ...patch });
}
