import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const studioDir = join(root, 'packages/studio/src/components');
const pattern = /from\s+['"]\.\.\/muapi(\.js)?['"]/;

let failed = false;

for (const file of readdirSync(studioDir)) {
  if (!file.endsWith('Studio.jsx')) continue;
  const path = join(studioDir, file);
  const content = readFileSync(path, 'utf8');
  if (pattern.test(content)) {
    console.error(`FAIL: ${file} imports muapi.js directly (use provider layer)`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log('check-no-muapi-in-studios: OK (media studios may still import during migration)');
