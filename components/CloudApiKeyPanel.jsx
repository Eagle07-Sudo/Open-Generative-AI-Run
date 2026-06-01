'use client';

import { useEffect, useRef, useId, useLayoutEffect } from 'react';
import ThemeSelect from './ThemeSelect';
import { keyConfiguredHint } from './cloudSession';
import { loadPreferences } from '@/src/lib/preferences.js';
import {
  APP_TITLE,
  SETTINGS_TITLE,
  SETTINGS_SUBTITLE,
  PROVIDER_COPY,
  ENTRY_CTA,
  SETTINGS_SAVE_CTA,
  ROUTING_SECTION_TITLE,
  ROUTING_ENTRY_NOTE,
  ROUTING_FALLBACK_LABEL,
  REMOVE_KEY_LABEL,
  CLOSE_LABEL,
  INPUT_CLASSNAME,
  PRIMARY_BUTTON_CLASSNAME,
  SECONDARY_BUTTON_CLASSNAME,
} from './cloudApiKeyCopy.js';
import {
  ROUTING_MODE_OPTIONS,
  ROUTING_PRIVACY_NOTE,
} from './cloudRoutingStore.js';

const KEY_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="group-hover:scale-110 transition-transform">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L12 17.25l-4.5-4.5L15.5 7.5z" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const linkClass = 'text-primary hover:text-primary-hover transition-colors';

function EntrySubtitle({ provider }) {
  const copy = PROVIDER_COPY[provider === 'runware' ? 'runware' : 'muapi'];
  if (provider === 'runware') {
    return (
      <>
        Enter your{' '}
        <a href={copy.footerHref} target="_blank" rel="noreferrer" className={linkClass}>
          Runware
        </a>{' '}
        API key to start.
      </>
    );
  }
  return (
    <>
      Enter your{' '}
      <a href={copy.footerHref} target="_blank" rel="noreferrer" className={linkClass}>
        Muapi.ai
      </a>{' '}
      API key to start.
    </>
  );
}

/**
 * Shared cloud API key card — entry (full-screen) or settings (overlay).
 * Settings overlay: z-[200]. Entry: full viewport.
 *
 * @param {'entry'|'settings'} variant
 * @param {boolean} [overlay]
 * @param {() => void} [onClose] — settings only; enables Escape + focus trap
 */
