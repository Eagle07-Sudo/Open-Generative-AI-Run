'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="og_next_theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
