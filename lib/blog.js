const fs = require('node:fs');
const path = require('node:path');
const { marked } = require('marked');

const BLOG_DIR = path.join(__dirname, '..', 'content', 'blog');

function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

function excerptOf(meta, body) {
  if (meta.description) return meta.description;
  return body.replace(/[#>*_`\[\]]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function loadArticles(dir = BLOG_DIR) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
  const arts = files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { meta, body } = parseFrontmatter(raw);
    const slug = f.replace(/\.md$/, '');
    return {
      slug, url: `/blog/${slug}`,
      title: meta.title || slug,
      description: meta.description || '',
      date: meta.date || '',
      cover: meta.cover || '',
      tags: Array.isArray(meta.tags) ? meta.tags : (meta.tags ? [meta.tags] : []),
      html: marked.parse(body),
      excerpt: excerptOf(meta, body)
    };
  });
  return arts.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

module.exports = { parseFrontmatter, loadArticles, excerptOf, BLOG_DIR };
