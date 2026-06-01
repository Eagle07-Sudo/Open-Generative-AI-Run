"use client";

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

import { getUserBalance } from '../studioGenerate.js';

const CreativeCanvas = dynamic(
  () => import('design-agent').then((mod) => mod.CreativeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-black flex items-center justify-center text-white/50 text-sm">
        Loading canvas…
      </div>
    ),
  },
);

function setThemeModeBridge(mode) {
  if (typeof window !== 'undefined' && window.__ogPreferences?.setThemeMode) {
    window.__ogPreferences.setThemeMode(mode);
  }
}

export default function DesignAgentStudio({
  apiKey,
  isHeaderVisible,
  onToggleHeader,
  onOpenApiSettings,
  onNavigateTab,
}) {
  const [userData, setUserData] = useState(null);
  const { setTheme: nextSetTheme } = useTheme();
  const muapiKey = apiKey?.trim() || '';

  const handleSetTheme = useCallback(
    (mode) => {
      const normalized = mode === 'light' ? 'light' : mode === 'system' ? 'system' : 'dark';
      setThemeModeBridge(normalized);
      nextSetTheme(normalized === 'system' ? 'system' : normalized);
    },
    [nextSetTheme],
  );

  // Sync bearer token before CreativeCanvas mounts (avoids 403 on first axios calls).
  useLayoutEffect(() => {
    if (muapiKey) {
      localStorage.setItem('token', muapiKey);
    } else {
      localStorage.removeItem('token');
    }
  }, [muapiKey]);

  useEffect(() => {
    if (!muapiKey) {
      setUserData(null);
      return;
    }

    let cancelled = false;

    const fetchUser = async () => {
      try {
        const data = await getUserBalance(muapiKey);
        if (cancelled) return;
        setUserData({
          username: data.email?.split('@')[0] || 'Studio User',
          email: data.email,
          balance: data.balance || 0,
        });
      } catch {
        if (!cancelled) setUserData(null);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [muapiKey]);

  if (!muapiKey) {
    return (
      <div className="h-full w-full bg-black flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-white/80 text-sm max-w-md">
          Design Agent requires a Muapi API key. Runware-only sessions cannot use this tab.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
        {onNavigateTab ? (
          <button
            type="button"
            onClick={() => onNavigateTab('image')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10"
          >
            Back to Image Studio
          </button>
        ) : null}
        {onOpenApiSettings ? (
          <button
            type="button"
            onClick={onOpenApiSettings}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-medium border border-white/10"
          >
            Open API Settings
          </button>
        ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-black overflow-hidden design-agent-studio">
      <CreativeCanvas
        apiKey={muapiKey}
        user={userData}
        creditConversionRate={200}
        setTheme={handleSetTheme}
        onToggleHeader={onToggleHeader}
        isHeaderVisible={isHeaderVisible}
      />
    </div>
  );
}
