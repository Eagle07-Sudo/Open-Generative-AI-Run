import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  expandModelInput,
  getModelInputOptions,
  getModelInputDefault,
  getQualityOptionsForModel,
  getModelInputOptionsForField,
  getReferenceInputLimits,
  getModelInputSchema,
  isRangeModelInput,
} from '../packages/studio/src/modelInputResolver.js';
import { imageTierToRunwareSize, normalizeImageTier } from '../packages/studio/src/providers/runwareImageTier.js';
import {
  buildImageTask,
  buildVideoTask,
  normalizeVideoAspectRatio,
} from '../packages/studio/src/providers/runwareTaskBuilder.js';
import { runwareI2vModels } from '../packages/studio/src/models.runware.i2v.js';
import { runwareT2iModels } from '../packages/studio/src/models.runware.js';
import { runwareVideoModels } from '../packages/studio/src/models.runware.video.js';
import { runwareI2iModels } from '../packages/studio/src/models.runware.i2i.js';
import { getMaxImagesForI2IModel } from '../packages/studio/src/modelRegistry.js';

describe('expandModelInput', () => {
  it('expands duration min/max/step', () => {
    const vals = expandModelInput({ minValue: 5, maxValue: 15, step: 5 });
    assert.deepEqual(vals, [5, 10, 15]);
  });

  it('prefers enum when present', () => {
    assert.deepEqual(expandModelInput({ enum: ['720p', '1080p'] }), ['720p', '1080p']);
  });
});

