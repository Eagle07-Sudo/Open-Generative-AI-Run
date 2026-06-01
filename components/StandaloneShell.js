'use client';

import { useState, useEffect, useLayoutEffect, useCallback, useRef, useMemo } from 'react';
import {
  migrateStudioPersistSchema,
  pruneOversizedStudioPersist,
} from '../packages/studio/src/media/studioPersistSafety.js';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ImageStudio,
  VideoStudio,
  ClippingStudio,
  VibeMotionStudio,
  LipSyncStudio,
  CinemaStudio,
  AudioStudio,
  MarketingStudio,
  WorkflowStudio,
  AgentStudio,
  AppsStudio,
  getUserBalance,
  DEFAULT_CLOUD_PROVIDER,
  subscribeStudioRecreate,
} from 'studio';
import StudioProviderBanner from './StudioProviderBanner';
import {
  hasCloudSession,
  normalizeCloudProvider,
  resolveAfterKeyRemoval,
} from './cloudSession';
import { PROVIDER_COPY, removeKeyConfirm } from './cloudApiKeyCopy';
import { getBannerContext } from './studioProviderRequirements';
import {
  hydrateCloudSession,
  persistEntryKeys,
  persistCloudKeys,
  clearCloudKeysForProvider,
  readCloudKeysFromStorage,
  isValidApiKey,
  subscribeCloudKeyStorageSync,
} from './cloudKeyStore';
import { setRunwareModelSearchEnabled } from 'studio';
import {
  loadRoutingPrefs,
  saveRoutingPrefs,
  enableRoutingV2,
} from './cloudRoutingStore';

const DesignAgentStudio = dynamic(() => import('studio').then(mod => mod.DesignAgentStudio), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-app-bg flex items-center justify-center text-foreground-muted">Loading Design Studio...</div>
});
import axios from 'axios';
import ApiKeyModal from './ApiKeyModal';
import SettingsModal from './SettingsModal';
import PreferencesModal from './PreferencesModal';
import {
  loadPreferences,
  savePreferences,
  applyPreferences,
  subscribeSystemTheme,
} from '@/src/lib/preferences.js';

const TABS = [
  { id: 'image',   label: 'Image Studio' },
  { id: 'video',   label: 'Video Studio' },
  { id: 'audio',   label: 'Audio Studio' },
  { id: 'clipping', label: 'AI Clipping' },
  { id: 'vibe-motion', label: 'Vibe Motion' },
  { id: 'lipsync', label: 'Lip Sync' },
  { id: 'cinema',  label: 'Cinema Studio' },
  { id: 'marketing', label: 'Marketing Studio' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'agents', label: 'Agents' },
  { id: 'design-agent', label: 'Design Agent' },
  { id: 'apps', label: 'Explore Apps' },
];

