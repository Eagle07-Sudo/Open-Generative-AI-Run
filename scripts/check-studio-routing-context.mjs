import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studioDir = join(root, 'packages/studio/src/components');
const studioGeneratePath = join(root, 'packages/studio/src/studioGenerate.js');

const ghostForStudio = /\bForStudio\s*\(\s*routing\b/;
const ghostGenerateI2I = /\bgenerateI2I\s*\(\s*routing\b/;
const bannedUiPatterns = [
  /\bisRunware\b/,
  /not available with Runware/i,
  /Use Muapi or text-to-image/i,
];

let failed = false;

for (const file of readdirSync(studioDir)) {
  if (!file.endsWith('Studio.jsx')) continue;
  const path = join(studioDir, file);
  const content = readFileSync(path, 'utf8');
  const lines = content.split('\n');

  for (const pattern of bannedUiPatterns) {
    lines.forEach((line, i) => {
      if (pattern.test(line)) {
        console.error(`FAIL: ${file}:${i + 1} banned provider-specific UI gate — use getStudioOpAvailability`);
        failed = true;
      }
    });
  }

  if (content.includes('baseRouting')) {
    lines.forEach((line, i) => {
      if (ghostForStudio.test(line) || ghostGenerateI2I.test(line)) {
        console.error(
          `FAIL: ${file}:${i + 1} uses undefined ghost "routing" with baseRouting pattern — use baseRouting or generationRouting`
        );
        failed = true;
      }
    });
  }

  if (content.includes('function UploadButton')) {
    const fnMatch = content.match(/function UploadButton\s*\(\s*\{([^}]*)\}/);
    if (fnMatch && content.includes('uploadFileForStudio(routing')) {
      if (!/\brouting\b/.test(fnMatch[1])) {
        console.error(
          `FAIL: ${file} UploadButton calls uploadFileForStudio(routing) but "routing" is not a prop`
        );
        failed = true;
      }
    }
  }
}

const sg = readFileSync(studioGeneratePath, 'utf8');
if (/muapi\.uploadFile\s*\(\s*routing\.muapiKey\s*\|\|\s*key/.test(sg)) {
  console.error(
    'FAIL: studioGenerate.js may pass resolved provider key to muapi.uploadFile — use withResolvedProvider only'
  );
  failed = true;
}

const studioCloudPath = join(root, 'packages/studio/src/studioCloud.js');
const cloud = readFileSync(studioCloudPath, 'utf8');
const blockWrapAntiPattern =
  /if\s*\(\s*['"]blockReason['"]\s+in\s+inner\s*\)\s*\{[\s\S]*?providerId:\s*routingMode\s*===\s*['"]muapi-only['"]\s*\?\s*['"]muapi['"]\s*:\s*['"]runware['"]/;
if (blockWrapAntiPattern.test(cloud)) {
  console.error(
    'FAIL: studioCloud.js wraps blockReason with routingMode-based providerId — use blockedProviderId(inner, fallback)'
  );
  failed = true;
}

const availPath = join(root, 'packages/studio/src/studioOpAvailability.js');
const avail = readFileSync(availPath, 'utf8');
if (/Muapi storage/i.test(avail)) {
  console.error('FAIL: studioOpAvailability.js must not force Muapi for upload');
  failed = true;
}

const capPath = join(root, 'packages/studio/src/providers/capabilities.js');
const runwarePath = join(root, 'packages/studio/src/providers/runware.js');
const cap = readFileSync(capPath, 'utf8');
const rw = readFileSync(runwarePath, 'utf8');
const uploadCapTrue = /runware:\s*\{[\s\S]*?upload:\s*true/.test(cap);
const hasUploadExport = /\buploadFile\b/.test(rw);
if (uploadCapTrue !== hasUploadExport) {
  console.error(
    'FAIL: capabilities.runware.upload must match runware.js uploadFile export'
  );
  failed = true;
}

for (const file of readdirSync(studioDir)) {
  if (!file.endsWith('Studio.jsx')) continue;
  const content = readFileSync(join(studioDir, file), 'utf8');
  if (content.includes('PERSIST_KEY') && /data:image\/[^"']+/.test(content)) {
    console.error(`FAIL: ${file} must not persist data:image URIs in localStorage`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('check-studio-routing-context: OK');
