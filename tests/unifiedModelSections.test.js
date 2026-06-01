import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  getUnifiedModelSections,
  getVisibleProviderIdsForPicker,
} from '../packages/studio/src/modelRegistry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/model-picker-matrix.json'), 'utf8')
);

describe('getVisibleProviderIdsForPicker', () => {
  for (const row of matrix.filter((r) => r.expectedSectionIds)) {
    it(row.id, () => {
      const ids = getVisibleProviderIdsForPicker({
        routingMode: row.routingMode,
        muapiKey: row.keys.muapi ? 'muapi-key' : '',
        runwareApiKey: row.keys.runware ? 'runware-key' : '',
        catalogMode: row.imageMode === 'i2i' ? 'i2i' : 't2i',
      });
      assert.deepEqual(ids, row.expectedSectionIds);
    });
  }
});

describe('getUnifiedModelSections image', () => {
  it('runware-first with both keys has models in both sections', () => {
    const sections = getUnifiedModelSections('image', {
      routingMode: 'runware-first',
      muapiKey: 'm',
      runwareApiKey: 'r',
      catalogMode: 't2i',
    });
    assert.equal(sections.length, 2);
    assert.ok(sections[0].models.length >= 12);
    assert.ok(sections[1].models.length >= 10);
  });

  it('runware models sorted newest releaseDate first', () => {
    const sections = getUnifiedModelSections('image', {
      routingMode: 'runware-first',
      muapiKey: 'm',
      runwareApiKey: 'r',
      catalogMode: 't2i',
    });
    const runware = sections.find((s) => s.providerId === 'runware')?.models || [];
    for (let i = 1; i < runware.length; i += 1) {
      assert.ok(
        (runware[i - 1].releaseDate || '') >= (runware[i].releaseDate || ''),
        `sort order at ${i}: ${runware[i - 1].id} vs ${runware[i].id}`,
      );
    }
  });
});
