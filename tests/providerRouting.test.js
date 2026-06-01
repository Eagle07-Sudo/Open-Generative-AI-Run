import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { resolveProviderForOp } from '../packages/studio/src/studioCloud.js';
import { supportsStudioOp } from '../packages/studio/src/providers/capabilities.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const matrix = JSON.parse(
  readFileSync(join(__dirname, 'fixtures/routing-matrix.json'), 'utf8')
);

describe('resolveProviderForOp (golden matrix)', () => {
  for (const row of matrix) {
    it(row.id, () => {
      const muapiKey = row.keys.muapi ? 'muapi-test-key' : '';
      const runwareApiKey = row.keys.runware ? 'runware-test-key' : '';

      const result = resolveProviderForOp(row.studioId, row.op, {
        routingMode: row.routingMode,
        perStudioRouting: row.perStudioRouting || {},
        providerOverride: row.providerOverride,
        muapiKey,
        runwareApiKey,
        allowMuapiFallback: row.allowMuapiFallback !== false,
      });

      if (row.blockReason) {
        assert.equal(result.blockReason, row.blockReason);
        if (row.expectedProvider) {
          assert.equal(result.providerId, row.expectedProvider);
        }
        return;
      }

      assert.equal(result.providerId, row.expectedProvider);
      assert.equal(result.usedFallback, Boolean(row.usedFallback));
      assert.ok(result.apiKey);
    });
  }
});

describe('agents/workflows never runware', () => {
  it('agents op on runware-first', () => {
    const r = resolveProviderForOp('agents', 'agents', {
      routingMode: 'runware-first',
      muapiKey: 'm',
      runwareApiKey: 'r',
    });
    assert.equal(r.providerId, 'muapi');
  });

  it('workflows op on runware-only media mode', () => {
    const r = resolveProviderForOp('workflows', 'workflow', {
      routingMode: 'runware-only',
      muapiKey: 'm',
      runwareApiKey: 'r',
    });
    assert.equal(r.providerId, 'muapi');
  });
});

describe('capabilities', () => {
  it('runware has imageT2i not agents', () => {
    assert.equal(supportsStudioOp('runware', 'imageT2i'), true);
    assert.equal(supportsStudioOp('runware', 'agents'), false);
  });
});
