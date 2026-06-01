/** Shared Runware catalog helpers — fork-owned. */

import { resolveMuapiIdForRunwareCatalog } from './runwareMuapiIds.js';

export const VERIFIED_AT = '2026-05-24';

/**
 * @param {string} slug Runware docs model slug
 */
export function rwDocUrl(slug) {
  return `https://runware.ai/docs/models/${slug}`;
}

/**
 * @param {string} slug
 * @param {string} releaseDate ISO date
 * @param {string} [verifiedAt]
 */
export function rwReleaseMeta(slug, releaseDate, verifiedAt = VERIFIED_AT) {
  return {
    releaseDate,
    provenance: {
      docUrl: rwDocUrl(slug),
      verifiedAt,
      source: 'runware-docs',
    },
  };
}

export const RUNWARE_PROMPT_INPUT = {
  type: 'string',
  title: 'Prompt',
  name: 'prompt',
};

export const RUNWARE_SEED_INPUT = {
  type: 'int',
  title: 'Seed',
  name: 'seed',
  minValue: 0,
  maxValue: 2147483647,
  description:
    'Leave empty for random. Fixed value reproduces output. Next generation defaults to seed+1.',
};

export const RUNWARE_ASPECT_INPUT = (defaultAr = '1:1') => ({
  enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3', '21:9'],
  title: 'Aspect Ratio',
  name: 'aspect_ratio',
  type: 'string',
  default: defaultAr,
});

export const RUNWARE_VIDEO_ASPECT_INPUT = {
  enum: ['16:9', '9:16', '1:1'],
  title: 'Aspect Ratio',
  name: 'aspect_ratio',
  type: 'string',
  default: '16:9',
};

export const RUNWARE_NANO_BANANA_2_ASPECT_INPUT = {
  enum: [
    '1:1',
    '1:4',
    '1:8',
    '2:3',
    '3:2',
    '3:4',
    '4:1',
    '4:3',
    '4:5',
    '5:4',
    '8:1',
    '9:16',
    '16:9',
    '21:9',
    'auto',
  ],
  title: 'Aspect Ratio',
  name: 'aspect_ratio',
  type: 'string',
  default: 'auto',
};

export const RUNWARE_SEEDANCE_ASPECT_INPUT = {
  enum: ['auto', '16:9', '9:16', '4:3', '3:4', '1:1', '21:9'],
  title: 'Aspect Ratio',
  name: 'aspect_ratio',
  type: 'string',
  default: 'auto',
};

export const RUNWARE_DURATION_INPUT = (values = [5, 10], defaultVal = 5) => ({
  enum: values,
  title: 'Duration',
  name: 'duration',
  type: 'number',
  default: defaultVal,
});

export const RUNWARE_SEEDANCE_DURATION_INPUT = {
  minValue: 4,
  maxValue: 15,
  step: 1,
  default: 5,
  type: 'number',
  name: 'duration',
  title: 'Duration',
};

export const RUNWARE_RESOLUTION_INPUT = (values = ['480p', '720p', '1080p'], defaultVal = '720p') => ({
  enum: values,
  title: 'Resolution',
  name: 'resolution',
  type: 'string',
  default: defaultVal,
});

export const RUNWARE_OPENAI_QUALITY_INPUT = {
  enum: ['low', 'medium', 'high'],
  title: 'Quality',
  name: 'quality',
  type: 'string',
  default: 'medium',
};

export const RUNWARE_TIER_RESOLUTION_INPUT = {
  enum: ['1k', '2k', '4k'],
  title: 'Resolution',
  name: 'resolution',
  type: 'string',
  default: '1k',
};

export const RUNWARE_GPT_ASPECT_INPUT = {
  enum: ['auto', '1:1', '16:9', '9:16', '4:3', '3:4'],
  title: 'Aspect Ratio',
  name: 'aspect_ratio',
  type: 'string',
  default: '1:1',
};

/**
 * @param {object} partial
 */
export function rwOpenAiImageEntry(partial) {
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: 'image-openai',
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_GPT_ASPECT_INPUT,
      quality: RUNWARE_OPENAI_QUALITY_INPUT,
    },
    ...partial,
  };
}

/**
 * @param {object} partial
 */
export function rwImageEntry(partial) {
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: 'image-standard',
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_ASPECT_INPUT(partial.defaultAspect || '1:1'),
    },
    ...partial,
  };
}

/**
 * @param {object} partial
 */
export function rwVideoEntry(partial) {
  const sota = partial.taskProfile === 'video-sota';
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: sota ? 'video-sota' : 'video-standard',
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_VIDEO_ASPECT_INPUT,
      ...(sota
        ? {
            duration: RUNWARE_DURATION_INPUT([5, 10], 5),
            resolution: RUNWARE_RESOLUTION_INPUT(['480p', '720p', '1080p'], '720p'),
          }
        : {}),
    },
    ...partial,
  };
}

/**
 * @param {object} partial
 */
export function rwAudioEntry(partial) {
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: 'audio-standard',
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
    },
    ...partial,
  };
}

/**
 * @param {object} partial
 */
export function rwI2iEntry(partial) {
  const isOpenAi =
    partial.taskProfile === 'image-openai-i2i' ||
    (typeof partial.runwareModel === 'string' && partial.runwareModel.startsWith('openai:'));
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: isOpenAi ? 'image-openai-i2i' : 'image-i2i',
    imageField: 'image_url',
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: isOpenAi ? RUNWARE_GPT_ASPECT_INPUT : RUNWARE_ASPECT_INPUT(partial.defaultAspect || '1:1'),
      ...(isOpenAi ? { quality: RUNWARE_OPENAI_QUALITY_INPUT } : {}),
    },
    ...partial,
  };
}

/**
 * @param {object} partial
 */
export function rwI2vEntry(partial) {
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: 'video-i2v',
    imageField: 'image_url',
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_VIDEO_ASPECT_INPUT,
      duration: RUNWARE_DURATION_INPUT([5, 10], 5),
      resolution: RUNWARE_RESOLUTION_INPUT(['480p', '720p', '1080p'], '720p'),
    },
    ...partial,
  };
}

/**
 * Seedance 2 I2V — same control surface as T2V Seedance (ADR-008).
 * @param {object} partial
 */
export function seedanceI2vEntry(partial) {
  return rwI2vEntry({
    supportsGeneratedAudio: true,
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

/**
 * @param {object} partial
 */
export function rwV2vEntry(partial) {
  return {
    provider: 'runware',
    status: 'live',
    taskProfile: 'video-v2v',
    videoField: 'video_url',
    imageField: partial.imageField || 'image_url',
    hasPrompt: partial.hasPrompt !== false,
    inputs: {
      prompt: RUNWARE_PROMPT_INPUT,
      aspect_ratio: RUNWARE_VIDEO_ASPECT_INPUT,
      duration: RUNWARE_DURATION_INPUT([5, 10], 5),
      resolution: RUNWARE_RESOLUTION_INPUT(['480p', '720p', '1080p'], '720p'),
    },
    ...partial,
  };
}

/** @returns {object[]} */
export function liveCatalogEntries(entries) {
  return entries
    .filter((e) => e.status !== 'deprecated')
    .map((e) => ({
      ...e,
      muapiId: e.muapiId || resolveMuapiIdForRunwareCatalog(e.id),
    }));
}
