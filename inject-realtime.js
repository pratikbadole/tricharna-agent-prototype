const fs = require('fs');
let s = fs.readFileSync('app.js','utf8');

if (!/tickets-stream/.test(s)) {
  const insert = `
  // --- Realtime updates for tickets ---
  if (window.supabase && !window.__ticketsRT) {
    window.__ticketsRT = window.supabase
      .channel('tickets-stream')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
        const row = payload.new || payload.old;
        // Extra guard (RLS already enforces reads server-side)
        if (state.user?.email && row.user_email && row.user_email !== state.user.email) return;

        if (payload.eventType === 'INSERT') {
          const t = { id: row.id, status: row.status, createdAt: row.created_at, title: row.title, description: row.details };
          if (!state.tickets.find(x => x.id === t.id)) state.tickets.unshift(t);
        }
        if (payload.eventType === 'UPDATE') {
          const idx = state.tickets.findIndex(x => x.id === row.id);
          if (idx > -1) state.tickets[idx] = { ...state.tickets[idx], status: row.status, title: row.title, description: row.details };
        }
        if (payload.eventType === 'DELETE') {
          state.tickets = state.tickets.filter(x => x.id !== row.id);
        }
        renderTickets();
      })
      .subscribe();
  }`;

  s = s.replace(/function initTickets\(\)\s*\{/, match => match + '\n' + insert + '\n');
}

fs.writeFileSync('app.js', s);
