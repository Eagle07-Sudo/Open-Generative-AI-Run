/** Runware t2i catalog — fork-owned; see ADR-003 / ADR-004. Sorted by releaseDate desc. */

import {
  liveCatalogEntries,
  rwImageEntry,
  rwOpenAiImageEntry,
  rwReleaseMeta,
  RUNWARE_TIER_RESOLUTION_INPUT,
  RUNWARE_NANO_BANANA_2_ASPECT_INPUT,
} from './models.runware.shared.js';
import {
  RUNWARE_IMAGE_DEFAULT_PRICING_HINTS,
  RUNWARE_OPENAI_IMAGE_PRICING_HINTS,
} from './cost/pricingHints.js';

const _all = [
  rwOpenAiImageEntry({
    id: 'rw-gpt-image-2',
    name: 'GPT Image 2',
    runwareModel: 'openai:gpt-image@2',
    pricingHints: RUNWARE_OPENAI_IMAGE_PRICING_HINTS,
    ...rwReleaseMeta('openai-gpt-image-2', '2026-04-21'),
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: {
        enum: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4'],
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        type: 'string',
        default: '1:1',
      },
      quality: {
        enum: ['low', 'medium', 'high'],
        title: 'Quality',
        name: 'quality',
        type: 'string',
        default: 'medium',
      },
      resolution: RUNWARE_TIER_RESOLUTION_INPUT,
    },
  }),
  rwImageEntry({
    id: 'rw-recraft-v4-1',
    name: 'Recraft V4.1',
    runwareModel: 'runware:recraft@v4.1',
    ...rwReleaseMeta('recraft-v4-1', '2026-03-01'),
  }),
  rwOpenAiImageEntry({
    id: 'rw-gpt-image-1-5',
    name: 'GPT Image 1.5',
    runwareModel: 'openai:gpt-image@1.5',
    ...rwReleaseMeta('openai-gpt-image-1-5', '2025-12-15'),
  }),
  rwImageEntry({
    id: 'rw-qwen-image-2512',
    name: 'Qwen-Image-2512',
    runwareModel: 'runware:qwen@image-2512',
    ...rwReleaseMeta('qwen-image-2512', '2025-12-01'),
  }),
  rwImageEntry({
    id: 'rw-flux-2-klein-9b',
    name: 'FLUX.2 [klein] 9B',
    runwareModel: 'runware:flux@2-klein-9b',
    ...rwReleaseMeta('flux-2-klein-9b', '2025-11-20'),
  }),
  rwImageEntry({
    id: 'rw-flux-2-klein-9b-base',
    name: 'FLUX.2 [klein] 9B Base',
    runwareModel: 'runware:flux@2-klein-9b-base',
    ...rwReleaseMeta('flux-2-klein-9b-base', '2025-11-20'),
  }),
  rwImageEntry({
    id: 'rw-flux-2-max',
    name: 'FLUX.2 [max]',
    runwareModel: 'runware:flux@2-max',
    pricingHints: RUNWARE_IMAGE_DEFAULT_PRICING_HINTS,
    ...rwReleaseMeta('flux-2-max', '2025-11-15'),
  }),
  rwImageEntry({
    id: 'rw-flux-2-pro',
    name: 'FLUX.2 [pro]',
    runwareModel: 'runware:flux@2-pro',
    ...rwReleaseMeta('flux-2-pro', '2025-11-01'),
  }),
  rwImageEntry({
    id: 'rw-flux-2-flex',
    name: 'FLUX.2 [flex]',
    runwareModel: 'runware:flux@2-flex',
    ...rwReleaseMeta('flux-2-flex', '2025-11-01'),
  }),
  rwImageEntry({
    id: 'rw-flux-2-dev',
    name: 'FLUX.2 [dev]',
    runwareModel: 'runware:flux@2-dev',
    ...rwReleaseMeta('flux-2-dev', '2025-11-01'),
  }),
  rwImageEntry({
    id: 'rw-uni-1-max',
    name: 'UNI-1 Max',
    runwareModel: 'runware:uni@1-max',
    ...rwReleaseMeta('uni-1-max', '2025-10-15'),
  }),
  rwImageEntry({
    id: 'rw-imagineart-1-5-pro',
    name: 'ImagineArt 1.5 Pro',
    runwareModel: 'runware:imagineart@1.5-pro',
    ...rwReleaseMeta('imagineart-1-5-pro', '2025-10-01'),
  }),
  rwImageEntry({
    id: 'rw-recraft-v4-1-pro',
    name: 'Recraft V4.1 Pro',
    runwareModel: 'runware:recraft@v4.1-pro',
    ...rwReleaseMeta('recraft-v4-1-pro', '2025-10-01'),
  }),
  rwImageEntry({
    id: 'rw-seedream-5-lite',
    name: 'Seedream 5.0 Lite',
    runwareModel: 'runware:seedream@5-lite',
    ...rwReleaseMeta('seedream-5-0-lite', '2025-09-01'),
  }),
  rwImageEntry({
    id: 'rw-nano-banana-2',
    name: 'Nano Banana 2',
    runwareModel: 'google:4@3',
    muapiId: 'nano-banana-2',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: RUNWARE_NANO_BANANA_2_ASPECT_INPUT,
      resolution: RUNWARE_TIER_RESOLUTION_INPUT,
    },
    ...rwReleaseMeta('nano-banana-2', '2025-08-15'),
  }),
  rwImageEntry({
    id: 'rw-kling-image-o3',
    name: 'Kling IMAGE O3',
    runwareModel: 'runware:kling@image-o3',
    ...rwReleaseMeta('kling-image-o3', '2025-08-01'),
  }),
  rwImageEntry({
    id: 'rw-wan-image',
    name: 'Wan2.7 Image',
    runwareModel: 'runware:wan@2.7-image',
    ...rwReleaseMeta('wan2-7-image', '2025-07-15'),
  }),
  rwImageEntry({
    id: 'rw-wan-image-pro',
    name: 'Wan2.7 Image Pro',
    runwareModel: 'runware:wan@2.7-image-pro',
    ...rwReleaseMeta('wan2-7-image-pro', '2025-07-15'),
  }),
  rwImageEntry({
    id: 'rw-kling-image-3',
    name: 'Kling IMAGE 3.0',
    runwareModel: 'runware:kling@image-3',
    ...rwReleaseMeta('kling-image-3-0', '2025-07-01'),
  }),
  rwImageEntry({
    id: 'rw-z-image-turbo',
    name: 'Z-Image-Turbo',
    runwareModel: 'runware:z@image-turbo',
    ...rwReleaseMeta('z-image-turbo', '2025-06-15'),
  }),
  rwImageEntry({
    id: 'rw-z-image',
    name: 'Z-Image',
    runwareModel: 'runware:z@image',
    ...rwReleaseMeta('z-image', '2025-06-01'),
  }),
  rwImageEntry({
    id: 'rw-uni-1',
    name: 'UNI-1',
    runwareModel: 'runware:uni@1',
    ...rwReleaseMeta('uni-1', '2025-06-01'),
  }),
  rwImageEntry({
    id: 'rw-flux-kontext-dev',
    name: 'FLUX.1 Kontext [dev]',
    runwareModel: 'runware:flux@kontext-dev',
    defaultAspect: '1:1',
    ...rwReleaseMeta('flux-1-kontext-dev', '2025-05-28'),
  }),
  rwImageEntry({
    id: 'rw-grok-imagine-image',
    name: 'Grok Imagine Image Quality',
    runwareModel: 'runware:grok@imagine-image',
    ...rwReleaseMeta('grok-imagine-image-quality', '2025-05-01'),
  }),
  rwImageEntry({
    id: 'rw-hunyuan-image-3',
    name: 'HunyuanImage-3.0',
    runwareModel: 'runware:hunyuan@image-3',
    ...rwReleaseMeta('hunyuanimage-3-0', '2025-04-15'),
  }),
  rwImageEntry({
    id: 'rw-imagineart-1-5',
    name: 'ImagineArt 1.5',
    runwareModel: 'runware:imagineart@1.5',
    ...rwReleaseMeta('imagineart-1-5', '2025-04-01'),
  }),
  rwImageEntry({
    id: 'rw-recraft-v4-pro',
    name: 'Recraft V4 Pro',
    runwareModel: 'runware:recraft@v4-pro',
    ...rwReleaseMeta('recraft-v4-pro', '2025-03-15'),
  }),
  rwImageEntry({
    id: 'rw-runway-gen4-image',
    name: 'Runway Gen-4 Image',
    runwareModel: 'runware:runway@gen-4-image',
    ...rwReleaseMeta('runway-gen-4-image', '2025-03-01'),
  }),
  rwImageEntry({
    id: 'rw-nano-banana-pro',
    name: 'Nano Banana Pro',
    runwareModel: 'runware:nano-banana@pro',
    muapiId: 'nano-banana-pro',
    inputs: {
      prompt: { type: 'string', title: 'Prompt', name: 'prompt' },
      aspect_ratio: {
        enum: ['1:1', '3:4', '4:3', '9:16', '16:9', '3:2', '2:3', '5:4', '4:5', '21:9'],
        title: 'Aspect Ratio',
        name: 'aspect_ratio',
        type: 'string',
        default: '1:1',
      },
      resolution: RUNWARE_TIER_RESOLUTION_INPUT,
    },
    ...rwReleaseMeta('nano-banana-pro', '2025-02-15'),
  }),
  rwImageEntry({
    id: 'rw-seedream-4-5',
    name: 'Seedream 4.5',
    runwareModel: 'runware:seedream@4.5',
    ...rwReleaseMeta('seedream-4-5', '2025-02-01'),
  }),
];

export const runwareT2iModels = liveCatalogEntries(_all);
