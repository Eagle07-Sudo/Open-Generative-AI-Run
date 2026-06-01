import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runwareT2iModels } from '../packages/studio/src/models.runware.js';
import { runwareVideoModels } from '../packages/studio/src/models.runware.video.js';
import { runwareAudioModels } from '../packages/studio/src/models.runware.audio.js';
import {
  buildImageTask,
  buildVideoTask,
  buildAudioTask,
} from '../packages/studio/src/providers/runwareTaskBuilder.js';
import {
  getCatalogSectionIds,
  getUnifiedModelSections,
} from '../packages/studio/src/modelRegistry.js';
import { RELEASE_CUTOFF } from '../packages/studio/src/modelReleaseMeta.js';

const AIR_PATTERN = /^(runware|civitai|openai|google):/;
const PLACEHOLDERS = new Set(['runware:500@1', 'runware:600@1']);

function allEntries() {
  return [
    ...runwareT2iModels.map((m) => ({ ...m, modality: 'image', expectedTaskType: 'imageInference' })),
    ...runwareVideoModels.map((m) => ({ ...m, modality: 'video', expectedTaskType: 'videoInference' })),
    ...runwareAudioModels.map((m) => ({ ...m, modality: 'audio', expectedTaskType: 'audioInference' })),
  ];
}

describe('runware static catalog', () => {
  it('meets minimum model counts', () => {
    assert.ok(runwareT2iModels.length >= 12);
    assert.ok(runwareVideoModels.length >= 8);
    assert.ok(runwareAudioModels.length >= 5);
  });

  it('has no pre-2025 live entries', () => {
    for (const m of allEntries()) {
      assert.ok(m.releaseDate >= RELEASE_CUTOFF, `${m.id} releaseDate ${m.releaseDate}`);
      assert.ok(m.provenance?.docUrl, `${m.id} missing provenance`);
    }
  });

  it('does not include legacy SD 1.5', () => {
    assert.ok(!runwareT2iModels.some((m) => m.id === 'rw-sd-1-5'));
  });

  for (const entry of allEntries()) {
    it(`${entry.id} has valid AIR`, () => {
      assert.match(entry.runwareModel, AIR_PATTERN);
      assert.ok(!PLACEHOLDERS.has(entry.runwareModel), `placeholder ${entry.runwareModel}`);
      assert.equal(entry.provider, 'runware');
      assert.ok(entry.id.startsWith('rw-'));
    });
  }
});

describe('runwareTaskBuilder', () => {
  it('buildVideoTask includes duration for video-sota', () => {
    const catalog = runwareVideoModels.find((m) => m.taskProfile === 'video-sota');
    assert.ok(catalog);
    const task = buildVideoTask(
      catalog,
      { model: catalog.id, prompt: 'test', aspect_ratio: '16:9', duration: 10, resolution: '720p' },
      'uuid-1',
    );
    assert.equal(task.taskType, 'videoInference');
    assert.equal(task.duration, 10);
    assert.equal(task.model, catalog.runwareModel);
  });

  it('buildImageTask maps aspect ratio', () => {
    const catalog = runwareT2iModels.find((m) => m.taskProfile === 'image-standard') || runwareT2iModels[0];
    const task = buildImageTask(
      catalog,
      { model: catalog.id, prompt: 'cat', aspect_ratio: '1:1' },
      'uuid-2',
    );
    assert.equal(task.width, 1024);
    assert.equal(task.height, 1024);
  });

  it('buildImageTask maps OpenAI GPT Image quality', () => {
    const catalog = runwareT2iModels.find((m) => m.id === 'rw-gpt-image-2');
    assert.ok(catalog);
    const task = buildImageTask(
      catalog,
      { model: catalog.id, prompt: 'poster', aspect_ratio: '16:9', quality: 'high' },
      'uuid-openai',
    );
    assert.equal(task.model, 'openai:gpt-image@2');
    assert.equal(task.width, 1536);
    assert.equal(task.providerSettings.openai.quality, 'high');
  });

  it('buildAudioTask uses catalog AIR', () => {
    const catalog = runwareAudioModels[0];
    const task = buildAudioTask(catalog, { model: catalog.id, prompt: 'rain' }, 'uuid-3');
    assert.equal(task.taskType, 'audioInference');
    assert.equal(task.model, catalog.runwareModel);
  });
});

describe('getCatalogSectionIds locked Muapi', () => {
  it('runware-first runware-only key shows both section headers', () => {
    const ids = getCatalogSectionIds({
      routingMode: 'runware-first',
      muapiKey: '',
      runwareApiKey: 'rw-key',
    });
    assert.deepEqual(ids, ['runware', 'muapi']);
  });

  it('getUnifiedModelSections includes Muapi disabledReason without key', () => {
    const sections = getUnifiedModelSections('image', {
      routingMode: 'runware-first',
      muapiKey: '',
      runwareApiKey: 'rw-key',
      catalogMode: 't2i',
    });
    assert.equal(sections.length, 2);
    const muapi = sections.find((s) => s.providerId === 'muapi');
    assert.ok(muapi?.disabledReason?.includes('2025+'));
    assert.equal(muapi?.models.length, 0);
    assert.ok(sections.find((s) => s.providerId === 'runware')?.models.length >= 12);
  });
});
