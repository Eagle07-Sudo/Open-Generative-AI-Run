#!/usr/bin/env node
/**
 * Validate Runware static catalog (AIR, provenance, cutoff, manifest parity).
 * Usage: node scripts/sync-runware-catalog.mjs --validate [--provenance]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studioSrc = join(root, 'packages/studio/src');
const manifestPath = join(studioSrc, 'data/runware-release-manifest.json');

const AIR_PATTERN = /^(runware|civitai|openai|google):/;
const PLACEHOLDER_IDS = new Set(['runware:500@1', 'runware:600@1']);
const RELEASE_CUTOFF = '2025-01-01';
const MIN_COUNTS = { image: 12, video: 8, audio: 5, i2i: 15, i2v: 15, v2v: 3 };

async function loadCatalogs() {
  const base = pathToFileURL(join(studioSrc, 'models.runware.js')).href;
  const video = pathToFileURL(join(studioSrc, 'models.runware.video.js')).href;
  const audio = pathToFileURL(join(studioSrc, 'models.runware.audio.js')).href;
  const i2i = pathToFileURL(join(studioSrc, 'models.runware.i2i.js')).href;
  const i2v = pathToFileURL(join(studioSrc, 'models.runware.i2v.js')).href;
  const v2v = pathToFileURL(join(studioSrc, 'models.runware.v2v.js')).href;
  const { runwareT2iModels } = await import(base);
  const { runwareVideoModels } = await import(video);
  const { runwareAudioModels } = await import(audio);
  const { runwareI2iModels } = await import(i2i);
  const { runwareI2vModels } = await import(i2v);
  const { runwareV2vModels } = await import(v2v);
  return {
    image: runwareT2iModels,
    video: runwareVideoModels,
    audio: runwareAudioModels,
    i2i: runwareI2iModels,
    i2v: runwareI2vModels,
    v2v: runwareV2vModels,
  };
}

function validateProvenance(entry) {
  const errors = [];
  if (!entry.releaseDate) errors.push(`${entry.id}: missing releaseDate`);
  else if (entry.releaseDate < RELEASE_CUTOFF) {
    errors.push(`${entry.id}: releaseDate ${entry.releaseDate} before cutoff`);
  }
  if (!entry.provenance?.docUrl) errors.push(`${entry.id}: missing provenance.docUrl`);
  if (!entry.provenance?.verifiedAt) errors.push(`${entry.id}: missing provenance.verifiedAt`);
  return errors;
}

function validateEntry(entry, checkProvenance) {
  const errors = [];
  if (!entry.id?.startsWith('rw-')) errors.push(`${entry.id}: id must start with rw-`);
  if (!AIR_PATTERN.test(entry.runwareModel || '')) {
    errors.push(`${entry.id}: invalid runwareModel ${entry.runwareModel}`);
  }
  if (PLACEHOLDER_IDS.has(entry.runwareModel)) {
    errors.push(`${entry.id}: placeholder runwareModel ${entry.runwareModel}`);
  }
  if (entry.status === 'deprecated') return errors;
  if (checkProvenance) errors.push(...validateProvenance(entry));
  return errors;
}

function buildManifestFromCatalog(catalogs) {
  /** @type {Record<string, { releaseDate: string, provenance: object }>} */
  const manifest = {};
  for (const models of Object.values(catalogs)) {
    for (const m of models) {
      if (m.runwareModel && m.releaseDate) {
        manifest[m.runwareModel] = {
          releaseDate: m.releaseDate,
          provenance: m.provenance,
        };
      }
    }
  }
  return manifest;
}

function checkManifestParity(catalogs, manifest) {
  const errors = [];
  for (const models of Object.values(catalogs)) {
    for (const m of models) {
      const row = manifest[m.runwareModel];
      if (!row) {
        errors.push(`${m.id}: missing from runware-release-manifest.json (${m.runwareModel})`);
        continue;
      }
      if (row.releaseDate !== m.releaseDate) {
        errors.push(`${m.id}: manifest releaseDate mismatch for ${m.runwareModel}`);
      }
    }
  }
  return errors;
}

async function main() {
  const validate = process.argv.includes('--validate');
  const checkProvenance = process.argv.includes('--provenance') || validate;
  const writeManifest = process.argv.includes('--write-manifest');

  if (!validate && !writeManifest) {
    console.log('Usage: node scripts/sync-runware-catalog.mjs --validate [--provenance] [--write-manifest]');
    process.exit(0);
  }

  const catalogs = await loadCatalogs();
  let failed = false;

  for (const [modality, models] of Object.entries(catalogs)) {
    const min = MIN_COUNTS[modality];
    if (models.length < min) {
      console.error(`FAIL: ${modality} catalog has ${models.length} models (min ${min})`);
      failed = true;
    }
    for (const m of models) {
      for (const err of validateEntry(m, checkProvenance)) {
        console.error(`FAIL: ${err}`);
        failed = true;
      }
    }
    console.log(`OK: ${modality} — ${models.length} live models`);
  }

  readFileSync(join(studioSrc, 'schemas/runwareModelEntry.schema.json'), 'utf8');
  console.log('OK: schema present');

  const manifest = buildManifestFromCatalog(catalogs);
  if (writeManifest) {
    mkdirSync(join(studioSrc, 'data'), { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`OK: wrote ${manifestPath} (${Object.keys(manifest).length} entries)`);
  }

  if (validate) {
    let diskManifest = manifest;
    try {
      diskManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    } catch {
      console.error(`FAIL: could not read ${manifestPath} — run with --write-manifest first`);
      failed = true;
    }
    if (!failed) {
      for (const err of checkManifestParity(catalogs, diskManifest)) {
        console.error(`FAIL: ${err}`);
        failed = true;
      }
      if (!failed) console.log('OK: manifest parity');
    }
  }

  if (failed) process.exit(1);
  console.log('sync-runware-catalog: validation passed');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
