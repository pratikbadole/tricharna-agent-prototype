const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const fetch = require("node-fetch");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

// Load embeddings built at deploy-time
let EMBEDDINGS = [];
try {
  const p = path.join(__dirname, "embeddings.json");
  const raw = fs.readFileSync(p, "utf8");
  EMBEDDINGS = JSON.parse(raw).items || [];
} catch (e) {
  EMBEDDINGS = [];
}

function json(body, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  };
}

// Fallback KB (if no embeddings found)
const FALLBACK_KB = [
  { id: "reset_password.md", title: "Reset Password — Corporate Account", content: "If locked out, use self-service reset or contact IT." }
];

function dot(a, b) { let s=0; for (let i=0;i<Math.min(a.length,b.length);i++) s += a[i]*b[i]; return s; }
function norm(a) { return Math.sqrt(a.reduce((s,x)=>s+x*x,0)) || 1; }
function cosine(a,b){ return dot(a,b)/(norm(a)*norm(b)); }

async function embedText(text) {
  if (!OPENAI_API_KEY) return null;
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text })
  });
  const j = await res.json();
  if (!res.ok) return null;
  return j.data[0].embedding;
}

async function retrieveContext(query, topK = 3) {
  if (!EMBEDDINGS.length) {
    // No prebuilt embeddings — return a small fallback
    return FALLBACK_KB.slice(0, topK);
  }
  const q = await embedText(query);
  if (!q) return FALLBACK_KB.slice(0, topK);
  return EMBEDDINGS
    .map(it => ({ it, score: cosine(q, it.embedding) }))
    .sort((a,b)=>b.score-a.score)
    .slice(0, topK)
    .map(({it}) => ({ id: it.filename, title: it.title, content: it.excerpt || "" }));
}

async function chatLLM({ message, intent, context }) {
  const model = "gpt-4o-mini";
  if (!OPENAI_API_KEY) {
    // Mock mode if key missing
    return `🤖 (mock) I understood "${message}" with intent ${intent}.`;
  }
  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemPrompt = `You are an AI IT Helpdesk assistant for corporate users.
- Answer ANY IT question clearly and concisely.
- Prefer step-by-step diagnostics before escalation.
- Use provided "Context" if relevant; otherwise rely on general IT knowledge.
- If the issue cannot be fully resolved in-chat, return a single JSON in a fenced block with EXACTLY one of:
  1) {"proposed_action":"create_ticket","params":{"title":"<short title>","details":"<what you've learned>","user_email":"<email if given>","impact":"<optional>","urgency":"<optional: low|medium|high>"}}
  2) {"proposed_action":"reset_password","params":{"user_email":"<email>"}}
NEVER include code fences unless outputting that JSON once at the end.`;

  const ctxText = context.map(d => `# ${d.title}\n${d.content||''}`).join("\n\n---\n\n");

  const res = await client.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context (use only if relevant):\n${ctxText}` },
      { role: "user", content: `User message: ${message}` }
    ]
  });

  return res.choices[0].message.content;
}

function classifyIntent(text = "") {
  const t = text.toLowerCase();
  if (t.includes("reset password") || t.includes("forgot password")) return "reset_password";
  if (t.includes("vpn")) return "vpn_issue";
  if (t.includes("outlook") || t.includes("email")) return "email_issue";
  if (t.includes("wifi") || t.includes("wireless")) return "wifi_issue";
  return "generic_support";
}

module.exports = {
  json, jwt, uuid,
  OPENAI_API_KEY, JWT_SECRET,
  retrieveContext, chatLLM, classifyIntent
};
