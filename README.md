# Tricharna IT Support — AI Agent Prototype

This is a **frontend-first** AI agent demo with:
- Login → App views (Chat, Tickets, Knowledge)
- Local tools: tickets (localStorage), knowledge search (static), weather (Open‑Meteo)
- Dual-mode AI:
  - **Demo Mode** (no backend): heuristic responses, tools run locally
  - **Live Mode** (real LLM): set `AGENT_CONFIG.apiBase` to your deployed URL (Vercel function provided)

## Run locally (Demo Mode)
```bash
python3 -m http.server 8000
# open http://localhost:8000/
```
Login with **john@tricharna.com / demo123**.

## Deploy a live AI endpoint (Vercel)
1. Push this folder to a GitHub repo.
2. Import to Vercel → **Environment Variables**: `OPENAI_API_KEY` (or your provider).
3. Deploy — you get `https://your-app.vercel.app`

In `app.js`, set:
```js
const AGENT_CONFIG = { apiBase: 'https://your-app.vercel.app' };
```
Then the agent will call `/api/ai` instead of Demo Mode.

## Notes
- Weather uses Open‑Meteo (no API key). If it fails on some networks, try a VPN.
- Tickets are stored in your browser **localStorage** only.
- Knowledge base is in `knowledge.js` (customize with your content).
- The Vercel function is a **stub** — implement your provider call + tool/function calling there.

Enjoy!
