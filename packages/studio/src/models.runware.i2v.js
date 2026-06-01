/** Runware i2v catalog — fork-owned; ADR-005. */

import { liveCatalogEntries, rwI2vEntry, seedanceI2vEntry, rwReleaseMeta } from './models.runware.shared.js';
import { RUNWARE_SEEDANCE_PRICING_HINTS } from './cost/pricingHints.js';

const _all = [
  seedanceI2vEntry({
    id: 'rw-seedance-2-i2v',
    name: 'Seedance 2.0 Image-to-Video',
    runwareModel: 'runware:seedance@2.0',
    muapiId: 'seedance-v2.0-i2v',
    pricingHints: RUNWARE_SEEDANCE_PRICING_HINTS,
    ...rwReleaseMeta('seedance-2-0', '2026-02-01'),
  }),
  seedanceI2vEntry({
    id: 'rw-seedance-2-fast-i2v',
    name: 'Seedance 2.0 Fast Image-to-Video',
    runwareModel: 'runware:seedance@2.0-fast',
    muapiId: 'seedance-v2.0-fast-i2v',
    pricingHints: RUNWARE_SEEDANCE_PRICING_HINTS,
    ...rwReleaseMeta('seedance-2-0-fast', '2026-02-01'),
  }),
  rwI2vEntry({
    id: 'rw-veo-3-1-i2v',
    name: 'Veo 3.1 Image-to-Video',
    runwareModel: 'runware:veo@3.1',
    muapiId: 'veo3.1-image-to-video',
    ...rwReleaseMeta('veo-3-1', '2025-10-15'),
  }),
  rwI2vEntry({
    id: 'rw-veo-3-1-fast-i2v',
    name: 'Veo 3.1 Fast Image-to-Video',
    runwareModel: 'runware:veo@3.1-fast',
    muapiId: 'veo3.1-fast-image-to-video',
    ...rwReleaseMeta('veo-3-1-fast', '2025-10-15'),
  }),
  rwI2vEntry({
    id: 'rw-veo-3-1-lite-i2v',
    name: 'Veo 3.1 Lite Image-to-Video',
    runwareModel: 'runware:veo@3.1-lite',
    muapiId: 'veo3.1-lite-image-to-video',
    ...rwReleaseMeta('veo-3-1-lite', '2025-10-01'),
  }),
  rwI2vEntry({
    id: 'rw-kling-video-o3-pro-i2v',
    name: 'Kling VIDEO O3 Pro Image-to-Video',
    runwareModel: 'runware:kling@video-o3-pro',
    muapiId: 'kling-video-o3-pro-image-to-video',
    ...rwReleaseMeta('kling-video-o3-pro', '2025-09-01'),
  }),
  rwI2vEntry({
    id: 'rw-kling-video-3-pro-i2v',
    name: 'Kling VIDEO 3.0 Pro Image-to-Video',
    runwareModel: 'runware:kling@video-3-pro',
    muapiId: 'kling-video-3-pro-image-to-video',
    ...rwReleaseMeta('kling-video-3-0-pro', '2025-09-01'),
  }),
  rwI2vEntry({
    id: 'rw-kling-video-3-4k-i2v',
    name: 'Kling VIDEO 3.0 4K Image-to-Video',
    runwareModel: 'runware:kling@video-3-4k',
    muapiId: 'kling-video-3-4k-image-to-video',
    ...rwReleaseMeta('kling-video-3-0-4k', '2025-11-15'),
  }),
  rwI2vEntry({
    id: 'rw-wan-2-7-i2v',
    name: 'Wan2.7 Image-to-Video',
    runwareModel: 'runware:wan@2.7',
    muapiId: 'wan2.7-image-to-video',
    ...rwReleaseMeta('wan2-7', '2025-07-15'),
  }),
  rwI2vEntry({
    id: 'rw-ltx-2-pro-i2v',
    name: 'LTX-2 Pro Image-to-Video',
    runwareModel: 'runware:ltx@2-pro',
    muapiId: 'ltx-2-pro-image-to-video',
    ...rwReleaseMeta('ltx-2-pro', '2025-07-01'),
  }),
  rwI2vEntry({
    id: 'rw-pixverse-v6-i2v',
    name: 'PixVerse V6 Image-to-Video',
    runwareModel: 'runware:pixverse@v6',
    muapiId: 'pixverse-v6-image-to-video',
    ...rwReleaseMeta('pixverse-v6', '2025-08-01'),
  }),
  rwI2vEntry({
    id: 'rw-grok-imagine-video-i2v',
    name: 'Grok Imagine Video Image-to-Video',
    runwareModel: 'runware:grok@imagine-video',
    muapiId: 'grok-imagine-video-i2v',
    ...rwReleaseMeta('grok-imagine-video', '2025-08-15'),
  }),
  rwI2vEntry({
    id: 'rw-skyreels-v4-i2v',
    name: 'SkyReels V4 Image-to-Video',
    runwareModel: 'runware:skyreels@v4',
    muapiId: 'skyreels-v4-image-to-video',
    ...rwReleaseMeta('skyreels-v4', '2025-11-01'),
  }),
  rwI2vEntry({
    id: 'rw-minimax-hailuo-2-3-i2v',
    name: 'MiniMax Hailuo 2.3 Image-to-Video',
    runwareModel: 'runware:minimax@hailuo-2.3',
    muapiId: 'minimax-hailuo-2.3-image-to-video',
    ...rwReleaseMeta('minimax-hailuo-2-3', '2025-05-15'),
  }),
  rwI2vEntry({
    id: 'rw-runway-gen-4-5-i2v',
    name: 'Runway Gen-4.5 Image-to-Video',
    runwareModel: 'runware:runway@gen-4.5',
    muapiId: 'runway-gen-4.5-image-to-video',
    ...rwReleaseMeta('runway-gen-4-5', '2025-06-15'),
  }),
];

export const runwareI2vModels = liveCatalogEntries(_all);
