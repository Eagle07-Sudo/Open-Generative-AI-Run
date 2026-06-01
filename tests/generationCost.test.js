import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateRunwareCost,
  roundCostUsd,
} from '../packages/studio/src/cost/estimateRunwareCost.js';
import { RUNWARE_SEEDANCE_PRICING_HINTS } from '../packages/studio/src/cost/pricingHints.js';
import { formatCostUsd, formatGenerateButtonLabels } from '../packages/studio/src/cost/formatGenerateLabel.js';
import { buildCostPayload } from '../packages/studio/src/cost/buildCostPayload.js';

describe('estimateRunwareCost', () => {
  it('Seedance base 5s 720p', () => {
    assert.equal(
      estimateRunwareCost(RUNWARE_SEEDANCE_PRICING_HINTS, { duration: 5, resolution: '720p' }),
      0.14,
    );
  });

  it('Seedance 10s 1080p costs more', () => {
    const short = estimateRunwareCost(RUNWARE_SEEDANCE_PRICING_HINTS, { duration: 5, resolution: '720p' });
    const long = estimateRunwareCost(RUNWARE_SEEDANCE_PRICING_HINTS, { duration: 10, resolution: '1080p' });
    assert.ok(long > short);
  });

  it('multimodal refs add cost', () => {
    const base = estimateRunwareCost(RUNWARE_SEEDANCE_PRICING_HINTS, { duration: 5, resolution: '720p' });
    const withRefs = estimateRunwareCost(RUNWARE_SEEDANCE_PRICING_HINTS, {
      duration: 5,
      resolution: '720p',
      refImageCount: 2,
      refAudioCount: 1,
    });
    assert.ok(withRefs > base);
  });
});

describe('formatGenerateLabel', () => {
  it('formatCostUsd approximate prefix', () => {
    assert.equal(formatCostUsd(0.14, { approximate: true }), '~$0.14');
    assert.equal(formatCostUsd(0.14), '$0.14');
    assert.equal(formatCostUsd(0.005), '<$0.01');
  });

  it('formatGenerateButtonLabels batch doubles display', () => {
    const labels = formatGenerateButtonLabels({
      unitCostUsd: 0.14,
      batchSize: 2,
      source: 'runware-estimate',
    });
    assert.equal(labels.primary, 'Generate');
    assert.equal(labels.secondary, '~$0.28');
  });

  it('generating hides secondary', () => {
    const labels = formatGenerateButtonLabels({ generating: true, unitCostUsd: 0.14 });
    assert.equal(labels.secondary, null);
  });
});

describe('buildCostPayload', () => {
  it('strips blob urls from images_list', () => {
    const p = buildCostPayload({
      model: 'x',
      images_list: ['blob:http://local', 'image1'],
    });
    assert.deepEqual(p.images_list, ['[staged]', 'image1']);
  });
});

describe('roundCostUsd', () => {
  it('minimum display bucket', () => {
    assert.equal(roundCostUsd(0.004), 0.01);
  });
});
