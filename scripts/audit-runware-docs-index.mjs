#!/usr/bin/env node
/**
 * Compare Runware docs categories vs parity matrix gaps.
 * Usage: node scripts/audit-runware-docs-index.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const matrixPath = join(root, 'tests/fixtures/runware-muapi-parity-matrix.json');

const DOC_BUCKETS = ['t2i', 'i2i', 't2v', 'i2v', 'v2v', 'audio', 'lipsync', 'tools'];

function main() {
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
  const classA = matrix.filter((r) => r.parityClass === 'A');
  const tbd = matrix.filter((r) => r.parityClass === 'TBD');
  const classB = matrix.filter((r) => r.parityClass === 'B');

  const byMode = {};
  for (const row of matrix) {
    byMode[row.mode] = (byMode[row.mode] || 0) + 1;
  }

  console.log(
    JSON.stringify(
      {
        docBuckets: DOC_BUCKETS,
        matrixRows: matrix.length,
        classA: classA.length,
        classB: classB.length,
        tbd: tbd.length,
        byMode,
        tbdSample: tbd.slice(0, 15).map((r) => r.muapiId),
        action: 'Review TBD rows; mark CLASS_B or map Class A with docUrl',
      },
      null,
      2,
    ),
  );
}

main();