export default function StandaloneShell() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug || []; 
  const idFromParams = params?.id;
  const tabFromParams = params?.tab;

  // Helper to extract workflow details precisely from either route structure
  const getWorkflowInfo = useCallback(() => {
    if (idFromParams) {
        return { id: idFromParams, tab: tabFromParams || null };
    }
    const wfIndex = slug.findIndex(s => s === 'workflows' || s === 'workflow');
    if (wfIndex === -1) return { id: null, tab: null };
    return {
      id: slug[wfIndex + 1] || null,
      tab: slug[wfIndex + 2] || null
    };
  }, [slug, idFromParams, tabFromParams]);

  const { id: urlWorkflowId } = getWorkflowInfo();

  // Initialize activeTab from URL slug/params or default to 'image'
  const getInitialTab = () => {
    if (idFromParams || slug.includes('workflow')) return 'workflows';
    if (slug.includes('agents')) return 'agents';
    if (slug.includes('design-agent')) return 'design-agent';
    if (slug.includes('apps')) return 'apps';
    const firstSegment = slug[0];
    if (firstSegment && TABS.find(t => t.id === firstSegment)) return firstSegment;
    return 'image';
  };
  
  const [apiKey, setApiKey] = useState(null);
  const [muapiKey, setMuapiKey] = useState(null);
  const [runwareApiKey, setRunwareApiKey] = useState('');
  const [cloudProvider, setCloudProvider] = useState(DEFAULT_CLOUD_PROVIDER);
  const [activeTab, setActiveTab] = useState(getInitialTab());

  const [balance, setBalance] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefsTab, setPrefsTab] = useState('theme');
  const [draftPrefs, setDraftPrefs] = useState(null);
  const savePrefsTimerRef = useRef(null);
  const [settingsProvider, setSettingsProvider] = useState(DEFAULT_CLOUD_PROVIDER);
  const [settingsMuapiKey, setSettingsMuapiKey] = useState('');
  const [settingsRunwareKey, setSettingsRunwareKey] = useState('');
  const [settingsError, setSettingsError] = useState(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);
  const [keysHydrated, setKeysHydrated] = useState(false);
  const [routingPrefs, setRoutingPrefs] = useState(() => loadRoutingPrefs());
  const [routingV2Enabled] = useState(true);
  const [fallbackToast, setFallbackToast] = useState(null);

  const updateRoutingPrefs = useCallback((patch) => {
    setRoutingPrefs((prev) => saveRoutingPrefs({ ...prev, ...patch }));
  }, []);
  const apiSettingsTriggerRef = useRef(null);

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState(null);

  // Sync tab with URL if user navigates manually or via browser back/forward
  useEffect(() => {
    const info = getWorkflowInfo();
    if (info.id) {
        setActiveTab('workflows');
    } else if (slug.includes('agents')) {
        setActiveTab('agents');
    } else if (slug.includes('design-agent')) {
        setActiveTab('design-agent');
    } else if (slug.includes('apps')) {
        setActiveTab('apps');
    } else {
        const firstSegment = slug[0];
        if (firstSegment && TABS.find(t => t.id === firstSegment)) {
          setActiveTab(firstSegment);
        }
    }
  }, [slug, getWorkflowInfo]);

  const handleTabChange = (tabId) => {
    router.push(`/studio/${tabId}`);
    // setActiveTab(tabId);
  };

  useEffect(() => {
    return subscribeStudioRecreate((snap) => {
      if (snap?.studioId && TABS.some((t) => t.id === snap.studioId)) {
        handleTabChange(snap.studioId);
      }
    });
  }, []);

  // Auto-hide header when inside a specific workflow view or design agent canvas
  useEffect(() => {
    const isEditingWorkflow = (activeTab === 'workflows' || !!idFromParams) && urlWorkflowId;
    const designAgentCanvasActive =
      activeTab === 'design-agent' && Boolean((muapiKey ?? apiKey)?.trim());

    if (isEditingWorkflow || designAgentCanvasActive) {
      setIsHeaderVisible(false);
    } else {
      setIsHeaderVisible(true);
    }
  }, [activeTab, urlWorkflowId, idFromParams, muapiKey, apiKey]);

  // Clear stale builder flags without reload loops (reload froze tabs when fromDesignAgent lingered)
  useEffect(() => {
    try {
      sessionStorage.removeItem('fromDesignAgent');
      const fromBuilder = sessionStorage.getItem('fromWorkflowBuilder');
      if (fromBuilder && activeTab !== 'workflows') {
        sessionStorage.removeItem('fromWorkflowBuilder');
      }
    } catch {
      /* ignore */
    }
  }, [activeTab]);

  const fetchBalance = useCallback(async (key) => {
    try {
      const data = await getUserBalance(key);
      setBalance(data.balance);
    } catch (err) {
      console.error('Balance fetch failed:', err);
    }
  }, []);

  useLayoutEffect(() => {
    try {
      migrateStudioPersistSchema();
      pruneOversizedStudioPersist();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setHasMounted(true);
    applyPreferences(loadPreferences());
    const unsub = subscribeSystemTheme(() => {
      setDraftPrefs((prev) => (prev ? loadPreferences() : prev));
    });
    return () => unsub?.();
  }, []);

  useEffect(() => {
    const session = hydrateCloudSession();
    if (session.muapiKey) {
      setApiKey(session.muapiKey);
      setMuapiKey(session.muapiKey);
    }
    if (session.runwareApiKey) setRunwareApiKey(session.runwareApiKey);
    setCloudProvider(session.cloudProvider);
    if (session.muapiKey && session.cloudProvider === DEFAULT_CLOUD_PROVIDER) {
      fetchBalance(session.muapiKey);
    }
    enableRoutingV2();
    setRoutingPrefs(loadRoutingPrefs());
    setKeysHydrated(true);
  }, [fetchBalance]);

  useEffect(() => {
    return subscribeCloudKeyStorageSync((session) => {
      setMuapiKey(session.muapiKey || null);
      setRunwareApiKey(session.runwareApiKey || null);
      setCloudProvider(session.cloudProvider);
      if (session.muapiKey) {
        setApiKey(session.muapiKey);
        fetchBalance(session.muapiKey);
      } else if (!session.muapiKey) {
        setApiKey(null);
      }
    });
  }, [fetchBalance]);

  useEffect(() => {
    const onFallback = (e) => {
      const label = e.detail?.label || 'Muapi';
      setFallbackToast(`Completed via ${label} (fallback)`);
      setTimeout(() => setFallbackToast(null), 5000);
    };
    window.addEventListener('cloud:fallback-used', onFallback);
    return () => window.removeEventListener('cloud:fallback-used', onFallback);
  }, []);

  useEffect(() => {
    if (!showSettings) return;
    setSettingsProvider(cloudProvider);
    setSettingsMuapiKey('');
    setSettingsRunwareKey('');
    setSettingsError(null);
  }, [showSettings, cloudProvider]);

  useEffect(() => {
    if (!showPreferences) return;
    setPrefsTab('theme');
    setDraftPrefs(loadPreferences());
  }, [showPreferences]);

  const handleDraftPrefsChange = useCallback((partial) => {
    setDraftPrefs((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        ...(partial.themeMode !== undefined ? { themeMode: partial.themeMode } : {}),
        themes: partial.themes
          ? {
              dark: { ...prev.themes.dark, ...(partial.themes.dark || {}) },
              light: { ...prev.themes.light, ...(partial.themes.light || {}) },
            }
          : prev.themes,
        general: partial.general ? { ...prev.general, ...partial.general } : prev.general,
      };
      applyPreferences(next);
      if (savePrefsTimerRef.current) clearTimeout(savePrefsTimerRef.current);
      savePrefsTimerRef.current = setTimeout(() => {
        savePreferences({
          themeMode: next.themeMode,
          themes: next.themes,
          general: next.general,
        });
      }, 500);
      return next;
    });
  }, []);

  const handleDraftPrefsReset = useCallback((defaults) => {
    setDraftPrefs(defaults);
    if (savePrefsTimerRef.current) clearTimeout(savePrefsTimerRef.current);
    savePreferences(defaults);
  }, []);

  const handleLocaleChange = useCallback((locale) => {
    savePreferences({ general: { locale } });
    localStorage.setItem('og_lang', locale);
    window.location.reload();
  }, []);

  const handleEntrySave = useCallback(({ provider, key }) => {
    const result = persistEntryKeys({ provider, key });
    setCloudProvider(result.provider);

    if (result.provider === 'runware') {
      setRunwareApiKey(result.runwareApiKey);
      setBalance(null);
      setRunwareModelSearchEnabled(true);
      const stored = readCloudKeysFromStorage();
      if (stored.muapiKey) {
        setMuapiKey(stored.muapiKey);
        setApiKey(stored.muapiKey);
      }
    } else {
      setApiKey(result.muapiKey);
      setMuapiKey(result.muapiKey);
      fetchBalance(result.muapiKey);
    }
  }, [fetchBalance]);

  const handleRemoveKey = useCallback(() => {
    const provider = normalizeCloudProvider(settingsProvider);
    const label = PROVIDER_COPY[provider === 'runware' ? 'runware' : 'muapi'].label;
    if (typeof window !== 'undefined' && !window.confirm(removeKeyConfirm(label))) {
      return;
    }

    clearCloudKeysForProvider(provider);

    const { nextMuapi, nextRunware, nextCloudProvider } = resolveAfterKeyRemoval(
      provider,
      apiKey,
      runwareApiKey,
      cloudProvider
    );

    setApiKey(nextMuapi || null);
    setMuapiKey(nextMuapi || null);
    setRunwareApiKey(nextRunware);
    setCloudProvider(nextCloudProvider);
    persistCloudKeys({ provider: nextCloudProvider });

    if (!nextMuapi) {
      setBalance(null);
    } else if (nextCloudProvider === DEFAULT_CLOUD_PROVIDER) {
      fetchBalance(nextMuapi);
    }

    setSettingsMuapiKey('');
    setSettingsRunwareKey('');
    setSettingsError(null);
  }, [settingsProvider, apiKey, runwareApiKey, cloudProvider, fetchBalance]);

  const handleSettingsSave = useCallback(() => {
    const provider = normalizeCloudProvider(settingsProvider);
    const draftMuapi = settingsMuapiKey.trim();
    const draftRunware = settingsRunwareKey.trim();

    if (draftMuapi && !isValidApiKey(draftMuapi)) {
      setSettingsError('Invalid Muapi API key format.');
      return;
    }
    if (draftRunware && !isValidApiKey(draftRunware)) {
      setSettingsError('Invalid Runware API key format.');
      return;
    }

    let nextMuapi = apiKey || '';
    let nextRunware = runwareApiKey || '';

    if (draftMuapi) {
      nextMuapi = draftMuapi;
      setApiKey(draftMuapi);
      setMuapiKey(draftMuapi);
    }

    if (draftRunware) {
      nextRunware = draftRunware;
      setRunwareApiKey(draftRunware);
    }

    if (!hasCloudSession(provider, nextMuapi, nextRunware)) {
      setSettingsError(
        provider === 'runware'
          ? 'Add a Runware API key before switching to Runware.'
          : 'Add a Muapi API key before switching to Muapi.'
      );
      return;
    }

    persistCloudKeys({
      provider,
      ...(draftMuapi ? { muapiKey: draftMuapi } : {}),
      ...(draftRunware ? { runwareApiKey: draftRunware } : {}),
    });
    setCloudProvider(provider);
    setSettingsError(null);

    if (provider === DEFAULT_CLOUD_PROVIDER && nextMuapi) {
      fetchBalance(nextMuapi);
    } else if (provider === 'runware') {
      setBalance(null);
    }

    const nextRouting = saveRoutingPrefs({
      routingMode: routingPrefs.routingMode,
      allowMuapiFallback: routingPrefs.allowMuapiFallback,
      perStudioRouting: routingPrefs.perStudioRouting,
    });
    setRoutingPrefs(nextRouting);

    setSettingsMuapiKey('');
    setSettingsRunwareKey('');
    setShowSettings(false);
    apiSettingsTriggerRef.current?.focus();

    const stored = readCloudKeysFromStorage();
    if (stored.muapiKey) {
      setMuapiKey(stored.muapiKey);
      setApiKey(stored.muapiKey);
    }
  }, [settingsProvider, settingsMuapiKey, settingsRunwareKey, apiKey, runwareApiKey, fetchBalance, routingPrefs]);

  const handleSettingsClose = useCallback(() => {
    setShowSettings(false);
    apiSettingsTriggerRef.current?.focus();
  }, []);

  // Inject API key into all outgoing Axios requests (prop-based approach)
  // We use an interceptor to be selective and NOT send the key to external domains like S3
  useEffect(() => {
    // Safety: Clear any global defaults that might have been set previously
    delete axios.defaults.headers.common['x-api-key'];

    if (!apiKey) return;

    const interceptorId = axios.interceptors.request.use((config) => {
      // Check if URL is local/proxied
      const isRelative = config.url.startsWith('/') || !config.url.startsWith('http');
      const isInternalProxy = config.url.includes('/api/app') || config.url.includes('/api/workflow') || config.url.includes('/api/agents') || config.url.includes('/api/api') || config.url.includes('/api/v1');

      if (isRelative || isInternalProxy) {
        config.headers['x-api-key'] = apiKey;
      }
      
      return config;
    });

    return () => {
      axios.interceptors.request.eject(interceptorId);
    };
  }, [apiKey]);

  // Poll for balance every 30 seconds when Muapi is the active cloud provider
  useEffect(() => {
    if (!apiKey || cloudProvider !== DEFAULT_CLOUD_PROVIDER) return;
    const interval = setInterval(() => fetchBalance(apiKey), 30000);
    return () => clearInterval(interval);
  }, [apiKey, cloudProvider, fetchBalance]);

  const openApiSettings = useCallback(() => setShowSettings(true), []);

  const studioCloudProps = useMemo(
    () => ({
      apiKey: muapiKey ?? apiKey,
      muapiKey: muapiKey ?? apiKey,
      runwareApiKey,
      routingPrefs,
      onOpenApiSettings: openApiSettings,
    }),
    [apiKey, muapiKey, runwareApiKey, routingPrefs, openApiSettings]
  );

  const bannerContext = useMemo(() => {
    if (!keysHydrated) return null;
    return getBannerContext(
      activeTab,
      cloudProvider,
      apiKey,
      runwareApiKey,
      routingV2Enabled ? routingPrefs : null
    );
  }, [keysHydrated, activeTab, cloudProvider, apiKey, runwareApiKey, routingPrefs, routingV2Enabled]);

  // Drag and Drop Handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the container itself, not moving between children
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setDroppedFiles(files);
    }
  }, []);

  const handleFilesHandled = useCallback(() => {
    setDroppedFiles(null);
  }, []);

  // Prevent drag overlay from sticking after cancelled drags (blocks perceived UI freeze)
  useEffect(() => {
    const clearDrag = () => setIsDragging(false);
    window.addEventListener('dragend', clearDrag);
    window.addEventListener('drop', clearDrag);
    window.addEventListener('blur', clearDrag);
    return () => {
      window.removeEventListener('dragend', clearDrag);
      window.removeEventListener('drop', clearDrag);
      window.removeEventListener('blur', clearDrag);
    };
  }, []);

  if (!hasMounted || !keysHydrated) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="animate-spin text-primary text-3xl">◌</div>
    </div>
  );

  if (!hasCloudSession(cloudProvider, apiKey, runwareApiKey)) {
    return (
      <ApiKeyModal
        defaultProvider={cloudProvider}
        onSave={handleEntrySave}
      />
    );
  }

  return (
    <div 
      className="og-studio-root h-screen bg-app-bg flex flex-col overflow-hidden text-foreground relative"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-primary/10 backdrop-blur-md border-4 border-dashed border-primary/50 flex items-center justify-center pointer-events-none transition-all duration-300">
          <div className="bg-panel-bg p-8 rounded-3xl border border-border-subtle shadow-2xl flex flex-col items-center gap-4 scale-110 animate-pulse">
            <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold text-foreground">Drop your media here</span>
              <span className="text-sm text-foreground-muted">Images, videos, or audio files</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      {isHeaderVisible && (
        <header className="flex-shrink-0 h-14 border-b border-border-subtle flex items-center justify-between px-6 bg-panel-bg/85 backdrop-blur-md z-40 gap-4">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center text-app-bg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground hidden sm:block">OpenGenerativeAI</span>
            {routingPrefs.routingMode === 'runware-first' && (
              <span className="text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full hidden sm:inline">
                Runware first
              </span>
            )}
          </div>

          {/* Center: Navigation Container with fade edges */}
          <div className="flex-1 min-w-0 mx-4 sm:mx-6 relative overflow-hidden h-full flex items-center justify-start lg:justify-center">
            {/* Fade Left Overlay */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-app-bg to-transparent pointer-events-none z-10 block lg:hidden" />
            
            <nav className="flex items-center gap-4 overflow-x-auto scrollbar-none w-full lg:w-auto h-full px-4 lg:px-0">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`relative text-[13px] font-medium transition-all duration-300 whitespace-nowrap px-1 flex-shrink-0 flex items-center h-full ${
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  <span className="relative z-10">{tab.label}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary to-accent rounded-full shadow-glow" />
                  )}
                </button>
              ))}
            </nav>
            
            {/* Fade Right Overlay */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-app-bg to-transparent pointer-events-none z-10 block lg:hidden" />
          </div>

          {/* Right: Actions */}
          <div className="flex-shrink-0 flex items-center gap-4">
            {cloudProvider === DEFAULT_CLOUD_PROVIDER && (
              <div className="flex items-center gap-3 bg-card-bg px-3 py-1.5 rounded-full border border-border-subtle transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    ${balance !== null ? `${balance}` : '---'}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPreferences(true)}
              title="Preferences — theme, language, accessibility"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border-subtle bg-card-bg text-[13px] font-bold text-foreground-secondary hover:text-foreground hover:bg-panel-bg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              <span>Preferences</span>
            </button>
            <button
              ref={apiSettingsTriggerRef}
              onClick={() => setShowSettings(true)}
              title="API Settings — API keys and cloud provider"
              aria-label="API Settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border-subtle bg-card-bg text-[13px] font-bold text-foreground-secondary hover:text-foreground hover:bg-panel-bg transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>API Settings</span>
            </button>
          </div>
        </header>
      )}

      {/* Studio Content */}
      <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        {fallbackToast && (
          <div
            role="status"
            className="mx-4 mt-2 px-3 py-2 rounded-md bg-primary/10 border border-primary/20 text-[12px] text-foreground-secondary"
          >
            {fallbackToast}
          </div>
        )}
        {bannerContext?.show && (
          <StudioProviderBanner
            requiredProvider={bannerContext.requiredProvider}
            studioLabel={bannerContext.studioLabel}
            reason={bannerContext.reason}
            onOpenSettings={() => setShowSettings(true)}
          />
        )}
        <div className="flex-1 min-h-0 relative overflow-hidden">
        {activeTab === 'image'   && (
          <ImageStudio
            {...studioCloudProps}
            cloudProvider={cloudProvider}
            droppedFiles={droppedFiles}
            onFilesHandled={handleFilesHandled}
          />
        )}
        {activeTab === 'video'   && <VideoStudio   {...studioCloudProps} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'clipping' && <ClippingStudio {...studioCloudProps} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'vibe-motion' && <VibeMotionStudio apiKey={apiKey} />}
        {activeTab === 'lipsync' && <LipSyncStudio {...studioCloudProps} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'cinema'  && <CinemaStudio  {...studioCloudProps} />}
        {activeTab === 'audio'   && <AudioStudio   {...studioCloudProps} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'marketing' && <MarketingStudio {...studioCloudProps} droppedFiles={droppedFiles} onFilesHandled={handleFilesHandled} />}
        {activeTab === 'workflows' && <WorkflowStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'agents' && <AgentStudio apiKey={apiKey} isHeaderVisible={isHeaderVisible} onToggleHeader={setIsHeaderVisible} />}
        {activeTab === 'design-agent' && (
          <DesignAgentStudio
            apiKey={muapiKey ?? apiKey}
            isHeaderVisible={isHeaderVisible}
            onToggleHeader={setIsHeaderVisible}
            onOpenApiSettings={openApiSettings}
            onNavigateTab={handleTabChange}
          />
        )}
        {activeTab === 'apps' && <AppsStudio apiKey={apiKey} />}
        </div>
      </div>

      <SettingsModal
        open={showSettings}
        onClose={handleSettingsClose}
        settingsProvider={settingsProvider}
        setSettingsProvider={setSettingsProvider}
        settingsMuapiKey={settingsMuapiKey}
        setSettingsMuapiKey={setSettingsMuapiKey}
        settingsRunwareKey={settingsRunwareKey}
        setSettingsRunwareKey={setSettingsRunwareKey}
        settingsError={settingsError}
        setSettingsError={setSettingsError}
        apiKey={muapiKey ?? apiKey}
        runwareApiKey={runwareApiKey}
        onSave={handleSettingsSave}
        onRemoveKey={handleRemoveKey}
        routingMode={routingPrefs.routingMode}
        onRoutingModeChange={(mode) => updateRoutingPrefs({ routingMode: mode })}
        allowMuapiFallback={routingPrefs.allowMuapiFallback}
        onAllowMuapiFallbackChange={(v) => updateRoutingPrefs({ allowMuapiFallback: v })}
        routingV2Enabled={routingV2Enabled}
        perStudioRouting={routingPrefs.perStudioRouting}
        onPerStudioRoutingChange={(next) => updateRoutingPrefs({ perStudioRouting: next })}
      />

      <PreferencesModal
        open={showPreferences}
        onClose={() => setShowPreferences(false)}
        draftPrefs={draftPrefs}
        prefsTab={prefsTab}
        setPrefsTab={setPrefsTab}
        onDraftChange={handleDraftPrefsChange}
        onDraftReset={handleDraftPrefsReset}
        onLocaleChange={handleLocaleChange}
      />
    </div>
  );
}
