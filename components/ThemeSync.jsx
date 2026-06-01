'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  loadPreferences,
  applyPreferences,
  resolveEffectiveTheme,
  subscribeSystemTheme,
} from '@/src/lib/preferences.js';

/**
 * Keeps next-themes and og_preferences in sync. og_preferences is the single writer for theme tokens.
 */
export default function ThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const prefs = loadPreferences();
    applyPreferences(prefs);
    const eff = resolveEffectiveTheme(prefs);
    setTheme(prefs.themeMode === 'system' ? 'system' : eff);

    const unsub = subscribeSystemTheme((effective) => {
      setTheme('system');
      applyPreferences(loadPreferences());
    });

    const onOgChange = () => {
      const p = loadPreferences();
      const e = resolveEffectiveTheme(p);
      setTheme(p.themeMode === 'system' ? 'system' : e);
      applyPreferences(p);
    };
    window.addEventListener('og-theme-change', onOgChange);

    return () => {
      unsub?.();
      window.removeEventListener('og-theme-change', onOgChange);
    };
  }, [setTheme]);

  return null;
}
