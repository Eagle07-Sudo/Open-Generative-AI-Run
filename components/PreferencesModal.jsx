'use client';

import { useState, useCallback, useEffect } from 'react';
import ThemeSelect from './ThemeSelect';
import PreferencesAppearancePanel from './PreferencesAppearancePanel';
import {
  THEME_MODES,
  setThemeMode,
  resetThemeVariant,
  loadPreferences,
  resolveEffectiveTheme,
} from '@/src/lib/preferences.js';

export default function PreferencesModal({
  open,
  onClose,
  draftPrefs,
  prefsTab,
  setPrefsTab,
  onDraftChange,
  onDraftReset,
  onLocaleChange,
}) {
  const [editVariant, setEditVariant] = useState('dark');

  useEffect(() => {
    if (!open) return;
    setEditVariant(resolveEffectiveTheme(loadPreferences()));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onOg = () => {
      const prefs = loadPreferences();
      if (prefs.themeMode === 'system') {
        setEditVariant(resolveEffectiveTheme(prefs));
      }
    };
    window.addEventListener('og-theme-change', onOg);
    return () => window.removeEventListener('og-theme-change', onOg);
  }, [open, draftPrefs?.themeMode]);

  const handleThemeMode = useCallback(
    (mode) => {
      setThemeMode(mode);
      const prefs = loadPreferences();
      const eff = mode === 'system' ? resolveEffectiveTheme(prefs) : mode;
      setEditVariant(eff);
      onDraftChange({ themeMode: mode });
    },
    [onDraftChange]
  );

  if (!open || !draftPrefs) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up p-4">
      <div className="og-modal rounded-xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 pb-0 flex-shrink-0">
          <h2 className="text-foreground font-bold text-lg mb-2">Preferences</h2>
          <p className="text-foreground-muted text-[13px] mb-4">
            Appearance and accessibility — stored only in this browser.
          </p>
          <div className="flex gap-1 border-b border-border-subtle pb-0 overflow-x-auto">
            {[
              { id: 'theme', label: 'Theme' },
              { id: 'general', label: 'General' },
              { id: 'accessibility', label: 'Accessibility' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPrefsTab(tab.id)}
                className={`px-3 py-2 text-xs font-bold rounded-t-md whitespace-nowrap transition-colors ${
                  prefsTab === tab.id ? 'og-modal-tab-active' : 'og-modal-tab-inactive'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {prefsTab === 'theme' && (
            <div className="space-y-4">
              <ThemeSelect
                label="Theme"
                value={draftPrefs.themeMode || 'dark'}
                options={THEME_MODES.map((m) => ({
                  value: m,
                  label: m.charAt(0).toUpperCase() + m.slice(1),
                }))}
                onChange={handleThemeMode}
              />
              <p className="text-[11px] text-foreground-muted">
                Follow system appearance when System is selected.
              </p>

              <div>
                <p className="text-xs font-bold text-foreground-muted mb-2 uppercase tracking-wide">
                  Customize — editing {editVariant} appearance
                </p>
                <div className="flex gap-1 p-1 rounded-lg border border-border-subtle bg-card-bg">
                  {['dark', 'light'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setEditVariant(v)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors ${
                        editVariant === v ? 'og-modal-segment-active' : 'og-modal-segment-inactive'
                      }`}
                    >
                      {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <PreferencesAppearancePanel
                variant={editVariant}
                draftPrefs={draftPrefs}
                onChange={onDraftChange}
                onResetVariant={() => {
                  const next = resetThemeVariant(editVariant);
                  onDraftReset(next);
                }}
              />
            </div>
          )}

          {prefsTab === 'general' && (
            <div className="space-y-4">
              <p className="text-[12px] text-foreground-muted leading-relaxed">
                Language is saved for Electron and future shell translations. The web studio header stays in English for now.
              </p>
              <ThemeSelect
                label="Language"
                value={draftPrefs.general?.locale || 'en'}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'zh', label: '中文' },
                ]}
                onChange={onLocaleChange}
              />
              <div>
                <label className="block text-xs font-bold text-foreground-muted mb-2">UI scale</label>
                <input
                  type="range"
                  min="0.9"
                  max="1.15"
                  step="0.05"
                  value={draftPrefs.general?.uiScale ?? 1}
                  onChange={(e) =>
                    onDraftChange({ general: { ...draftPrefs.general, uiScale: parseFloat(e.target.value) } })
                  }
                  className="w-full"
                />
                <p className="text-[11px] text-foreground-muted mt-1">
                  {Number(draftPrefs.general?.uiScale ?? 1).toFixed(2)}×
                </p>
              </div>
            </div>
          )}

          {prefsTab === 'accessibility' && (
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!draftPrefs.general?.reducedMotion}
                  onChange={(e) =>
                    onDraftChange({ general: { ...draftPrefs.general, reducedMotion: e.target.checked } })
                  }
                  className="rounded border-border-subtle"
                />
                <span className="text-sm text-foreground">Reduce motion</span>
              </label>
              <p className="text-[11px] text-foreground-muted">Minimizes animations across the interface.</p>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 flex-shrink-0 border-t border-border-subtle">
          <button type="button" onClick={onClose} className="w-full h-10 rounded-md og-modal-btn-ghost text-xs font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
