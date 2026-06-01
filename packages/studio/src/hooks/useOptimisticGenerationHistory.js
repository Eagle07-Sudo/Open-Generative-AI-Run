import { useCallback, useState } from 'react';
import { GENERATION_HISTORY_MAX } from '../media/generationHistoryTypes.js';

/**
 * Optimistic gallery history (ADR-012).
 * @param {import('../media/generationHistoryTypes.js').GenerationHistoryEntry[]} [initial]
 */
export function useOptimisticGenerationHistory(initial = []) {
  const [history, setHistory] = useState(initial);

  const prependPending = useCallback((entry) => {
    const id = entry.id || `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const row = {
      status: 'pending',
      timestamp: new Date().toISOString(),
      ...entry,
      id,
    };
    setHistory((prev) => [row, ...prev].slice(0, GENERATION_HISTORY_MAX));
    return id;
  }, []);

  const resolvePending = useCallback((id, patch) => {
    setHistory((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              ...patch,
              status: 'ready',
              timestamp: patch.timestamp || new Date().toISOString(),
            }
          : row,
      ),
    );
  }, []);

  const failPending = useCallback((id, error) => {
    setHistory((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              status: 'failed',
              error: error || 'Generation failed',
            }
          : row,
      ),
    );
  }, []);

  const prependReady = useCallback((entry) => {
    setHistory((prev) =>
      [{ status: 'ready', timestamp: new Date().toISOString(), ...entry }, ...prev].slice(
        0,
        GENERATION_HISTORY_MAX,
      ),
    );
  }, []);

  const retryPending = useCallback((id, patch = {}) => {
    setHistory((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              ...patch,
              status: 'pending',
              error: undefined,
            }
          : row,
      ),
    );
  }, []);

  return {
    history,
    setHistory,
    prependPending,
    resolvePending,
    failPending,
    prependReady,
    retryPending,
  };
}
