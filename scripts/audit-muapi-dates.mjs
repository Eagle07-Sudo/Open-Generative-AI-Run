#!/usr/bin/env node
/** Audit Muapi overlay coverage vs models.js catalogs. */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const studioSrc = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages/studio/src');
const W1_TARGET = 0.8;

async function main() {
  const coverage = process.argv.includes('--coverage');
  const { t2iModels, t2vModels, audioModels } = await import(
    pathToFileURL(join(studioSrc, 'models.js')).href,
  );
  const { MUAPI_RELEASE_DATES, MUAPI_W1_SOTA_IDS } = await import(
    pathToFileURL(join(studioSrc, 'models.muapi.releaseDates.js')).href,
  );

  const catalogs = { image: t2iModels, video: t2vModels, audio: audioModels };
  for (const [modality, models] of Object.entries(catalogs)) {
    const missing = models.filter((m) => !MUAPI_RELEASE_DATES[m.id]);
    console.log(`${modality}: ${models.length} total, ${missing.length} without overlay date`);
    if (!coverage) {
      missing.slice(0, 10).forEach((m) => console.log(`  MISSING  ${m.id}`));
      if (missing.length > 10) console.log(`  ... and ${missing.length - 10} more`);
    }
  }

  const w1Covered = MUAPI_W1_SOTA_IDS.filter((id) => MUAPI_RELEASE_DATES[id]).length;
  const w1Ratio = w1Covered / MUAPI_W1_SOTA_IDS.length;
  console.log(`W1 image SOTA coverage: ${w1Covered}/${MUAPI_W1_SOTA_IDS.length} (${(w1Ratio * 100).toFixed(0)}%)`);

  if (coverage && w1Ratio < W1_TARGET) {
    console.error(`FAIL: W1 coverage below ${W1_TARGET * 100}%`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
