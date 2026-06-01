/** @typedef {'image' | 'video' | 'audio'} StudioAssetKind */

/** @typedef {'staged' | 'uploading' | 'ready' | 'error'} StudioAssetStatus */

/**
 * @typedef {Object} StudioAsset
 * @property {string} label - e.g. image1 (mention @image1)
 * @property {StudioAssetKind} kind
 * @property {StudioAssetStatus} status
 * @property {string} previewUrl - blob URL for full preview
 * @property {string} thumbUrl - blob URL for small chrome (~256px)
 * @property {File} localFile
 * @property {string} [fileName]
 * @property {string} [inferenceRef] - https URL or imageUUID after finalize
 * @property {import('../providers/types.js').CloudProviderId} [providerId]
 * @property {string} [errorMessage]
 */

/**
 * @param {StudioAssetKind} kind
 * @returns {string}
 */
export function mentionTagForLabel(label) {
  return `@${label}`;
}

/**
 * @param {string} tag - @image1
 * @returns {string | null} label without @
 */
export function labelFromMention(tag) {
  const m = /^@(image|video|audio)(\d+)$/i.exec(tag.trim());
  return m ? `${m[1].toLowerCase()}${m[2]}` : null;
}

/**
 * @param {File} file
 * @returns {StudioAssetKind}
 */
export function kindFromFile(file) {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'image';
}

export const MAX_BYTES = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
};
