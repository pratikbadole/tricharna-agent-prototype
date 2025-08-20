/**
 * Netlify Edge Function — streams tokens AND appends metadata.
 * It accumulates the full assistant text, extracts a proposed_action JSON
 * (from a fenced ``` block or raw JSON), then emits:
 *   <|END_OF_STREAM|>{"proposed_action": ...}
 */
export default async (request, context) => {
  const enc = new TextEncoder();

  // --- read request body ---
  let message = "", email = "", history = [];
  try {
    const body = await request.json();
    message = body?.message || "";
    email   = body?.email   || "";
    history = Array.isArray(body?.history) ? body.history : [];
  } catch {}
  if (!message) return new Response("message required", { status: 400 });

  // --- env key (Edge runtime) ---
  const OPENAI_API_KEY =
    (typeof Netlify !== "undefined" && Netlify.env?.get?.("OPENAI_API_KEY")) ||
    (typeof Deno !== "undefined" && Deno.env?.get?.("OPENAI_API_KEY")) || "";

  // --- system prompt (uses history and finalizes on confirmation) ---
  const systemPrompt = `You are an AI IT Helpdesk assistant.
- Use conversation history; do not re-ask questions already answered.
- Write clear markdown (lists, bold where relevant).
- When the user CONFIRMS ("yes", "please proceed", "confirm"):
  • Infer any missing details from history if possible.
  • If sufficient, output EXACTLY ONE fenced JSON block and nothing else:
    {"proposed_action":"create_ticket","params":{"title":"<short>","details":"<from history>","user_email":"${email || "<email>"}","impact":"<optional>","urgency":"<low|medium|high>"}}
    OR
    {"proposed_action":"reset_password","params":{"user_email":"${email || "<email>"}}}
- If still missing critical fields, ask only for those; once provided, output the JSON and stop.`;

  // map minimal history
  const historyMsgs = history
    .filter(h => h && typeof h.content === "string" && (h.role === "user" || h.role === "assistant"))
    .map(h => ({ role: h.role, content: h.content }));

  // call OpenAI with SSE stream
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
        ...historyMsgs,
        { role: "user", content: message }
      ]
    })
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err || "OpenAI error", { status: upstream.status });
  }

  // helper: extract JSON from text (fenced or raw)
  function extractActionFrom(text) {
    // fenced block (``` or ```json)
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fence) {
      try { return JSON.parse(fence[1]); } catch {}
    }
    // raw JSON containing "proposed_action"
    const raw = text.match(/\{[\s\S]*"proposed_action"[\s\S]*\}/);
    if (raw) {
      try { return JSON.parse(raw[0]); } catch {}
    }
    return null;
  }

  const END_MARK = "<|END_OF_STREAM|>";
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";        // SSE buffer
  let fullText = "";      // accumulate assistant text for extraction

  const stream = new ReadableStream({
    async start(controller) {
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
              // finalize: extract action and append metadata
              const action = extractActionFrom(fullText);
              controller.enqueue(enc.encode(`\n${END_MARK}` + JSON.stringify({ proposed_action: action || null })));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(payload);
              const delta = json?.choices?.[0]?.delta?.content || "";
              if (delta) {
                fullText += delta;
                controller.enqueue(enc.encode(delta));
              }
            } catch {
              // ignore malformed frame
            }
          }
        }
        // upstream ended without [DONE]
        const action = extractActionFrom(fullText);
        controller.enqueue(enc.encode(`\n${END_MARK}` + JSON.stringify({ proposed_action: action || null })));
        controller.close();
      } catch (e) {
        controller.enqueue(enc.encode("[ERROR] " + e.message));
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
