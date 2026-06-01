import { kindFromFile, MAX_BYTES } from './studioAssetTypes.js';
import { nextLabel, registerStudioAsset } from './studioAssetRegistry.js';
import { createThumbnailBlobUrl } from './createThumbnail.js';
import { putAssetBlob } from './studioAssetBlobStore.js';

/**
 * Stage a file locally (no cloud upload). Returns registered asset.
 * @param {string} studioId
 * @param {File} file
 * @param {{ label?: string, slotKind?: import('./studioAssetTypes.js').StudioAssetKind, skipThumbnail?: boolean }} [opts]
 */
export async function stageLocalAsset(studioId, file, opts = {}) {
  const kind = opts.slotKind || kindFromFile(file);
  const max = MAX_BYTES[kind];
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024));
    throw new Error(`File exceeds ${mb}MB limit.`);
  }

  const label = opts.label || nextLabel(studioId, kind);
  const previewUrl = URL.createObjectURL(file);
  let thumbUrl = previewUrl;
  if (!opts.skipThumbnail && typeof document !== 'undefined') {
    try {
      thumbUrl = await createThumbnailBlobUrl(file, kind);
      if (thumbUrl !== previewUrl && kind === 'image') {
        /* keep both */
      }
    } catch {
      thumbUrl = previewUrl;
    }
  }

  /** @type {import('./studioAssetTypes.js').StudioAsset} */
  const asset = {
    label,
    kind,
    status: 'staged',
    previewUrl,
    thumbUrl,
    localFile: file,
    fileName: file.name,
  };

  registerStudioAsset(studioId, asset);
  // IDB write is opt-in (see studioBlobPersistPolicy) — fire-and-forget when enabled
  putAssetBlob(studioId, label, file).catch(() => {});
  return asset;
}
