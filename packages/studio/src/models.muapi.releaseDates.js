/** Muapi release-date overlay — fork-owned; see ADR-004. Do not edit models.js. */

export const VERIFIED_AT = '2026-05-24';

/** @typedef {{ releaseDate: string, provenance: { docUrl: string, verifiedAt: string, source: 'muapi'|'vendor'|'runware-docs'|'manual' } }} MuapiReleaseRow */

/** @type {Record<string, MuapiReleaseRow>} */
export const MUAPI_RELEASE_DATES = {
  // —— Image t2i W1 (2025+ SOTA) ——
  'nano-banana-2': {
    releaseDate: '2025-08-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/nano-banana-2', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'seedream-5.0': {
    releaseDate: '2025-09-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/seedream-5-0-lite', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'gpt-image-2': {
    releaseDate: '2026-04-21',
    provenance: { docUrl: 'https://runware.ai/docs/models/openai-gpt-image-2', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'gpt-image-1.5': {
    releaseDate: '2025-12-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/openai-gpt-image-1-5', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'flux-2-dev': {
    releaseDate: '2025-11-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/flux-2-dev', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'flux-2-flex': {
    releaseDate: '2025-11-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/flux-2-flex', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'flux-2-pro': {
    releaseDate: '2025-11-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/flux-2-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'flux-2-klein-9b': {
    releaseDate: '2025-11-20',
    provenance: { docUrl: 'https://runware.ai/docs/models/flux-2-klein-9b', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'flux-2-klein-4b': {
    releaseDate: '2025-11-20',
    provenance: { docUrl: 'https://runware.ai/docs/models/flux-2-klein-9b', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'z-image-turbo': {
    releaseDate: '2025-06-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/z-image-turbo', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'z-image-base': {
    releaseDate: '2025-06-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/z-image', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'qwen-text-to-image-2512': {
    releaseDate: '2025-12-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/qwen-image-2512', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'hunyuan-image-3.0': {
    releaseDate: '2025-04-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/hunyuanimage-3-0', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'grok-imagine-text-to-image': {
    releaseDate: '2025-05-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/grok-imagine-image-quality', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'nano-banana-pro': {
    releaseDate: '2025-02-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/nano-banana-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'bytedance-seedream-v4.5': {
    releaseDate: '2025-02-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/seedream-4-5', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'bytedance-seedream-v4': {
    releaseDate: '2025-01-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/seedream-4-5', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'kling-o1-text-to-image': {
    releaseDate: '2025-08-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/kling-image-o3', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'wan2.6-text-to-image': {
    releaseDate: '2025-07-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/wan2-7-image-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'flux-kontext-dev-t2i': {
    releaseDate: '2025-05-28',
    provenance: { docUrl: 'https://runware.ai/docs/models/flux-1-kontext-dev', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'midjourney-v7-text-to-image': {
    releaseDate: '2025-03-01',
    provenance: { docUrl: 'https://docs.midjourney.com/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'google-imagen4': {
    releaseDate: '2025-05-01',
    provenance: { docUrl: 'https://deepmind.google/technologies/imagen/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'google-imagen4-fast': {
    releaseDate: '2025-05-01',
    provenance: { docUrl: 'https://deepmind.google/technologies/imagen/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'google-imagen4-ultra': {
    releaseDate: '2025-05-01',
    provenance: { docUrl: 'https://deepmind.google/technologies/imagen/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'ideogram-v3-t2i': {
    releaseDate: '2025-03-01',
    provenance: { docUrl: 'https://ideogram.ai/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'wan2.5-text-to-image': {
    releaseDate: '2025-06-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/wan2-7', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'reve-text-to-image': {
    releaseDate: '2025-04-01',
    provenance: { docUrl: 'https://reve.ai/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'leonardoai-phoenix-1.0': {
    releaseDate: '2025-03-01',
    provenance: { docUrl: 'https://leonardo.ai/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'minimax-image-01': {
    releaseDate: '2025-06-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/imagineart-1-5', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'vidu-q2-text-to-image': {
    releaseDate: '2025-05-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/vidu-q3', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  // —— Video t2v W2 ——
  'seedance-v2.0-t2v': {
    releaseDate: '2026-02-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/seedance-2-0', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'veo3.1-text-to-video': {
    releaseDate: '2025-10-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/veo-3-1', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'veo3.1-fast-text-to-video': {
    releaseDate: '2025-10-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/veo-3-1-fast', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'veo3.1-lite-text-to-video': {
    releaseDate: '2025-10-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/veo-3-1-lite', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'kling-v3.0-pro-text-to-video': {
    releaseDate: '2025-09-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/kling-video-3-0-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'kling-v3.0-standard-text-to-video': {
    releaseDate: '2025-09-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/kling-video-3-0-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'grok-imagine-text-to-video': {
    releaseDate: '2025-08-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/grok-imagine-video', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'wan2.6-text-to-video': {
    releaseDate: '2025-07-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/wan2-7', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'ltx-2-pro-text-to-video': {
    releaseDate: '2025-07-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/ltx-2-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'ltx-2-fast-text-to-video': {
    releaseDate: '2025-07-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/ltx-2-fast', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'minimax-hailuo-2.3-pro-t2v': {
    releaseDate: '2025-05-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/minimax-hailuo-2-3', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'minimax-hailuo-2.3-standard-t2v': {
    releaseDate: '2025-05-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/minimax-hailuo-2-3', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'openai-sora-2-text-to-video': {
    releaseDate: '2025-10-01',
    provenance: { docUrl: 'https://openai.com/sora', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'openai-sora-2-pro-text-to-video': {
    releaseDate: '2025-10-01',
    provenance: { docUrl: 'https://openai.com/sora', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
  'pixverse-v5.5-t2v': {
    releaseDate: '2025-08-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/pixverse-v6', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'seedance-v1.5-pro-t2v': {
    releaseDate: '2025-03-01',
    provenance: { docUrl: 'https://runware.ai/docs/models/seedance-1-5-pro', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  // —— Audio W3 ——
  'minimax-speech-2.6-hd': {
    releaseDate: '2025-08-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/minimax-speech-2-8', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'minimax-speech-2.6-turbo': {
    releaseDate: '2025-08-15',
    provenance: { docUrl: 'https://runware.ai/docs/models/minimax-speech-2-8', verifiedAt: VERIFIED_AT, source: 'runware-docs' },
  },
  'suno-create-music': {
    releaseDate: '2025-06-01',
    provenance: { docUrl: 'https://suno.com/', verifiedAt: VERIFIED_AT, source: 'vendor' },
  },
};

/** W1 SOTA ids used for coverage gate (image t2i). */
export const MUAPI_W1_SOTA_IDS = [
  'nano-banana-2',
  'seedream-5.0',
  'gpt-image-2',
  'gpt-image-1.5',
  'flux-2-dev',
  'flux-2-flex',
  'flux-2-pro',
  'flux-2-klein-9b',
  'z-image-turbo',
  'z-image-base',
  'qwen-text-to-image-2512',
  'hunyuan-image-3.0',
  'grok-imagine-text-to-image',
  'nano-banana-pro',
  'bytedance-seedream-v4.5',
  'kling-o1-text-to-image',
  'wan2.6-text-to-image',
  'flux-kontext-dev-t2i',
  'midjourney-v7-text-to-image',
  'google-imagen4',
  'ideogram-v3-t2i',
  'bytedance-seedream-v4',
  'wan2.5-text-to-image',
  'minimax-image-01',
  'vidu-q2-text-to-image',
];
