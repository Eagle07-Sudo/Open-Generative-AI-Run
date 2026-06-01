import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildImageTask,
  buildI2ITask,
  buildVideoTask,
  buildI2VTask,
  buildV2VTask,
} from '../packages/studio/src/providers/runwareTaskBuilder.js';
import { runwareVideoModels } from '../packages/studio/src/models.runware.video.js';
import { runwareI2iModels } from '../packages/studio/src/models.runware.i2i.js';
import { runwareI2vModels } from '../packages/studio/src/models.runware.i2v.js';
import { runwareV2vModels } from '../packages/studio/src/models.runware.v2v.js';

describe('runwareTaskBuilder video SOTA', () => {
  it('Seedance-style model sends videoInference with duration', () => {
    const catalog = runwareVideoModels.find((m) => m.id === 'rw-seedance-2');
    assert.ok(catalog);
    const task = buildVideoTask(
      catalog,
      {
        model: catalog.id,
        prompt: 'ocean waves',
        aspect_ratio: '16:9',
        duration: 5,
        resolution: '720p',
      },
      'task-uuid',
    );
    assert.equal(task.taskType, 'videoInference');
    assert.equal(task.deliveryMethod, 'async');
    assert.match(task.model, /^runware:/);
    assert.equal(task.duration, 5);
  });

  it('Seedance task includes seed when params.seed set', () => {
    const catalog = runwareVideoModels.find((m) => m.id === 'rw-seedance-2-fast');
    assert.ok(catalog);
    const task = buildVideoTask(
      catalog,
      {
        model: catalog.id,
        prompt: 'test',
        aspect_ratio: '16:9',
        duration: 5,
        resolution: '720p',
        seed: 42,
      },
      'task-seed',
    );
    assert.equal(task.seed, 42);
  });

  it('Seedance task omits seed when not in params', () => {
    const catalog = runwareVideoModels.find((m) => m.id === 'rw-seedance-2-fast');
    assert.ok(catalog);
    const task = buildVideoTask(
      catalog,
      { model: catalog.id, prompt: 'test', aspect_ratio: '16:9', duration: 5 },
      'task-no-seed',
    );
    assert.equal(task.seed, undefined);
  });
});

describe('runwareTaskBuilder i2i/i2v/v2v profiles', () => {
  it('i2i task includes referenceImages', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-nano-banana-2-i2i');
    assert.ok(catalog);
    const task = buildI2ITask(
      catalog,
      { model: catalog.id, prompt: 'edit', image_url: 'https://example.com/a.png' },
      'uuid-i2i',
    );
    assert.equal(task.taskType, 'imageInference');
    assert.deepEqual(task.inputs?.referenceImages, ['https://example.com/a.png']);
  });

  it('i2i task strips @mentions from positivePrompt', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-nano-banana-2-i2i');
    assert.ok(catalog);
    const task = buildI2ITask(
      catalog,
      {
        model: catalog.id,
        prompt: '@image1 night scene',
        image_url: 'https://example.com/a.png',
      },
      'uuid-i2i-mention',
    );
    assert.equal(task.positivePrompt, 'night scene');
    assert.ok(!task.positivePrompt.includes('@'));
  });

  it('flux i2i with refs keeps width/height (no tier preset field)', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-flux-2-pro-i2i');
    assert.ok(catalog);
    const task = buildI2ITask(
      catalog,
      {
        model: catalog.id,
        prompt: 'edit',
        image_url: '550e8400-e29b-41d4-a716-446655440000',
        resolution: '1k',
        aspect_ratio: '1:1',
      },
      'uuid-flux-tier',
    );
    assert.ok(task.width > 0);
    assert.ok(task.height > 0);
    assert.equal(task.resolution, undefined);
    assert.deepEqual(task.inputs?.referenceImages, [
      '550e8400-e29b-41d4-a716-446655440000',
    ]);
  });

  it('nano-banana i2i with tier sends resolution without width/height', () => {
    const catalog = runwareI2iModels.find((m) => m.id === 'rw-nano-banana-2-i2i');
    assert.ok(catalog);
    const task = buildI2ITask(
      catalog,
      {
        model: catalog.id,
        prompt: 'night scene',
        image_url: '550e8400-e29b-41d4-a716-446655440000',
        resolution: '1k',
        aspect_ratio: 'auto',
      },
      'uuid-i2i-tier',
    );
    assert.deepEqual(task.inputs?.referenceImages, [
      '550e8400-e29b-41d4-a716-446655440000',
    ]);
    assert.equal(task.model, 'google:4@3');
    assert.equal(task.resolution, '1K');
    assert.equal(task.width, undefined);
    assert.equal(task.height, undefined);
    assert.equal(task.providerSettings?.google?.safetyTolerance, 'off');
  });

  it('i2v task includes referenceImages', () => {
    const catalog = runwareI2vModels.find((m) => m.id === 'rw-veo-3-1-i2v');
    assert.ok(catalog);
    const task = buildI2VTask(
      catalog,
      { model: catalog.id, prompt: 'animate', image_url: 'https://example.com/a.png', duration: 5 },
      'uuid-i2v',
    );
    assert.equal(task.taskType, 'videoInference');
    assert.deepEqual(task.referenceImages, ['https://example.com/a.png']);
  });

  it('v2v task includes inputVideo', () => {
    const catalog = runwareV2vModels[0];
    assert.ok(catalog);
    const task = buildV2VTask(
      catalog,
      { model: catalog.id, prompt: 'motion', video_url: 'https://example.com/v.mp4' },
      'uuid-v2v',
    );
    assert.equal(task.taskType, 'videoInference');
    assert.equal(task.inputVideo, 'https://example.com/v.mp4');
  });
});
