/** @typedef {'pending' | 'ready' | 'failed'} GenerationHistoryStatus */

/**
 * @typedef {Object} GenerationHistoryEntry
 * @property {string} id
 * @property {GenerationHistoryStatus} status
 * @property {string} [url]
 * @property {string} [prompt]
 * @property {string} [model]
 * @property {string} [providerId]
 * @property {string} [aspect_ratio]
 * @property {string} [resolution]
 * @property {number} [duration]
 * @property {string} [timestamp]
 * @property {string} [error]
 * @property {import('../studioRecreate.js').GenerationSnapshot} [snapshot]
 * @property {'image' | 'video' | 'marketing'} [mediaType]
 */

export const GENERATION_HISTORY_MAX = 50;
