const fs = require('node:fs');
const path = require('node:path');

// dist/ must contain ONLY the deployable static site. Exclude VCS/build dirs
// AND the generator's own source (build.js, lib/, test/, package.json,
// .gitignore) so the output never re-runs itself: shipping test/*.test.js +
// build.js made `node --test` recurse into dist/ and spawn nested builds.
const EXCLUDES = new Set([
  '.git', 'node_modules', 'dist', 'docs', '.vercel',
  'build.js', 'lib', 'test', 'package.json', '.gitignore'
]);

function copyStatic(srcDir, dstDir, root = true) {
  fs.mkdirSync(dstDir, { recursive: true });
  for (const name of fs.readdirSync(srcDir)) {
    if (root && EXCLUDES.has(name)) continue;
    const s = path.join(srcDir, name);
    const d = path.join(dstDir, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyStatic(s, d, false);
    else fs.copyFileSync(s, d);
  }
}

module.exports = { copyStatic, EXCLUDES };
