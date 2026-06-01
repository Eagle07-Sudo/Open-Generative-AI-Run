/** Guard against oversized studio localStorage blobs (main-thread freeze on getItem/parse). */

export const STUDIO_PERSIST_SCHEMA = 'og_studio_persist_v2';

export const STUDIO_PERSIST_KEYS = [
  'hg_image_studio_persistent',
  'hg_video_studio_persistent',
  'hg_marketing_studio_persistent',
  'hg_lipsync_studio_persistent',
  'hg_audio_studio_persistent',
  'hg_clipping_studio_persistent',
  'hg_cinema_studio_persistent',
  'hg_vibe_motion_studio_persistent',
];

/** Above this, drop the key before studios mount (sync getItem can freeze the tab). */
export const STUDIO_PERSIST_MAX_BYTES = 200_000;

/**
 * One-time migration: drop legacy blobs without reading them (avoids getItem freeze).
 * @returns {boolean} true if keys were cleared
 */
export function migrateStudioPersistSchema() {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem('og_studio_persist_schema') === STUDIO_PERSIST_SCHEMA) {
    return false;
  }
  for (const key of STUDIO_PERSIST_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  try {
    localStorage.setItem('og_studio_persist_schema', STUDIO_PERSIST_SCHEMA);
  } catch {
    /* ignore */
  }
  return true;
}

/**
 * Remove studio persist entries that exceed the size cap.
 * @returns {{ removed: string[], sizes: Record<string, number> }}
 */
export function pruneOversizedStudioPersist() {
  const removed = [];
  const sizes = {};
  if (typeof localStorage === 'undefined') return { removed, sizes };
  for (const key of STUDIO_PERSIST_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      sizes[key] = raw.length;
      if (raw.length > STUDIO_PERSIST_MAX_BYTES) {
        localStorage.removeItem(key);
        removed.push(key);
      }
    } catch {
      try {
        localStorage.removeItem(key);
        removed.push(key);
      } catch {
        /* ignore */
      }
    }
  }
  return { removed, sizes };
}
