#!/usr/bin/env node
/**
 * Draft Runware↔Muapi parity matrix from models.js + Runware catalogs.
 * Usage: node scripts/build-parity-matrix-draft.mjs [--write]
 */

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studioSrc = join(root, 'packages/studio/src');
const outPath = join(root, 'tests/fixtures/runware-muapi-parity-matrix.json');

const CLASS_B_PATTERNS = [
  /midjourney/i,
  /sun[o0]/i,
  /hidream/i,
  /^ai-/,
  /^gpt4o/i,
  /mmaudio/i,
  /voice-clone/i,
  /clipping/i,
  /workflow/i,
  /agent/i,
  /design-agent/i,
  /marketing-studio/i,
  /vibe-motion/i,
  /lip-?sync/i,
  /sora-2-pro-image-to-video/i,
  /openai-sora/i,
  /ovi-image-to-video/i,
  /video-watermark-remover/i,
  /ai-video-effects/i,
  /effect/i,
];

/** @type {Record<string, { catalogId: string, air: string, docSlug?: string }>} */
const MUAPI_TO_RUNWARE = {
  'gpt-image-2': { catalogId: 'rw-gpt-image-2', air: 'openai:gpt-image@2', docSlug: 'openai-gpt-image-2' },
  'gpt-image-1.5': { catalogId: 'rw-gpt-image-1-5', air: 'openai:gpt-image@1.5', docSlug: 'openai-gpt-image-1-5' },
  'nano-banana-2': { catalogId: 'rw-nano-banana-2', air: 'google:4@3', docSlug: 'nano-banana-2' },
  'nano-banana-pro': { catalogId: 'rw-nano-banana-pro', air: 'runware:nano-banana@pro', docSlug: 'nano-banana-pro' },
  'seedance-v2.0-t2v': { catalogId: 'rw-seedance-2', air: 'runware:seedance@2.0', docSlug: 'seedance-2-0' },
  'seedance-v2.0-fast-t2v': { catalogId: 'rw-seedance-2-fast', air: 'runware:seedance@2.0-fast', docSlug: 'seedance-2-0-fast' },
  'veo3.1-text-to-video': { catalogId: 'rw-veo-3-1', air: 'runware:veo@3.1', docSlug: 'veo-3-1' },
  'veo3.1-fast-text-to-video': { catalogId: 'rw-veo-3-1-fast', air: 'runware:veo@3.1-fast', docSlug: 'veo-3-1-fast' },
  'veo3.1-lite-text-to-video': { catalogId: 'rw-veo-3-1-lite', air: 'runware:veo@3.1-lite', docSlug: 'veo-3-1-lite' },
  'nano-banana-2-edit': { catalogId: 'rw-nano-banana-2-i2i', air: 'google:4@3', docSlug: 'nano-banana-2' },
  'nano-banana-pro-edit': { catalogId: 'rw-nano-banana-pro-i2i', air: 'runware:nano-banana@pro', docSlug: 'nano-banana-pro' },
  'gpt-image-2-edit': { catalogId: 'rw-gpt-image-2-i2i', air: 'openai:gpt-image@2', docSlug: 'openai-gpt-image-2' },
  'gpt-image-1.5-edit': { catalogId: 'rw-gpt-image-1-5-i2i', air: 'openai:gpt-image@1.5', docSlug: 'openai-gpt-image-1-5' },
  'flux-2-dev-edit': { catalogId: 'rw-flux-2-dev-i2i', air: 'runware:flux@2-dev', docSlug: 'flux-2-dev' },
  'flux-2-pro-edit': { catalogId: 'rw-flux-2-pro-i2i', air: 'runware:flux@2-pro', docSlug: 'flux-2-pro' },
  'flux-2-flex-edit': { catalogId: 'rw-flux-2-flex-i2i', air: 'runware:flux@2-flex', docSlug: 'flux-2-flex' },
  'flux-2-klein-9b-edit': { catalogId: 'rw-flux-2-klein-9b-i2i', air: 'runware:flux@2-klein-9b', docSlug: 'flux-2-klein-9b' },
  'seedream-5.0-edit': { catalogId: 'rw-seedream-5-lite-i2i', air: 'runware:seedream@5-lite', docSlug: 'seedream-5-0-lite' },
  'kling-o1-edit-image': { catalogId: 'rw-kling-image-o3-i2i', air: 'runware:kling@image-o3', docSlug: 'kling-image-o3' },
  'veo3.1-image-to-video': { catalogId: 'rw-veo-3-1-i2v', air: 'runware:veo@3.1', docSlug: 'veo-3-1' },
  'veo3.1-fast-image-to-video': { catalogId: 'rw-veo-3-1-fast-i2v', air: 'runware:veo@3.1-fast', docSlug: 'veo-3-1-fast' },
  'veo3.1-lite-image-to-video': { catalogId: 'rw-veo-3-1-lite-i2v', air: 'runware:veo@3.1-lite', docSlug: 'veo-3-1-lite' },
  'seedance-v2.0-i2v': { catalogId: 'rw-seedance-2-i2v', air: 'runware:seedance@2.0', docSlug: 'seedance-2-0' },
  'kling-v3.0-pro-motion-control': { catalogId: 'rw-kling-video-3-pro-v2v', air: 'runware:kling@video-3-pro', docSlug: 'kling-video-3-0-pro' },
  'kling-v3.0-std-motion-control': { catalogId: 'rw-kling-video-3-4k-v2v', air: 'runware:kling@video-3-4k', docSlug: 'kling-video-3-0-4k' },
};

