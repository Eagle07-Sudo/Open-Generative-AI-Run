/**
 * Theme & UI preferences — single source of truth (og_preferences v2).
 * Boot script: scripts/gen-preferences-boot.mjs → public/preferences-boot.js
 */

export const PREFERENCES_STORAGE = 'og_preferences';
export const PREFERENCES_VERSION = 2;
export const LANG_KEY_LEGACY = 'og_lang';
export const THEME_MODES = ['system', 'light', 'dark'];
export const THEME_VARIANTS = ['dark', 'light'];

export const DEFAULT_THEME_DARK = {
  colorPrimary: '#22d3ee',
  colorPrimaryHover: '#06b6d4',
  colorAccent: '#a855f7',
  colorAccentHover: '#9333ea',
  colorDanger: '#ef4444',
  bgApp: '#050505',
  bgPanel: '#0a0a0a',
  bgCard: '#141414',
  bgGlass: 'rgba(10, 10, 10, 0.8)',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',
  borderColor: '#27272a',
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderRadiusSm: '6px',
  borderRadiusMd: '10px',
  borderRadiusLg: '16px',
  borderRadiusXl: '24px',
  shadowGlow: '0 0 20px rgba(176, 251, 93, 0.4)',
  shadowGlowAccent: '0 0 20px rgba(168, 85, 247, 0.4)',
  backdropBlur: 'blur(20px)',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

export const DEFAULT_THEME_LIGHT = {
  colorPrimary: '#0891b2',
  colorPrimaryHover: '#0e7490',
  colorAccent: '#7c3aed',
  colorAccentHover: '#6d28d9',
  colorDanger: '#dc2626',
  bgApp: '#f8fafc',
  bgPanel: '#ffffff',
  bgCard: '#f1f5f9',
  bgGlass: 'rgba(255, 255, 255, 0.85)',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  borderColor: '#e2e8f0',
  borderLight: 'rgba(15, 23, 42, 0.12)',
  borderRadiusSm: '6px',
  borderRadiusMd: '10px',
  borderRadiusLg: '16px',
  borderRadiusXl: '24px',
  shadowGlow: '0 0 20px rgba(8, 145, 178, 0.25)',
  shadowGlowAccent: '0 0 20px rgba(124, 58, 237, 0.2)',
  backdropBlur: 'blur(20px)',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

export const PREFERENCE_CSS_MAP = {
  colorPrimary: '--color-primary',
  colorPrimaryHover: '--color-primary-hover',
  colorAccent: '--color-accent',
  colorAccentHover: '--color-accent-hover',
  colorDanger: '--color-danger',
  bgApp: '--bg-app',
  bgPanel: '--bg-panel',
  bgCard: '--bg-card',
  bgGlass: '--bg-glass',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  borderColor: '--border-color',
  borderLight: '--border-light',
  borderRadiusSm: '--border-radius-sm',
  borderRadiusMd: '--border-radius-md',
  borderRadiusLg: '--border-radius-lg',
  borderRadiusXl: '--border-radius-xl',
  shadowGlow: '--shadow-glow',
  shadowGlowAccent: '--shadow-glow-accent',
  backdropBlur: '--backdrop-blur',
  fontFamily: '--font-family',
};

export const TOKEN_KEYS = Object.keys(PREFERENCE_CSS_MAP);

const COLOR_KEYS = new Set([
  'colorPrimary', 'colorPrimaryHover', 'colorAccent', 'colorAccentHover', 'colorDanger',
  'bgApp', 'bgPanel', 'bgCard', 'bgGlass', 'textPrimary', 'textSecondary', 'textMuted',
  'borderColor', 'borderLight',
]);
const RADIUS_KEYS = new Set(['borderRadiusSm', 'borderRadiusMd', 'borderRadiusLg', 'borderRadiusXl']);
const EFFECT_STRING_KEYS = new Set(['shadowGlow', 'shadowGlowAccent', 'backdropBlur', 'fontFamily']);

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGBA_RE = /^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+\s*(,\s*[\d.]+\s*)?\)$/;
const PX_RE = /^\d+(\.\d+)?px$/;

/** @deprecated v1 flat — use createDefaultPreferencesV2 */
export const DEFAULT_PREFERENCES = {
  ...DEFAULT_THEME_DARK,
  preferencesVersion: 1,
  locale: 'en',
  uiScale: 1,
  reducedMotion: false,
  colorScheme: 'dark',
};

export function createDefaultPreferencesV2() {
  return {
    preferencesVersion: PREFERENCES_VERSION,
    themeMode: 'dark',
    themes: {
      dark: { ...DEFAULT_THEME_DARK },
      light: { ...DEFAULT_THEME_LIGHT },
    },
    general: {
      locale: 'en',
      uiScale: 1,
      reducedMotion: false,
    },
  };
}

export function getAppearanceFieldGroups() {
  return [
    { id: 'brand', labelKey: 'settings.appearance.brand', keys: ['colorPrimary', 'colorPrimaryHover', 'colorAccent', 'colorAccentHover', 'colorDanger'] },
    { id: 'backgrounds', labelKey: 'settings.appearance.backgrounds', keys: ['bgApp', 'bgPanel', 'bgCard', 'bgGlass'] },
    { id: 'text', labelKey: 'settings.appearance.text', keys: ['textPrimary', 'textSecondary', 'textMuted'] },
    { id: 'borders', labelKey: 'settings.appearance.borders', keys: ['borderColor', 'borderLight'] },
    { id: 'radius', labelKey: 'settings.appearance.radius', keys: ['borderRadiusSm', 'borderRadiusMd', 'borderRadiusLg', 'borderRadiusXl'] },
    { id: 'effects', labelKey: 'settings.appearance.effects', keys: ['shadowGlow', 'shadowGlowAccent', 'backdropBlur', 'fontFamily'] },
  ];
}

export function validateTokenValue(key, value) {
  if (value == null || String(value).trim() === '') return false;
  const v = String(value).trim();
  if (COLOR_KEYS.has(key)) return HEX_RE.test(v) || RGBA_RE.test(v);
  if (RADIUS_KEYS.has(key)) return PX_RE.test(v);
  if (EFFECT_STRING_KEYS.has(key)) return v.length > 0 && v.length < 512;
  return false;
}

/** @deprecated alias */
export function validatePreferenceValue(key, value) {
  if (key === 'locale') return value === 'en' || value === 'zh';
  if (key === 'uiScale') return typeof value === 'number' && value >= 0.85 && value <= 1.25;
  if (key === 'reducedMotion') return typeof value === 'boolean';
  if (key === 'themeMode') return THEME_MODES.includes(value);
  if (key === 'colorScheme') return value === 'dark' || value === 'light';
  return validateTokenValue(key, value);
}

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function getContrastRatio(fgHex, bgHex) {
  if (!HEX_RE.test(fgHex) || !HEX_RE.test(bgHex)) return null;
  const lum = (hex) => {
    const { r, g, b } = parseHex(hex);
    const srgb = [r, g, b].map((c) => {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };
  const L1 = lum(fgHex);
  const L2 = lum(bgHex);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getContrastWarning(tokens) {
  if (!tokens?.textPrimary || !tokens?.bgApp) return null;
  const ratio = getContrastRatio(tokens.textPrimary, tokens.bgApp);
  if (ratio == null || ratio >= 4.5) return null;
  return `Low contrast (${ratio.toFixed(1)}:1). Text may be hard to read (WCAG AA needs 4.5:1).`;
}

function mergeThemeTokens(base, overrides) {
  const out = { ...base };
  if (!overrides || typeof overrides !== 'object') return out;
  for (const key of TOKEN_KEYS) {
    if (overrides[key] !== undefined && validateTokenValue(key, overrides[key])) {
      out[key] = overrides[key];
    }
  }
  return out;
}

function normalizeThemeMode(mode) {
  return THEME_MODES.includes(mode) ? mode : 'dark';
}

export function getSystemPrefersDark() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveEffectiveTheme(prefs) {
  const mode = normalizeThemeMode(prefs?.themeMode);
  if (mode === 'system') return getSystemPrefersDark() ? 'dark' : 'light';
  return mode;
}

export function resolveThemeTokens(prefs, effective = resolveEffectiveTheme(prefs)) {
  const base = effective === 'light' ? DEFAULT_THEME_LIGHT : DEFAULT_THEME_DARK;
  const overrides = prefs?.themes?.[effective] || {};
  return mergeThemeTokens(base, overrides);
}

function normalizeV2(partial) {
  const defaults = createDefaultPreferencesV2();
  const out = {
    preferencesVersion: PREFERENCES_VERSION,
    themeMode: normalizeThemeMode(partial?.themeMode ?? defaults.themeMode),
    themes: {
      dark: mergeThemeTokens(defaults.themes.dark, partial?.themes?.dark),
      light: mergeThemeTokens(defaults.themes.light, partial?.themes?.light),
    },
    general: {
      locale: partial?.general?.locale === 'zh' ? 'zh' : partial?.general?.locale === 'en' ? 'en' : defaults.general.locale,
      uiScale:
        typeof partial?.general?.uiScale === 'number' && partial.general.uiScale >= 0.85 && partial.general.uiScale <= 1.25
          ? partial.general.uiScale
          : defaults.general.uiScale,
      reducedMotion:
        typeof partial?.general?.reducedMotion === 'boolean'
          ? partial.general.reducedMotion
          : defaults.general.reducedMotion,
    },
  };
  return out;
}

function migrateV1Flat(parsed) {
  const darkOverrides = {};
  for (const key of TOKEN_KEYS) {
    if (parsed[key] !== undefined && validateTokenValue(key, parsed[key])) {
      darkOverrides[key] = parsed[key];
    }
  }
  return normalizeV2({
    themeMode: parsed.colorScheme === 'light' ? 'light' : 'dark',
    themes: { dark: darkOverrides, light: {} },
    general: {
      locale: parsed.locale === 'zh' ? 'zh' : 'en',
      uiScale: typeof parsed.uiScale === 'number' ? parsed.uiScale : 1,
      reducedMotion: !!parsed.reducedMotion,
    },
  });
}

export function migrateStoredPreferences(parsed) {
  if (!parsed || typeof parsed !== 'object') return createDefaultPreferencesV2();
  if (parsed.preferencesVersion >= 2 && parsed.themes) return normalizeV2(parsed);
  return migrateV1Flat(parsed);
}

export function migrateLegacyLang(prefs) {
  if (typeof window === 'undefined') return prefs;
  if (prefs.general?.locale && prefs.general.locale !== 'en') return prefs;
  const legacy = localStorage.getItem(LANG_KEY_LEGACY);
  if (legacy === 'zh' || legacy === 'en') {
    return {
      ...prefs,
      general: { ...prefs.general, locale: legacy },
    };
  }
  return prefs;
}

export function loadPreferences() {
  if (typeof window === 'undefined') return createDefaultPreferencesV2();
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE);
    if (!raw) return migrateLegacyLang(createDefaultPreferencesV2());
    const parsed = JSON.parse(raw);
    let prefs = migrateStoredPreferences(parsed);
    prefs = migrateLegacyLang(prefs);
    return prefs;
  } catch {
    return migrateLegacyLang(createDefaultPreferencesV2());
  }
}

export function savePreferences(partial) {
  if (typeof window === 'undefined') return loadPreferences();
  const current = loadPreferences();
  let next = normalizeV2(current);

  if (partial?.themeMode !== undefined) {
    next.themeMode = normalizeThemeMode(partial.themeMode);
  }
  if (partial?.themes) {
    next.themes = {
      dark: mergeThemeTokens(next.themes.dark, partial.themes.dark),
      light: mergeThemeTokens(next.themes.light, partial.themes.light),
    };
  }
  if (partial?.general) {
    next.general = { ...next.general, ...partial.general };
    if (next.general.locale !== 'en' && next.general.locale !== 'zh') next.general.locale = 'en';
  }

  // v1 flat compat during transition
  for (const key of TOKEN_KEYS) {
    if (partial?.[key] !== undefined && validateTokenValue(key, partial[key])) {
      const eff = resolveEffectiveTheme(next);
      next.themes[eff] = { ...next.themes[eff], [key]: partial[key] };
    }
  }
  if (partial?.locale) next.general.locale = partial.locale;
  if (partial?.uiScale !== undefined) next.general.uiScale = partial.uiScale;
  if (partial?.reducedMotion !== undefined) next.general.reducedMotion = partial.reducedMotion;

  next = normalizeV2(next);
  localStorage.setItem(PREFERENCES_STORAGE, JSON.stringify(next));
  if (partial?.general?.locale || partial?.locale) {
    localStorage.setItem(LANG_KEY_LEGACY, next.general.locale);
  }
  return next;
}

export function resetThemeVariant(variant) {
  const defaults = variant === 'light' ? DEFAULT_THEME_LIGHT : DEFAULT_THEME_DARK;
  const current = loadPreferences();
  const next = normalizeV2({
    ...current,
    themes: {
      ...current.themes,
      [variant]: { ...defaults },
    },
  });
  localStorage.setItem(PREFERENCES_STORAGE, JSON.stringify(next));
  applyPreferences(next);
  return next;
}

export function resetPreferences() {
  const defaults = createDefaultPreferencesV2();
  if (typeof window !== 'undefined') {
    localStorage.setItem(PREFERENCES_STORAGE, JSON.stringify(defaults));
  }
  applyPreferences(defaults);
  return defaults;
}

export function setThemeMode(mode) {
  const normalized = normalizeThemeMode(mode);
  const next = savePreferences({ themeMode: normalized });
  applyPreferences(next);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('og-theme-change', { detail: { themeMode: normalized, effective: resolveEffectiveTheme(next) } }));
  }
  return next;
}

