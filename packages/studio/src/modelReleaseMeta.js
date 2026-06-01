/** Catalog release metadata — fork-owned; see ADR-004. */

import { MUAPI_RELEASE_DATES } from './models.muapi.releaseDates.js';

export const RELEASE_CUTOFF = '2025-01-01';
export const CATALOG_RELEASE_FILTER_FLAG = 'CATALOG_RELEASE_FILTER';

/** @typedef {'runware-docs'|'vendor'|'manual'|'muapi'} ProvenanceSource */
/** @typedef {{ docUrl: string, verifiedAt: string, source?: ProvenanceSource }} CatalogProvenance */

/**
 * @param {Storage} [storage]
 */
export function isCatalogReleaseFilterEnabled(storage = globalThis.localStorage) {
  try {
    const v = storage?.getItem(CATALOG_RELEASE_FILTER_FLAG);
    if (v === '0') return false;
    return v !== '0';
  } catch {
    return true;
  }
}

/**
 * @param {boolean} enabled
 * @param {Storage} [storage]
 */
export function setCatalogReleaseFilterEnabled(enabled, storage = globalThis.localStorage) {
  try {
    storage.setItem(CATALOG_RELEASE_FILTER_FLAG, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

/**
 * @param {string | undefined} iso
 */
export function isOnOrAfterCutoff(iso) {
  if (!iso) return false;
  return iso.slice(0, 10) >= RELEASE_CUTOFF;
}

/**
 * @param {object | null | undefined} model
 * @param {'muapi'|'runware'} providerId
 */
export function getReleaseDate(model, providerId) {
  if (!model) return undefined;
  if (providerId === 'runware') return model.releaseDate;
  const row = MUAPI_RELEASE_DATES[model.id];
  return row?.releaseDate;
}

/**
 * @param {object | null | undefined} model
 * @param {'muapi'|'runware'} providerId
 * @returns {CatalogProvenance | undefined}
 */
export function getProvenance(model, providerId) {
  if (!model) return undefined;
  if (providerId === 'runware') return model.provenance;
  return MUAPI_RELEASE_DATES[model.id]?.provenance;
}

/**
 * @param {object} model
 * @param {'muapi'|'runware'} providerId
 * @param {{ filterEnabled?: boolean }} [opts]
 */
export function isCatalogVisible(model, providerId, opts = {}) {
  const filterEnabled = opts.filterEnabled ?? isCatalogReleaseFilterEnabled();
  if (!filterEnabled) return true;
  const releaseDate = getReleaseDate(model, providerId);
  if (!releaseDate) return providerId === 'runware' ? false : false;
  return isOnOrAfterCutoff(releaseDate);
}

/**
 * @param {object} a
 * @param {object} b
 * @param {'muapi'|'runware'} providerId
 */
export function compareByReleaseDate(a, b, providerId) {
  const da = getReleaseDate(a, providerId) || '';
  const db = getReleaseDate(b, providerId) || '';
  if (da !== db) return db.localeCompare(da);
  return (a.name || a.id || '').localeCompare(b.name || b.id || '');
}

/**
 * @param {object[]} models
 * @param {'muapi'|'runware'} providerId
 * @param {{ filterEnabled?: boolean }} [opts]
 */
export function processCatalogModels(models, providerId, opts = {}) {
  const enriched = models.map((m) => ({
    ...m,
    releaseDate: getReleaseDate(m, providerId),
    provenance: getProvenance(m, providerId),
  }));
  const filtered = enriched.filter((m) => isCatalogVisible(m, providerId, opts));
  return filtered.sort((a, b) => compareByReleaseDate(a, b, providerId));
}

/**
 * @param {string | undefined} iso
 * @param {string} [locale]
 */
export function formatReleaseDateLabel(iso, locale) {
  if (!iso) return '';
  try {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale || undefined, {
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 7);
  }
}

/**
 * @param {string | undefined} iso
 * @param {string} [locale]
 */
export function formatReleaseDateFull(iso, locale) {
  if (!iso) return '';
  try {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
    return new Intl.DateTimeFormat(locale || undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}
