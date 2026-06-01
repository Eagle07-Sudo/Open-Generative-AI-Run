/**
 * Cloud API key persistence for StandaloneShell (browser localStorage + Muapi cookie).
 * UI components should call these helpers instead of touching storage directly.
 */

import {
  MUAPI_KEY_STORAGE,
  RUNWARE_KEY_STORAGE,
  CLOUD_PROVIDER_STORAGE,
  DEFAULT_CLOUD_PROVIDER,
} from '../packages/studio/src/providers/storageKeys.js';
import { normalizeCloudProvider, pickFallbackProvider } from './cloudSession.js';

const MUAPI_COOKIE_MAX_AGE = '31536000';
const OBFUSCATION_PREFIX = 'og_obf_';
const SALT = 'OpenGenAISecretSalt';

export function isValidApiKey(key) {
  if (typeof key !== 'string') return false;
  return /^[A-Za-z0-9_\-]{8,128}$/.test(key.trim());
}

export function obfuscate(text) {
  if (!text) return '';
  if (text.startsWith(OBFUSCATION_PREFIX)) return text;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
    result += String.fromCharCode(charCode);
  }
  if (typeof btoa !== 'undefined') {
    return OBFUSCATION_PREFIX + btoa(result);
  } else {
    return OBFUSCATION_PREFIX + Buffer.from(result, 'binary').toString('base64');
  }
}

export function deobfuscate(text) {
  if (!text) return '';
  if (!text.startsWith(OBFUSCATION_PREFIX)) {
    return text; // plaintext fallback
  }
  const base64Part = text.slice(OBFUSCATION_PREFIX.length);
  let decoded = '';
  if (typeof atob !== 'undefined') {
    decoded = atob(base64Part);
  } else {
    decoded = Buffer.from(base64Part, 'base64').toString('binary');
  }
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    const charCode = decoded.charCodeAt(i) ^ SALT.charCodeAt(i % SALT.length);
    result += String.fromCharCode(charCode);
  }
  return result;
}

function safeGetItem(storage, key) {
  try {
    return storage.getItem(key) || '';
  } catch {
    return '';
  }
}

function safeSetItem(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(storage, key) {
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** @param {Storage} [storage] */
export function readCloudKeysFromStorage(storage = globalThis.localStorage) {
  const rawMuapiKey = safeGetItem(storage, MUAPI_KEY_STORAGE).trim();
  const rawRunwareApiKey = safeGetItem(storage, RUNWARE_KEY_STORAGE).trim();
  const muapiKey = deobfuscate(rawMuapiKey);
  const runwareApiKey = deobfuscate(rawRunwareApiKey);
  const storedProvider =
    safeGetItem(storage, CLOUD_PROVIDER_STORAGE) || DEFAULT_CLOUD_PROVIDER;

  return {
    muapiKey,
    runwareApiKey,
    storedProvider: normalizeCloudProvider(storedProvider),
  };
}

/**
 * @param {Document} [doc]
 */
export function setMuapiCookie(muapiKey, doc = globalThis.document) {
  if (!doc) return;
  try {
    doc.cookie = `muapi_key=${muapiKey}; path=/; max-age=${MUAPI_COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

/** @param {Document} [doc] */
export function clearMuapiCookie(doc = globalThis.document) {
  try {
    doc.cookie = 'muapi_key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch {
    /* ignore */
  }
}

/**
 * Read storage and resolve active provider (with fallback).
 * @param {Storage} [storage]
 * @returns {{
 *   muapiKey: string,
 *   runwareApiKey: string,
 *   cloudProvider: string,
 *   providerCorrected: boolean,
 * }}
 */
export function hydrateCloudSession(storage = globalThis.localStorage) {
  const { muapiKey, runwareApiKey, storedProvider } = readCloudKeysFromStorage(storage);
  const cloudProvider = pickFallbackProvider(storedProvider, muapiKey, runwareApiKey);
  const providerCorrected = cloudProvider !== storedProvider;

  if (providerCorrected) {
    safeSetItem(storage, CLOUD_PROVIDER_STORAGE, cloudProvider);
  }

  return {
    muapiKey,
    runwareApiKey,
    cloudProvider,
    providerCorrected,
  };
}

/**
 * Persist provider and optional key updates.
 * @param {{
 *   provider: string,
 *   muapiKey?: string | null,
 *   runwareApiKey?: string | null,
 * }} payload
 * @param {Storage} [storage]
 * @param {Document} [doc]
 */
export function persistCloudKeys(
  { provider, muapiKey, runwareApiKey },
  storage = globalThis.localStorage,
  doc = globalThis.document
) {
  const normalized = normalizeCloudProvider(provider);
  safeSetItem(storage, CLOUD_PROVIDER_STORAGE, normalized);

  if (muapiKey != null && muapiKey !== '') {
    safeSetItem(storage, MUAPI_KEY_STORAGE, obfuscate(muapiKey));
    setMuapiCookie(muapiKey, doc);
  }

  if (runwareApiKey != null && runwareApiKey !== '') {
    safeSetItem(storage, RUNWARE_KEY_STORAGE, obfuscate(runwareApiKey));
  }

  return normalized;
}

/**
 * Entry flow: save active provider + one key.
 * @param {{ provider: string, key: string }} payload
 */
export function persistEntryKeys(
  { provider, key },
  storage = globalThis.localStorage,
  doc = globalThis.document
) {
  const normalized = normalizeCloudProvider(provider);

  if (normalized === 'runware') {
    safeSetItem(storage, RUNWARE_KEY_STORAGE, obfuscate(key));
    safeSetItem(storage, CLOUD_PROVIDER_STORAGE, normalized);
    return { provider: normalized, runwareApiKey: key, muapiKey: null };
  }

  safeSetItem(storage, MUAPI_KEY_STORAGE, obfuscate(key));
  safeSetItem(storage, CLOUD_PROVIDER_STORAGE, normalized);
  setMuapiCookie(key, doc);
  return { provider: normalized, muapiKey: key, runwareApiKey: null };
}

/** Sign out clears the active provider key only. */
export function clearCloudKeysForProvider(
  provider,
  storage = globalThis.localStorage,
  doc = globalThis.document
) {
  const normalized = normalizeCloudProvider(provider);

  if (normalized === 'runware') {
    safeRemoveItem(storage, RUNWARE_KEY_STORAGE);
    return { cleared: 'runware' };
  }

  safeRemoveItem(storage, MUAPI_KEY_STORAGE);
  clearMuapiCookie(doc);
  return { cleared: 'muapi' };
}

const CROSS_TAB_SYNC_KEYS = new Set([
  MUAPI_KEY_STORAGE,
  RUNWARE_KEY_STORAGE,
  CLOUD_PROVIDER_STORAGE,
]);

/**
 * Sync keys cleared or updated in another tab (storage event).
 * @param {(session: ReturnType<typeof hydrateCloudSession>) => void} onChange
 * @param {Storage} [storage]
 */
export function subscribeCloudKeyStorageSync(
  onChange,
  storage = globalThis.localStorage,
) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => {
    if (e.storageArea !== storage) return;
    if (e.key != null && !CROSS_TAB_SYNC_KEYS.has(e.key)) return;
    onChange(hydrateCloudSession(storage));
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export {
  MUAPI_KEY_STORAGE,
  RUNWARE_KEY_STORAGE,
  CLOUD_PROVIDER_STORAGE,
  DEFAULT_CLOUD_PROVIDER,
};
