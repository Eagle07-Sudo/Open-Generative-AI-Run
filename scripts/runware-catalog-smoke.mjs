#!/usr/bin/env node
/**
 * Runware catalog smoke — static (--dry-run) or live (--live, RUNWARE_API_KEY).
 * Usage: node scripts/runware-catalog-smoke.mjs [--dry-run|--live] [--quarantine-report]
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studioSrc = join(root, 'packages/studio/src');

const LIVE = process.argv.includes('--live');
const DRY = process.argv.includes('--dry-run') || !LIVE;

async function loadAllRunwareEntries() {
  const files = [
    ['models.runware.js', 'runwareT2iModels'],
    ['models.runware.video.js', 'runwareVideoModels'],
    ['models.runware.audio.js', 'runwareAudioModels'],
    ['models.runware.i2i.js', 'runwareI2iModels'],
    ['models.runware.i2v.js', 'runwareI2vModels'],
    ['models.runware.v2v.js', 'runwareV2vModels'],
  ];
  /** @type {object[]} */
  const entries = [];
  for (const [file, exportName] of files) {
    try {
      const mod = await import(pathToFileURL(join(studioSrc, file)).href);
      const list = mod[exportName] || [];
      for (const m of list) {
        if (m.status !== 'deprecated') entries.push(m);
      }
    } catch {
      /* optional */
    }
  }
  return entries;
}

function staticCheck(entry) {
  const errors = [];
  if (!entry.runwareModel) errors.push('missing runwareModel');
  if (!entry.id?.startsWith('rw-')) errors.push('invalid id');
  if (!entry.releaseDate) errors.push('missing releaseDate');
  if (!entry.provenance?.docUrl) errors.push('missing provenance.docUrl');
  return errors.length ? { status: 'INVALID_MODEL', errors } : { status: 'PASS' };
}

async function liveCheck(entry, postTasks, apiKey) {
  const { buildImageTask, buildVideoTask, buildAudioTask } = await import(
    pathToFileURL(join(studioSrc, 'providers/runwareTaskBuilder.js')).href
  );
  const taskUUID = crypto.randomUUID();
  let task;
  if (entry.taskProfile?.startsWith('video')) {
    task = buildVideoTask(
      entry,
      { model: entry.id, prompt: 'smoke test', aspect_ratio: '16:9', duration: 5 },
      taskUUID,
    );
  } else if (entry.taskProfile?.startsWith('audio')) {
    task = buildAudioTask(entry, { model: entry.id, prompt: 'smoke test' }, taskUUID);
  } else {
    task = buildImageTask(entry, { model: entry.id, prompt: 'smoke test', aspect_ratio: '1:1' }, taskUUID);
  }
  try {
    await postTasks(apiKey, [task]);
    return { status: 'PASS' };
  } catch (err) {
    const status = err.status;
    if (status === 401 || status === 403) return { status: 'AUTH', message: err.message };
    if (String(err.message).includes('INVALID') || status === 400) {
      return { status: 'INVALID_MODEL', message: err.message };
    }
    if (String(err.message).match(/timeout|504/i)) return { status: 'TIMEOUT', message: err.message };
    return { status: 'INVALID_MODEL', message: err.message };
  }
}

async function main() {
  const entries = await loadAllRunwareEntries();
  const apiKey = process.env.RUNWARE_API_KEY || '';

  if (LIVE && !apiKey) {
    console.error('runware-catalog-smoke --live requires RUNWARE_API_KEY in environment');
    process.exit(1);
  }

  let postTasks;
  if (LIVE) {
    ({ postTasks } = await import(pathToFileURL(join(studioSrc, 'providers/runwareClient.js')).href));
  }

  const results = [];
  for (const entry of entries) {
    const outcome = DRY
      ? staticCheck(entry)
      : await liveCheck(entry, postTasks, apiKey);
    results.push({ id: entry.id, runwareModel: entry.runwareModel, ...outcome });
  }

  const summary = {
    mode: LIVE ? 'live' : 'dry-run',
    total: results.length,
    pass: results.filter((r) => r.status === 'PASS').length,
    invalid: results.filter((r) => r.status === 'INVALID_MODEL').length,
    auth: results.filter((r) => r.status === 'AUTH').length,
    timeout: results.filter((r) => r.status === 'TIMEOUT').length,
  };

  console.log(
    JSON.stringify(
      { summary, failures: results.filter((r) => r.status !== 'PASS').slice(0, 10) },
      null,
      2,
    ),
  );

  if (process.argv.includes('--quarantine-report')) {
    const reportPath = join(root, 'tests/fixtures/runware-smoke-report.json');
    writeFileSync(
      reportPath,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
    );
    console.log(`Wrote ${reportPath}`);
  }

  if (LIVE && (summary.invalid > 0 || summary.auth > 0)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
