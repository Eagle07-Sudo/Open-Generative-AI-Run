#!/usr/bin/env node
/**
 * Validate runware-muapi-parity-matrix.json — G1 gate (ADR-005).
 * Usage: node scripts/validate-parity-matrix.mjs
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const matrixPath = join(root, 'tests/fixtures/runware-muapi-parity-matrix.json');
const schemaPath = join(root, 'packages/studio/src/schemas/parityMatrixEntry.schema.json');

async function loadMuapiIds() {
  const modelsUrl = pathToFileURL(join(root, 'packages/studio/src/models.js')).href;
  const {
    t2iModels,
    t2vModels,
    i2iModels,
    i2vModels,
    v2vModels,
    audioModels,
  } = await import(modelsUrl);
  const ids = new Set();
  for (const arr of [t2iModels, t2vModels, i2iModels, i2vModels, v2vModels, audioModels]) {
    for (const m of arr || []) {
      if (m?.id) ids.add(m.id);
    }
  }
  return ids;
}

async function loadRunwareCatalog() {
  const studioSrc = join(root, 'packages/studio/src');
  const files = [
    'models.runware.js',
    'models.runware.video.js',
    'models.runware.audio.js',
    'models.runware.i2i.js',
    'models.runware.i2v.js',
    'models.runware.v2v.js',
  ];
  /** @type {Map<string, string>} */
  const byId = new Map();
  /** @type {Set<string>} */
  const airs = new Set();
  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(join(studioSrc, file)).href);
      for (const list of Object.values(mod)) {
        if (!Array.isArray(list)) continue;
        for (const m of list) {
          if (m?.id) byId.set(m.id, m.runwareModel);
          if (m?.runwareModel) airs.add(m.runwareModel);
        }
      }
    } catch {
      /* optional catalog */
    }
  }
  return { byId, airs };
}

function validateRow(row, index) {
  const errors = [];
  const prefix = `row[${index}] ${row.id || '?'}:`;
  if (!row.id || !row.muapiId || !row.parityClass) {
    errors.push(`${prefix} missing required fields`);
  }
  if (row.parityClass === 'A') {
    if (!row.runwareCatalogId) errors.push(`${prefix} Class A missing runwareCatalogId`);
    if (!row.runwareAir) errors.push(`${prefix} Class A missing runwareAir`);
    if (!row.adapterOp) errors.push(`${prefix} Class A missing adapterOp`);
  }
  if (row.parityClass === 'B' && !row.exemptionReason) {
    errors.push(`${prefix} Class B missing exemptionReason`);
  }
  return errors;
}

async function main() {
  readFileSync(schemaPath, 'utf8');
  const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
  if (!Array.isArray(matrix)) {
    console.error('Matrix must be an array');
    process.exit(1);
  }

  const muapiIds = await loadMuapiIds();
  const { byId, airs } = await loadRunwareCatalog();

  const errors = [];
  const covered = new Set();
  const seenMuapi = new Set();

  for (let i = 0; i < matrix.length; i += 1) {
    const row = matrix[i];
    errors.push(...validateRow(row, i));
    covered.add(row.muapiId);

    if (seenMuapi.has(row.muapiId)) {
      errors.push(`duplicate muapiId ${row.muapiId}`);
    }
    seenMuapi.add(row.muapiId);

    if (row.parityClass === 'A' && row.runwareCatalogId) {
      const air = byId.get(row.runwareCatalogId);
      if (!air) {
        errors.push(`row[${i}] ${row.muapiId}: unknown runwareCatalogId ${row.runwareCatalogId}`);
      } else if (row.runwareAir && air !== row.runwareAir) {
        errors.push(
          `row[${i}] ${row.muapiId}: AIR mismatch matrix=${row.runwareAir} catalog=${air}`,
        );
      }
    }
    if (row.runwareAir && row.parityClass === 'A' && !airs.has(row.runwareAir)) {
      errors.push(`row[${i}] ${row.muapiId}: orphan runwareAir ${row.runwareAir}`);
    }
  }

  for (const id of muapiIds) {
    if (!covered.has(id)) {
      errors.push(`missing matrix row for muapi id: ${id}`);
    }
  }

  const summary = {
    rows: matrix.length,
    muapiIds: muapiIds.size,
    classA: matrix.filter((r) => r.parityClass === 'A').length,
    classB: matrix.filter((r) => r.parityClass === 'B').length,
    tbd: matrix.filter((r) => r.parityClass === 'TBD').length,
    errors: errors.length,
  };

  if (errors.length) {
    console.error('validate-parity-matrix FAILED');
    console.error(JSON.stringify(summary, null, 2));
    for (const e of errors.slice(0, 30)) console.error(`  - ${e}`);
    if (errors.length > 30) console.error(`  ... and ${errors.length - 30} more`);
    process.exit(1);
  }

  console.log('validate-parity-matrix OK');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
