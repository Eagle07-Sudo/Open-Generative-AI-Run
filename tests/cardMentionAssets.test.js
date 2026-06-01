import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCardLabels,
  cardMentionAssets,
  mentionsInCardScope,
  filterMentionsToCardScope,
  stripMentionsFromPrompt,
} from '../packages/studio/src/media/cardMentionAssets.js';
import {
  registerStudioAsset,
  clearAllStudioRegistriesForTests,
} from '../packages/studio/src/media/studioAssetRegistry.js';
import {
  resolveImageLabels,
  applyAssetRefsToParams,
} from '../packages/studio/src/media/mentionResolve.js';
import { getReferenceInputLimits } from '../packages/studio/src/modelInputResolver.js';

describe('cardMentionAssets', () => {
  beforeEach(() => {
    clearAllStudioRegistriesForTests();
  });

  it('extractCardLabels preserves order and dedupes', () => {
    assert.deepEqual(extractCardLabels(['image2', 'image1', 'image2']), ['image2', 'image1']);
  });

  it('extractCardLabels includes audio labels', () => {
    assert.deepEqual(extractCardLabels(['audio1', 'image1', 'audio2']), [
      'audio1',
      'image1',
      'audio2',
    ]);
  });

  it('extractCardLabels from objects with label', () => {
    assert.deepEqual(extractCardLabels([{ label: 'image1' }, { url: 'image2' }]), [
      'image1',
      'image2',
    ]);
  });

  it('ignores blob URLs without label', () => {
    assert.deepEqual(extractCardLabels(['blob:http://x', 'image1']), ['image1']);
  });

  it('cardMentionAssets returns registry entries in card order', () => {
    registerStudioAsset('image', {
      label: 'image1',
      kind: 'image',
      status: 'staged',
      previewUrl: 'blob:a',
      thumbUrl: 'blob:b',
      localFile: new File([], 'a.png', { type: 'image/png' }),
      fileName: 'a.png',
    });
    registerStudioAsset('image', {
      label: 'image2',
      kind: 'image',
      status: 'staged',
      previewUrl: 'blob:c',
      thumbUrl: 'blob:d',
      localFile: new File([], 'b.png', { type: 'image/png' }),
      fileName: 'b.png',
    });
    const assets = cardMentionAssets('image', ['image2', 'image1']);
    assert.equal(assets.length, 2);
    assert.equal(assets[0].label, 'image2');
    assert.equal(assets[1].label, 'image1');
  });

  it('mentionsInCardScope intersects with allowed labels', () => {
    assert.deepEqual(
      mentionsInCardScope('Use @image2 and @image99', ['image1', 'image2']),
      ['image2'],
    );
  });

  it('filterMentionsToCardScope strips out-of-card tags', () => {
    const out = filterMentionsToCardScope('Hi @image1 and @image99 end', ['image1']);
    assert.equal(out, 'Hi @image1 and  end');
  });

  it('stripMentionsFromPrompt removes all mention tags', () => {
    assert.equal(stripMentionsFromPrompt('@image1 make night'), 'make night');
    assert.equal(stripMentionsFromPrompt('@image1 turn the scene to night'), 'turn the scene to night');
    assert.equal(stripMentionsFromPrompt('  @video2  @audio1  hi  '), 'hi');
  });

  it('resolveImageLabels ignores prompt mentions outside cardLabels', () => {
    registerStudioAsset('image', {
      label: 'image1',
      kind: 'image',
      status: 'staged',
      previewUrl: 'blob:a',
      thumbUrl: 'blob:b',
      localFile: new File([], 'a.png', { type: 'image/png' }),
    });
    registerStudioAsset('image', {
      label: 'image99',
      kind: 'image',
      status: 'staged',
      previewUrl: 'blob:c',
      thumbUrl: 'blob:d',
      localFile: new File([], 'z.png', { type: 'image/png' }),
    });
    const labels = resolveImageLabels('image', 'Style @image99', undefined, ['image1']);
    assert.deepEqual(labels, []);
  });

  it('resolveImageLabels uses explicitLabels filtered by cardLabels', () => {
    const labels = resolveImageLabels(
      'image',
      '',
      ['image1', 'image2'],
      ['image1'],
    );
    assert.deepEqual(labels, ['image1']);
  });

  it('applyAssetRefsToParams rejects unresolved image labels', () => {
    assert.throws(
      () =>
        applyAssetRefsToParams('image', { prompt: 'edit' }, { imageLabels: ['image1'] }),
      /not uploaded to the cloud yet/i,
    );
  });

  it('applyAssetRefsToParams resolves referenceAudios labels', () => {
    registerStudioAsset('video', {
      label: 'audio1',
      kind: 'audio',
      status: 'committed',
      previewUrl: 'blob:a',
      thumbUrl: 'blob:a',
      inferenceRef: 'https://cdn.example/a.mp3',
      fileName: 'a.mp3',
    });
    const out = applyAssetRefsToParams('video', {
      referenceAudios: ['audio1'],
    });
    assert.deepEqual(out.referenceAudios, ['https://cdn.example/a.mp3']);
  });

  it('Seedance Fast catalog allows 3 reference audios', () => {
    const limits = getReferenceInputLimits('rw-seedance-2-fast', 'runware', 't2v');
    assert.equal(limits.audios, 3);
    assert.equal(limits.images, 9);
    assert.equal(limits.videos, 3);
  });
});
