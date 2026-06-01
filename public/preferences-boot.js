/**
 * AUTO-GENERATED — do not edit. Run: node scripts/gen-preferences-boot.mjs
 */
(function () {
  var STORAGE = 'og_preferences';
  var MAP = {
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
  var DEFAULT_DARK = {
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
  var DEFAULT_LIGHT = {
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

  function mergeTokens(base, overrides) {
    var out = {};
    for (var k in base) if (Object.prototype.hasOwnProperty.call(base, k)) out[k] = base[k];
    if (!overrides) return out;
    for (var k in overrides) if (overrides[k] != null) out[k] = overrides[k];
    return out;
  }

  function systemDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function effectiveTheme(prefs) {
    var mode = prefs.themeMode || 'dark';
    if (mode === 'system') return systemDark() ? 'dark' : 'light';
    if (mode === 'light') return 'light';
    return 'dark';
  }

  function migrateV1(parsed) {
    var dark = {};
    for (var k in MAP) {
      if (parsed[k] != null) dark[k] = parsed[k];
    }
    return {
      preferencesVersion: 2,
      themeMode: parsed.colorScheme === 'light' ? 'light' : 'dark',
      themes: { dark: dark, light: {} },
      general: {
        locale: parsed.locale === 'zh' ? 'zh' : 'en',
        uiScale: typeof parsed.uiScale === 'number' ? parsed.uiScale : 1,
        reducedMotion: !!parsed.reducedMotion,
      },
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE);
      if (!raw) return { preferencesVersion: 2, themeMode: 'dark', themes: { dark: {}, light: {} }, general: {} };
      var p = JSON.parse(raw);
      if (p.preferencesVersion >= 2 && p.themes) return p;
      return migrateV1(p);
    } catch (e) {
      return { preferencesVersion: 2, themeMode: 'dark', themes: { dark: {}, light: {} }, general: {} };
    }
  }

  var prefs = load();
  var eff = effectiveTheme(prefs);
  var base = eff === 'light' ? DEFAULT_LIGHT : DEFAULT_DARK;
  var tokens = mergeTokens(base, prefs.themes && prefs.themes[eff] ? prefs.themes[eff] : {});
  var root = document.documentElement;
  for (var key in MAP) {
    if (tokens[key] != null) root.style.setProperty(MAP[key], tokens[key]);
  }
  root.style.colorScheme = eff;
  if (eff === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
  var scale = (prefs.general && prefs.general.uiScale) || 1;
  root.style.setProperty('--ui-scale', String(scale));
  root.style.fontSize = 'calc(16px * ' + scale + ')';
})();
