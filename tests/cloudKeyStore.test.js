import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  subscribeCloudKeyStorageSync,
  persistCloudKeys,
  obfuscate,
} from '../components/cloudKeyStore.js';
import { MUAPI_KEY_STORAGE } from '../packages/studio/src/providers/storageKeys.js';

describe('subscribeCloudKeyStorageSync', () => {
  /** @type {Map<string, string>} */
  let storageMap;
  /** @type {Storage} */
  let storage;
  /** @type {typeof globalThis.window} */
  let originalWindow;

  beforeEach(() => {
    storageMap = new Map();
    storage = {
      getItem: (key) => storageMap.get(key) ?? null,
      setItem: (key, val) => storageMap.set(key, String(val)),
      removeItem: (key) => storageMap.delete(key),
      key: (idx) => Array.from(storageMap.keys())[idx] ?? null,
      get length() {
        return storageMap.size;
      },
    };
    originalWindow = globalThis.window;
    const listeners = new Map();
    globalThis.window = {
      addEventListener: (type, fn) => {
        const list = listeners.get(type) || [];
        list.push(fn);
        listeners.set(type, list);
      },
      removeEventListener: (type, fn) => {
        const list = listeners.get(type) || [];
        listeners.set(
          type,
          list.filter((f) => f !== fn),
        );
      },
      dispatchEvent: (event) => {
        for (const fn of listeners.get(event.type) || []) {
          fn(event);
        }
        return true;
      },
    };
    globalThis.localStorage = storage;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it('notifies when Muapi key changes in another tab', () => {
    let seen = null;
    const unsub = subscribeCloudKeyStorageSync((session) => {
      seen = session;
    }, storage);

    persistCloudKeys({ provider: 'muapi', muapiKey: 'fake-muapi-key-for-test' }, storage);

    window.dispatchEvent({
      type: 'storage',
      key: MUAPI_KEY_STORAGE,
      newValue: obfuscate('fake-muapi-key-for-test'),
      storageArea: storage,
    });

    assert.ok(seen?.muapiKey);
    unsub();
  });
});
