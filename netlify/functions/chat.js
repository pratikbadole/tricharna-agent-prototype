const { json, retrieveContext, chatLLM, classifyIntent } = require("./_shared/common.js");

function extractProposedAction(answer) {
  // 1) JSON in fenced block
  const fence = answer.match(/```[\s\S]*?```/);
  if (fence) {
    try { return JSON.parse(fence[0].replace(/```/g, '').trim()); } catch {}
  }
  // 2) Raw JSON only
  try { return JSON.parse(answer.trim()); } catch {}
  return null;
}

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const { message, email } = JSON.parse(event.body || "{}");
  if (!message) return json({ error: "message required" }, 400);

  const intent = classifyIntent(message);
  const ctx = await retrieveContext(message, 3);
  const answer = await chatLLM({ message, intent, context: ctx });

  const proposed_action = extractProposedAction(answer);

  return json({
    ok: true,
    intent,
    contextDocs: ctx.map(d => ({ id: d.id, title: d.title })),
    answer,
    proposed_action
  });
};
