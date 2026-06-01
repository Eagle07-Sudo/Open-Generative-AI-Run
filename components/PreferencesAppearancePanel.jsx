'use client';

import {
  getAppearanceFieldGroups,
  DEFAULT_THEME_DARK,
  DEFAULT_THEME_LIGHT,
  getThemeDraftFlat,
  getPreviewCssVars,
  getContrastWarning,
  resolveEffectiveTheme,
} from '@/src/lib/preferences.js';

const FIELD_LABELS = {
  colorPrimary: 'Primary',
  colorPrimaryHover: 'Primary hover',
  colorAccent: 'Accent',
  colorAccentHover: 'Accent hover',
  colorDanger: 'Danger',
  bgApp: 'App background',
  bgPanel: 'Panel background',
  bgCard: 'Card background',
  bgGlass: 'Glass background',
  textPrimary: 'Text primary',
  textSecondary: 'Text secondary',
  textMuted: 'Text muted',
  borderColor: 'Border',
  borderLight: 'Border light',
  borderRadiusSm: 'Radius SM',
  borderRadiusMd: 'Radius MD',
  borderRadiusLg: 'Radius LG',
  borderRadiusXl: 'Radius XL',
  shadowGlow: 'Shadow glow',
  shadowGlowAccent: 'Shadow glow accent',
  backdropBlur: 'Backdrop blur',
  fontFamily: 'Font family',
};

const GROUP_LABELS = {
  brand: 'Brand colors',
  backgrounds: 'Backgrounds',
  text: 'Text',
  borders: 'Borders',
  radius: 'Border radius',
  effects: 'Effects',
};

function isColorField(key) {
  return [
    'colorPrimary', 'colorPrimaryHover', 'colorAccent', 'colorAccentHover', 'colorDanger',
    'bgApp', 'bgPanel', 'bgCard', 'bgGlass', 'textPrimary', 'textSecondary', 'textMuted',
    'borderColor', 'borderLight',
  ].includes(key);
}

export default function PreferencesAppearancePanel({
  variant,
  draftPrefs,
  onChange,
  onResetVariant,
}) {
  const groups = getAppearanceFieldGroups();
  const draft = getThemeDraftFlat(draftPrefs, variant);
  const defaults = variant === 'light' ? DEFAULT_THEME_LIGHT : DEFAULT_THEME_DARK;
  const contrastWarn = getContrastWarning(draft);
  const previewTokens = draft;
  const previewStyle = getPreviewCssVars(previewTokens);
  const appEffective = resolveEffectiveTheme(draftPrefs);
  const mismatch =
    appEffective !== variant
      ? `Editing ${variant} appearance · App is using ${appEffective}`
      : null;

  const handleToken = (key, value) => {
    onChange({
      themes: {
        ...draftPrefs.themes,
        [variant]: { ...draftPrefs.themes[variant], [key]: value },
      },
    });
  };

  return (
    <div className="space-y-4">
      {mismatch && (
        <p className="text-[11px] text-foreground-muted og-modal-muted border border-border-subtle rounded-md px-3 py-2">
          {mismatch}
        </p>
      )}

      {contrastWarn && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400/90 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
          {contrastWarn}
        </p>
      )}

      <div
        data-theme-preview={variant}
        className="rounded-lg p-3 space-y-2"
        style={previewStyle}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide og-preview-label">
          Preview: {variant.charAt(0).toUpperCase() + variant.slice(1)}
        </p>
        <div className="flex items-center gap-2">
          <button type="button" className="px-3 py-1.5 rounded-md text-xs font-bold og-preview-primary">
            Primary
          </button>
          <div className="flex-1 rounded-md p-2 text-xs og-preview-card">
            Card sample
          </div>
        </div>
        <div className="h-1 rounded-full og-preview-gradient" />
      </div>

      {groups.map((group) => (
        <details key={group.id} className="group border border-border-subtle rounded-lg" open={group.id === 'brand'}>
          <summary className="cursor-pointer px-3 py-2 text-xs font-bold text-foreground-muted hover:text-foreground">
            {GROUP_LABELS[group.id] || group.id}
          </summary>
          <div className="px-3 pb-3 space-y-2">
            {group.keys.map((key) => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-[11px] text-foreground-muted w-28 flex-shrink-0 truncate" title={key}>
                  {FIELD_LABELS[key] || key}
                </label>
                {isColorField(key) ? (
                  <input
                    type="color"
                    value={
                      String(draft[key] || '').startsWith('#') && String(draft[key]).length >= 7
                        ? draft[key].slice(0, 7)
                        : defaults[key]?.slice?.(0, 7) || '#000000'
                    }
                    onChange={(e) => handleToken(key, e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border border-border-subtle bg-transparent"
                  />
                ) : null}
                <input
                  type="text"
                  value={draft[key] ?? ''}
                  onChange={(e) => handleToken(key, e.target.value)}
                  className="flex-1 min-w-0 og-modal-input rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>
            ))}
          </div>
        </details>
      ))}

      <button
        type="button"
        onClick={onResetVariant}
        className="w-full h-9 rounded-md og-modal-btn-ghost text-xs font-semibold"
      >
        Reset {variant} theme to defaults
      </button>
    </div>
  );
}
