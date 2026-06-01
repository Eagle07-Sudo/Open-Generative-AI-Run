/** IndexedDB persistence for staged reference files (ADR-012 / ADR-007). */

import {
  isStudioBlobPersistEnabled,
  readBlobIndex,
  trackBlobIndex,
  untrackBlobIndex,
  clearBlobIndex,
} from './studioBlobPersistPolicy.js';

const DB_NAME = 'og_studio_asset_blobs';
const STORE = 'blobs';
const DB_VERSION = 1;
const MAX_BLOBS_PER_STUDIO = 20;
const OPEN_DB_TIMEOUT_MS = 4000;

/** @type {ReturnType<typeof setTimeout> | null} */
let evictTimer = null;

/** @type {IDBDatabase | null} */
let dbPromise = null;

function resetDbPromise() {
  dbPromise = null;
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 */
function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise((resolve) => {
      setTimeout(() => resolve(fallback), ms);
    }),
  ]);
}

function openDb() {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => {
        resetDbPromise();
        reject(req.error);
      };
      req.onblocked = () => {
        console.warn('[studioAssetBlobStore] IndexedDB open blocked — retry later');
      };
      req.onsuccess = () => resolve(req.result);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
    });
    dbPromise = withTimeout(dbPromise, OPEN_DB_TIMEOUT_MS, null).catch((err) => {
      resetDbPromise();
      console.warn('[studioAssetBlobStore] IndexedDB unavailable', err);
      return null;
    });
  }
  return dbPromise;
}

/**
 * @param {string} studioId
 * @param {string} label
 */
function blobKey(studioId, label) {
  return `${studioId}:${label}`;
}

/**
 * @param {string} studioId
 * @param {string} label
 * @param {File} file
 */
export async function putAssetBlob(studioId, label, file) {
  if (!isStudioBlobPersistEnabled()) return;
  const db = await openDb();
  if (!db) return;
  const key = blobKey(studioId, label);
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    store.put({ key, studioId, label, file, storedAt: Date.now() });
    await txComplete(tx);
    trackBlobIndex(studioId, label, file?.size || 0);
    scheduleEvictBlobs();
  } catch (err) {
    if (err?.name === 'QuotaExceededError') {
      console.warn('[studioAssetBlobStore] QuotaExceededError during put. Triggering emergency eviction.');
      await evictBlobsToCap(true);
    } else {
      console.error('[studioAssetBlobStore] Failed to store blob:', err);
    }
  }
}

/**
 * @param {string} studioId
 * @param {string} label
 * @returns {Promise<File | null>}
 */
export async function getAssetBlob(studioId, label) {
  if (!isStudioBlobPersistEnabled()) return null;
  return withTimeout(_getAssetBlob(studioId, label), 3000, null);
}

/** @param {string} studioId @param {string} label */
async function _getAssetBlob(studioId, label) {
  const db = await openDb();
  if (!db) return null;
  const key = blobKey(studioId, label);
  const tx = db.transaction(STORE, 'readonly');
  const req = tx.objectStore(STORE).get(key);
  const row = await reqToPromise(req);
  return row?.file instanceof File ? row.file : null;
}

/**
 * @param {string} studioId
 * @param {string} label
 */
export async function deleteAssetBlob(studioId, label) {
  untrackBlobIndex(studioId, label);
  if (!isStudioBlobPersistEnabled()) return;
  const db = await openDb();
  if (!db) return;
  const tx = db.transaction(STORE, 'readwrite');
  tx.objectStore(STORE).delete(blobKey(studioId, label));
  await txComplete(tx);
}

/**
 * @param {string} studioId
 */
export async function clearStudioBlobs(studioId) {
  const index = readBlobIndex(studioId);
  clearBlobIndex(studioId);
  if (!isStudioBlobPersistEnabled()) return;
  for (const entry of index) {
    const db = await openDb();
    if (!db) break;
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(blobKey(studioId, entry.label));
    await txComplete(tx);
  }
}

function scheduleEvictBlobs() {
  if (typeof window === 'undefined') return;
  if (evictTimer) clearTimeout(evictTimer);
  evictTimer = setTimeout(() => {
    evictTimer = null;
    void evictBlobsToCap();
  }, 2500);
}

const GLOBAL_SIZE_CAP = 3 * 1024 * 1024 * 1024; // 3GB

export async function evictBlobsToCap(emergency = false) {
  if (!isStudioBlobPersistEnabled()) return;
  const db = await openDb();
  if (!db) return;

  const allEntries = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('og_blob_index_')) {
        const studioId = key.slice('og_blob_index_'.length);
        const raw = localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        if (Array.isArray(list)) {
          for (const entry of list) {
            allEntries.push({ ...entry, studioId });
          }
        }
      }
    }
  } catch {
    return;
  }

  allEntries.sort((a, b) => a.at - b.at);

  let currentTotal = allEntries.reduce((sum, e) => sum + (Number(e.size) || 0), 0);
  const targetCap = emergency ? GLOBAL_SIZE_CAP * 0.7 : GLOBAL_SIZE_CAP;

  if (currentTotal <= targetCap && !emergency) {
    const studioCounts = {};
    const reversed = [...allEntries].reverse();
    for (const entry of reversed) {
      studioCounts[entry.studioId] = (studioCounts[entry.studioId] || 0) + 1;
      if (studioCounts[entry.studioId] > MAX_BLOBS_PER_STUDIO) {
        await deleteAssetBlob(entry.studioId, entry.label);
      }
    }
    return;
  }

  for (const entry of allEntries) {
    if (currentTotal <= targetCap) break;
    await deleteAssetBlob(entry.studioId, entry.label);
    currentTotal -= Number(entry.size) || 0;
  }
}

/** @param {IDBTransaction} tx */
function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/** @param {IDBRequest} req */
function reqToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Tests: reset module state */
export function resetBlobStoreForTests() {
  dbPromise = null;
}
