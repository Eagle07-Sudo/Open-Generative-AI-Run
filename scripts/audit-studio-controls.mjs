#!/usr/bin/env node
/**
 * Studio control coverage audit (ADR-012).
 * Fails on P0: resolver exposes options but catalog row missing required inputs.
 */
import { writeFileSync } from 'fs';
import {
  getModelInputOptions,
  getModelInputSchema,
} from '../packages/studio/src/modelInputResolver.js';

const P0_GOLDEN = [
  {
    id: 'rw-nano-banana-2',
    provider: 'runware',
    catalogMode: 't2i',
    studio: 'image-t2i',
    required: ['aspect_ratio', 'resolution'],
  },
  {
    id: 'rw-nano-banana-2-i2i',
    provider: 'runware',
    catalogMode: 'i2i',
    studio: 'image-i2i',
    required: ['aspect_ratio', 'resolution'],
  },
  {
    id: 'rw-seedance-2-fast',
    provider: 'runware',
    catalogMode: 't2v',
    studio: 'video-t2v',
    required: ['aspect_ratio', 'duration', 'resolution'],
  },
  {
    id: 'rw-seedance-2-fast-i2v',
    provider: 'runware',
    catalogMode: 'i2v',
    studio: 'video-i2v',
    required: ['aspect_ratio', 'duration', 'resolution'],
  },
  {
    id: 'rw-gpt-image-2',
    provider: 'runware',
    catalogMode: 't2i',
    studio: 'image-t2i',
    required: ['quality', 'resolution'],
  },
  {
    id: 'rw-seedance-2-fast',
    provider: 'runware',
    catalogMode: 't2v',
    studio: 'video-t2v',
    required: ['seed'],
  },
];

const rows = [];
let failures = 0;

for (const g of P0_GOLDEN) {
  for (const field of g.required) {
    const schema = getModelInputSchema(g.id, field, g.provider, g.catalogMode);
    const options =
      field === 'seed'
        ? schema
          ? ['int (freeform)']
          : []
        : getModelInputOptions(g.id, field, g.provider, g.catalogMode);
    const ok = field === 'seed' ? schema != null : options.length > 0;
    rows.push({
      modelId: g.id,
      studio: g.studio,
      field,
      resolverOptions: options.join(','),
      severity: ok ? 'ok' : 'P0',
    });
    if (!ok) {
      failures += 1;
      console.error(`P0 ${g.id} ${field}: no resolver options (${g.catalogMode})`);
    }
  }
}

const md = [
  '# Studio controls audit (generated)',
  '',
  '| modelId | studio | field | options | severity |',
  '|---------|--------|-------|---------|----------|',
  ...rows.map(
    (r) => `| ${r.modelId} | ${r.studio} | ${r.field} | ${r.resolverOptions || '—'} | ${r.severity} |`,
  ),
  '',
  failures === 0 ? '**Status: PASS**' : `**Status: FAIL (${failures} P0)**`,
].join('\n');

writeFileSync('docs/studio-controls-audit.md', md);
console.log(`audit-studio-controls: ${rows.length} rows, ${failures} P0 failures`);
process.exit(failures > 0 ? 1 : 0);
