import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getStudioOpAvailability, buildMissingKeyMessage } from '../packages/studio/src/studioOpAvailability.js';

describe('buildMissingKeyMessage', () => {
  it('uses provider label only (no Muapi-mandatory upload copy)', () => {
    const msg = buildMissingKeyMessage('image', 'upload', 'muapi');
    assert.match(msg, /Add API key for/i);
    assert.match(msg, /API Settings/i);
    assert.doesNotMatch(msg, /Muapi storage/i);
  });

  it('runware missing key message names Runware', () => {
    const msg = buildMissingKeyMessage('image', 'upload', 'runware');
    assert.match(msg, /Runware/i);
  });
});

describe('getStudioOpAvailability', () => {
  it('upload allows local staging without API key', () => {
    const avail = getStudioOpAvailability('image', 'upload', {
      routingMode: 'runware-first',
      muapiKey: '',
      runwareApiKey: '',
      allowMuapiFallback: true,
    });
    assert.equal(avail.canRun, true);
    assert.match(avail.message, /Local preview/i);
    assert.doesNotMatch(avail.message, /Muapi storage/i);
  });

  it('imageT2i with no runware key blocks with runware provider', () => {
    const avail = getStudioOpAvailability('image', 'imageT2i', {
      routingMode: 'runware-first',
      providerOverride: 'runware',
      muapiKey: 'mk',
      runwareApiKey: '',
      allowMuapiFallback: true,
    });
    assert.equal(avail.canRun, false);
    assert.equal(avail.providerId, 'runware');
    assert.match(avail.message, /Add API key for/i);
  });

  it('upload with keys still allows local staging first', () => {
    const avail = getStudioOpAvailability('image', 'upload', {
      routingMode: 'runware-first',
      muapiKey: 'mk',
      runwareApiKey: 'rk',
      allowMuapiFallback: true,
    });
    assert.equal(avail.canRun, true);
    assert.match(avail.message, /Local preview/i);
  });
});
