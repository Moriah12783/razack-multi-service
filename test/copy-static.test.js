const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { copyStatic, EXCLUDES } = require('../lib/copy-static');

test('EXCLUDES contains dev/build dirs', () => {
  for (const d of ['.git', 'node_modules', 'dist', 'docs']) assert.ok(EXCLUDES.has(d));
});

test('EXCLUDES contains the generator dev files (never ship them to dist)', () => {
  // dist/ must contain only the deployable site — not the generator itself.
  // Shipping test/ + build.js caused node --test to recursively re-run tests
  // inside dist/ and spawn nested builds. Guard against regression.
  // 'functions' is a Cloudflare Pages Functions dir read from the project root,
  // not the build output, so it must never be copied into dist/.
  for (const d of ['test', 'lib', 'build.js', 'package.json', 'functions']) assert.ok(EXCLUDES.has(d), `EXCLUDES should contain ${d}`);
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

test('copyStatic does not ship generator dev files (test/, build.js)', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'src2-'));
  const dst = fs.mkdtempSync(path.join(os.tmpdir(), 'dst2-'));
  fs.writeFileSync(path.join(src, 'index.html'), 'hi');
  fs.writeFileSync(path.join(src, 'build.js'), 'run()');
  fs.mkdirSync(path.join(src, 'test'));
  fs.writeFileSync(path.join(src, 'test', 'x.test.js'), 'test');
  copyStatic(src, dst);
  assert.ok(fs.existsSync(path.join(dst, 'index.html')));
  assert.ok(!fs.existsSync(path.join(dst, 'build.js')), 'build.js not shipped');
  assert.ok(!fs.existsSync(path.join(dst, 'test')), 'test/ not shipped');
});