let systemUnsubscribe = null;

export function subscribeSystemTheme(callback) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const handler = () => {
    const prefs = loadPreferences();
    if (prefs.themeMode === 'system') {
      applyPreferences(prefs);
      callback(resolveEffectiveTheme(prefs));
    }
  };
  mq.addEventListener('change', handler);
  systemUnsubscribe = () => mq.removeEventListener('change', handler);
  return systemUnsubscribe;
}

export function applyPreferences(prefs = loadPreferences(), root = typeof document !== 'undefined' ? document.documentElement : null) {
  if (!root) return prefs;

  const effective = resolveEffectiveTheme(prefs);
  const tokens = resolveThemeTokens(prefs, effective);

  for (const [key, cssVar] of Object.entries(PREFERENCE_CSS_MAP)) {
    const val = tokens[key];
    if (val != null) root.style.setProperty(cssVar, String(val));
  }

  const scale = Number(prefs.general?.uiScale) || 1;
  root.style.setProperty('--ui-scale', String(scale));
  root.style.fontSize = `calc(16px * ${scale})`;
  root.style.colorScheme = effective;
  root.classList.toggle('dark', effective === 'dark');
  root.classList.toggle('light', effective === 'light');

  root.style.setProperty(
    '--scrollbar-thumb',
    effective === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.15)'
  );
  root.style.setProperty('--scrollbar-track', 'transparent');

  const reduced = prefs.general?.reducedMotion;
  const osReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || osReduced) root.classList.add('reduce-motion');
  else root.classList.remove('reduce-motion');

  return prefs;
}

/** Flat view for appearance panel editing a variant */
export function getThemeDraftFlat(prefs, variant) {
  return { ...resolveThemeTokens(prefs, variant) };
}

const PREVIEW_CSS_MAP = {
  bgPanel: '--preview-bg-panel',
  bgCard: '--preview-bg-card',
  textPrimary: '--preview-text-primary',
  textMuted: '--preview-text-muted',
  borderLight: '--preview-border',
  colorPrimary: '--preview-color-primary',
  colorAccent: '--preview-color-accent',
};

/** CSS custom properties for isolated theme preview island */
export function getPreviewCssVars(tokens) {
  const out = {};
  for (const [key, cssVar] of Object.entries(PREVIEW_CSS_MAP)) {
    if (tokens[key] != null) out[cssVar] = String(tokens[key]);
  }
  return out;
}

export function patchThemeToken(prefs, variant, key, value) {
  if (!validateTokenValue(key, value)) return prefs;
  return {
    ...prefs,
    themes: {
      ...prefs.themes,
      [variant]: { ...prefs.themes[variant], [key]: value },
    },
  };
}
