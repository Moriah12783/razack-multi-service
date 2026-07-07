const { test } = require('node:test');
const assert = require('node:assert');
const { loadCategory, groupItems } = require('../lib/data');

test('loadCategory attaches url and slug to every item', () => {
  const items = loadCategory('vente');
  assert.ok(items.length >= 40, 'at least 40 vehicles for sale');
  for (const it of items) {
    assert.ok(it.slug && it.slug.length > 0, 'has slug');
    assert.match(it.url, /^\/vehicules-vente\/[a-z0-9-]+$/);
  }
});

test('groupItems groups by the category groupBy field, skipping empties', () => {
  const items = [
    { type: 'SUV', slug: 'a' }, { type: 'SUV', slug: 'b' }, { type: 'Pick-up', slug: 'c' }, { type: '', slug: 'd' }
  ];
  const groups = groupItems(items, 'type');
  assert.strictEqual(groups.get('SUV').length, 2);
  assert.strictEqual(groups.get('Pick-up').length, 1);
  assert.ok(!groups.has(''), 'empty group key is skipped');
});
