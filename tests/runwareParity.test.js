import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PROVIDER_CAPABILITIES } from '../packages/studio/src/providers/capabilities.js';
import * as runwareProvider from '../packages/studio/src/providers/runware.js';
import {
  getT2iModelsForProvider,
  getI2iModelsForProvider,
  getI2vModelsForProvider,
  getV2vModelsForProvider,
  getModelsForStudio,
} from '../packages/studio/src/modelRegistry.js';

/** G3: capabilities ↔ catalog ↔ adapter — ADR-005 */
const RUNWARE_OP_CHECKS = [
  { op: 'imageT2i', catalog: () => getT2iModelsForProvider('runware'), adapter: 'generateImage' },
  { op: 'imageI2i', catalog: () => getI2iModelsForProvider('runware'), adapter: 'generateI2I' },
  {
    op: 'videoT2i',
    catalog: () => getModelsForStudio('video', 'runware', { catalogMode: 't2v' }),
    adapter: 'generateVideo',
  },
  {
    op: 'videoI2v',
    catalog: () => getI2vModelsForProvider('runware'),
    adapter: 'generateI2V',
  },
  {
    op: 'videoV2v',
    catalog: () => getV2vModelsForProvider('runware'),
    adapter: 'processV2V',
  },
  {
    op: 'audioT2a',
    catalog: () => getModelsForStudio('audio', 'runware'),
    adapter: 'generateAudio',
  },
];

describe('runwareParity G3 zero drift', () => {
  for (const { op, catalog, adapter } of RUNWARE_OP_CHECKS) {
    it(`${op}: capability matches catalog + adapter`, () => {
      const enabled = Boolean(PROVIDER_CAPABILITIES.runware[op]);
      const models = catalog();
      const hasAdapter = typeof runwareProvider[adapter] === 'function';

      if (enabled) {
        assert.ok(models.length > 0, `${op} enabled but Runware catalog empty`);
        assert.ok(hasAdapter, `${op} enabled but missing runware.${adapter}`);
      } else {
        assert.ok(!hasAdapter || models.length === 0, `${op} disabled but implementation present`);
      }
    });
  }

  it('i2i catalog has at least 15 Class A entries', () => {
    assert.ok(getI2iModelsForProvider('runware').length >= 15);
  });

  it('i2v catalog has at least 15 Class A entries', () => {
    assert.ok(getI2vModelsForProvider('runware').length >= 15);
  });
});
