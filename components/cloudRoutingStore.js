/**
 * Hybrid cloud routing preferences (localStorage). Keys only — no secrets.
 */

export const ROUTING_STORE_VERSION = 1;
export const ROUTING_MODE_STORAGE = 'cloud_routing_mode';
export const ROUTING_FALLBACK_STORAGE = 'cloud_allow_muapi_fallback';
export const PER_STUDIO_ROUTING_STORAGE = 'cloud_per_studio_routing';
export const ROUTING_V2_FLAG = 'routing_v2';

/** @typedef {'runware-first' | 'muapi-only' | 'runware-only'} RoutingMode */
/** @typedef {'auto' | 'runware' | 'muapi'} PerStudioRoute */

const DEFAULT_ROUTING_MODE = 'runware-first';

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {string} raw
 * @returns {RoutingMode}
 */
export function normalizeRoutingMode(raw) {
  if (raw === 'muapi-only' || raw === 'runware-only') return raw;
  return 'runware-first';
}

/**
 * @param {Storage} [storage]
 */
export function isRoutingV2Enabled(storage = globalThis.localStorage) {
  return safeGet(storage, ROUTING_V2_FLAG) === '1';
}

/**
 * @param {Storage} [storage]
 */
export function loadRoutingPrefs(storage = globalThis.localStorage) {
  const versionRaw = safeGet(storage, 'cloud_routing_store_version');
  const version = versionRaw ? parseInt(versionRaw, 10) : 0;

  let routingMode = normalizeRoutingMode(safeGet(storage, ROUTING_MODE_STORAGE) || DEFAULT_ROUTING_MODE);
  let allowMuapiFallback = safeGet(storage, ROUTING_FALLBACK_STORAGE) !== '0';
  /** @type {Record<string, PerStudioRoute>} */
  let perStudioRouting = {};

  if (version >= ROUTING_STORE_VERSION) {
    try {
      const raw = safeGet(storage, PER_STUDIO_ROUTING_STORAGE);
      if (raw) perStudioRouting = JSON.parse(raw);
    } catch {
      perStudioRouting = {};
    }
  } else if (version > 0 && version < ROUTING_STORE_VERSION) {
    // future migrations
  }

  if (!isRoutingV2Enabled(storage) && !safeGet(storage, ROUTING_MODE_STORAGE)) {
    routingMode = 'runware-first';
  }

  return {
    routingMode,
    allowMuapiFallback,
    perStudioRouting,
    storeVersion: ROUTING_STORE_VERSION,
  };
}

/**
 * @param {{
 *   routingMode?: RoutingMode,
 *   allowMuapiFallback?: boolean,
 *   perStudioRouting?: Record<string, PerStudioRoute>,
 * }} prefs
 * @param {Storage} [storage]
 */
export function saveRoutingPrefs(prefs, storage = globalThis.localStorage) {
  if (prefs.routingMode != null) {
    safeSet(storage, ROUTING_MODE_STORAGE, normalizeRoutingMode(prefs.routingMode));
  }
  if (prefs.allowMuapiFallback != null) {
    safeSet(storage, ROUTING_FALLBACK_STORAGE, prefs.allowMuapiFallback ? '1' : '0');
  }
  if (prefs.perStudioRouting != null) {
    safeSet(storage, PER_STUDIO_ROUTING_STORAGE, JSON.stringify(prefs.perStudioRouting));
  }
  safeSet(storage, 'cloud_routing_store_version', String(ROUTING_STORE_VERSION));
  return loadRoutingPrefs(storage);
}

/**
 * Enable hybrid routing UI (rollout flag).
 * @param {Storage} [storage]
 */
export function enableRoutingV2(storage = globalThis.localStorage) {
  safeSet(storage, ROUTING_V2_FLAG, '1');
  if (!safeGet(storage, ROUTING_MODE_STORAGE)) {
    safeSet(storage, ROUTING_MODE_STORAGE, DEFAULT_ROUTING_MODE);
  }
  safeSet(storage, 'cloud_routing_store_version', String(ROUTING_STORE_VERSION));
}

export const ROUTING_MODE_OPTIONS = [
  { value: 'runware-first', label: 'Runware first (Muapi fallback)' },
  { value: 'muapi-only', label: 'Muapi only' },
  { value: 'runware-only', label: 'Runware only' },
];

export const ROUTING_PRIVACY_NOTE =
  'Routing preferences are stored in your browser only. API keys are never uploaded to this app’s server.';
