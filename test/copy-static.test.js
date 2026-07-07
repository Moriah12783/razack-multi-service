const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { copyStatic, EXCLUDES } = require('../lib/copy-static');

test('EXCLUDES contains dev/build dirs', () => {
  for (const d of ['.git', 'node_modules', 'dist', 'docs']) assert.ok(EXCLUDES.has(d));
});

test('copyStatic copies files but skips excluded dirs', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), 'dst-'));
  fs.writeFileSync(path.join(src, 'index.html'), 'hi');
  fs.mkdirSync(path.join(src, 'node_modules'));
  fs.writeFileSync(path.join(src, 'node_modules', 'x.js'), 'nope');
  copyStatic(src, dst);
  assert.ok(fs.existsSync(path.join(dst, 'index.html')));
  assert.ok(!fs.existsSync(path.join(dst, 'node_modules')));
});
