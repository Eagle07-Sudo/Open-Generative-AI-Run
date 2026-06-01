const test = require('node:test');
const assert = require('node:assert/strict');

/** @type {typeof fetch | null} */
let originalFetch = null;

test.beforeEach(() => {
  originalFetch = global.fetch;
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test('generateImage posts imageInference payload', async () => {
  /** @type {object[] | null} */
  let posted = null;
  global.fetch = async (_url, opts) => {
    posted = JSON.parse(String(opts.body));
    const taskUUID = posted[0].taskUUID;
    return {
      ok: true,
      text: async () =>
        JSON.stringify({
          data: [{ taskUUID, imageURL: 'https://cdn.example/img.png' }],
        }),
    };
  };

  const { generateImage } = await import('../packages/studio/src/providers/runware.js');
  const result = await generateImage('rw-contract-key', {
    model: 'rw-flux-2-pro',
    prompt: 'a red cube',
    aspect_ratio: '1:1',
  });

  assert.ok(posted);
  assert.equal(posted.length, 1);
  assert.equal(posted[0].taskType, 'imageInference');
  assert.equal(posted[0].positivePrompt, 'a red cube');
  assert.equal(posted[0].deliveryMethod, 'sync');
  assert.equal(posted[0].width, 1024);
  assert.equal(posted[0].height, 1024);
  assert.match(posted[0].model, /^runware:/);
  assert.equal(result.ok, true);
  assert.equal(result.url, 'https://cdn.example/img.png');
});

test('generateAudio posts audioInference payload', async () => {
  /** @type {object[] | null} */
  let posted = null;
  global.fetch = async (_url, opts) => {
    posted = JSON.parse(String(opts.body));
    const taskUUID = posted[0].taskUUID;
    return {
      ok: true,
      text: async () =>
        JSON.stringify({
          data: [{ taskUUID, audioURL: 'https://cdn.example/audio.mp3' }],
        }),
    };
  };

  const { generateAudio } = await import('../packages/studio/src/providers/runware.js');
  const result = await generateAudio('rw-contract-key', {
    model: 'rw-eleven-v3',
    prompt: 'soft rain',
  });

  assert.ok(posted);
  assert.equal(posted[0].taskType, 'audioInference');
  assert.equal(posted[0].deliveryMethod, 'async');
  assert.match(posted[0].model, /^runware:/);
  assert.equal(result.ok, true);
  assert.equal(result.url, 'https://cdn.example/audio.mp3');
});

test('generateI2I posts imageInference with referenceImages', async () => {
  /** @type {object[] | null} */
  let posted = null;
  global.fetch = async (_url, opts) => {
    posted = JSON.parse(String(opts.body));
    const taskUUID = posted[0].taskUUID;
    return {
      ok: true,
      text: async () =>
        JSON.stringify({
          data: [{ taskUUID, imageURL: 'https://cdn.example/edit.png' }],
        }),
    };
  };

  const { generateI2I } = await import('../packages/studio/src/providers/runware.js');
  const result = await generateI2I('rw-contract-key', {
    model: 'rw-nano-banana-2-i2i',
    prompt: 'make it blue',
    image_url: 'https://cdn.example/ref.png',
    resolution: '1k',
    aspect_ratio: 'auto',
  });

  assert.ok(posted);
  assert.equal(posted[0].taskType, 'imageInference');
  assert.deepEqual(posted[0].inputs?.referenceImages, ['https://cdn.example/ref.png']);
  assert.equal(posted[0].resolution, '1K');
  assert.equal(posted[0].width, undefined);
  assert.equal(result.url, 'https://cdn.example/edit.png');
});

test('generateI2I strips @mentions from positivePrompt', async () => {
  /** @type {object[] | null} */
  let posted = null;
  global.fetch = async (_url, opts) => {
    posted = JSON.parse(String(opts.body));
    const taskUUID = posted[0].taskUUID;
    return {
      ok: true,
      text: async () =>
        JSON.stringify({
          data: [{ taskUUID, imageURL: 'https://cdn.example/edit2.png' }],
        }),
    };
  };

  const { generateI2I } = await import('../packages/studio/src/providers/runware.js');
  await generateI2I('rw-contract-key', {
    model: 'rw-nano-banana-2-i2i',
    prompt: '@image1 make it night',
    image_url: '550e8400-e29b-41d4-a716-446655440000',
  });

  assert.ok(posted);
  assert.equal(posted[0].positivePrompt, 'make it night');
  assert.ok(!posted[0].positivePrompt.includes('@'));
});
