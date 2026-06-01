import { getStudioAsset } from './studioAssetRegistry.js';
import { isAssetLabel } from './previewSrc.js';
import { labelFromMention } from './studioAssetTypes.js';
import { parseMentionLabels } from './mentionParse.js';

/**
 * Extract unique asset labels from prompt-card refs (order preserved).
 * @param {unknown[]} refs
 * @returns {string[]}
 */
export function extractCardLabels(refs) {
  const out = [];
  const seen = new Set();
  for (const ref of refs || []) {
    let label = null;
    if (typeof ref === 'string' && isAssetLabel(ref)) {
      label = ref;
    } else if (ref && typeof ref === 'object') {
      if (typeof ref.label === 'string' && isAssetLabel(ref.label)) {
        label = ref.label;
      } else if (typeof ref.url === 'string' && isAssetLabel(ref.url)) {
        label = ref.url;
      }
    }
    if (label && !seen.has(label)) {
      seen.add(label);
      out.push(label);
    }
  }
  return out;
}

/**
 * Studio assets for mention autocomplete — only labels on this prompt card.
 * @param {string} studioId
 * @param {unknown[]} refs
 * @returns {import('./studioAssetTypes.js').StudioAsset[]}
 */
export function cardMentionAssets(studioId, refs) {
  return extractCardLabels(refs)
    .map((label) => getStudioAsset(studioId, label))
    .filter((a) => a != null);
}

/**
 * Mention labels in prompt that are allowed on this card.
 * @param {string} prompt
 * @param {string[]} allowedLabels
 * @returns {string[]}
 */
export function mentionsInCardScope(prompt, allowedLabels) {
  if (!allowedLabels?.length) return parseMentionLabels(prompt || '');
  const allowed = new Set(allowedLabels);
  return parseMentionLabels(prompt || '').filter((l) => allowed.has(l));
}

/**
 * Remove @mentions not on this card from prompt text (keeps allowed tags).
 * @param {string} prompt
 * @param {string[]} allowedLabels
 * @returns {string}
 */
export function filterMentionsToCardScope(prompt, allowedLabels) {
  if (!prompt || !allowedLabels?.length) return prompt || '';
  const allowed = new Set(allowedLabels);
  return prompt.replace(/@(image|video|audio)\d+/gi, (tag) => {
    const label = labelFromMention(tag);
    return label && allowed.has(label) ? tag : '';
  });
}

/**
 * Remove all @imageN / @videoN / @audioN tags before sending to providers (refs go in referenceImages).
 * @param {string} prompt
 * @returns {string}
 */
export function stripMentionsFromPrompt(prompt) {
  return (prompt || '')
    .replace(/@(image|video|audio)\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}
