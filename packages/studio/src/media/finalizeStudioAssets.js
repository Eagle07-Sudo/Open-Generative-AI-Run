import { getProvider } from '../providerFactory.js';
import { resolveProviderForOp } from '../studioCloud.js';
import * as muapi from '../muapi.js';
import {
  registerInferenceByLabel,
  uploadImageToRunware,
  stageMediaForInference,
} from '../providers/runwareUpload.js';
import { listStudioAssets, patchStudioAsset } from './studioAssetRegistry.js';

/**
 * @param {string} studioId
 * @param {import('../studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} routing
 * @param {string} genOp - e.g. imageI2i
 * @param {(pct: number, index: number, total: number) => void} [onProgress]
 */
export async function finalizeStudioAssets(studioId, routing, genOp, onProgress) {
  const assets = listStudioAssets(studioId).filter((a) => a.status === 'staged' || !a.inferenceRef);
  const total = assets.length;
  if (!total) return;

  const resolved = resolveProviderForOp(studioId, genOp, routing);
  if (resolved.blockReason === 'missing_key') {
    throw new Error(`Missing API key for cloud upload before generate`);
  }
  if (resolved.blockReason === 'unsupported') {
    throw new Error(`Generate operation not supported on selected provider`);
  }

  const provider = getProvider(resolved.providerId);
  let index = 0;

  for (const asset of assets) {
    if (asset.inferenceRef && asset.status === 'ready') {
      index += 1;
      continue;
    }

    patchStudioAsset(studioId, asset.label, { status: 'uploading' });

    try {
      const pct = (p) => {
        if (onProgress) onProgress(p, index, total);
      };

      let inferenceRef;
      if (resolved.providerId === 'runware') {
        if (asset.kind === 'image') {
          inferenceRef = await uploadImageToRunware(resolved.apiKey, asset.localFile, pct);
        } else {
          inferenceRef = await stageMediaForInference(asset.localFile, pct);
        }
        registerInferenceByLabel(asset.label, inferenceRef, asset.kind);
      } else if (typeof provider.uploadFile === 'function') {
        inferenceRef = await provider.uploadFile(resolved.apiKey, asset.localFile, pct);
      } else {
        inferenceRef = await muapi.uploadFile(resolved.apiKey, asset.localFile, pct);
      }

      patchStudioAsset(studioId, asset.label, {
        status: 'ready',
        inferenceRef,
        providerId: resolved.providerId,
        errorMessage: undefined,
      });
    } catch (err) {
      patchStudioAsset(studioId, asset.label, {
        status: 'error',
        errorMessage: err?.message || 'Upload failed',
      });
      throw err;
    }

    index += 1;
    if (onProgress) onProgress(100, index, total);
  }
}

/**
 * Finalize assets that already have inferenceRef (prefetch).
 * @param {string} studioId
 */
export async function finalizePrefetchedAssets(studioId) {
  const pending = listStudioAssets(studioId).filter((a) => a.status === 'staged' && !a.inferenceRef);
  return pending.length === 0;
}
