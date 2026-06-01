import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import {
  uploadImageToRunware,
  resolveRunwareAsset,
  registerInferenceByLabel,
  clearAssetRegistryForTests,
} from '../packages/studio/src/providers/runwareUpload.js';

describe('runwareUpload', () => {
  beforeEach(() => {
    clearAssetRegistryForTests();
  });

  it('resolveRunwareAsset returns imageUUID by label', () => {
    registerInferenceByLabel('image1', 'uuid-123', 'image');
    assert.equal(resolveRunwareAsset('image1'), 'uuid-123');
  });

  it('resolveRunwareAsset passthrough https', () => {
    assert.equal(resolveRunwareAsset('https://example.com/x.png'), 'https://example.com/x.png');
  });

  it('uploadImageToRunware posts imageUpload and returns imageUUID', async () => {
    const taskUUID = '11111111-1111-4111-8111-111111111111';
    const originalRandomUUID = crypto.randomUUID;
    crypto.randomUUID = () => taskUUID;

    const fetchMock = mock.fn(async () => ({
      ok: true,
      text: async () =>
        JSON.stringify({
          data: {
            taskType: 'imageUpload',
            taskUUID,
            imageUUID: 'img-uuid-456',
          },
        }),
    }));
    globalThis.fetch = fetchMock;

    const tinyPng = new File(
      [new Uint8Array([137, 80, 78, 71])],
      't.png',
      { type: 'image/png' },
    );

    try {
      const imageUUID = await uploadImageToRunware('test-key', tinyPng);
      assert.equal(imageUUID, 'img-uuid-456');
      registerInferenceByLabel('image1', imageUUID, 'image');
      assert.equal(resolveRunwareAsset('image1'), 'img-uuid-456');
      assert.equal(fetchMock.mock.calls.length, 1);
      const body = JSON.parse(fetchMock.mock.calls[0].arguments[1].body);
      assert.equal(body[0].taskType, 'imageUpload');
      assert.match(body[0].image, /^data:image\//);
    } finally {
      crypto.randomUUID = originalRandomUUID;
      mock.restoreAll();
    }
  });
});
