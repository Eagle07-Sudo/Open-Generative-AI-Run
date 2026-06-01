import { getStudioAsset, listStudioAssets } from './studioAssetRegistry.js';
import { parseMentionLabels } from './mentionParse.js';
import { mentionsInCardScope } from './cardMentionAssets.js';
import { isAssetLabel } from './previewSrc.js';

/**
 * @param {string[]} labels
 * @param {Set<string> | null} allowed
 */
function filterLabelsToCard(labels, allowed) {
  if (!allowed) return labels;
  return labels.filter((l) => {
    const norm = String(l).replace(/^@/, '');
    return isAssetLabel(norm) ? allowed.has(norm) : true;
  });
}

/**
 * Collect image labels for images_list: explicit labels, mentions in prompt, or all image assets.
 * @param {string} studioId
 * @param {string} [prompt]
 * @param {string[]} [explicitLabels]
 * @param {string[]} [cardLabels] - prompt-card scope; intersects prompt mentions
 */
export function resolveImageLabels(studioId, prompt, explicitLabels, cardLabels) {
  const allowed = cardLabels?.length ? new Set(cardLabels) : null;

  if (explicitLabels?.length) {
    const normalized = explicitLabels.map((l) => String(l).replace(/^@/, ''));
    return filterLabelsToCard(normalized, allowed);
  }

  const fromPrompt = mentionsInCardScope(prompt || '', cardLabels || []).filter((l) =>
    l.startsWith('image'),
  );
  if (fromPrompt.length) return fromPrompt;

  if (allowed) {
    return [];
  }

  const all = listStudioAssets(studioId)
    .filter((a) => a.kind === 'image')
    .map((a) => a.label);
  return all;
}

/**
 * @param {string} studioId
 * @param {string} label
 */
export function getInferenceRefForLabel(studioId, label) {
  const asset = getStudioAsset(studioId, label);
  if (!asset) return undefined;
  return asset.inferenceRef;
}

/**
 * @param {string} studioId
 * @param {string} val - label, @label, blob preview URL, or https
 */
export function resolveParamRef(studioId, val) {
  if (!val || typeof val !== 'string') return val;
  const stripped = val.replace(/^@/, '');
  const byLabel = getInferenceRefForLabel(studioId, stripped);
  if (byLabel) return byLabel;
  const assets = listStudioAssets(studioId);
  const match = assets.find(
    (a) =>
      a.label === stripped ||
      a.previewUrl === val ||
      a.thumbUrl === val,
  );
  if (match?.inferenceRef) return match.inferenceRef;
  return val.startsWith('blob:') || val.startsWith('data:') ? undefined : val;
}

/**
 * Build provider params with inference refs (post-finalize).
 * @param {string} studioId
 * @param {Record<string, unknown>} params
 * @param {{ imageLabels?: string[], videoLabel?: string, audioLabel?: string, cardLabels?: string[] }} [opts]
 */
export function applyAssetRefsToParams(studioId, params, opts = {}) {
  const out = { ...params };
  const promptText = String(params.prompt || '');
  const imageLabels = resolveImageLabels(
    studioId,
    promptText,
    opts.imageLabels,
    opts.cardLabels,
  );

  if (imageLabels.length) {
    const refs = imageLabels.map((l) => getInferenceRefForLabel(studioId, l)).filter(Boolean);
    if (refs.length !== imageLabels.length) {
      throw new Error(
        'Reference image not uploaded to the cloud yet. Wait for the upload to finish, then try Generate again.',
      );
    }
    for (const ref of refs) {
      if (isAssetLabel(ref)) {
        throw new Error(
          'Reference image not uploaded to the cloud yet. Wait for the upload to finish, then try Generate again.',
        );
      }
    }
    if (refs.length) {
      out.images_list = refs;
      out.image_url = refs[0];
    }
  } else if (params.image_url && typeof params.image_url === 'string') {
    const ref = resolveParamRef(studioId, params.image_url);
    if (ref) out.image_url = ref;
    if (params.images_list) {
      out.images_list = params.images_list
        .map((u) => resolveParamRef(studioId, String(u)))
        .filter(Boolean);
    }
  }

  if (opts.videoLabel || params.video_url) {
    const vl =
      opts.videoLabel ||
      (typeof params.video_url === 'string' ? params.video_url.replace(/^@/, '') : null);
    if (vl) {
      const ref = resolveParamRef(studioId, vl);
      if (ref) out.video_url = ref;
    }
  }

  if (opts.audioLabel || params.audio_url) {
    const al =
      opts.audioLabel ||
      (typeof params.audio_url === 'string' ? params.audio_url : null);
    if (al) {
      const ref = resolveParamRef(studioId, al);
      if (ref) out.audio_url = ref;
    }
  }

  for (const key of ['referenceImages', 'referenceVideos', 'referenceAudios']) {
    const arr = params[key];
    if (Array.isArray(arr) && arr.length) {
      const resolved = arr
        .map((r) => resolveParamRef(studioId, String(r)))
        .filter(Boolean);
      if (resolved.length !== arr.length) {
        throw new Error(
          'Reference media not uploaded to the cloud yet. Wait for the upload to finish, then try Generate again.',
        );
      }
      for (const ref of resolved) {
        if (isAssetLabel(ref)) {
          throw new Error(
            'Reference media not uploaded to the cloud yet. Wait for the upload to finish, then try Generate again.',
          );
        }
      }
      if (resolved.length) out[key] = resolved;
    }
  }

  if (out.images_list) {
    for (const ref of out.images_list) {
      if (isAssetLabel(ref)) {
        throw new Error(
          'Reference image not uploaded to the cloud yet. Wait for the upload to finish, then try Generate again.',
        );
      }
    }
  }
  if (out.image_url && isAssetLabel(out.image_url)) {
    throw new Error(
      'Reference image not uploaded to the cloud yet. Wait for the upload to finish, then try Generate again.',
    );
  }

  return out;
}
