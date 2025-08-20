const { json, KB, classifyIntent, chatLLM } = require("./_shared/common.js");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const { message, email } = JSON.parse(event.body || "{}");
  if (!message) return json({ error: "message required" }, 400);

  const intent = classifyIntent(message);
  const words = message.toLowerCase().split(/\W+/).filter(Boolean);
  const ctx = KB.filter(doc => words.some(w => doc.content.toLowerCase().includes(w))).slice(0, 2);

  const answer = await chatLLM({ message, intent, context: ctx });

  let proposed_action = null;
  const m = answer.match(/```\\s*\\{[\\s\\S]*?\\}\\s*```/);
  if (m) { try { proposed_action = JSON.parse(m[0].replace(/```/g, "").trim()); } catch {} }

  return json({ ok: true, intent, contextDocs: ctx.map(d => ({ id: d.id, title: d.title })), answer, proposed_action });
};
