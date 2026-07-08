// Recreates the `sampa-shared` symlink in node_modules so the app can import the
// web app's shared pure-JS modules (e.g. `sampa-shared/membership`) without
// duplicating them. Runs automatically on `postinstall` (npm wipes node_modules
// on install, taking the symlink with it). Idempotent and safe to run anytime.

const fs = require('fs');
const path = require('path');

const nodeModules = path.resolve(__dirname, '..', 'node_modules');
const linkPath = path.join(nodeModules, 'sampa-shared');
const targetAbs = path.resolve(__dirname, '..', '..', 'src', 'lib'); // <repo>/src/lib
const targetRel = path.relative(nodeModules, targetAbs); // ../../src/lib

try {
  if (!fs.existsSync(targetAbs)) {
    console.warn('[link-shared] shared source not found at ' + targetAbs + ' — skipping.');
    process.exit(0);
  }
  if (!fs.existsSync(nodeModules)) fs.mkdirSync(nodeModules, { recursive: true });
  try {
    fs.rmSync(linkPath, { recursive: true, force: true });
  } catch {}
  fs.symlinkSync(targetRel, linkPath, 'dir');
  console.log('[link-shared] node_modules/sampa-shared -> ' + targetRel);
} catch (e) {
  console.warn('[link-shared] could not create symlink: ' + (e && e.message));
}
