import { registerInferenceByLabel } from '../providers/runwareUpload.js';
import { registerStudioAsset, getStudioAsset } from './studioAssetRegistry.js';
import { stageLocalAsset } from './stageLocalAsset.js';
import { getAssetBlob } from './studioAssetBlobStore.js';
import { parseMentionLabels } from './mentionParse.js';

/**
 * @typedef {Object} StudioAssetManifestEntry
 * @property {string} label
 * @property {'image' | 'video' | 'audio'} kind
 * @property {string} [fileName]
 * @property {string} [inferenceRef] https CDN URL
 * @property {string} [imageUUID] Runware imageUpload UUID
 * @property {'runware' | 'muapi'} [providerId]
 */

/**
 * @param {import('./studioAssetTypes.js').StudioAsset[]} assets
 * @returns {StudioAssetManifestEntry[]}
 */
export function assetsToManifest(assets) {
  return (assets || [])
    .filter(Boolean)
    .map((a) => {
      const ref = a.inferenceRef;
      const isHttps = typeof ref === 'string' && ref.startsWith('https://');
      const isRunwareUuid =
        typeof ref === 'string' &&
        ref &&
        !isHttps &&
        !ref.startsWith('data:') &&
        a.kind === 'image';
      return {
        label: a.label,
        kind: a.kind,
        fileName: a.fileName,
        inferenceRef: isHttps ? ref : undefined,
        imageUUID: isRunwareUuid ? ref : undefined,
        providerId: a.providerId,
      };
    });
}

/**
 * @param {StudioAssetManifestEntry[]} manifest
 * @returns {{ labels: string[], httpsPreviewByLabel: Record<string, string> }}
 */
export function manifestToRestoreHints(manifest) {
  const httpsPreviewByLabel = {};
  const labels = [];
  for (const e of manifest || []) {
    labels.push(e.label);
    if (e.inferenceRef?.startsWith('https://')) {
      httpsPreviewByLabel[e.label] = e.inferenceRef;
    }
  }
  return { labels, httpsPreviewByLabel };
}

/**
 * @param {string} studioId
 * @param {StudioAssetManifestEntry} entry
 * @returns {boolean}
 */
function registerReadyAssetFromManifest(studioId, entry) {
  if (entry.inferenceRef?.startsWith('https://')) {
    registerStudioAsset(studioId, {
      label: entry.label,
      kind: entry.kind || 'image',
      status: 'ready',
      previewUrl: entry.inferenceRef,
      thumbUrl: entry.inferenceRef,
      inferenceRef: entry.inferenceRef,
      providerId: entry.providerId,
      fileName: entry.fileName,
    });
    return true;
  }
  if (entry.imageUUID) {
    const kind = entry.kind || 'image';
    registerInferenceByLabel(entry.label, entry.imageUUID, kind);
    registerStudioAsset(studioId, {
      label: entry.label,
      kind,
      status: 'ready',
      previewUrl: entry.inferenceRef || entry.imageUUID,
      thumbUrl: entry.inferenceRef || entry.imageUUID,
      inferenceRef: entry.imageUUID,
      providerId: entry.providerId || 'runware',
      fileName: entry.fileName,
    });
    return true;
  }
  return false;
}

/**
 * @param {string} studioId
 * @param {string} label
 * @param {string} [kind]
 */
async function restoreLabelFromIdb(studioId, label, kind = 'image') {
  const file = await getAssetBlob(studioId, label);
  if (!file) return false;
  await stageLocalAsset(studioId, file, { label, slotKind: kind, skipThumbnail: true });
  const asset = getStudioAsset(studioId, label);
  if (asset?.status === 'staged' && asset.localFile) {
    registerStudioAsset(studioId, { ...asset, status: 'ready' });
  }
  return true;
}

/**
 * Restore registry entries from manifest + IndexedDB (ADR-012).
 * @param {string} studioId
 * @param {StudioAssetManifestEntry[]} [manifest]
 * @returns {Promise<{ restored: string[], missing: string[] }>}
 */
export async function restoreStudioAssetsFromManifest(studioId, manifest) {
  const restored = [];
  const missing = [];
  for (const entry of manifest || []) {
    let ok = false;
    if (await restoreLabelFromIdb(studioId, entry.label, entry.kind || 'image')) {
      ok = true;
    } else if (registerReadyAssetFromManifest(studioId, entry)) {
      ok = true;
    }
    if (ok) restored.push(entry.label);
    else missing.push(entry.label);
  }
  return { restored, missing };
}

/**
 * @param {string} studioId
 * @param {import('../studioRecreate.js').GenerationSnapshot} snap
 */
export async function restoreAssetsForRecreate(studioId, snap) {
  const manifest = snap?.assetManifest;
  if (manifest?.length) {
    return restoreStudioAssetsFromManifest(studioId, manifest);
  }
  const labels =
    snap?.assetLabels?.length > 0
      ? [...snap.assetLabels]
      : parseMentionLabels(snap?.prompt || '');
  const restored = [];
  const missing = [];
  for (const label of labels) {
    const kind = label.startsWith('video')
      ? 'video'
      : label.startsWith('audio')
        ? 'audio'
        : 'image';
    if (await restoreLabelFromIdb(studioId, label, kind)) {
      restored.push(label);
    } else {
      missing.push(label);
    }
  }
  return { restored, missing };
}

/**
 * @param {string} studioId
 * @param {string} label
 */
export function isStudioAssetRestored(studioId, label) {
  const a = getStudioAsset(studioId, label);
  return Boolean(
    a &&
      (a.status === 'ready' ||
        a.thumbUrl ||
        a.previewUrl ||
        a.inferenceRef ||
        a.localFile),
  );
}

/**
 * @param {string} studioId
 * @param {string[]} labels
 * @returns {StudioAssetManifestEntry[]}
 */
export function manifestFromAssetLabels(studioId, labels) {
  return assetsToManifest(
    (labels || []).map((l) => getStudioAsset(studioId, l)).filter(Boolean),
  );
}
