/**
 * Netlify Edge Function – true streaming to the browser.
 * Uses the Edge runtime (Web Streams). No Node-only modules here.
 */
export default async (request, context) => {
  const encoder = new TextEncoder();

  // Read JSON body
  let message = "", email = "";
  try {
    const body = await request.json();
    message = body?.message || "";
    email = body?.email || "";
  } catch {}

  if (!message) {
    return new Response("message required", { status: 400 });
  }

  // Get API key (Edge supports Deno.env or Netlify.env)
  const OPENAI_API_KEY =
    (typeof Netlify !== "undefined" && Netlify.env?.get?.("OPENAI_API_KEY")) ||
    (typeof Deno !== "undefined" && Deno.env?.get?.("OPENAI_API_KEY")) ||
    "";

  // Minimal RAG for Edge: (simple system prompt; we skip your Node retrieval to keep Edge portable)
  const systemPrompt = `You are an AI IT Helpdesk assistant for corporate users.
- Answer ANY IT question clearly and concisely, using markdown bullet points where helpful.
- Prefer step-by-step diagnostics before escalation.
- If the issue cannot be fully resolved in-chat, output ONE JSON at the very end in a fenced block:
{"proposed_action":"create_ticket","params":{"title":"<short title>","details":"<what you've learned>","user_email":"${email || "<email>"}","impact":"<optional>","urgency":"<low|medium|high>"}}
OR
{"proposed_action":"reset_password","params":{"user_email":"${email || "<email>"}}}
Do NOT include any other fenced JSON.`;

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
        { role: "user", content: message }
      ]
    })
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(err || "OpenAI error", { status: upstream.status });
  }

  // Parse OpenAI's SSE and forward only the delta content as plain text
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

          // OpenAI SSE frames separated by \n\n ; lines starting with "data: "
          const frames = buffer.split("\n\n");
          // Hold last partial frame in buffer
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
              // Ignore bad JSON
            }
          }
        }
        // End of upstream stream
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
      // Helpful for browsers / proxies
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "Transfer-Encoding": "chunked"
    }
  });
};
