import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getRequiredProviderForTab,
  hasKeyForProvider,
  needsStudioProviderBanner,
  getBannerContext,
} from '../components/studioProviderRequirements.js';

describe('getRequiredProviderForTab', () => {
  it('image + runware cloud uses runware', () => {
    assert.equal(getRequiredProviderForTab('image', 'runware'), 'runware');
  });

  it('video + runware cloud still needs muapi (legacy)', () => {
    assert.equal(getRequiredProviderForTab('video', 'runware'), 'muapi');
  });

  it('video + runware-first routing resolves runware', () => {
    assert.equal(
      getRequiredProviderForTab('video', 'muapi', { routingMode: 'runware-first' }, 'mk', 'rk'),
      'runware'
    );
  });

  it('unknown tab defaults to muapi', () => {
    assert.equal(getRequiredProviderForTab('unknown-tab', 'runware'), 'muapi');
  });
});

describe('hasKeyForProvider', () => {
  it('detects trimmed muapi key', () => {
    assert.equal(hasKeyForProvider('muapi', '  mk  ', ''), true);
    assert.equal(hasKeyForProvider('muapi', null, 'rk'), false);
  });

  it('detects runware key', () => {
    assert.equal(hasKeyForProvider('runware', '', 'rk'), true);
  });
});

describe('needsStudioProviderBanner', () => {
  it('regression: video + runware + both keys — no banner', () => {
    assert.equal(
      needsStudioProviderBanner('video', 'runware', 'mk', 'rk'),
      false
    );
  });

  it('video + runware-first + both keys — no banner', () => {
    assert.equal(
      needsStudioProviderBanner('video', 'muapi', 'mk', 'rk', { routingMode: 'runware-first' }),
      false
    );
  });

  it('video + runware + runware only — banner (legacy)', () => {
    assert.equal(
      needsStudioProviderBanner('video', 'runware', '', 'rk'),
      true
    );
  });

  it('video + runware-first + runware only — no banner', () => {
    assert.equal(
      needsStudioProviderBanner('video', 'runware', '', 'rk', { routingMode: 'runware-first' }),
      false
    );
  });

  it('image + runware + runware only — no shell banner', () => {
    assert.equal(
      needsStudioProviderBanner('image', 'runware', '', 'rk'),
      false
    );
  });

  it('image + muapi + no muapi — banner', () => {
    assert.equal(
      needsStudioProviderBanner('image', 'muapi', '', 'rk'),
      true
    );
  });

  it('agents + runware + muapi key — no banner', () => {
    assert.equal(
      needsStudioProviderBanner('agents', 'runware', 'mk', ''),
      false
    );
  });

  it('unknown tab + no muapi — banner', () => {
    assert.equal(
      needsStudioProviderBanner('future-tab', 'muapi', '', ''),
      true
    );
  });
});

describe('getBannerContext', () => {
  it('returns show false when keys satisfied', () => {
    const ctx = getBannerContext('video', 'runware', 'mk', 'rk');
    assert.equal(ctx.show, false);
  });

  it('returns provider and label when banner needed', () => {
    const ctx = getBannerContext('video', 'runware', '', 'rk');
    assert.equal(ctx.show, true);
    assert.equal(ctx.requiredProvider, 'muapi');
    assert.equal(ctx.studioLabel, 'Video Studio');
  });
});
