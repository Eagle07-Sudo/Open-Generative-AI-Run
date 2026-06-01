import { postTasks } from './runwareClient.js';

export const RUNWARE_MODEL_SEARCH_FLAG = 'RUNWARE_MODEL_SEARCH';
export const RUNWARE_SEARCH_CACHE_KEY = 'og_runware_search_cache_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * @param {Storage} [storage]
 */
export function isRunwareModelSearchEnabled(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(RUNWARE_MODEL_SEARCH_FLAG) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {Storage} [storage]
 * @param {boolean} enabled
 */
export function setRunwareModelSearchEnabled(enabled, storage = globalThis.localStorage) {
  try {
    if (enabled) storage.setItem(RUNWARE_MODEL_SEARCH_FLAG, '1');
    else storage.removeItem(RUNWARE_MODEL_SEARCH_FLAG);
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} cacheKey
 * @param {Storage} [storage]
 */
function readCache(cacheKey, storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(RUNWARE_SEARCH_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.key !== cacheKey) return null;
    if (Date.now() - data.ts > CACHE_TTL_MS) return null;
    return data.results;
  } catch {
    return null;
  }
}

/**
 * @param {string} cacheKey
 * @param {object[]} results
 * @param {Storage} [storage]
 */
function writeCache(cacheKey, results, storage = globalThis.localStorage) {
  try {
    storage.setItem(
      RUNWARE_SEARCH_CACHE_KEY,
      JSON.stringify({ key: cacheKey, ts: Date.now(), results }),
    );
  } catch {
    /* ignore */
  }
}

/**
 * @param {object} row
 */
function mapSearchResult(row) {
  return {
    id: `rw-search-${(row.air || row.name || '').replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}`,
    name: row.name || row.air,
    runwareModel: row.air,
    provider: 'runware',
    providerId: 'runware',
    private: Boolean(row.private),
    fromSearch: true,
  };
}

/**
 * @param {string} apiKey
 * @param {{ search?: string, limit?: number, category?: string }} opts
 * @param {Storage} [storage]
 */
export async function searchRunwareModels(apiKey, opts = {}, storage = globalThis.localStorage) {
  const search = (opts.search || '').trim();
  if (!search || !apiKey) return [];

  const cacheKey = `${search}:${opts.category || 'all'}:${opts.limit || 20}`;
  const cached = readCache(cacheKey, storage);
  if (cached) return cached;

  const taskUUID = crypto.randomUUID();
  const body = await postTasks(apiKey, [
    {
      taskType: 'modelSearch',
      taskUUID,
      search,
      category: opts.category || 'checkpoint',
      visibility: 'public',
      limit: Math.min(opts.limit || 20, 50),
      offset: 0,
    },
  ]);

  const block = (body?.data || []).find((d) => d.taskType === 'modelSearch') || body?.data?.[0];
  const rows = (block?.results || []).filter((r) => !r.private);
  const mapped = rows.map(mapSearchResult);
  writeCache(cacheKey, mapped, storage);
  return mapped;
}
