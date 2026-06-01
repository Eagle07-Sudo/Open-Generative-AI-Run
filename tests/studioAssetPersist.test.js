import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  assetsToManifest,
  restoreStudioAssetsFromManifest,
  manifestFromAssetLabels,
  isStudioAssetRestored,
} from '../packages/studio/src/media/studioAssetPersist.js';
import {
  registerStudioAsset,
  clearAllStudioRegistriesForTests,
  getStudioAsset,
} from '../packages/studio/src/media/studioAssetRegistry.js';

describe('studioAssetPersist', () => {
  beforeEach(() => {
    clearAllStudioRegistriesForTests();
  });

  it('assetsToManifest keeps https inferenceRef', () => {
    const manifest = assetsToManifest([
      {
        label: 'image1',
        kind: 'image',
        status: 'ready',
        inferenceRef: 'https://cdn.example/ref.jpg',
        providerId: 'muapi',
        fileName: 'ref.jpg',
      },
    ]);
    assert.equal(manifest.length, 1);
    assert.equal(manifest[0].inferenceRef, 'https://cdn.example/ref.jpg');
    assert.equal(manifest[0].imageUUID, undefined);
    assert.equal(manifest[0].label, 'image1');
  });

  it('assetsToManifest maps Runware UUID to imageUUID', () => {
    const manifest = assetsToManifest([
      {
        label: 'image1',
        kind: 'image',
        status: 'ready',
        inferenceRef: 'a1b2-c3d4-uuid',
        providerId: 'runware',
      },
    ]);
    assert.equal(manifest[0].imageUUID, 'a1b2-c3d4-uuid');
    assert.equal(manifest[0].inferenceRef, undefined);
  });

  it('restoreStudioAssetsFromManifest registers https CDN assets', async () => {
    const { restored, missing } = await restoreStudioAssetsFromManifest('image', [
      {
        label: 'image1',
        kind: 'image',
        inferenceRef: 'https://cdn.example/ref.jpg',
        providerId: 'muapi',
      },
    ]);
    assert.deepEqual(restored, ['image1']);
    assert.deepEqual(missing, []);
    const asset = getStudioAsset('image', 'image1');
    assert.equal(asset?.status, 'ready');
    assert.equal(asset?.inferenceRef, 'https://cdn.example/ref.jpg');
    assert.equal(asset?.thumbUrl, 'https://cdn.example/ref.jpg');
  });

  it('restoreStudioAssetsFromManifest registers Runware imageUUID', async () => {
    const { restored, missing } = await restoreStudioAssetsFromManifest('image', [
      {
        label: 'image2',
        kind: 'image',
        imageUUID: 'runware-uuid-99',
        providerId: 'runware',
      },
    ]);
    assert.deepEqual(restored, ['image2']);
    assert.deepEqual(missing, []);
    const asset = getStudioAsset('image', 'image2');
    assert.equal(asset?.status, 'ready');
    assert.equal(asset?.inferenceRef, 'runware-uuid-99');
    assert.ok(isStudioAssetRestored('image', 'image2'));
  });

  it('manifestFromAssetLabels builds from registry', () => {
    registerStudioAsset('video', {
      label: 'image1',
      kind: 'image',
      status: 'ready',
      inferenceRef: 'https://cdn.example/v.jpg',
      thumbUrl: 'https://cdn.example/v.jpg',
      providerId: 'muapi',
    });
    const manifest = manifestFromAssetLabels('video', ['image1']);
    assert.equal(manifest[0].inferenceRef, 'https://cdn.example/v.jpg');
  });
});

import { afterEach } from 'node:test';
import { isStudioBlobPersistEnabled, trackBlobIndex, readBlobIndex } from '../packages/studio/src/media/studioBlobPersistPolicy.js';

describe('studioBlobPersistPolicy default & eviction', () => {
  let originalLocalStorage;

  beforeEach(() => {
    originalLocalStorage = globalThis.localStorage;
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
  });

  it('enables blob persistence by default when localStorage is empty', () => {
    const storageMap = new Map();
    globalThis.localStorage = {
      getItem: (key) => storageMap.get(key) || null,
      setItem: (key, val) => storageMap.set(key, String(val)),
      removeItem: (key) => storageMap.delete(key),
      key: (idx) => Array.from(storageMap.keys())[idx],
      get length() { return storageMap.size; }
    };
    assert.equal(isStudioBlobPersistEnabled(), true);
  });

  it('disables blob persistence only when og_idb_assets is 0', () => {
    const storageMap = new Map();
    storageMap.set('og_idb_assets', '0');
    globalThis.localStorage = {
      getItem: (key) => storageMap.get(key) || null,
      setItem: (key, val) => storageMap.set(key, String(val)),
      removeItem: (key) => storageMap.delete(key),
      key: (idx) => Array.from(storageMap.keys())[idx],
      get length() { return storageMap.size; }
    };
    assert.equal(isStudioBlobPersistEnabled(), false);
  });

  it('tracks blob size in index', () => {
    const storageMap = new Map();
    globalThis.localStorage = {
      getItem: (key) => storageMap.get(key) || null,
      setItem: (key, val) => storageMap.set(key, String(val)),
      removeItem: (key) => storageMap.delete(key),
      key: (idx) => Array.from(storageMap.keys())[idx],
      get length() { return storageMap.size; }
    };
    trackBlobIndex('image', 'image1', 1024);
    const index = readBlobIndex('image');
    assert.equal(index.length, 1);
    assert.equal(index[0].label, 'image1');
    assert.equal(index[0].size, 1024);
  });
});