const TOKEN_MAP = [
  ['seedance', 'rw-seedance-2'],
  ['veo3.1', 'rw-veo-3-1'],
  ['veo3', 'rw-veo-3-1'],
  ['kling-video-o3', 'rw-kling-video-o3-pro'],
  ['kling-video-3', 'rw-kling-video-3-pro'],
  ['kling-o1', 'rw-kling-image-o3'],
  ['nano-banana-2', 'rw-nano-banana-2'],
  ['nano-banana-pro', 'rw-nano-banana-pro'],
  ['flux-2-pro', 'rw-flux-2-pro'],
  ['flux-2-dev', 'rw-flux-2-dev'],
  ['flux-2-flex', 'rw-flux-2-flex'],
  ['flux-2-klein', 'rw-flux-2-klein-9b'],
  ['gpt-image-2', 'rw-gpt-image-2'],
  ['gpt-image-1.5', 'rw-gpt-image-1-5'],
  ['wan2.7', 'rw-wan-2-7'],
  ['wan2.5', 'rw-wan-2-7'],
  ['ltx-2', 'rw-ltx-2-pro'],
  ['pixverse', 'rw-pixverse-v6'],
  ['grok-imagine', 'rw-grok-imagine-video'],
  ['skyreels', 'rw-skyreels-v4'],
  ['minimax', 'rw-minimax-hailuo-2-3'],
  ['runway', 'rw-runway-gen-4-5'],
  ['seedream', 'rw-seedream-5-lite'],
  ['recraft', 'rw-recraft-v4-1'],
  ['qwen-image', 'rw-qwen-image-2512'],
  ['eleven', 'rw-eleven-multilingual-v2'],
  ['gemini.*tts', 'rw-gemini-tts'],
];

function isClassB(muapiId, name = '') {
  const hay = `${muapiId} ${name}`;
  return CLASS_B_PATTERNS.some((re) => re.test(hay));
}

function inferMode(muapiId, listName) {
  if (listName === 'i2iModels' || muapiId.includes('-edit') || muapiId.includes('upscaler')) return 'i2i';
  if (listName === 'i2vModels' || muapiId.includes('image-to-video')) return 'i2v';
  if (listName === 'v2vModels' || muapiId.includes('motion-control')) return 'v2v';
  if (listName === 't2vModels' || muapiId.includes('-t2v') || muapiId.includes('text-to-video')) return 't2v';
  if (listName === 'audioModels') return 't2a';
  return 't2i';
}

function inferStudio(mode) {
  if (mode === 't2a') return 'audio';
  if (mode === 't2v' || mode === 'i2v' || mode === 'v2v') return 'video';
  return 'image';
}

function inferAdapterOp(mode) {
  const map = { t2i: 'imageT2i', i2i: 'imageI2i', t2v: 'videoT2i', i2v: 'videoI2v', v2v: 'videoV2v', t2a: 'audioT2a' };
  return map[mode] || null;
}

function inferTaskProfile(mode) {
  const map = {
    t2i: 'image-standard',
    i2i: 'image-i2i',
    t2v: 'video-sota',
    i2v: 'video-i2v',
    v2v: 'video-v2v',
    t2a: 'audio-standard',
  };
  return map[mode] || null;
}

/**
 * @param {string} muapiId
 * @param {Map<string, { id: string, runwareModel: string, provenance?: { docUrl?: string } }>} catalogById
 * @param {Map<string, { id: string, runwareModel: string, provenance?: { docUrl?: string } }>} catalogByAir
 */
function resolveRunware(muapiId, catalogById, catalogByAir) {
  if (MUAPI_TO_RUNWARE[muapiId]) {
    const hit = MUAPI_TO_RUNWARE[muapiId];
    const cat = catalogById.get(hit.catalogId);
    return {
      runwareCatalogId: hit.catalogId,
      runwareAir: hit.air,
      docUrl: cat?.provenance?.docUrl || (hit.docSlug ? `https://runware.ai/docs/models/${hit.docSlug}` : null),
      parityClass: 'A',
    };
  }

  for (const [token, catalogId] of TOKEN_MAP) {
    if (new RegExp(token, 'i').test(muapiId)) {
      const suffix =
        muapiId.includes('-edit') || muapiId.includes('edit-')
          ? '-i2i'
          : muapiId.includes('image-to-video')
            ? '-i2v'
            : muapiId.includes('motion-control')
              ? '-v2v'
              : '';
      const cid = `${catalogId}${suffix}`;
      const cat = catalogById.get(cid) || catalogById.get(catalogId);
      if (cat) {
        return {
          runwareCatalogId: cat.id,
          runwareAir: cat.runwareModel,
          docUrl: cat.provenance?.docUrl || null,
          parityClass: 'A',
        };
      }
    }
  }

  return {
    runwareCatalogId: null,
    runwareAir: null,
    docUrl: null,
    parityClass: 'TBD',
  };
}

