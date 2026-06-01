import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadRoutingPrefs,
  saveRoutingPrefs,
  normalizeRoutingMode,
  enableRoutingV2,
  ROUTING_MODE_STORAGE,
} from '../components/cloudRoutingStore.js';

function mockStorage() {
  /** @type {Record<string, string>} */
  const data = {};
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

describe('cloudRoutingStore', () => {
  /** @type {Storage} */
  let storage;

  beforeEach(() => {
    storage = mockStorage();
  });

  it('normalizeRoutingMode', () => {
    assert.equal(normalizeRoutingMode('muapi-only'), 'muapi-only');
    assert.equal(normalizeRoutingMode('invalid'), 'runware-first');
  });

  it('save and load routing prefs', () => {
    enableRoutingV2(storage);
    saveRoutingPrefs(
      {
        routingMode: 'muapi-only',
        allowMuapiFallback: false,
        perStudioRouting: { video: 'muapi' },
      },
      storage
    );
    const prefs = loadRoutingPrefs(storage);
    assert.equal(prefs.routingMode, 'muapi-only');
    assert.equal(prefs.allowMuapiFallback, false);
    assert.equal(prefs.perStudioRouting.video, 'muapi');
  });

  it('defaults runware-first when v2 enabled', () => {
    enableRoutingV2(storage);
    const prefs = loadRoutingPrefs(storage);
    assert.equal(prefs.routingMode, 'runware-first');
  });
});
