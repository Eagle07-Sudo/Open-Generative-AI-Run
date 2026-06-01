import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  tierToRunwareResolution,
  detectImageModelFamily,
  catalogSupportsTierResolutionPreset,
  shouldUseTierResolutionPreset,
  applyImageInferenceDimensions,
  assertRunwareImagePayload,
  formatRunwareErrorForStudio,
} from '../packages/studio/src/providers/runwareImagePayload.js';
import { runwareI2iModels } from '../packages/studio/src/models.runware.i2i.js';

describe('runwareImagePayload', () => {
  it('tierToRunwareResolution maps tiers to Runware presets', () => {
    assert.equal(tierToRunwareResolution('1k'), '1K');
    assert.equal(tierToRunwareResolution('2K'), '2K');
    assert.equal(tierToRunwareResolution('4k'), '4K');
  });

  it('detectImageModelFamily identifies preset-capable models', () => {
    assert.equal(detectImageModelFamily('runware:nano-banana@2'), 'google');
    assert.equal(detectImageModelFamily('runware:seedream@5-lite'), 'google');
    assert.equal(detectImageModelFamily('google:4@3'), 'google');
    assert.equal(detectImageModelFamily('openai:gpt-image@2'), 'openai');
    assert.equal(detectImageModelFamily('runware:flux@2-pro'), 'flux');
  });

  it('catalogSupportsTierResolutionPreset reads catalog resolution enum', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-nano-banana-2-i2i');
    assert.ok(catalog);
    assert.equal(catalogSupportsTierResolutionPreset(catalog), true);
  });

  it('shouldUseTierResolutionPreset is false for OpenAI', () => {
    assert.equal(shouldUseTierResolutionPreset(null, 'openai:gpt-image@2'), false);
  });

  it('applyImageInferenceDimensions uses resolution for nano-banana with refs', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-nano-banana-2-i2i');
    const task = {
      model: 'google:4@3',
      width: 1024,
      height: 1024,
      inputs: { referenceImages: ['550e8400-e29b-41d4-a716-446655440000'] },
    };
    applyImageInferenceDimensions(task, { resolution: '1k' }, catalog);
    assert.equal(task.resolution, '1K');
    assert.equal(task.width, undefined);
    assert.equal(task.height, undefined);
  });

  it('applyImageInferenceDimensions uses resolution for seedream i2i with refs', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-seedream-5-lite-i2i');
    assert.ok(catalog);
    const task = {
      model: 'runware:seedream@5-lite',
      width: 2048,
      height: 2048,
      inputs: { referenceImages: ['uuid-ref'] },
    };
    applyImageInferenceDimensions(task, { resolution: '2k' }, catalog);
    assert.equal(task.resolution, '2K');
    assert.equal(task.width, undefined);
  });

  it('applyImageInferenceDimensions keeps width/height for flux i2i with refs', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-flux-2-pro-i2i');
    assert.ok(catalog);
    const task = {
      model: 'runware:flux@2-pro',
      width: 1024,
      height: 1024,
      inputs: { referenceImages: ['uuid-ref'] },
    };
    applyImageInferenceDimensions(task, { resolution: '1k' }, catalog);
    assert.equal(task.resolution, undefined);
    assert.equal(task.width, 1024);
    assert.equal(task.height, 1024);
  });

  it('assertRunwareImagePayload rejects @mentions in prompt', () => {
    assert.throws(
      () =>
        assertRunwareImagePayload({
          taskType: 'imageInference',
          positivePrompt: '@image1 night',
        }),
      /@mentions/,
    );
  });

  it('assertRunwareImagePayload rejects resolution with width/height', () => {
    assert.throws(
      () =>
        assertRunwareImagePayload({
          taskType: 'imageInference',
          resolution: '1K',
          width: 1024,
          height: 1024,
        }),
      /resolution/,
    );
  });

  it('formatRunwareErrorForStudio maps 400 with code', () => {
    const msg = formatRunwareErrorForStudio({
      status: 400,
      code: 'invalidPayload',
      message: 'Runware API failed: 400 - x',
    });
    assert.match(msg, /rejected this image request/);
    assert.match(msg, /invalidPayload/);
  });

  it('formatRunwareErrorForStudio maps insufficient credits', () => {
    const msg = formatRunwareErrorForStudio({
      status: 400,
      code: 'thirdPartyInsufficientCredits',
      message:
        'Runware API failed: 400 - External inference tasks require a paid invoice or at least $5 credit.',
    });
    assert.match(msg, /billing required/i);
    assert.match(msg, /my\.runware\.ai\/wallet/);
  });
});
