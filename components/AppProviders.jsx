'use client';

import { useEffect } from 'react';
import ThemeProvider from './ThemeProvider';
import ThemeSync from './ThemeSync';
import * as ogPreferences from '@/src/lib/preferences.js';

export default function AppProviders({ children }) {
  useEffect(() => {
    window.__ogPreferences = ogPreferences;
    return () => {
      delete window.__ogPreferences;
    };
  }, []);

  return (
    <ThemeProvider>
      <ThemeSync />
      {children}
    </ThemeProvider>
  );
}
