import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { supportsStudioOp, PROVIDER_CAPABILITIES } from '../packages/studio/src/providers/capabilities.js';

describe('providerCapabilities', () => {
  it('muapi supports agents', () => {
    assert.equal(supportsStudioOp('muapi', 'agents'), true);
  });

  it('runware does not support agents or workflow', () => {
    assert.equal(supportsStudioOp('runware', 'agents'), false);
    assert.equal(supportsStudioOp('runware', 'workflow'), false);
  });

  it('runware supports image and video t2i', () => {
    assert.equal(supportsStudioOp('runware', 'imageT2i'), true);
    assert.equal(supportsStudioOp('runware', 'videoT2i'), true);
  });

  it('matrix has both providers defined', () => {
    assert.ok(PROVIDER_CAPABILITIES.muapi);
    assert.ok(PROVIDER_CAPABILITIES.runware);
  });
});
