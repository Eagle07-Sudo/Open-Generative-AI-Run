import { finalizeStudioAssets } from './finalizeStudioAssets.js';
import { applyAssetRefsToParams } from './mentionResolve.js';
import { listStudioAssets } from './studioAssetRegistry.js';

/**
 * @param {string} studioId
 * @param {string} genOp
 * @param {import('../studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} routing
 * @param {Record<string, unknown>} params
 * @param {{ imageLabels?: string[], videoLabel?: string, audioLabel?: string, cardLabels?: string[], onUploadProgress?: (pct: number, i: number, t: number) => void }} [opts]
 */
export async function finalizeParamsAssets(studioId, genOp, routing, params, opts = {}) {
  const hasStaged = listStudioAssets(studioId).some(
    (a) => a.status === 'staged' || (a.localFile && !a.inferenceRef),
  );
  if (hasStaged) {
    await finalizeStudioAssets(studioId, routing, genOp, opts.onUploadProgress);
  }
  return applyAssetRefsToParams(studioId, params, {
    imageLabels: opts.imageLabels,
    videoLabel: opts.videoLabel,
    audioLabel: opts.audioLabel,
    cardLabels: opts.cardLabels,
  });
}
