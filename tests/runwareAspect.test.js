const test = require('node:test');
const assert = require('node:assert/strict');

const { aspectRatioToRunwareSize } = require('../packages/studio/src/providers/runwareAspect.js');

test('aspectRatioToRunwareSize maps 1:1 to 1024 square', () => {
  const size = aspectRatioToRunwareSize('1:1');
  assert.equal(size.width, 1024);
  assert.equal(size.height, 1024);
});

test('aspectRatioToRunwareSize maps 16:9 with 64-aligned dimensions', () => {
  const size = aspectRatioToRunwareSize('16:9');
  assert.equal(size.width % 64, 0);
  assert.equal(size.height % 64, 0);
  assert.ok(size.width > size.height);
});

test('aspectRatioToRunwareSize defaults unknown ratios to 1024', () => {
  const size = aspectRatioToRunwareSize('unknown');
  assert.deepEqual(size, { width: 1024, height: 1024 });
});