export default function CloudApiKeyPanel({
  variant = 'entry',
  overlay = false,
  onClose,
  title,
  subtitle,
  // entry
  entryProvider,
  onEntryProviderChange,
  entryKey,
  onEntryKeyChange,
  entryError,
  onEntrySubmit,
  // settings
  settingsProvider,
  onSettingsProviderChange,
  settingsMuapiKey,
  onSettingsMuapiKeyChange,
  settingsRunwareKey,
  onSettingsRunwareKeyChange,
  settingsError,
  storedMuapiKey,
  storedRunwareKey,
  onSettingsSave,
  onRemoveKey,
  routingMode = 'runware-first',
  onRoutingModeChange,
  allowMuapiFallback = true,
  onAllowMuapiFallbackChange,
  routingV2Enabled = true,
  perStudioRouting = {},
  onPerStudioRoutingChange,
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const firstFieldRef = useRef(null);
  const closeBtnRef = useRef(null);
  const reducedMotion = loadPreferences()?.general?.reducedMotion;
  const animClass = reducedMotion ? '' : 'animate-fade-in-up';

  const isSettings = variant === 'settings';
  const displayTitle = title || (isSettings ? SETTINGS_TITLE : APP_TITLE);
  const entrySubtitleNode =
    !isSettings && !subtitle ? (
      <EntrySubtitle provider={entryProvider} />
    ) : null;
  const displaySubtitle = isSettings
    ? subtitle || SETTINGS_SUBTITLE
    : subtitle || null;

  const entryCopy = PROVIDER_COPY[entryProvider === 'runware' ? 'runware' : 'muapi'];
  const settingsIsRunware = settingsProvider === 'runware';
  const settingsCopy = PROVIDER_COPY[settingsIsRunware ? 'runware' : 'muapi'];
  const settingsKeyValue = settingsIsRunware ? settingsRunwareKey : settingsMuapiKey;
  const settingsStoredKey = settingsIsRunware ? storedRunwareKey : storedMuapiKey;
  const settingsSavedHint = keyConfiguredHint(settingsStoredKey);
  const hadSavedKeyRef = useRef(Boolean(settingsSavedHint));

  const providerOptions = [
    { value: 'muapi', label: 'Muapi' },
    { value: 'runware', label: 'Runware' },
  ];

  const handleBackdropClick = (e) => {
    if (overlay && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (!overlay || !onClose) return undefined;

    const focusTarget = firstFieldRef.current || closeBtnRef.current;
    focusTarget?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), [href], select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [overlay, onClose]);

  useLayoutEffect(() => {
    if (!isSettings) return;
    const hasSaved = Boolean(settingsSavedHint);
    if (hadSavedKeyRef.current && !hasSaved) {
      firstFieldRef.current?.focus();
    }
    hadSavedKeyRef.current = hasSaved;
  }, [isSettings, settingsSavedHint]);

  const wrapperClass = overlay
    ? `fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 font-inter ${animClass}`
    : `min-h-screen bg-app-bg flex items-center justify-center px-4 font-inter`;

  const card = (
    <div
      ref={panelRef}
      role={overlay ? 'dialog' : undefined}
      aria-modal={overlay ? 'true' : undefined}
      aria-labelledby={overlay ? titleId : undefined}
      className="og-modal w-full max-w-sm backdrop-blur-xl rounded-xl p-10 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
      onClick={(e) => e.stopPropagation()}
    >
      {overlay && onClose && (
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-md text-foreground-muted hover:text-foreground hover:bg-card-bg transition-colors flex items-center justify-center"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      <div className="flex flex-col items-center text-center mb-10">
        <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center border border-primary/10 mb-6 group hover:border-primary/30 transition-colors text-primary">
          {KEY_ICON}
        </div>
        <h1 id={overlay ? titleId : undefined} className="text-xl font-bold text-foreground tracking-tight mb-2">
          {displayTitle}
        </h1>
        <p className="text-foreground-muted text-[13px] leading-relaxed px-4">
          {entrySubtitleNode || displaySubtitle}
        </p>
      </div>

      {isSettings ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSettingsSave();
          }}
          className="space-y-6"
        >
          <ThemeSelect
            label="Cloud provider (display / entry)"
            value={settingsProvider}
            options={providerOptions}
            onChange={onSettingsProviderChange}
          />

          {routingV2Enabled && (
            <fieldset className="space-y-3 border border-border-subtle rounded-lg p-4">
              <legend className="text-xs font-bold text-foreground-muted px-1">
                {ROUTING_SECTION_TITLE}
              </legend>
              <p className="text-[11px] text-foreground-muted leading-relaxed">{ROUTING_ENTRY_NOTE}</p>
              <div
                role="radiogroup"
                aria-label={ROUTING_SECTION_TITLE}
                className="space-y-2 text-left"
              >
                {ROUTING_MODE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-[13px] text-foreground-secondary cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="routingMode"
                      value={opt.value}
                      checked={routingMode === opt.value}
                      onChange={() => onRoutingModeChange?.(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              <label className="flex items-start gap-2 text-[12px] text-foreground-muted cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={allowMuapiFallback}
                  onChange={(e) => onAllowMuapiFallbackChange?.(e.target.checked)}
                />
                {ROUTING_FALLBACK_LABEL}
              </label>
              <p className="text-[10px] text-foreground-muted">{ROUTING_PRIVACY_NOTE}</p>
              <div className="space-y-2 pt-2 border-t border-border-subtle text-left">
                <p className="text-[11px] font-bold text-foreground-muted">Per studio (optional)</p>
                {[
                  { id: 'image', label: 'Image' },
                  { id: 'video', label: 'Video' },
                  { id: 'audio', label: 'Audio' },
                  { id: 'agents', label: 'Agents (Muapi only)' },
                  { id: 'workflows', label: 'Workflows (Muapi only)' },
                ].map(({ id, label }) => (
                  <label key={id} className="flex items-center justify-between gap-2 text-[12px]">
                    <span className="text-foreground-secondary">{label}</span>
                    <select
                      className="og-modal-input rounded px-2 py-1 text-[12px] min-w-[7rem]"
                      value={perStudioRouting[id] || 'auto'}
                      disabled={id === 'agents' || id === 'workflows'}
                      onChange={(e) =>
                        onPerStudioRoutingChange?.({ ...perStudioRouting, [id]: e.target.value })
                      }
                    >
                      <option value="auto">Auto</option>
                      <option value="runware">Runware</option>
                      <option value="muapi">Muapi</option>
                    </select>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground-muted ml-1">
              Muapi API key
            </label>
            {storedMuapiKey && (
              <p className="text-[11px] text-foreground-muted font-mono ml-1">
                Saved: {keyConfiguredHint(storedMuapiKey)}
              </p>
            )}
            <input
              type="password"
              value={settingsMuapiKey}
              onChange={(e) => onSettingsMuapiKeyChange(e.target.value)}
              placeholder={storedMuapiKey ? 'Paste to update Muapi key' : 'Paste Muapi key'}
              className={INPUT_CLASSNAME}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground-muted ml-1">
              Runware API key
            </label>
            {storedRunwareKey && (
              <p className="text-[11px] text-foreground-muted font-mono ml-1">
                Saved: {keyConfiguredHint(storedRunwareKey)}
              </p>
            )}
            <input
              ref={firstFieldRef}
              type="password"
              value={settingsRunwareKey}
              onChange={(e) => onSettingsRunwareKeyChange(e.target.value)}
              placeholder={storedRunwareKey ? 'Paste to update Runware key' : 'Paste Runware key'}
              className={INPUT_CLASSNAME}
              autoComplete="off"
            />
          </div>

          {onRemoveKey && (
            <button type="button" onClick={onRemoveKey} className={`${SECONDARY_BUTTON_CLASSNAME} w-full`}>
              {REMOVE_KEY_LABEL} ({settingsCopy.label})
            </button>
          )}

          {settingsError && (
            <p className="mt-2 text-red-500/80 text-[11px] font-medium ml-1" role="alert">
              {settingsError}
            </p>
          )}

          <button type="submit" className={PRIMARY_BUTTON_CLASSNAME}>
            {SETTINGS_SAVE_CTA}
          </button>

          <button type="button" onClick={onClose} className={`${SECONDARY_BUTTON_CLASSNAME} w-full`}>
            {CLOSE_LABEL}
          </button>

          <p className="text-center text-[12px] text-foreground-muted pt-2">
            Need a key?{' '}
            <a
              href={settingsCopy.footerHref}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-secondary hover:text-primary transition-colors font-medium"
            >
              {settingsCopy.footerText}
            </a>
          </p>
        </form>
      ) : (
        <form onSubmit={onEntrySubmit} className="space-y-6">
          <ThemeSelect
            label="Cloud provider"
            value={entryProvider}
            options={providerOptions}
            onChange={onEntryProviderChange}
          />

          <div className="space-y-2">
            <label className="block text-xs font-bold text-foreground-muted ml-1">
              {entryCopy.label} API key
            </label>
            <input
              ref={firstFieldRef}
              type="password"
              value={entryKey}
              onChange={(e) => onEntryKeyChange(e.target.value)}
              placeholder="Paste your key here..."
              className={INPUT_CLASSNAME}
              autoComplete="off"
              suppressHydrationWarning
            />
            {entryError && (
              <p className="mt-2 text-red-500/80 text-[11px] font-medium ml-1" role="alert">
                {entryError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className={PRIMARY_BUTTON_CLASSNAME}
            suppressHydrationWarning
          >
            {ENTRY_CTA}
          </button>

          <p className="text-center text-[12px] text-foreground-muted pt-2">
            Need a key?{' '}
            <a
              href={entryCopy.footerHref}
              target="_blank"
              rel="noreferrer"
              className="text-foreground-secondary hover:text-primary transition-colors font-medium"
            >
              {entryCopy.footerText}
            </a>
          </p>
        </form>
      )}
    </div>
  );

  return (
    <div className={wrapperClass} onClick={handleBackdropClick}>
      {card}
    </div>
  );
}
