/**
 * Generates public/preferences-boot.js from src/lib/preferences.js map (single source).
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const prefsPath = join(root, 'src/lib/preferences.js');
const outPath = join(root, 'public/preferences-boot.js');

const src = readFileSync(prefsPath, 'utf8');

function extractObject(name) {
  const re = new RegExp(`export const ${name} = \\{([\\s\\S]*?)\\n\\};`, 'm');
  const m = src.match(re);
  if (!m) throw new Error(`Could not find ${name} in preferences.js`);
  return `{${m[1]}\n}`;
}

function extractMap() {
  const re = /export const PREFERENCE_CSS_MAP = \{([\s\S]*?)\n\};/m;
  const m = src.match(re);
  if (!m) throw new Error('Could not find PREFERENCE_CSS_MAP');
  const body = m[1].trim();
  const entries = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'));
  return entries;
}

const darkObj = extractObject('DEFAULT_THEME_DARK');
const lightObj = extractObject('DEFAULT_THEME_LIGHT');
const mapLines = extractMap();

const boot = `/**
 * AUTO-GENERATED — do not edit. Run: node scripts/gen-preferences-boot.mjs
 */
(function () {
  var STORAGE = 'og_preferences';
  var MAP = {
${mapLines.map((l) => '    ' + l).join('\n')}
  };
  var DEFAULT_DARK = ${darkObj};
  var DEFAULT_LIGHT = ${lightObj};

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
`;

writeFileSync(outPath, boot, 'utf8');
console.log('Wrote', outPath);
