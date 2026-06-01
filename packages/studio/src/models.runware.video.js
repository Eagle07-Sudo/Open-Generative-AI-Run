/** Runware video catalog — fork-owned; see ADR-003 / ADR-004. */

import {
  liveCatalogEntries,
  rwVideoEntry,
  rwReleaseMeta,
  RUNWARE_PROMPT_INPUT,
  RUNWARE_SEEDANCE_ASPECT_INPUT,
  RUNWARE_SEEDANCE_DURATION_INPUT,
  RUNWARE_RESOLUTION_INPUT,
  RUNWARE_SEED_INPUT,
} from './models.runware.shared.js';
import { RUNWARE_SEEDANCE_PRICING_HINTS } from './cost/pricingHints.js';

const SEEDANCE_REFERENCE_INPUTS = {
  images: 9,
  videos: 3,
  audios: 3,
};

/** @param {object} partial */
function seedanceVideoEntry(partial) {
  return rwVideoEntry({
    taskProfile: 'video-sota',
    referenceInputs: SEEDANCE_REFERENCE_INPUTS,
    supportsGeneratedAudio: true,
    pricingHints: RUNWARE_SEEDANCE_PRICING_HINTS,
    ...partial,
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_SEEDANCE_ASPECT_INPUT,
      duration: RUNWARE_SEEDANCE_DURATION_INPUT,
      resolution: RUNWARE_RESOLUTION_INPUT(['480p', '720p'], '720p'),
      seed: RUNWARE_SEED_INPUT,
    },
  });
}

const _all = [
  seedanceVideoEntry({
    id: 'rw-seedance-2',
    name: 'Seedance 2.0',
    runwareModel: 'runware:seedance@2.0',
    taskProfile: 'video-sota',
    muapiId: 'seedance-v2.0-t2v',
    ...rwReleaseMeta('seedance-2-0', '2026-02-01'),
  }),
  seedanceVideoEntry({
    id: 'rw-seedance-2-fast',
    name: 'Seedance 2.0 Fast',
    runwareModel: 'runware:seedance@2.0-fast',
    taskProfile: 'video-sota',
    muapiId: 'seedance-v2.0-fast-t2v',
    ...rwReleaseMeta('seedance-2-0-fast', '2026-02-01'),
  }),
  rwVideoEntry({
    id: 'rw-kling-video-o3-4k',
    name: 'Kling VIDEO O3 4K',
    runwareModel: 'runware:kling@video-o3-4k',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('kling-video-o3-4k', '2025-12-01'),
  }),
  rwVideoEntry({
    id: 'rw-kling-video-3-4k',
    name: 'Kling VIDEO 3.0 4K',
    runwareModel: 'runware:kling@video-3-4k',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('kling-video-3-0-4k', '2025-11-15'),
  }),
  rwVideoEntry({
    id: 'rw-skyreels-v4',
    name: 'SkyReels V4',
    runwareModel: 'runware:skyreels@v4',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('skyreels-v4', '2025-11-01'),
  }),
  rwVideoEntry({
    id: 'rw-veo-3-1',
    name: 'Veo 3.1',
    runwareModel: 'runware:veo@3.1',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('veo-3-1', '2025-10-15'),
  }),
  rwVideoEntry({
    id: 'rw-veo-3-1-fast',
    name: 'Veo 3.1 Fast',
    runwareModel: 'runware:veo@3.1-fast',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('veo-3-1-fast', '2025-10-15'),
  }),
  rwVideoEntry({
    id: 'rw-veo-3-1-lite',
    name: 'Veo 3.1 Lite',
    runwareModel: 'runware:veo@3.1-lite',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('veo-3-1-lite', '2025-10-01'),
  }),
  rwVideoEntry({
    id: 'rw-kling-video-3-pro',
    name: 'Kling VIDEO 3.0 Pro',
    runwareModel: 'runware:kling@video-3-pro',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('kling-video-3-0-pro', '2025-09-01'),
  }),
  rwVideoEntry({
    id: 'rw-kling-video-o3-pro',
    name: 'Kling VIDEO O3 Pro',
    runwareModel: 'runware:kling@video-o3-pro',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('kling-video-o3-pro', '2025-09-01'),
  }),
  rwVideoEntry({
    id: 'rw-grok-imagine-video',
    name: 'Grok Imagine Video',
    runwareModel: 'runware:grok@imagine-video',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('grok-imagine-video', '2025-08-15'),
  }),
  rwVideoEntry({
    id: 'rw-pixverse-v6',
    name: 'PixVerse V6',
    runwareModel: 'runware:pixverse@v6',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('pixverse-v6', '2025-08-01'),
  }),
  rwVideoEntry({
    id: 'rw-wan-2-7',
    name: 'Wan2.7',
    runwareModel: 'runware:wan@2.7',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('wan2-7', '2025-07-15'),
  }),
  rwVideoEntry({
    id: 'rw-ltx-2-pro',
    name: 'LTX-2 Pro',
    runwareModel: 'runware:ltx@2-pro',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('ltx-2-pro', '2025-07-01'),
  }),
  rwVideoEntry({
    id: 'rw-ltx-2-fast',
    name: 'LTX-2 Fast',
    runwareModel: 'runware:ltx@2-fast',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('ltx-2-fast', '2025-07-01'),
  }),
  rwVideoEntry({
    id: 'rw-runway-gen-4-5',
    name: 'Runway Gen-4.5',
    runwareModel: 'runware:runway@gen-4.5',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('runway-gen-4-5', '2025-06-15'),
  }),
  rwVideoEntry({
    id: 'rw-vidu-q3',
    name: 'Vidu Q3',
    runwareModel: 'runware:vidu@q3',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('vidu-q3', '2025-06-01'),
  }),
  rwVideoEntry({
    id: 'rw-minimax-hailuo-2-3',
    name: 'MiniMax Hailuo 2.3',
    runwareModel: 'runware:minimax@hailuo-2.3',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('minimax-hailuo-2-3', '2025-05-15'),
  }),
  rwVideoEntry({
    id: 'rw-aurora-v1',
    name: 'Aurora v1',
    runwareModel: 'runware:aurora@v1',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('aurora-v1', '2025-05-01'),
  }),
  rwVideoEntry({
    id: 'rw-seedance-1-5-pro',
    name: 'Seedance 1.5 Pro',
    runwareModel: 'runware:seedance@1.5-pro',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('seedance-1-5-pro', '2025-03-01'),
  }),
  rwVideoEntry({
    id: 'rw-happyhorse-1',
    name: 'HappyHorse-1.0',
    runwareModel: 'runware:happyhorse@1.0',
    taskProfile: 'video-sota',
    ...rwReleaseMeta('happyhorse-1-0', '2025-02-01'),
  }),
];

export const runwareVideoModels = liveCatalogEntries(_all);
