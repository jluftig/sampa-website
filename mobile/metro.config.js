// Metro config for the SAMPA mobile app.
//
// The app shares pure-JS logic with the web app's `src/lib` (membership tiers,
// tag/slug/date helpers) WITHOUT copying it — avoiding the drift the web repo's
// CLAUDE.md rule 11 warns about. That shared folder lives outside this project
// (`<repo>/src/lib`), so we expose it to Metro as a symlinked node_modules
// package named `sampa-shared` (created by scripts/link-shared.js on postinstall).
//
// Metro resolves a symlinked package to its real target and includes it in the
// module graph as long as (a) symlink support is on, and (b) the real target is
// under a watched root — hence watching the repo root. (A plain `watchFolders` +
// alias does NOT work here: this Metro version won't map a bare folder outside
// the project; the node_modules-package shape is what makes it resolvable.)

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [repoRoot];
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
