import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAssetLabel, resolvePreviewSrc } from '../packages/studio/src/media/previewSrc.js';

describe('previewSrc', () => {
  it('isAssetLabel detects image1', () => {
    assert.equal(isAssetLabel('image1'), true);
    assert.equal(isAssetLabel('blob:x'), false);
  });

  it('resolvePreviewSrc returns string for blob url', () => {
    const src = resolvePreviewSrc('image', null, 'blob:http://localhost/x');
    assert.equal(src, 'blob:http://localhost/x');
  });

  it('resolvePreviewSrc ignores non-string url', () => {
    assert.equal(resolvePreviewSrc('image', { thumbUrl: {} }, null), null);
    assert.equal(resolvePreviewSrc('image', null, { foo: 1 }), null);
  });
});
