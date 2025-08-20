export const runtime = 'edge';
export async function POST(req) {
  const body = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error:"OPENAI_API_KEY not set" }), { status: 500, headers: { "content-type": "application/json" } });
  }
  return new Response(JSON.stringify({
    type: "message",
    content: "Hello from /api/ai — wire your provider here and enable tool calls!"
  }), { headers: { "content-type": "application/json" } });
}
