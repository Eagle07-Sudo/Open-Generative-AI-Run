import { aspectRatioToRunwareSize } from './runwareAspect.js';
import { resolveRunwareAsset } from './runwareUpload.js';
import { imageTierToRunwareSize, isImageResolutionTier } from './runwareImageTier.js';
import { stripMentionsFromPrompt } from '../media/cardMentionAssets.js';
import {
  applyImageInferenceDimensions,
  detectImageModelFamily,
} from './runwareImagePayload.js';

const RESOLUTION_MAP = {
  '480p': { width: 854, height: 480 },
  '720p': { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
};

/** @param {string} [aspectRatio] */
export function openAiImageSize(aspectRatio = '1:1') {
  if (!aspectRatio || aspectRatio === 'auto') {
    return { width: 1024, height: 1024 };
  }
  const map = {
    '1:1': { width: 1024, height: 1024 },
    '16:9': { width: 1536, height: 1024 },
    '9:16': { width: 1024, height: 1536 },
    '4:3': { width: 1365, height: 1024 },
    '3:4': { width: 1024, height: 1365 },
  };
  return map[aspectRatio] || aspectRatioToRunwareSize(aspectRatio);
}

/**
 * Video aspect for pixel sizing — `auto` follows Runware Seedance default (16:9).
 * @param {string} [aspectRatio]
 */
export function normalizeVideoAspectRatio(aspectRatio) {
  if (!aspectRatio || aspectRatio === 'auto') return '16:9';
  return aspectRatio;
}

/**
 * @param {string} resolution
 * @param {string} [aspectRatio]
 */
export function resolutionToSize(resolution, aspectRatio = '16:9') {
  const ar = normalizeVideoAspectRatio(aspectRatio);
  const base = RESOLUTION_MAP[resolution];
  if (base) return { width: base.width, height: base.height };
  return aspectRatioToRunwareSize(ar);
}

/**
 * @param {object | null | undefined} catalog
 * @param {object} params
 * @param {string} taskUUID
 */
export function buildImageTask(catalog, params, taskUUID) {
  const runwareModel = catalog?.runwareModel || params.model;
  const isOpenAi =
    catalog?.taskProfile === 'image-openai' ||
    (typeof runwareModel === 'string' && runwareModel.startsWith('openai:'));

  const { width, height } = isOpenAi
    ? isImageResolutionTier(params.resolution)
      ? imageTierToRunwareSize(params.resolution, params.aspect_ratio)
      : openAiImageSize(params.aspect_ratio)
    : isImageResolutionTier(params.resolution)
      ? imageTierToRunwareSize(params.resolution, params.aspect_ratio)
      : aspectRatioToRunwareSize(params.aspect_ratio);

  const task = {
    taskType: 'imageInference',
    taskUUID,
    positivePrompt: stripMentionsFromPrompt(params.prompt),
    model: runwareModel,
    width,
    height,
    deliveryMethod: 'sync',
    includeCost: true,
  };

  if (params.seed != null && Number(params.seed) >= 0) {
    task.seed = Number(params.seed);
  }

  if (isOpenAi) {
    task.providerSettings = {
      openai: {
        quality: params.quality || 'medium',
        moderation: 'auto',
      },
    };
  } else if (detectImageModelFamily(runwareModel) === 'google') {
    task.providerSettings = {
      google: {
        safetyTolerance: 'off',
        imageSearch: false,
        webSearch: false,
      },
    };
  }

  attachReferenceImages(task, params);
  applyImageInferenceDimensions(task, params, catalog);

  return task;
}

/**
 * @param {object} task
 * @param {object} params
 */
/**
 * @param {object} task
 * @param {object} params
 * @param {{ nestUnderInputs?: boolean }} [opts]
 */
function attachReferenceImages(task, params, opts = {}) {
  const nestUnderInputs = opts.nestUnderInputs !== false;
  const refs =
    params.images_list?.length > 0
      ? params.images_list
      : params.image_url
        ? [params.image_url]
        : [];
  if (refs.length > 0) {
    const resolved = refs.map((r) => resolveRunwareAsset(r)).filter(Boolean);
    if (resolved.length > 0) {
      if (nestUnderInputs) {
        // imageInference (Nano Banana, GPT Image, etc.) — Runware docs: inputs.referenceImages
        task.inputs = { ...(task.inputs || {}), referenceImages: resolved };
      } else {
        task.referenceImages = resolved;
      }
    }
  }
  if (params.last_image) {
    task.frameImages = [
      ...(task.frameImages || []),
      { inputImage: resolveRunwareAsset(params.last_image), frame: 'last' },
    ];
  }
}

/**
 * @param {object | null | undefined} catalog
 * @param {object} params
 * @param {string} taskUUID
 */
export function buildI2ITask(catalog, params, taskUUID) {
  const task = buildImageTask(catalog, params, taskUUID);
  task.taskProfile = catalog?.taskProfile || 'image-i2i';
  return task;
}

/**
 * @param {object | null | undefined} catalog
 * @param {object} params
 * @param {string} taskUUID
 */
export function buildVideoTask(catalog, params, taskUUID) {
  const runwareModel = catalog?.runwareModel || params.model;
  const profile = catalog?.taskProfile || 'video-standard';
  const aspect = normalizeVideoAspectRatio(params.aspect_ratio);

  let width;
  let height;
  if (profile === 'video-sota' && params.resolution) {
    ({ width, height } = resolutionToSize(params.resolution, aspect));
  } else {
    ({ width, height } = aspectRatioToRunwareSize(aspect));
  }

  const task = {
    taskType: 'videoInference',
    taskUUID,
    positivePrompt: params.prompt,
    model: runwareModel,
    width,
    height,
    deliveryMethod: 'async',
    includeCost: true,
  };

  if (profile === 'video-sota' && params.duration != null) {
    task.duration = Number(params.duration) || 5;
  }

  if (params.seed != null && Number(params.seed) >= 0) {
    task.seed = Number(params.seed);
  }

  attachMultimodalReferences(task, catalog, params);

  return task;
}

/**
 * @param {object} task
 * @param {object | null | undefined} catalog
 * @param {object} params
 */
function attachMultimodalReferences(task, catalog, params) {
  const refs = catalog?.referenceInputs;
  if (!refs) return;

  if (params.referenceImages?.length) {
    task.referenceImages = params.referenceImages.map((r) => resolveRunwareAsset(r));
  }
  if (params.referenceVideos?.length) {
    task.referenceVideos = params.referenceVideos.map((r) => resolveRunwareAsset(r));
  }
  if (params.referenceAudios?.length) {
    task.referenceAudios = params.referenceAudios.map((r) => resolveRunwareAsset(r));
  }
  if (params.generateAudio != null && catalog.supportsGeneratedAudio) {
    task.settings = { ...(task.settings || {}), audio: Boolean(params.generateAudio) };
  }
}

/**
 * @param {object | null | undefined} catalog
 * @param {object} params
 * @param {string} taskUUID
 */
export function buildI2VTask(catalog, params, taskUUID) {
  const task = buildVideoTask(catalog, params, taskUUID);
  task.taskProfile = catalog?.taskProfile || 'video-i2v';
  attachReferenceImages(task, params, { nestUnderInputs: false });
  return task;
}

/**
 * @param {object | null | undefined} catalog
 * @param {object} params
 * @param {string} taskUUID
 */
export function buildV2VTask(catalog, params, taskUUID) {
  const task = buildVideoTask(catalog, params, taskUUID);
  task.taskProfile = catalog?.taskProfile || 'video-v2v';
  if (params.video_url) {
    task.inputVideo = resolveRunwareAsset(params.video_url);
  }
  attachReferenceImages(task, params, { nestUnderInputs: false });
  return task;
}

/**
 * @param {object | null | undefined} catalog
 * @param {object} params
 * @param {string} taskUUID
 */
export function buildAudioTask(catalog, params, taskUUID) {
  const runwareModel = catalog?.runwareModel || params.model;

  return {
    taskType: 'audioInference',
    taskUUID,
    positivePrompt: params.prompt,
    model: runwareModel,
    deliveryMethod: 'async',
  };
}
