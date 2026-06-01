/** IndexedDB blob cache policy (ADR-012). Default on; opt out with `localStorage.og_idb_assets = '0'`. */

const LS_FLAG = 'og_idb_assets';
const LS_INDEX_PREFIX = 'og_blob_index_';

/**
 * Staged reference files persist to IndexedDB when enabled (default).
 * Disable: `localStorage.setItem('og_idb_assets', '0')` then reload.
 * @returns {boolean}
 */
export function isStudioBlobPersistEnabled() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(LS_FLAG) !== '0';
}

/**
 * @param {string} studioId
 * @returns {{ label: string, at: number, size?: number }[]}
 */
export function readBlobIndex(studioId) {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LS_INDEX_PREFIX}${studioId}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * @param {string} studioId
 * @param {string} label
 * @param {number} [size]
 */
export function trackBlobIndex(studioId, label, size = 0) {
  if (typeof localStorage === 'undefined') return;
  const list = readBlobIndex(studioId).filter((e) => e.label !== label);
  list.push({ label, at: Date.now(), size });
  try {
    localStorage.setItem(`${LS_INDEX_PREFIX}${studioId}`, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} studioId
 * @param {string} label
 */
export function untrackBlobIndex(studioId, label) {
  if (typeof localStorage === 'undefined') return;
  const list = readBlobIndex(studioId).filter((e) => e.label !== label);
  try {
    localStorage.setItem(`${LS_INDEX_PREFIX}${studioId}`, JSON.stringify(list));
  } catch {
    /* quota */
  }
}

/**
 * @param {string} studioId
 */
export function clearBlobIndex(studioId) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(`${LS_INDEX_PREFIX}${studioId}`);
  } catch {
    /* ignore */
  }
}
