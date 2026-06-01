import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeCloudProvider,
  hasCloudSession,
  resolveProviderKey,
  pickFallbackProvider,
  keyConfiguredHint,
  resolveAfterKeyRemoval,
} from '../components/cloudSession.js';

describe('normalizeCloudProvider', () => {
  it('maps runware', () => {
    assert.equal(normalizeCloudProvider('runware'), 'runware');
  });

  it('maps unknown to muapi', () => {
    assert.equal(normalizeCloudProvider('other'), 'muapi');
    assert.equal(normalizeCloudProvider(undefined), 'muapi');
  });
});

describe('hasCloudSession', () => {
  it('runware session requires runware key', () => {
    assert.equal(hasCloudSession('runware', null, 'rk'), true);
    assert.equal(hasCloudSession('runware', 'mk', ''), false);
  });

  it('muapi session requires muapi key', () => {
    assert.equal(hasCloudSession('muapi', 'mk', ''), true);
    assert.equal(hasCloudSession('muapi', null, 'rk'), false);
  });
});

describe('resolveProviderKey', () => {
  it('prefers draft over stored for runware', () => {
    assert.equal(
      resolveProviderKey('runware', '', 'old', '', 'new'),
      'new'
    );
  });

  it('falls back to stored when draft empty', () => {
    assert.equal(
      resolveProviderKey('muapi', 'stored', '', '', ''),
      'stored'
    );
  });
});

describe('pickFallbackProvider', () => {
  it('keeps stored when valid', () => {
    assert.equal(pickFallbackProvider('runware', '', 'rk'), 'runware');
  });

  it('falls back to muapi when runware orphan', () => {
    assert.equal(pickFallbackProvider('runware', 'mk', ''), 'muapi');
  });

  it('falls back to runware when muapi orphan', () => {
    assert.equal(pickFallbackProvider('muapi', '', 'rk'), 'runware');
  });

  it('returns stored when neither has key', () => {
    assert.equal(pickFallbackProvider('runware', '', ''), 'runware');
  });
});

describe('resolveAfterKeyRemoval', () => {
  it('clears runware only while muapi remains', () => {
    const r = resolveAfterKeyRemoval('runware', 'mk', 'rk', 'muapi');
    assert.equal(r.nextMuapi, 'mk');
    assert.equal(r.nextRunware, '');
    assert.equal(r.nextCloudProvider, 'muapi');
    assert.equal(r.hasAnySession, true);
  });

  it('falls back to runware when active muapi key removed', () => {
    const r = resolveAfterKeyRemoval('muapi', 'mk', 'rk', 'muapi');
    assert.equal(r.nextMuapi, '');
    assert.equal(r.nextRunware, 'rk');
    assert.equal(r.nextCloudProvider, 'runware');
    assert.equal(r.hasAnySession, true);
  });

  it('has no session when last key removed', () => {
    const r = resolveAfterKeyRemoval('runware', '', 'rk', 'runware');
    assert.equal(r.nextRunware, '');
    assert.equal(r.hasAnySession, false);
  });

  it('clears muapi when runware active and muapi removed from settings', () => {
    const r = resolveAfterKeyRemoval('muapi', 'mk', 'rk', 'runware');
    assert.equal(r.nextMuapi, '');
    assert.equal(r.nextRunware, 'rk');
    assert.equal(r.nextCloudProvider, 'runware');
    assert.equal(r.hasAnySession, true);
  });
});

describe('keyConfiguredHint', () => {
  it('returns null for empty', () => {
    assert.equal(keyConfiguredHint(''), null);
  });

  it('masks key prefix', () => {
    assert.equal(keyConfiguredHint('abcdefghijklmnop'), 'abcdefgh••••••••');
  });
});
