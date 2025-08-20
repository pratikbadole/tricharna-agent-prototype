const OpenAI = require("openai");
const { OPENAI_API_KEY, retrieveContext } = require("./_shared/common.js");

// Parse proposed_action JSON at the end (either fenced or raw)
function extractActionFrom(text) {
  const fence = text.match(/```[\s\S]*?```/);
  if (fence) {
    try { return JSON.parse(fence[0].replace(/```/g, '').trim()); } catch {}
  }
  try { return JSON.parse(text.trim()); } catch {}
  return null;
}

exports.handler = async (event) => {
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const END_MARK = "<|END_OF_STREAM|>";
      const write = (s) => controller.enqueue(enc.encode(typeof s === "string" ? s : String(s)));

      try {
        if (event.httpMethod !== "POST") { write("Method not allowed"); controller.close(); return; }

        let message = "", email = "";
        try {
          const body = JSON.parse(event.body || "{}");
          message = body.message || "";
          email = body.email || "";
        } catch {}

        if (!message) { write("message required"); controller.close(); return; }

        // RAG context (best-effort)
        const ctx = await retrieveContext(message, 3);
        const ctxText = ctx.map(d => `# ${d.title}\n${d.content || ''}`).join("\n\n---\n\n");

        if (!OPENAI_API_KEY) {
          // Mock streaming so UI still looks alive
          const mock = `🤖 (mock) I understood: "${message}".\nThis is a demo stream.\n\nDone.`;
          for (const ch of mock) { write(ch); await new Promise(r => setTimeout(r, 8)); }
          write(`\n${END_MARK}` + JSON.stringify({ proposed_action: null, contextDocs: ctx.map(d => ({ id: d.id, title: d.title })) }));
          controller.close(); return;
        }

        const client = new OpenAI({ apiKey: OPENAI_API_KEY });

        const systemPrompt = `You are an AI IT Helpdesk assistant for corporate users.
- Answer ANY IT question clearly and concisely, using markdown lists where helpful.
- Prefer step-by-step diagnostics before escalation.
- Use provided "Context" if relevant; otherwise rely on general IT knowledge.
- If the issue cannot be fully resolved in-chat, output ONE JSON at the very end in a fenced block:
{"proposed_action":"create_ticket","params":{"title":"<short title>","details":"<what you've learned>","user_email":"${email || "<email>"}","impact":"<optional>","urgency":"<low|medium|high>"}}
OR
{"proposed_action":"reset_password","params":{"user_email":"${email || "<email>"}}}
Do NOT include any other fenced JSON.`;

        let full = "";

        const resp = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.2,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Context (use only if relevant):\n${ctxText}` },
            { role: "user", content: `User message: ${message}` }
          ]
        });

        for await (const part of resp) {
          const delta = part.choices?.[0]?.delta?.content || "";
          if (delta) { full += delta; write(delta); }
        }

        const proposed_action = extractActionFrom(full);
        write(`\n${END_MARK}` + JSON.stringify({
          proposed_action,
          contextDocs: ctx.map(d => ({ id: d.id, title: d.title }))
        }));
        controller.close();
      } catch (e) {
        controller.enqueue(new TextEncoder().encode("[ERROR] " + e.message));
        controller.close();
      }
    }
  });

  // Return a standard Web Response with the stream
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
