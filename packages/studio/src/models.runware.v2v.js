/** Runware v2v / motion-control catalog — fork-owned; ADR-005. */

import {
  liveCatalogEntries,
  rwV2vEntry,
  rwReleaseMeta,
  RUNWARE_PROMPT_INPUT,
  RUNWARE_SEEDANCE_ASPECT_INPUT,
  RUNWARE_SEEDANCE_DURATION_INPUT,
  RUNWARE_RESOLUTION_INPUT,
  RUNWARE_SEED_INPUT,
} from './models.runware.shared.js';

const _all = [
  rwV2vEntry({
    id: 'rw-kling-video-3-pro-v2v',
    name: 'Kling VIDEO 3.0 Pro Motion Control',
    runwareModel: 'runware:kling@video-3-pro',
    muapiId: 'kling-v3.0-pro-motion-control',
    hasPrompt: true,
    ...rwReleaseMeta('kling-video-3-0-pro', '2025-09-01'),
  }),
  rwV2vEntry({
    id: 'rw-kling-video-3-4k-v2v',
    name: 'Kling VIDEO 3.0 Std Motion Control',
    runwareModel: 'runware:kling@video-3-4k',
    muapiId: 'kling-v3.0-std-motion-control',
    hasPrompt: true,
    ...rwReleaseMeta('kling-video-3-0-4k', '2025-11-15'),
  }),
  rwV2vEntry({
    id: 'rw-kling-video-o3-pro-v2v',
    name: 'Kling VIDEO O3 Pro Motion Control',
    runwareModel: 'runware:kling@video-o3-pro',
    muapiId: 'kling-v2.6-std-motion-control',
    hasPrompt: true,
    ...rwReleaseMeta('kling-video-o3-pro', '2025-09-01'),
  }),
  rwV2vEntry({
    id: 'rw-seedance-2-v2v',
    name: 'Seedance 2.0 Video-to-Video',
    runwareModel: 'runware:seedance@2.0',
    muapiId: 'seedance-v2.0-v2v',
    hasPrompt: true,
    taskProfile: 'video-sota',
    ...rwReleaseMeta('seedance-2-0', '2026-02-01'),
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_SEEDANCE_ASPECT_INPUT,
      duration: RUNWARE_SEEDANCE_DURATION_INPUT,
      resolution: RUNWARE_RESOLUTION_INPUT(['480p', '720p'], '720p'),
      seed: RUNWARE_SEED_INPUT,
    },
  }),
  rwV2vEntry({
    id: 'rw-runway-gen-4-5-v2v',
    name: 'Runway Gen-4.5 Video-to-Video',
    runwareModel: 'runware:runway@gen-4.5',
    muapiId: 'runway-gen-4.5-v2v',
    hasPrompt: true,
    ...rwReleaseMeta('runway-gen-4-5', '2025-06-15'),
  }),
];

export const runwareV2vModels = liveCatalogEntries(_all);