async function loadAll() {
  const modelsUrl = pathToFileURL(join(studioSrc, 'models.js')).href;
  const t2iUrl = pathToFileURL(join(studioSrc, 'models.runware.js')).href;
  const videoUrl = pathToFileURL(join(studioSrc, 'models.runware.video.js')).href;
  const audioUrl = pathToFileURL(join(studioSrc, 'models.runware.audio.js')).href;
  const i2iUrl = pathToFileURL(join(studioSrc, 'models.runware.i2i.js')).href;
  const i2vUrl = pathToFileURL(join(studioSrc, 'models.runware.i2v.js')).href;
  const v2vUrl = pathToFileURL(join(studioSrc, 'models.runware.v2v.js')).href;

  const models = await import(modelsUrl);
  let runwareI2i = [];
  let runwareI2v = [];
  let runwareV2v = [];
  try {
    runwareI2i = (await import(i2iUrl)).runwareI2iModels || [];
  } catch {
    /* optional until P2 */
  }
  try {
    runwareI2v = (await import(i2vUrl)).runwareI2vModels || [];
  } catch {
    /* optional until P3 */
  }
  try {
    runwareV2v = (await import(v2vUrl)).runwareV2vModels || [];
  } catch {
    /* optional until P4 */
  }

  const { runwareT2iModels } = await import(t2iUrl);
  const { runwareVideoModels } = await import(videoUrl);
  const { runwareAudioModels } = await import(audioUrl);

  const allRunware = [
    ...runwareT2iModels,
    ...runwareVideoModels,
    ...runwareAudioModels,
    ...runwareI2i,
    ...runwareI2v,
    ...runwareV2v,
  ];

  const catalogById = new Map(allRunware.map((m) => [m.id, m]));
  const catalogByAir = new Map(allRunware.map((m) => [m.runwareModel, m]));

  return { models, catalogById, catalogByAir };
}

function buildRow(muapiId, name, listName, catalogById, catalogByAir) {
  const mode = inferMode(muapiId, listName);
  const studio = inferStudio(mode);

  if (isClassB(muapiId, name)) {
    return {
      id: muapiId,
      studio,
      mode,
      muapiId,
      runwareCatalogId: null,
      runwareAir: null,
      parityClass: 'B',
      taskType: mode.includes('2') ? `${mode.replace('2', '')}Inference` : null,
      taskProfile: inferTaskProfile(mode),
      pickerSurface: mode === 't2i' || mode === 't2v' ? 'unified' : 'legacy',
      adapterOp: inferAdapterOp(mode),
      docUrl: null,
      verifiedLive: false,
      verifiedAt: null,
      exemptionReason: 'Muapi-exclusive or no Runware equivalent documented',
    };
  }

  const rw = resolveRunware(muapiId, catalogById, catalogByAir);
  const parityClass = rw.parityClass === 'A' ? 'A' : rw.parityClass;

  return {
    id: muapiId,
    studio,
    mode,
    muapiId,
    runwareCatalogId: rw.runwareCatalogId,
    runwareAir: rw.runwareAir,
    parityClass,
    taskType:
      mode === 't2i' || mode === 'i2i'
        ? 'imageInference'
        : mode === 't2a'
          ? 'audioInference'
          : 'videoInference',
    taskProfile: inferTaskProfile(mode),
    pickerSurface: 'unified',
    adapterOp: inferAdapterOp(mode),
    docUrl: rw.docUrl,
    verifiedLive: false,
    verifiedAt: null,
    exemptionReason: parityClass === 'B' ? 'Muapi-exclusive' : null,
  };
}

async function main() {
  const { models, catalogById, catalogByAir } = await loadAll();
  const lists = [
    ['t2iModels', models.t2iModels],
    ['t2vModels', models.t2vModels],
    ['i2iModels', models.i2iModels],
    ['i2vModels', models.i2vModels],
    ['v2vModels', models.v2vModels],
    ['audioModels', models.audioModels],
  ];

  /** @type {object[]} */
  const rows = [];
  const seen = new Set();

  for (const [listName, arr] of lists) {
    for (const m of arr || []) {
      if (!m?.id || seen.has(m.id)) continue;
      seen.add(m.id);
      rows.push(buildRow(m.id, m.name || '', listName, catalogById, catalogByAir));
    }
  }

  rows.sort((a, b) => a.muapiId.localeCompare(b.muapiId));

  const summary = {
    total: rows.length,
    classA: rows.filter((r) => r.parityClass === 'A').length,
    classB: rows.filter((r) => r.parityClass === 'B').length,
    tbd: rows.filter((r) => r.parityClass === 'TBD').length,
  };

  console.log(JSON.stringify({ summary, sample: rows.slice(0, 3) }, null, 2));

  if (process.argv.includes('--write')) {
    writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${rows.length} rows → ${outPath}`);
  } else {
    console.log('Pass --write to emit tests/fixtures/runware-muapi-parity-matrix.json');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
