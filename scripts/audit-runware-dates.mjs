#!/usr/bin/env node
/** Audit Runware catalog vs release cutoff. */

import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RELEASE_CUTOFF = '2025-01-01';
const studioSrc = join(dirname(fileURLToPath(import.meta.url)), '..', 'packages/studio/src');

async function loadAll() {
  const { runwareT2iModels } = await import(pathToFileURL(join(studioSrc, 'models.runware.js')).href);
  const { runwareVideoModels } = await import(pathToFileURL(join(studioSrc, 'models.runware.video.js')).href);
  const { runwareAudioModels } = await import(pathToFileURL(join(studioSrc, 'models.runware.audio.js')).href);
  return [...runwareT2iModels, ...runwareVideoModels, ...runwareAudioModels];
}

async function main() {
  const models = await loadAll();
  let gaps = 0;
  for (const m of models) {
    if (!m.releaseDate || !m.provenance?.docUrl) {
      console.log(`GAP      ${m.id}  missing releaseDate or provenance`);
      gaps += 1;
    } else if (m.releaseDate < RELEASE_CUTOFF) {
      console.log(`REMOVE   ${m.id}  releaseDate=${m.releaseDate}`);
      gaps += 1;
    }
  }
  console.log(`audit-runware-dates: ${models.length} live, ${gaps} issues`);
  if (gaps > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
