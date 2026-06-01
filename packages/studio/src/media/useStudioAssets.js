'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { stageLocalAsset } from './stageLocalAsset.js';
import {
  listStudioAssets,
  removeStudioAsset,
  clearStudioRegistry,
  getStudioAsset,
} from './studioAssetRegistry.js';
import { prefetchStudioAssets } from './prefetchStudioAssets.js';

/**
 * @param {string} studioId
 * @param {string} defaultGenOp
 * @param {import('../studioCloud.js').RoutingPrefs & { muapiKey?: string, runwareApiKey?: string }} routing
 */
export function useStudioAssets(studioId, defaultGenOp, routing) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const assets = useMemo(() => listStudioAssets(studioId), [studioId, version]);

  const stageFile = useCallback(
    async (file, opts) => {
      const asset = await stageLocalAsset(studioId, file, opts);
      bump();
      prefetchStudioAssets(studioId, defaultGenOp, routing).catch(() => {});
      return asset;
    },
    [studioId, defaultGenOp, routing, bump],
  );

  const removeAsset = useCallback(
    (label) => {
      removeStudioAsset(studioId, label);
      bump();
    },
    [studioId, bump],
  );

  const clearAssets = useCallback(() => {
    clearStudioRegistry(studioId);
    bump();
  }, [studioId, bump]);

  const getAsset = useCallback((label) => getStudioAsset(studioId, label), [studioId, version]);

  useEffect(() => {
    return () => {
      /* keep registry for tab lifetime; parent may call clearAssets on unmount */
    };
  }, [studioId]);

  return {
    assets,
    stageFile,
    removeAsset,
    clearAssets,
    getAsset,
    refresh: bump,
  };
}
