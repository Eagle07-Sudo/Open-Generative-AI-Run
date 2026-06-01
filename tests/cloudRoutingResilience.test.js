import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPermanentApiError,
  isTransientApiError,
  isProviderCircuitOpen,
  recordProviderFailure,
  recordProviderSuccess,
  resetRoutingCircuitForTests,
} from '../packages/studio/src/cloudRoutingResilience.js';

describe('cloudRoutingResilience', () => {
  beforeEach(() => {
    resetRoutingCircuitForTests();
  });

  it('classifies permanent HTTP errors', () => {
    assert.equal(isPermanentApiError({ status: 401 }), true);
    assert.equal(isPermanentApiError({ status: 429 }), true);
    assert.equal(isTransientApiError({ status: 401 }), false);
  });

  it('classifies transient 5xx errors', () => {
    assert.equal(isTransientApiError({ status: 503 }), true);
    assert.equal(isPermanentApiError({ status: 503 }), false);
  });

  it('opens Runware circuit after three transient failures', () => {
    const err = { status: 503 };
    recordProviderFailure('runware', err);
    recordProviderFailure('runware', err);
    assert.equal(isProviderCircuitOpen('runware'), false);
    recordProviderFailure('runware', err);
    assert.equal(isProviderCircuitOpen('runware'), true);
    recordProviderSuccess('runware');
    assert.equal(isProviderCircuitOpen('runware'), false);
  });
});
