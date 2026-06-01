import {
  getAppearanceFieldGroups,
  loadPreferences,
  savePreferences,
  applyPreferences,
  resetThemeVariant,
  setThemeMode,
  getThemeDraftFlat,
  getPreviewCssVars,
  THEME_MODES,
} from '../lib/preferences.js';
import { t } from '../lib/i18n.js';

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
  brand: 'settings.appearance.brand',
  backgrounds: 'settings.appearance.backgrounds',
  text: 'settings.appearance.text',
  borders: 'settings.appearance.borders',
  radius: 'settings.appearance.radius',
  effects: 'settings.appearance.effects',
};

let saveTimer = null;

function scheduleSave(partial) {
  const next = savePreferences(partial);
  applyPreferences(next);
}

function debouncedSave(partial) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => scheduleSave(partial), 500);
}

function applyPreviewVars(el, tokens) {
  const vars = getPreviewCssVars(tokens);
  for (const [k, v] of Object.entries(vars)) {
    el.style.setProperty(k, v);
  }
}

function buildPreviewBlock(variant) {
  const prefs = loadPreferences();
  const tokens = getThemeDraftFlat(prefs, variant);
  const wrap = document.createElement('div');
  wrap.setAttribute('data-theme-preview', variant);
  wrap.className = 'og-modal';
  wrap.style.cssText = 'padding:0.75rem;margin-bottom:0.5rem;border-radius:0.5rem;';
  applyPreviewVars(wrap, tokens);

  const label = document.createElement('p');
  label.className = 'og-preview-label';
  label.style.cssText = 'font-size:0.65rem;font-weight:700;text-transform:uppercase;margin:0 0 0.5rem;';
  label.textContent = `Preview: ${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
  wrap.appendChild(label);

  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:0.5rem;align-items:center;';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'og-preview-primary';
  btn.textContent = 'Primary';
  btn.style.cssText = 'padding:0.35rem 0.75rem;border-radius:0.35rem;font-size:0.7rem;font-weight:700;border:none;';
  const card = document.createElement('div');
  card.className = 'og-preview-card';
  card.textContent = 'Card sample';
  card.style.cssText = 'flex:1;padding:0.35rem;border-radius:0.35rem;font-size:0.65rem;border:1px solid;';
  row.appendChild(btn);
  row.appendChild(card);
  wrap.appendChild(row);

  const grad = document.createElement('div');
  grad.className = 'og-preview-gradient';
  grad.style.cssText = 'height:4px;border-radius:2px;margin-top:0.5rem;';
  wrap.appendChild(grad);

  return wrap;
}

function buildTokenEditor(variant, onRebuild) {
  const panel = document.createElement('div');
  panel.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

  panel.appendChild(buildPreviewBlock(variant));

  const updateToken = (key, value) => {
    const prefs = loadPreferences();
    const themes = {
      ...prefs.themes,
      [variant]: { ...prefs.themes[variant], [key]: value },
    };
    debouncedSave({ themes });
    onRebuild?.();
  };

  let draft = getThemeDraftFlat(loadPreferences(), variant);

  getAppearanceFieldGroups().forEach((group) => {
    const details = document.createElement('details');
    details.open = group.id === 'brand';
    const summary = document.createElement('summary');
    summary.style.cssText =
      'cursor:pointer;font-size:0.7rem;font-weight:700;color:var(--text-muted);padding:0.25rem 0;';
    summary.textContent = t(GROUP_LABELS[group.id] || group.id);
    details.appendChild(summary);

    const inner = document.createElement('div');
    inner.style.cssText = 'display:flex;flex-direction:column;gap:0.35rem;padding:0.25rem 0 0.5rem;';

    group.keys.forEach((key) => {
      draft = getThemeDraftFlat(loadPreferences(), variant);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:0.5rem;';

      const label = document.createElement('label');
      label.style.cssText =
        'font-size:0.65rem;color:var(--text-muted);width:5.5rem;flex-shrink:0;';
      label.textContent = FIELD_LABELS[key] || key;

      const input = document.createElement('input');
      input.type = 'text';
      input.value = draft[key] ?? '';
      input.className = 'og-modal-input';
      input.style.cssText =
        'flex:1;min-width:0;border-radius:0.35rem;padding:0.25rem 0.4rem;font-size:0.65rem;font-family:monospace;';
      input.addEventListener('input', () => updateToken(key, input.value));

      row.appendChild(label);
      row.appendChild(input);
      inner.appendChild(row);
    });

    details.appendChild(inner);
    panel.appendChild(details);
  });

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = `Reset ${variant} theme to defaults`;
  resetBtn.className = 'og-modal-btn-ghost';
  resetBtn.style.cssText =
    'margin-top:0.5rem;padding:0.5rem;border-radius:0.5rem;font-size:0.7rem;font-weight:700;cursor:pointer;width:100%;';
  resetBtn.onclick = () => {
    resetThemeVariant(variant);
    onRebuild?.();
  };
  panel.appendChild(resetBtn);

  return panel;
}

export function buildThemePanel(onRebuild) {
  const panel = document.createElement('div');
  panel.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

  const prefs = loadPreferences();

  const modeLabel = document.createElement('label');
  modeLabel.style.cssText = 'font-size:0.75rem;color:var(--text-muted);font-weight:600;';
  modeLabel.textContent = t('preferences.themeMode');

  const modeSelect = document.createElement('select');
  modeSelect.className = 'og-modal-input';
  modeSelect.style.cssText = 'width:100%;border-radius:0.5rem;padding:0.5rem;font-size:0.875rem;';
  THEME_MODES.forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    modeSelect.appendChild(opt);
  });
  modeSelect.value = prefs.themeMode || 'dark';
  modeSelect.addEventListener('change', () => {
    setThemeMode(modeSelect.value);
    onRebuild?.();
  });

  panel.appendChild(modeLabel);
  panel.appendChild(modeSelect);

  let editVariant = prefs.themeMode === 'light' ? 'light' : prefs.themeMode === 'dark' ? 'dark' : 'dark';
  const variantBar = document.createElement('div');
  variantBar.style.cssText =
    'display:flex;gap:0.25rem;padding:0.25rem;border-radius:0.5rem;border:1px solid var(--border-light);background:var(--bg-card);';

  const tokenHost = document.createElement('div');
  const paintSegments = () => {
    Array.from(variantBar.children).forEach((b) => {
      const active = b.dataset.variant === editVariant;
      b.style.background = active ? 'var(--bg-panel)' : 'transparent';
      b.style.color = active ? 'var(--text-primary)' : 'var(--text-muted)';
    });
  };

  const renderTokens = () => {
    tokenHost.innerHTML = '';
    tokenHost.appendChild(
      buildTokenEditor(editVariant, () => {
        renderTokens();
        onRebuild?.();
      })
    );
  };

  ['dark', 'light'].forEach((v) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = v.charAt(0).toUpperCase() + v.slice(1);
    btn.dataset.variant = v;
    btn.style.cssText =
      'flex:1;padding:0.35rem;border:none;border-radius:0.35rem;font-size:0.7rem;font-weight:700;cursor:pointer;background:transparent;color:var(--text-muted);';
    btn.onclick = () => {
      editVariant = v;
      paintSegments();
      renderTokens();
    };
    variantBar.appendChild(btn);
  });
  paintSegments();

  panel.appendChild(variantBar);
  panel.appendChild(tokenHost);
  renderTokens();

  return panel;
}

export function buildAppearancePanel() {
  return buildThemePanel();
}

export function buildLanguagePanel() {
  const panel = document.createElement('div');
  panel.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

  const prefs = loadPreferences();
  const label = document.createElement('label');
  label.style.cssText = 'font-size:0.75rem;color:var(--text-muted);font-weight:600;';
  label.textContent = t('settings.tab.language');

  const select = document.createElement('select');
  select.className = 'og-modal-input';
  select.style.cssText = 'width:100%;border-radius:0.5rem;padding:0.5rem;font-size:0.875rem;';
  select.innerHTML = '<option value="en">English</option><option value="zh">中文</option>';
  select.value = prefs.general?.locale || 'en';
  select.addEventListener('change', () => {
    savePreferences({ general: { locale: select.value } });
    localStorage.setItem('og_lang', select.value);
    location.reload();
  });

  panel.appendChild(label);
  panel.appendChild(select);
  return panel;
}

export function buildAccessibilityPanel() {
  const panel = document.createElement('div');
  const prefs = loadPreferences();
  const label = document.createElement('label');
  label.style.cssText =
    'display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem;color:var(--text-primary);';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = !!prefs.general?.reducedMotion;
  cb.addEventListener('change', () => {
    debouncedSave({ general: { reducedMotion: cb.checked } });
  });
  label.appendChild(cb);
  label.appendChild(document.createTextNode(t('settings.reducedMotion')));
  panel.appendChild(label);
  return panel;
}

export function buildGeneralPanel() {
  const panel = document.createElement('div');
  panel.style.cssText = 'display:flex;flex-direction:column;gap:0.75rem;';

  const prefs = loadPreferences();

  const langLabel = document.createElement('label');
  langLabel.style.cssText = 'font-size:0.75rem;color:var(--text-muted);font-weight:600;';
  langLabel.textContent = t('settings.tab.language');
  const select = document.createElement('select');
  select.className = 'og-modal-input';
  select.style.cssText = 'width:100%;border-radius:0.5rem;padding:0.5rem;font-size:0.875rem;';
  select.innerHTML = '<option value="en">English</option><option value="zh">中文</option>';
  select.value = prefs.general?.locale || 'en';
  select.addEventListener('change', () => {
    savePreferences({ general: { locale: select.value } });
    localStorage.setItem('og_lang', select.value);
    location.reload();
  });
  panel.appendChild(langLabel);
  panel.appendChild(select);

  const scaleLabel = document.createElement('label');
  scaleLabel.style.cssText = 'font-size:0.7rem;color:var(--text-muted);margin-top:0.5rem;display:block;';
  scaleLabel.textContent = 'UI scale';
  const scaleInput = document.createElement('input');
  scaleInput.type = 'range';
  scaleInput.min = '0.9';
  scaleInput.max = '1.15';
  scaleInput.step = '0.05';
  scaleInput.value = String(prefs.general?.uiScale ?? 1);
  scaleInput.addEventListener('input', () => {
    debouncedSave({ general: { uiScale: parseFloat(scaleInput.value) } });
  });
  panel.appendChild(scaleLabel);
  panel.appendChild(scaleInput);
  return panel;
}
