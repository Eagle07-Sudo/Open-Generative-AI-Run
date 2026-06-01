/**
 * Cloud provider session helpers for StandaloneShell entry/settings auth.
 * Not part of packages/studio — Next.js shell only.
 */

export function normalizeCloudProvider(id) {
  return id === 'runware' ? 'runware' : 'muapi';
}

export function hasCloudSession(provider, muapiKey, runwareKey) {
  const p = normalizeCloudProvider(provider);
  if (p === 'runware') return Boolean(runwareKey?.trim());
  return Boolean(muapiKey?.trim());
}

/** Effective key after Save: non-empty draft wins, else stored. */
export function resolveProviderKey(provider, muapiKey, runwareKey, draftMuapi, draftRunware) {
  const p = normalizeCloudProvider(provider);
  if (p === 'runware') {
    const t = draftRunware?.trim();
    return t || runwareKey?.trim() || '';
  }
  const t = draftMuapi?.trim();
  return t || muapiKey?.trim() || '';
}

/** When stored provider has no key, prefer any provider that has a key. */
export function pickFallbackProvider(storedProvider, muapiKey, runwareKey) {
  const stored = normalizeCloudProvider(storedProvider);
  if (hasCloudSession(stored, muapiKey, runwareKey)) return stored;
  if (hasCloudSession('runware', muapiKey, runwareKey)) return 'runware';
  if (hasCloudSession('muapi', muapiKey, runwareKey)) return 'muapi';
  return stored;
}

/** Masked hint for settings UI (first 8 chars + bullets). */
export function keyConfiguredHint(key) {
  const t = key?.trim();
  if (!t) return null;
  return `${t.slice(0, 8)}••••••••`;
}

/**
 * Session state after removing one provider's key (storage already cleared).
 * @returns {{ nextMuapi: string, nextRunware: string, nextCloudProvider: string, hasAnySession: boolean }}
 */
export function resolveAfterKeyRemoval(removedProvider, muapiKey, runwareKey, activeProvider) {
  const removed = normalizeCloudProvider(removedProvider);
  const nextMuapi = removed === 'muapi' ? '' : (muapiKey?.trim() || '');
  const nextRunware = removed === 'runware' ? '' : (runwareKey?.trim() || '');
  const nextCloudProvider = pickFallbackProvider(activeProvider, nextMuapi, nextRunware);
  const hasAnySession =
    hasCloudSession('muapi', nextMuapi, nextRunware) ||
    hasCloudSession('runware', nextMuapi, nextRunware);
  return { nextMuapi, nextRunware, nextCloudProvider, hasAnySession };
}
