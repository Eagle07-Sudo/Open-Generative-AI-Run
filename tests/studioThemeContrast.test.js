import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_THEME_DARK,
  DEFAULT_THEME_LIGHT,
} from '../src/lib/preferences.js';

function parseHex(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const n = parseInt(full, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
  };
}

function relativeLuminance({ r, g, b }) {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrastRatio(fgHex, bgHex) {
  const l1 = relativeLuminance(parseHex(fgHex));
  const l2 = relativeLuminance(parseHex(bgHex));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe('studio theme contrast (WCAG AA body text)', () => {
  it('default light: text on app background meets 4.5:1', () => {
    const ratio = contrastRatio(DEFAULT_THEME_LIGHT.textPrimary, DEFAULT_THEME_LIGHT.bgApp);
    assert.ok(ratio >= 4.5, `light contrast ${ratio.toFixed(2)} < 4.5`);
  });

  it('default light: text on panel background meets 4.5:1', () => {
    const ratio = contrastRatio(DEFAULT_THEME_LIGHT.textPrimary, DEFAULT_THEME_LIGHT.bgPanel);
    assert.ok(ratio >= 4.5, `light panel contrast ${ratio.toFixed(2)} < 4.5`);
  });

  it('default dark: text on app background meets 4.5:1', () => {
    const ratio = contrastRatio(DEFAULT_THEME_DARK.textPrimary, DEFAULT_THEME_DARK.bgApp);
    assert.ok(ratio >= 4.5, `dark contrast ${ratio.toFixed(2)} < 4.5`);
  });

  it('default dark: text on panel background meets 4.5:1', () => {
    const ratio = contrastRatio(DEFAULT_THEME_DARK.textPrimary, DEFAULT_THEME_DARK.bgPanel);
    assert.ok(ratio >= 4.5, `dark panel contrast ${ratio.toFixed(2)} < 4.5`);
  });
});
