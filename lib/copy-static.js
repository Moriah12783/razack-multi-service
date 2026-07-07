const fs = require('node:fs');
const path = require('node:path');

const EXCLUDES = new Set(['.git', 'node_modules', 'dist', 'docs', '.vercel']);

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
