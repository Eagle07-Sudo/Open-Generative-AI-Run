import { labelFromMention } from './studioAssetTypes.js';

const MENTION_RE = /@(image|video|audio)\d+/gi;

/**
 * @param {string} text
 * @returns {string[]} unique labels in order of first appearance
 */
export function parseMentionLabels(text) {
  if (!text) return [];
  const seen = new Set();
  const order = [];
  const re = new RegExp(MENTION_RE.source, 'gi');
  let m;
  while ((m = re.exec(text)) !== null) {
    const label = labelFromMention(m[0]);
    if (label && !seen.has(label)) {
      seen.add(label);
      order.push(label);
    }
  }
  return order;
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function textHasMentions(text) {
  return MENTION_RE.test(text || '');
}
