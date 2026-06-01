/**
 * Runware media inference plane — imageUpload at finalize only (ADR-007).
 * UI previews use blob URLs via studio media layer; never data URI in <img>.
 */

import { postTasks } from './runwareClient.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

/** @type {Map<string, { inferenceRef: string, kind: string, imageUUID?: string }>} */
const inferenceByLabel = new Map();

/** @type {Map<string, { imageUUID?: string, inferenceRef: string, kind: string }>} */
const legacyByPreviewUrl = new Map();

/**
 * @param {string} label
 * @param {string} inferenceRef
 * @param {string} kind
 */
export function registerInferenceByLabel(label, inferenceRef, kind) {
  const entry = { inferenceRef, kind };
  if (kind === 'image' && !inferenceRef.startsWith('http') && !inferenceRef.startsWith('data:')) {
    entry.imageUUID = inferenceRef;
  }
  inferenceByLabel.set(label, entry);
}

/**
 * Legacy: map preview URL to inference (migration).
 * @param {string} previewUrl
 * @param {{ imageUUID?: string, inferenceRef: string, kind: string }} meta
 */
export function registerAsset(previewUrl, meta) {
  legacyByPreviewUrl.set(previewUrl, meta);
}

/**
 * @param {string | undefined} ref - label, imageUUID, https, data URI, or legacy preview URL
 * @returns {string | undefined}
 */
export function resolveRunwareAsset(ref) {
  if (!ref) return ref;
  const byLabel = inferenceByLabel.get(ref);
  if (byLabel) return byLabel.imageUUID || byLabel.inferenceRef;
  const legacy = legacyByPreviewUrl.get(ref);
  if (legacy?.imageUUID) return legacy.imageUUID;
  if (legacy?.inferenceRef) return legacy.inferenceRef;
  return ref;
}

export function clearAssetRegistryForTests() {
  inferenceByLabel.clear();
  legacyByPreviewUrl.clear();
}

/**
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<string>}
 */
async function readFileAsDataUri(file, onProgress) {
  if (typeof FileReader === 'undefined') {
    const buf = await file.arrayBuffer();
    if (onProgress) onProgress(90);
    const mime = file.type || 'application/octet-stream';
    const b64 =
      typeof Buffer !== 'undefined'
        ? Buffer.from(buf).toString('base64')
        : btoa(String.fromCharCode(...new Uint8Array(buf)));
    if (onProgress) onProgress(100);
    return `data:${mime};base64,${b64}`;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 90));
      }
    };
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * @param {object} body
 * @param {string} taskUUID
 */
function extractImageUUID(body, taskUUID) {
  const raw = body?.data;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const match = items.find((i) => i.taskUUID === taskUUID) || items[0];
  if (!match?.imageUUID) {
    throw new Error('No imageUUID in Runware imageUpload response');
  }
  return match.imageUUID;
}

/**
 * Runware imageUpload — returns imageUUID (inference ref), not a UI preview URL.
 * @param {string} apiKey
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<string>} imageUUID
 */
export async function uploadImageToRunware(apiKey, file, onProgress) {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds 10MB limit.');
  }
  const dataUri = await readFileAsDataUri(file, onProgress);
  const taskUUID = crypto.randomUUID();
  const body = await postTasks(apiKey, [
    { taskType: 'imageUpload', taskUUID, image: dataUri },
  ]);
  if (onProgress) onProgress(100);
  return extractImageUUID(body, taskUUID);
}

/**
 * Video/audio inference payload until Runware CDN upload exists.
 * @param {File} file
 * @param {(pct: number) => void} [onProgress]
 */
export async function stageMediaForInference(file, onProgress) {
  const isVideo = file.type.startsWith('video/');
  const isAudio = file.type.startsWith('audio/');
  const max = isVideo ? MAX_VIDEO_BYTES : isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) {
    const mb = Math.round(max / (1024 * 1024));
    throw new Error(`File exceeds ${mb}MB limit.`);
  }
  const dataUri = await readFileAsDataUri(file, onProgress);
  if (onProgress) onProgress(100);
  return dataUri;
}

/**
 * @deprecated Use stageLocalAsset + finalizeStudioAssets. Kept for provider adapter contract.
 */
export async function uploadFile(apiKey, file, onProgress) {
  if (file.type.startsWith('image/')) {
    return uploadImageToRunware(apiKey, file, onProgress);
  }
  return stageMediaForInference(file, onProgress);
}
