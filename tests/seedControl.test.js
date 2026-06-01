import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  randomSeed,
  resolveSeedForGenerate,
  advanceSeed,
  seedsForBatch,
  seedForSnapshot,
  usedSeedFromResponse,
  modelSupportsSeed,
  snapshotWithCardSeed,
} from '../packages/studio/src/lib/seedControl.js';

describe('seedControl', () => {
  it('randomSeed returns non-negative integers within range', () => {
    for (let i = 0; i < 20; i++) {
      const s = randomSeed();
      assert.ok(Number.isInteger(s));
      assert.ok(s >= 0 && s <= 2147483646);
    }
  });

  it('resolveSeedForGenerate treats empty as random', () => {
    assert.equal(resolveSeedForGenerate(null), undefined);
    assert.equal(resolveSeedForGenerate(''), undefined);
    assert.equal(resolveSeedForGenerate(-1), undefined);
  });

  it('resolveSeedForGenerate clamps to schema bounds', () => {
    const schema = { minValue: 10, maxValue: 20 };
    assert.equal(resolveSeedForGenerate(5, schema), 10);
    assert.equal(resolveSeedForGenerate(99, schema), 20);
    assert.equal(resolveSeedForGenerate(15, schema), 15);
  });

  it('advanceSeed increments fixed seeds', () => {
    assert.equal(advanceSeed(42), 43);
  });

  it('advanceSeed returns new random when no fixed seed', () => {
    const next = advanceSeed(undefined);
    assert.ok(Number.isInteger(next) && next >= 0);
  });

  it('seedsForBatch assigns consecutive seeds', () => {
    assert.deepEqual(seedsForBatch(10, 3), [10, 11, 12]);
    const randomBatch = seedsForBatch(null, 2);
    assert.equal(randomBatch.length, 2);
    assert.equal(randomBatch[1], randomBatch[0] + 1);
  });

  it('seedForSnapshot omits random', () => {
    assert.equal(seedForSnapshot(null), undefined);
    assert.equal(seedForSnapshot(7), 7);
  });

  it('usedSeedFromResponse prefers API echo', () => {
    assert.equal(usedSeedFromResponse(1, { seed: 99 }), 99);
    assert.equal(usedSeedFromResponse(5, {}), 5);
    const fallback = usedSeedFromResponse(undefined, {});
    assert.ok(Number.isInteger(fallback));
  });

  it('modelSupportsSeed for Seedance fast t2v', () => {
    assert.equal(modelSupportsSeed('rw-seedance-2-fast', 'runware', 't2v'), true);
  });

  it('snapshotWithCardSeed stores per-card seed', () => {
    const base = {
      snapshotVersion: 1,
      studioId: 'image',
      catalogMode: 't2i',
      modelId: 'm1',
      providerId: 'runware',
      prompt: 'p',
      controls: { seed: 10 },
      assetLabels: [],
    };
    const out = snapshotWithCardSeed(base, 12);
    assert.equal(out.controls.seed, 12);
    const random = snapshotWithCardSeed(base, -1);
    assert.equal(random.controls.seed, undefined);
  });
});
