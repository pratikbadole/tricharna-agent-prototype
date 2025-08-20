/**
 * Netlify Edge Function – true streaming to the browser.
 * Streams OpenAI tokens and appends <|END_OF_STREAM|>{...meta} at the end.
 */
export default async (request, context) => {
  const encoder = new TextEncoder();

  let message = "", email = "", history = [];
  try {
    const body = await request.json();
    message = body?.message || "";
    email   = body?.email   || "";
    history = Array.isArray(body?.history) ? body.history : [];
  } catch {}

  if (!message) return new Response("message required", { status: 400 });

  const OPENAI_API_KEY =
    (typeof Netlify !== "undefined" && Netlify.env?.get?.("OPENAI_API_KEY")) ||
    (typeof Deno !== "undefined" && Deno.env?.get?.("OPENAI_API_KEY")) || "";

  // Build messages: system + (recent history) + latest user
  const systemPrompt = `You are an AI IT Helpdesk assistant.
- Use the conversation history to avoid repeating questions.
- Give clear, concise answers in markdown (use bullet/numbered lists when helpful).
- When the user CONFIRMS (e.g., "yes", "please proceed", "confirm"):
  • Infer missing details from history if possible.
  • If enough to proceed, OUTPUT EXACTLY ONE fenced JSON block and NOTHING ELSE:
    {"proposed_action":"create_ticket","params":{"title":"<short>","details":"<what you know from history>","user_email":"${email || "<email>"}","impact":"<optional>","urgency":"<low|medium|high>"}}
    OR
    {"proposed_action":"reset_password","params":{"user_email":"${email || "<email>"}}}
- Do not ask the same questions again once they were answered.
- If you still lack critical details, ask only for the missing fields; once provided, output the JSON and stop.`;

  // Convert history to OpenAI format safely (only role/content)
  const historyMessages = history
    .filter(h => h && typeof h.content === "string" && (h.role === "user" || h.role === "assistant"))
    .map(h => ({ role: h.role, content: h.content }));

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...historyMessages,
        { role: "user", content: message }
      ]
    })
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err || "OpenAI error", { status: upstream.status });
  }

  // Stream OpenAI SSE -> plain text tokens
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";

          for (const frame of frames) {
            const line = frame.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("\n<|END_OF_STREAM|>{}"));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content || "";
              if (delta) controller.enqueue(encoder.encode(delta));
            } catch {
              // ignore
            }
          }
        }
        controller.enqueue(encoder.encode("\n<|END_OF_STREAM|>{}"));
        controller.close();
      } catch (e) {
        controller.enqueue(encoder.encode("[ERROR] " + e.message));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked"
    }
  });
};
