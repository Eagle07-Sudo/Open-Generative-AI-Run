import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGenerationSnapshot,
  SNAPSHOT_VERSION,
  STUDIO_RECREATE_EVENT,
} from '../packages/studio/src/studioRecreate.js';

describe('studioRecreate', () => {
  it('buildGenerationSnapshot returns v1 shape', () => {
    const snap = buildGenerationSnapshot({
      studioId: 'image',
      catalogMode: 't2i',
      modelId: 'rw-nano-banana-2',
      providerId: 'runware',
      prompt: 'a cat @image1',
      controls: { aspect_ratio: '16:9', resolution: '2k' },
      assetLabels: ['image1'],
      batchSize: 2,
    });
    assert.equal(snap.snapshotVersion, SNAPSHOT_VERSION);
    assert.equal(snap.studioId, 'image');
    assert.equal(snap.modelId, 'rw-nano-banana-2');
    assert.equal(snap.providerId, 'runware');
    assert.equal(snap.prompt, 'a cat @image1');
    assert.equal(snap.controls.resolution, '2k');
    assert.deepEqual(snap.assetLabels, ['image1']);
    assert.equal(snap.batchSize, 2);
  });

  it('normalizes muapi provider id', () => {
    const snap = buildGenerationSnapshot({
      studioId: 'marketing',
      catalogMode: 't2v',
      modelId: 'marketing-ad',
      providerId: 'muapi',
      prompt: 'script',
      controls: {},
    });
    assert.equal(snap.providerId, 'muapi');
  });

  it('stores video restore URLs', () => {
    const snap = buildGenerationSnapshot({
      studioId: 'video',
      catalogMode: 'i2v',
      modelId: 'rw-seedance-2-fast-i2v',
      providerId: 'runware',
      prompt: 'motion',
      controls: { duration: 8 },
      restoreImageUrl: 'https://cdn.example/start.jpg',
      imageMode: true,
    });
    assert.equal(snap.restoreImageUrl, 'https://cdn.example/start.jpg');
    assert.equal(snap.imageMode, true);
  });

  it('exports recreate event name', () => {
    assert.equal(STUDIO_RECREATE_EVENT, 'studio:recreate');
  });

  it('round-trips controls.seed for video recreate', () => {
    const snap = buildGenerationSnapshot({
      studioId: 'video',
      catalogMode: 't2v',
      modelId: 'rw-seedance-2-fast',
      providerId: 'runware',
      prompt: 'waves',
      controls: { duration: 8, seed: 42 },
    });
    assert.equal(snap.controls.seed, 42);
  });

  it('round-trips assetManifest on buildGenerationSnapshot', () => {
    const manifest = [
      {
        label: 'image1',
        kind: 'image',
        inferenceRef: 'https://cdn.example/a.png',
        providerId: 'muapi',
      },
    ];
    const snap = buildGenerationSnapshot({
      studioId: 'image',
      catalogMode: 'i2i',
      modelId: 'rw-nano-banana-2',
      providerId: 'runware',
      prompt: 'edit @image1',
      controls: { aspect_ratio: '1:1' },
      assetLabels: ['image1'],
      assetManifest: manifest,
    });
    assert.deepEqual(snap.assetManifest, manifest);
    assert.deepEqual(snap.assetLabels, ['image1']);
  });

  it('omits seed from snapshot when random (caller convention)', () => {
    const snap = buildGenerationSnapshot({
      studioId: 'image',
      catalogMode: 't2i',
      modelId: 'rw-nano-banana-2',
      providerId: 'runware',
      prompt: 'cat',
      controls: { aspect_ratio: '1:1' },
    });
    assert.equal(snap.controls.seed, undefined);
  });
});
