import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PREFERENCES_VERSION,
  DEFAULT_THEME_DARK,
  DEFAULT_THEME_LIGHT,
  PREFERENCE_CSS_MAP,
  validatePreferenceValue,
  validateTokenValue,
  getAppearanceFieldGroups,
  migrateLegacyLang,
  migrateStoredPreferences,
  createDefaultPreferencesV2,
  resolveEffectiveTheme,
  resolveThemeTokens,
  getContrastRatio,
  getContrastWarning,
  getPreviewCssVars,
  applyPreferences,
} from '../src/lib/preferences.js';

describe('preferences v2 schema', () => {
  it('createDefaultPreferencesV2 has version 2 and theme variants', () => {
    const prefs = createDefaultPreferencesV2();
    assert.equal(prefs.preferencesVersion, PREFERENCES_VERSION);
    assert.equal(prefs.themeMode, 'dark');
    assert.ok(prefs.themes.dark);
    assert.ok(prefs.themes.light);
    assert.equal(prefs.general.locale, 'en');
  });

  it('maps every appearance key to CSS var', () => {
    const groups = getAppearanceFieldGroups();
    const keys = groups.flatMap((g) => g.keys);
    for (const key of keys) {
      assert.ok(PREFERENCE_CSS_MAP[key], `missing map for ${key}`);
    }
  });
});

describe('migrateStoredPreferences', () => {
  it('migrates v1 flat to v2', () => {
    const v1 = {
      preferencesVersion: 1,
      colorPrimary: '#ff0000',
      locale: 'zh',
      uiScale: 1.1,
      reducedMotion: true,
    };
    const v2 = migrateStoredPreferences(v1);
    assert.equal(v2.preferencesVersion, 2);
    assert.equal(v2.themes.dark.colorPrimary, '#ff0000');
    assert.equal(v2.general.locale, 'zh');
    assert.equal(v2.general.uiScale, 1.1);
    assert.equal(v2.general.reducedMotion, true);
  });

  it('migration is idempotent for v2', () => {
    const base = createDefaultPreferencesV2();
    base.themes.dark.colorPrimary = '#abcdef';
    const again = migrateStoredPreferences(base);
    assert.equal(again.themes.dark.colorPrimary, '#abcdef');
    assert.equal(again.preferencesVersion, 2);
  });
});

describe('resolveEffectiveTheme', () => {
  it('returns light/dark for explicit modes', () => {
    assert.equal(resolveEffectiveTheme({ themeMode: 'light' }), 'light');
    assert.equal(resolveEffectiveTheme({ themeMode: 'dark' }), 'dark');
  });

  it('follows system preference when themeMode is system', () => {
    const original = globalThis.window;
    globalThis.window = {
      matchMedia: () => ({ matches: false }),
    };
    try {
      assert.equal(resolveEffectiveTheme({ themeMode: 'system' }), 'light');
    } finally {
      globalThis.window = original;
    }
  });
});

describe('resolveThemeTokens', () => {
  it('merges overrides on defaults', () => {
    const prefs = createDefaultPreferencesV2();
    prefs.themes.light.bgApp = '#eeeeee';
    const tokens = resolveThemeTokens(prefs, 'light');
    assert.equal(tokens.bgApp, '#eeeeee');
    assert.equal(tokens.colorPrimary, DEFAULT_THEME_LIGHT.colorPrimary);
  });
});

describe('validateTokenValue', () => {
  it('accepts hex colors', () => {
    assert.equal(validateTokenValue('colorPrimary', '#22d3ee'), true);
  });

  it('rejects empty color', () => {
    assert.equal(validateTokenValue('colorPrimary', ''), false);
  });
});

describe('validatePreferenceValue', () => {
  it('accepts locale en/zh only', () => {
    assert.equal(validatePreferenceValue('locale', 'zh'), true);
    assert.equal(validatePreferenceValue('locale', 'fr'), false);
  });

  it('accepts themeMode', () => {
    assert.equal(validatePreferenceValue('themeMode', 'system'), true);
    assert.equal(validatePreferenceValue('themeMode', 'invalid'), false);
  });
});

describe('contrast helpers', () => {
  it('computes contrast ratio for hex pairs', () => {
    const ratio = getContrastRatio('#ffffff', '#000000');
    assert.ok(ratio > 20);
  });

  it('warns on low contrast text/background', () => {
    const warn = getContrastWarning({ textPrimary: '#cccccc', bgApp: '#dddddd' });
    assert.ok(warn && warn.includes('Low contrast'));
  });

  it('no warning for default dark preset', () => {
    const warn = getContrastWarning(DEFAULT_THEME_DARK);
    assert.equal(warn, null);
  });
});

describe('getPreviewCssVars', () => {
  it('returns seven preview CSS variables', () => {
    const vars = getPreviewCssVars(DEFAULT_THEME_LIGHT);
    assert.equal(vars['--preview-bg-panel'], DEFAULT_THEME_LIGHT.bgPanel);
    assert.equal(vars['--preview-color-primary'], DEFAULT_THEME_LIGHT.colorPrimary);
    assert.equal(Object.keys(vars).length, 7);
  });
});

describe('applyPreferences scrollbar', () => {
  it('sets scrollbar thumb for dark and light', () => {
    const root = { style: { setProperty: () => {} }, classList: { toggle: () => {}, add: () => {}, remove: () => {} } };
    const props = [];
    root.style.setProperty = (k, v) => props.push([k, v]);
    globalThis.window = { matchMedia: () => ({ matches: false }) };
    applyPreferences({ ...createDefaultPreferencesV2(), themeMode: 'dark' }, root);
    assert.ok(props.some(([k, v]) => k === '--scrollbar-thumb' && v.includes('255')));
    props.length = 0;
    applyPreferences({ ...createDefaultPreferencesV2(), themeMode: 'light' }, root);
    assert.ok(props.some(([k, v]) => k === '--scrollbar-thumb' && v.includes('15')));
  });
});

describe('migrateLegacyLang', () => {
  it('migrates og_lang into general.locale', () => {
    const storage = new Map([['og_lang', 'zh']]);
    const original = globalThis.localStorage;
    globalThis.localStorage = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
    };
  globalThis.window = {};
    try {
      const prefs = createDefaultPreferencesV2();
      const migrated = migrateLegacyLang(prefs);
      assert.equal(migrated.general.locale, 'zh');
    } finally {
      globalThis.localStorage = original;
    }
  });
});
