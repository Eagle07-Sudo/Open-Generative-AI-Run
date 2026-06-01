import * as muapiProvider from './providers/muapi.js';
import * as runwareProvider from './providers/runware.js';
import { DEFAULT_CLOUD_PROVIDER } from './providers/storageKeys.js';

export { DEFAULT_CLOUD_PROVIDER } from './providers/storageKeys.js';
export * from './providers/storageKeys.js';

/** @type {Record<string, string>} */
export const PROVIDER_LABELS = {
  muapi: 'Muapi',
  runware: 'Runware',
};

const REGISTRY = {
  muapi: muapiProvider,
  runware: runwareProvider,
};

/** @type {readonly string[]} */
export const PROVIDER_IDS = Object.freeze(Object.keys(REGISTRY));

/**
 * @param {string} id
 * @param {typeof muapiProvider} module
 */
export function registerProvider(id, module) {
  REGISTRY[id] = module;
  if (!PROVIDER_LABELS[id]) {
    PROVIDER_LABELS[id] = id.charAt(0).toUpperCase() + id.slice(1);
  }
}

/**
 * @param {string} [id]
 */
export function getProvider(id = DEFAULT_CLOUD_PROVIDER) {
  const key = id && REGISTRY[id] ? id : id === 'runware' ? 'runware' : 'muapi';
  return REGISTRY[key] || REGISTRY.muapi;
}

/**
 * @param {'muapi' | 'runware' | string} provider
 * @param {{ muapiKey?: string | null, runwareApiKey?: string | null }} keys
 */
export function getCloudApiKey(provider, keys) {
  if (provider === 'runware') return keys.runwareApiKey || '';
  return keys.muapiKey || '';
}

/**
 * @param {string} providerId
 */
export function providerLabel(providerId) {
  return PROVIDER_LABELS[providerId] || providerId;
}