describe('modelInputResolver golden cases', () => {
  it('Runware Nano Banana Pro exposes 1k/2k/4k resolution', () => {
    const opts = getQualityOptionsForModel('rw-nano-banana-pro', 'runware', 't2i');
    assert.deepEqual(opts, ['1k', '2k', '4k']);
    assert.equal(getModelInputDefault('rw-nano-banana-pro', 'resolution', 'runware', 't2i'), '1k');
  });

  it('Runware Nano Banana 2 Edit AR includes auto via muapiId fallback', () => {
    const ars = getModelInputOptions('rw-nano-banana-2-i2i', 'aspect_ratio', 'runware', 'i2i');
    assert.ok(ars.includes('auto'));
    assert.ok(ars.includes('16:9'));
  });

  it('Runware Nano Banana 2 Edit exposes 1k/2k/4k resolution in catalog', () => {
    const res = getModelInputOptionsForField('rw-nano-banana-2-i2i', 'resolution', 'runware', 'i2i');
    assert.deepEqual(res, ['1k', '2k', '4k']);
  });

  it('Seedance Fast duration range 4–15 and resolution 480p/720p only', () => {
    const schema = getModelInputSchema('rw-seedance-2-fast', 'duration', 'runware', 't2v');
    assert.ok(isRangeModelInput(schema));
    assert.equal(schema.minValue, 4);
    assert.equal(schema.maxValue, 15);
    const durations = getModelInputOptions('rw-seedance-2-fast', 'duration', 'runware', 't2v');
    assert.deepEqual(durations, [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    const resolutions = getModelInputOptions('rw-seedance-2-fast', 'resolution', 'runware', 't2v');
    assert.deepEqual(resolutions, ['480p', '720p']);
    assert.ok(!resolutions.includes('1080p'));
    assert.equal(getModelInputDefault('rw-seedance-2-fast', 'resolution', 'runware', 't2v'), '720p');
    const ars = getModelInputOptions('rw-seedance-2-fast', 'aspect_ratio', 'runware', 't2v');
    assert.deepEqual(ars, ['auto', '16:9', '9:16', '4:3', '3:4', '1:1', '21:9']);
    assert.equal(getModelInputDefault('rw-seedance-2-fast', 'aspect_ratio', 'runware', 't2v'), 'auto');
  });

  it('Seedance I2V matches T2V duration and resolution caps', () => {
    const i2v = runwareI2vModels.find((m) => m.id === 'rw-seedance-2-fast-i2v');
    assert.ok(i2v);
    assert.ok(isRangeModelInput(i2v.inputs.duration));
    const resolutions = getModelInputOptions('rw-seedance-2-fast-i2v', 'resolution', 'runware', 'i2v');
    assert.deepEqual(resolutions, ['480p', '720p']);
    assert.ok(i2v.supportsGeneratedAudio);
  });

  it('GPT Image 2 exposes quality without auto and resolution tiers', () => {
    const quality = getModelInputOptionsForField('rw-gpt-image-2', 'quality', 'runware', 't2i');
    assert.deepEqual(quality, ['low', 'medium', 'high']);
    assert.ok(!quality.includes('auto'));
    const resolution = getModelInputOptionsForField('rw-gpt-image-2', 'resolution', 'runware', 't2i');
    assert.deepEqual(resolution, ['1k', '2k', '4k']);
  });

  it('Seedance reference input limits 9/3/3', () => {
    assert.deepEqual(getReferenceInputLimits('rw-seedance-2', 'runware', 't2v'), {
      images: 9,
      videos: 3,
      audios: 3,
    });
  });
});

describe('runwareImageTier', () => {
  it('maps 2k + 16:9 to wider pixels', () => {
    const { width, height } = imageTierToRunwareSize('2k', '16:9');
    assert.ok(width > height);
    assert.equal(normalizeImageTier('2K'), '2k');
  });
});

describe('runwareTaskBuilder resolution fidelity', () => {
  it('buildImageTask uses tier pixels for GPT Image 2 at 2k', () => {
    const catalog = runwareT2iModels.find((m) => m.id === 'rw-gpt-image-2');
    assert.ok(catalog);
    const task = buildImageTask(
      catalog,
      {
        model: catalog.id,
        prompt: 'test',
        aspect_ratio: '16:9',
        quality: 'high',
        resolution: '2k',
      },
      'uuid-gpt2',
    );
    assert.ok(task.width >= 2048 || task.height >= 2048);
    assert.equal(task.providerSettings?.openai?.quality, 'high');
  });

  it('buildImageTask uses tier pixels for Nano Banana Pro', () => {
    const catalog = runwareT2iModels.find((m) => m.id === 'rw-nano-banana-pro');
    assert.ok(catalog);
    const task = buildImageTask(
      catalog,
      { model: catalog.id, prompt: 'test', aspect_ratio: '16:9', resolution: '2k' },
      'uuid-tier',
    );
    assert.ok(task.width >= 2048 || task.height >= 2048);
  });

  it('buildVideoTask forwards duration and resolution for Seedance', () => {
    const catalog = runwareVideoModels.find((m) => m.id === 'rw-seedance-2-fast');
    assert.ok(catalog);
    const task = buildVideoTask(
      catalog,
      {
        model: catalog.id,
        prompt: 'dance',
        aspect_ratio: '16:9',
        duration: 15,
        resolution: '720p',
        referenceImages: ['https://example.com/a.png'],
        generateAudio: true,
      },
      'uuid-v',
    );
    assert.equal(task.duration, 15);
    assert.equal(task.width, 1280);
    assert.deepEqual(task.referenceImages, ['https://example.com/a.png']);
    assert.equal(task.settings?.audio, true);
  });

  it('normalizeVideoAspectRatio maps auto to 16:9', () => {
    assert.equal(normalizeVideoAspectRatio('auto'), '16:9');
    assert.equal(normalizeVideoAspectRatio('9:16'), '9:16');
  });

  it('buildVideoTask uses 16:9 pixels when aspect_ratio is auto', () => {
    const catalog = runwareVideoModels.find((m) => m.id === 'rw-seedance-2-fast');
    assert.ok(catalog);
    const task = buildVideoTask(
      catalog,
      {
        model: catalog.id,
        prompt: 'night',
        aspect_ratio: 'auto',
        duration: 8,
        resolution: '720p',
      },
      'uuid-auto',
    );
    assert.equal(task.width, 1280);
    assert.equal(task.height, 720);
    assert.equal(task.duration, 8);
  });
});

describe('getMaxImagesForI2IModel', () => {
  it('resolves Runware id via muapiId for Nano Banana 2 Edit', () => {
    assert.equal(getMaxImagesForI2IModel('rw-nano-banana-2-i2i', 'runware'), 14);
  });
});

describe('Runware T2I Muapi merge', () => {
  it('exposes google_search schema for rw-nano-banana-2 via muapiId', () => {
    const schema = getModelInputSchema('rw-nano-banana-2', 'google_search', 'runware', 't2i');
    assert.equal(schema?.type, 'boolean');
  });
});
