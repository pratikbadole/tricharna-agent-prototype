const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const fetch = require("node-fetch");
const OpenAI = require("openai");

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "";

function json(body, statusCode = 200, extraHeaders = {}) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  };
}

// Demo in-memory stores
const Tickets = [];
const KB = [
  {
    id: "reset_password.md",
    title: "Reset Password — Corporate Account",
    content: "1) Use self-service 'Forgot password?'\n2) Complete MFA\n3) If locked: IT admin reset (Okta/AzureAD)."
  },
  {
    id: "vpn_issues.md",
    title: "VPN Troubleshooting — Win/macOS",
    content: "Check internet, time/cert, UDP/TCP, reinstall profile, reboot, test another network."
  },
  {
    id: "email_setup.md",
    title: "Email Setup — Outlook 365",
    content: "Add account → MFA browser → sync. If stuck: clear creds, verify license, wait for initial sync."
  }
];

function classifyIntent(text = "") {
  const t = text.toLowerCase();
  if (t.includes("reset password") || t.includes("forgot password")) return "reset_password";
  if (t.includes("vpn")) return "vpn_issue";
  if (t.includes("outlook") || t.includes("email")) return "email_issue";
  if (t.includes("wifi")) return "wifi_issue";
  return "generic_support";
}

async function chatLLM({ message, intent, context }) {
  if (!OPENAI_API_KEY) {
    return "AI not configured: set OPENAI_API_KEY in Netlify → Environment Variables.";
  }

  const client = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemPrompt = `You are an AI IT Helpdesk assistant. Be concise. 
If a privileged action is needed, output JSON like:
{"proposed_action":"reset_password","params":{"user_email":"<email>"}}`;

  const combinedContext = context.map(d => `# ${d.title}\n${d.content}`).join("\n\n---\n\n");

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Context:\n${combinedContext}` },
      { role: "user", content: `Intent: ${intent}` },
      { role: "user", content: message }
    ]
  });

  return res.choices[0].message.content;
}

async function getWeather(city = "Frankfurt") {
  if (!OPENWEATHER_API_KEY) {
    return { city, tempC: null, description: "mock: set OPENWEATHER_API_KEY" };
  }
  const q = encodeURIComponent(city);
  const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${OPENWEATHER_API_KEY}&units=metric`);
  if (!r.ok) return { city, tempC: null, description: "unknown" };
  const j = await r.json();
  return { city, tempC: j.main?.temp ?? null, description: j.weather?.[0]?.description ?? "n/a" };
}

module.exports = { json, jwt, uuid, fetch, OpenAI, OPENAI_API_KEY, JWT_SECRET, OPENWEATHER_API_KEY, Tickets, KB, classifyIntent, chatLLM, getWeather };
