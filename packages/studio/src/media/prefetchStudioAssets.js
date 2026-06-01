import { resolveProviderForOp } from '../studioCloud.js';
import { getProvider } from '../providerFactory.js';
import * as muapi from '../muapi.js';
import {
  registerInferenceByLabel,
  uploadImageToRunware,
  stageMediaForInference,
} from '../providers/runwareUpload.js';
import { listStudioAssets, patchStudioAsset } from './studioAssetRegistry.js';

const PREFETCH_FLAG = 'studioAssetPrefetch';

/**
 * @returns {boolean}
 */
export function isStudioAssetPrefetchEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PREFETCH_FLAG) === '1';
  } catch {
    return false;
  }
}

/**
 * Background cloud upload for staged assets (optional P1.5).
 * @param {string} studioId
 * @param {string} genOp
 * @param {import('../studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} routing
 */
export async function prefetchStudioAssets(studioId, genOp, routing) {
  if (!isStudioAssetPrefetchEnabled()) return;

  const resolved = resolveProviderForOp(studioId, genOp, routing);
  if (resolved.blockReason) return;

  const provider = getProvider(resolved.providerId);
  const staged = listStudioAssets(studioId).filter((a) => a.status === 'staged' && !a.inferenceRef);

  for (const asset of staged) {
    patchStudioAsset(studioId, asset.label, { status: 'uploading' });
    try {
      let inferenceRef;
      if (resolved.providerId === 'runware') {
        inferenceRef =
          asset.kind === 'image'
            ? await uploadImageToRunware(resolved.apiKey, asset.localFile)
            : await stageMediaForInference(asset.localFile);
        registerInferenceByLabel(asset.label, inferenceRef, asset.kind);
      } else if (typeof provider.uploadFile === 'function') {
        inferenceRef = await provider.uploadFile(resolved.apiKey, asset.localFile);
      } else {
        inferenceRef = await muapi.uploadFile(resolved.apiKey, asset.localFile);
      }
      patchStudioAsset(studioId, asset.label, {
        status: 'ready',
        inferenceRef,
        providerId: resolved.providerId,
      });
    } catch {
      patchStudioAsset(studioId, asset.label, { status: 'staged' });
    }
  }
}
