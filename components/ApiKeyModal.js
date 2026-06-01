'use client';

import { useState, useEffect } from 'react';
import CloudApiKeyPanel from './CloudApiKeyPanel';
import { isValidApiKey } from './cloudKeyStore';

export default function ApiKeyModal({
  onSave,
  defaultProvider = 'muapi',
}) {
  const [provider, setProvider] = useState(
    defaultProvider === 'runware' ? 'runware' : 'muapi'
  );

  useEffect(() => {
    setProvider(defaultProvider === 'runware' ? 'runware' : 'muapi');
  }, [defaultProvider]);
  const [key, setKey] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter your API key');
      return;
    }
    if (!isValidApiKey(trimmed)) {
      setError('Invalid API key format. Key must be between 8 and 128 characters and contain only alphanumeric characters, hyphens, and underscores.');
      return;
    }
    onSave({ provider, key: trimmed });
  };

  return (
    <CloudApiKeyPanel
      variant="entry"
      overlay={false}
      entryProvider={provider}
      onEntryProviderChange={(v) => {
        setProvider(v === 'runware' ? 'runware' : 'muapi');
        setError('');
      }}
      entryKey={key}
      onEntryKeyChange={(v) => {
        setKey(v);
        setError('');
      }}
      entryError={error}
      onEntrySubmit={handleSubmit}
    />
  );
}
