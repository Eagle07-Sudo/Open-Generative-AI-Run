'use client';

import CloudApiKeyPanel from './CloudApiKeyPanel';

/** Thin wrapper — API Settings overlay shares Get Started card via CloudApiKeyPanel. */
export default function SettingsModal({
  open,
  onClose,
  settingsProvider,
  setSettingsProvider,
  settingsMuapiKey,
  setSettingsMuapiKey,
  settingsRunwareKey,
  setSettingsRunwareKey,
  settingsError,
  setSettingsError,
  apiKey,
  runwareApiKey,
  onSave,
  onRemoveKey,
  routingMode,
  onRoutingModeChange,
  allowMuapiFallback,
  onAllowMuapiFallbackChange,
  routingV2Enabled,
  perStudioRouting,
  onPerStudioRoutingChange,
}) {
  if (!open) return null;

  return (
    <CloudApiKeyPanel
      variant="settings"
      overlay
      onClose={onClose}
      settingsProvider={settingsProvider}
      onSettingsProviderChange={(v) => {
        setSettingsProvider(v);
        setSettingsError(null);
      }}
      settingsMuapiKey={settingsMuapiKey}
      onSettingsMuapiKeyChange={(v) => {
        setSettingsMuapiKey(v);
        setSettingsError(null);
      }}
      settingsRunwareKey={settingsRunwareKey}
      onSettingsRunwareKeyChange={(v) => {
        setSettingsRunwareKey(v);
        setSettingsError(null);
      }}
      settingsError={settingsError}
      storedMuapiKey={apiKey}
      storedRunwareKey={runwareApiKey}
      onSettingsSave={onSave}
      onRemoveKey={onRemoveKey}
      routingMode={routingMode}
      onRoutingModeChange={onRoutingModeChange}
      allowMuapiFallback={allowMuapiFallback}
      onAllowMuapiFallbackChange={onAllowMuapiFallbackChange}
      routingV2Enabled={routingV2Enabled}
      perStudioRouting={perStudioRouting}
      onPerStudioRoutingChange={onPerStudioRoutingChange}
    />
  );
}
