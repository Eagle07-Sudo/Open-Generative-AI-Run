'use client';

import {
  BANNER_OPEN_SETTINGS,
  bannerMuapiRequiredMessage,
  bannerRunwareRequiredMessage,
  bannerUnsupportedMessage,
} from './cloudApiKeyCopy.js';

/**
 * Contextual warning when the active studio tab lacks its required API key.
 *
 * @param {'muapi' | 'runware'} requiredProvider
 * @param {string} studioLabel
 * @param {() => void} onOpenSettings
 */
export default function StudioProviderBanner({
  requiredProvider,
  studioLabel,
  onOpenSettings,
  reason,
}) {
  const message =
    reason === 'unsupported'
      ? bannerUnsupportedMessage(studioLabel)
      : requiredProvider === 'runware'
        ? bannerRunwareRequiredMessage(studioLabel)
        : bannerMuapiRequiredMessage(studioLabel);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-4 mt-3 mb-1 px-4 py-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-100/90 text-[13px] leading-relaxed flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <p>{message}</p>
      {onOpenSettings && (
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open API Settings"
          className="flex-shrink-0 px-3 py-1.5 rounded-md bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 text-xs font-semibold border border-amber-500/40 transition-colors"
        >
          {BANNER_OPEN_SETTINGS}
        </button>
      )}
    </div>
  );
}
