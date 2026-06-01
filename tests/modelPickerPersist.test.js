import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadModelPick,
  saveModelPick,
  clearModelPick,
} from '../packages/studio/src/modelPickerPersist.js';

class MemoryStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(k) {
    return this.store.get(k) ?? null;
  }
  setItem(k, v) {
    this.store.set(k, v);
  }
  removeItem(k) {
    this.store.delete(k);
  }
}

describe('modelPickerPersist', () => {
  it('round-trips valid pick', () => {
    const storage = new MemoryStorage();
    saveModelPick('image', { v: 1, modelId: 'flux-dev', providerId: 'muapi' }, storage);
    const loaded = loadModelPick('image', storage);
    assert.deepEqual(loaded, { v: 1, modelId: 'flux-dev', providerId: 'muapi' });
  });

  it('rejects malformed JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem('og_model_pick_image', '{not json');
    assert.equal(loadModelPick('image', storage), null);
  });

  it('rejects invalid provider', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'og_model_pick_image',
      JSON.stringify({ v: 1, modelId: 'x', providerId: 'evil' })
    );
    assert.equal(loadModelPick('image', storage), null);
  });

  it('clear removes pick', () => {
    const storage = new MemoryStorage();
    saveModelPick('video', { v: 1, modelId: 'rw-video-default', providerId: 'runware' }, storage);
    clearModelPick('video', storage);
    assert.equal(loadModelPick('video', storage), null);
  });
});
