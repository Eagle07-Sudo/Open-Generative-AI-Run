import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { supportsStudioOp } from '../packages/studio/src/providers/capabilities.js';
import { resolveProviderForOp } from '../packages/studio/src/studioCloud.js';

describe('upload capability honesty', () => {
  it('runware advertises upload when adapter exists', () => {
    assert.equal(supportsStudioOp('runware', 'upload'), true);
    assert.equal(supportsStudioOp('muapi', 'upload'), true);
  });
});

describe('resolveProviderForOp upload routing', () => {
  it('runware-first with both keys resolves runware without fallback', () => {
    const r = resolveProviderForOp('image', 'upload', {
      routingMode: 'runware-first',
      muapiKey: 'muapi-test-key',
      runwareApiKey: 'runware-test-key',
      allowMuapiFallback: true,
    });
    assert.equal(r.providerId, 'runware');
    assert.equal(r.usedFallback, false);
    assert.equal(r.blockReason, null);
    assert.ok(r.apiKey);
  });

  it('runware-only without muapi key resolves runware for upload', () => {
    const r = resolveProviderForOp('image', 'upload', {
      routingMode: 'runware-only',
      muapiKey: '',
      runwareApiKey: 'runware-test-key',
      allowMuapiFallback: true,
    });
    assert.equal(r.blockReason, null);
    assert.equal(r.providerId, 'runware');
    assert.ok(r.apiKey);
  });

  it('runware-first runware key only resolves runware', () => {
    const r = resolveProviderForOp('image', 'upload', {
      routingMode: 'runware-first',
      muapiKey: '',
      runwareApiKey: 'runware-test-key',
      allowMuapiFallback: true,
    });
    assert.equal(r.providerId, 'runware');
    assert.equal(r.blockReason, null);
  });
});
