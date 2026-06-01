import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  nextLabel,
  registerStudioAsset,
  getStudioAsset,
  removeStudioAsset,
  clearAllStudioRegistriesForTests,
} from '../packages/studio/src/media/studioAssetRegistry.js';
import { parseMentionLabels } from '../packages/studio/src/media/mentionParse.js';

describe('studioAssetRegistry', () => {
  beforeEach(() => {
    clearAllStudioRegistriesForTests();
  });

  it('allocates image1 then image2', () => {
    assert.equal(nextLabel('image', 'image'), 'image1');
    registerStudioAsset('image', {
      label: 'image1',
      kind: 'image',
      status: 'staged',
      previewUrl: 'blob:a',
      thumbUrl: 'blob:b',
      localFile: new File([], 'a.png', { type: 'image/png' }),
    });
    assert.equal(nextLabel('image', 'image'), 'image2');
    assert.equal(getStudioAsset('image', 'image1')?.label, 'image1');
  });

  it('removeStudioAsset clears entry', () => {
    registerStudioAsset('video', {
      label: 'video1',
      kind: 'video',
      status: 'staged',
      previewUrl: 'blob:v',
      thumbUrl: 'blob:v',
      localFile: new File([], 'v.mp4', { type: 'video/mp4' }),
    });
    removeStudioAsset('video', 'video1');
    assert.equal(getStudioAsset('video', 'video1'), undefined);
  });
});

describe('mentionParse', () => {
  it('parses @image1 @image2 in order', () => {
    const labels = parseMentionLabels('Use @image2 and @image1 for style');
    assert.deepEqual(labels, ['image2', 'image1']);
  });

  it('parses @video1', () => {
    assert.deepEqual(parseMentionLabels('Animate @video1'), ['video1']);
  });
});
