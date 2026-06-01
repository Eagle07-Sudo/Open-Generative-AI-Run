/** @typedef {'muapi' | 'runware'} CloudProviderId */

/**
 * @typedef {Object} GenerateImageParams
 * @property {string} model - Internal catalog id (e.g. rw-flux-dev or flux-dev)
 * @property {string} prompt
 * @property {string} [aspect_ratio]
 * @property {string} [resolution]
 * @property {string} [quality]
 * @property {(requestId: string) => void} [onRequestId]
 */

/**
 * @typedef {Object} GenerateImageResult
 * @property {string} [url]
 * @property {string} [id]
 */

export {};
