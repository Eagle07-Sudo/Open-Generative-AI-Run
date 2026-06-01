import { labelFromMention } from './studioAssetTypes.js';

const MENTION_TOKEN_RE = /@(image|video|audio)\d+/gi;

/**
 * @typedef {'plain' | 'active' | 'invalid' | 'pending'} MentionSegmentType
 */

/**
 * @typedef {{ type: MentionSegmentType, text: string }} MentionSegment
 */

/**
 * Split prompt text for mirror highlighting (ADR-007).
 * @param {string} text
 * @param {{
 *   assetLabels?: Set<string> | string[],
 *   pendingAt?: number,
 *   pendingQuery?: string,
 *   popupOpen?: boolean,
 * }} [opts]
 * @returns {MentionSegment[]}
 */
export function segmentizePromptText(text, opts = {}) {
  const raw = text || '';
  const labelSet =
    opts.assetLabels instanceof Set
      ? opts.assetLabels
      : new Set((opts.assetLabels || []).map((l) => String(l).toLowerCase()));
  const pendingAt = opts.pendingAt ?? -1;
  const pendingQuery = opts.pendingQuery ?? '';
  const popupOpen = Boolean(opts.popupOpen);

  if (!raw) return [];

  const segments = [];
  let i = 0;

  while (i < raw.length) {
    if (popupOpen && pendingAt >= 0 && i === pendingAt) {
      const pendingText = `@${pendingQuery}`;
      segments.push({ type: 'pending', text: pendingText });
      i += pendingText.length;
      continue;
    }

    if (raw[i] === '@') {
      const rest = raw.slice(i);
      const m = /^@(image|video|audio)(\d+)/i.exec(rest);
      if (m) {
        const token = m[0];
        const label = `${m[1].toLowerCase()}${m[2]}`;
        segments.push({
          type: labelSet.has(label) ? 'active' : 'invalid',
          text: token,
        });
        i += token.length;
        continue;
      }
    }

    let end = raw.length;
    const nextAt = raw.indexOf('@', i);
    if (nextAt >= 0) end = Math.min(end, nextAt);
    if (popupOpen && pendingAt > i) end = Math.min(end, pendingAt);

    const chunk = raw.slice(i, end);
    if (chunk) segments.push({ type: 'plain', text: chunk });
    i = end;
  }

  return segments.length > 0 ? segments : [{ type: 'plain', text: raw }];
}

/** @param {MentionSegmentType} type */
export function mentionSegmentClassName(type) {
  switch (type) {
    case 'active':
      return 'text-primary font-semibold bg-primary/15 rounded-sm px-0.5';
    case 'pending':
      return 'text-white/50 italic';
    case 'invalid':
      return 'text-amber-400/90 underline decoration-dotted decoration-amber-400/60';
    default:
      return 'text-foreground';
  }
}

export { MENTION_TOKEN_RE };
