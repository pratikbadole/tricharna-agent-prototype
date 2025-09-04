export async function sendChatMessage({ text, history = [], endpoint = (window.STRATAMIND_CHAT_ENDPOINT || '/api/chat'), apiKey = null }) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? {'Authorization': `Bearer ${apiKey}`} : {})
    },
    body: JSON.stringify({ message: text, history })
  }).catch(() => null);

  if (!res || !res.ok) return { ok:false, error:'offline_or_no_endpoint' };
  try {
    const data = await res.json();
    return { ok:true, data };
  } catch {
    return { ok:false, error:'bad_json' };
  }
}
