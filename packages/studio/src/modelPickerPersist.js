/** @typedef {'muapi' | 'runware'} CloudProviderId */

const PICKER_VERSION = 1;

/**
 * @param {string} studioId
 */
export function modelPickStorageKey(studioId) {
  return `og_model_pick_${studioId}`;
}

/**
 * @typedef {{ v: number, modelId: string, providerId: CloudProviderId }} ModelPickState
 */

/**
 * @param {string} studioId
 * @param {Storage | null} [storage]
 * @returns {ModelPickState | null}
 */
export function loadModelPick(studioId, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(modelPickStorageKey(studioId));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.v !== PICKER_VERSION) return null;
    if (!data.modelId || !data.providerId) return null;
    if (data.providerId !== 'muapi' && data.providerId !== 'runware') return null;
    return { v: PICKER_VERSION, modelId: String(data.modelId), providerId: data.providerId };
  } catch {
    return null;
  }
}

/**
 * @param {string} studioId
 * @param {ModelPickState} state
 * @param {Storage | null} [storage]
 */
export function saveModelPick(studioId, state, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(
      modelPickStorageKey(studioId),
      JSON.stringify({ v: PICKER_VERSION, modelId: state.modelId, providerId: state.providerId })
    );
  } catch {
    /* ignore quota */
  }
}

/**
 * @param {string} studioId
 * @param {Storage | null} [storage]
 */
export function clearModelPick(studioId, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    storage.removeItem(modelPickStorageKey(studioId));
  } catch {
    /* ignore */
  }
}
