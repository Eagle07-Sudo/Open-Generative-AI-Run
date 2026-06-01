import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { segmentizePromptText, mentionSegmentClassName } from '../packages/studio/src/media/mentionHighlight.js';

describe('segmentizePromptText', () => {
  it('marks known @image1 as active', () => {
    const segs = segmentizePromptText('@image1 make it night', { assetLabels: ['image1'] });
    assert.equal(segs[0].type, 'active');
    assert.equal(segs[0].text, '@image1');
    assert.equal(segs[1].type, 'plain');
    assert.ok(segs[1].text.includes('make it night'));
  });

  it('marks unknown @image9 as invalid', () => {
    const segs = segmentizePromptText('@image9 test', { assetLabels: ['image1'] });
    assert.equal(segs[0].type, 'invalid');
  });

  it('highlights pending @query while popup open', () => {
    const segs = segmentizePromptText('hi @ima', {
      assetLabels: ['image1'],
      pendingAt: 3,
      pendingQuery: 'ima',
      popupOpen: true,
    });
    assert.equal(segs[0].type, 'plain');
    assert.equal(segs[0].text, 'hi ');
    assert.equal(segs[1].type, 'pending');
    assert.equal(segs[1].text, '@ima');
  });

  it('mentionSegmentClassName returns distinct styles', () => {
    assert.ok(mentionSegmentClassName('active').includes('text-primary'));
    assert.ok(mentionSegmentClassName('invalid').includes('amber'));
    assert.ok(mentionSegmentClassName('pending').includes('italic'));
  });
});
