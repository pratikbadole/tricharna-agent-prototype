const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('ERROR: Set OPENAI_API_KEY in your shell before running this script.');
  process.exit(1);
}

const KB_DIR = path.join(process.cwd(), 'kb-docs');
const OUT_PATH = path.join(process.cwd(), 'netlify', 'functions', '_shared', 'embeddings.json');

function readDocs() {
  const files = fs.readdirSync(KB_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = fs.readFileSync(path.join(KB_DIR, f), 'utf8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return {
      id: f,
      title: titleMatch ? titleMatch[1] : f,
      content
    };
  });
}

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  const j = await res.json();
  if (!res.ok) {
    console.error('Embedding error:', j);
    throw new Error('Failed to embed');
  }
  return j.data[0].embedding;
}

(async () => {
  const docs = readDocs();
  const items = [];
  for (const doc of docs) {
    const embedding = await embed(doc.content);
    items.push({
      filename: doc.id,
      title: doc.title,
      embedding,
      // A tiny excerpt helpful for debugging
      excerpt: doc.content.slice(0, 300)
    });
    console.log('Embedded:', doc.id);
  }
  fs.writeFileSync(OUT_PATH, JSON.stringify({ model: 'text-embedding-3-small', items }, null, 2));
  console.log('Wrote embeddings to', OUT_PATH);
})();
