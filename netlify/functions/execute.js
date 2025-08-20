const { json, uuid, Tickets } = require("./_shared/common.js");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const { action, params } = JSON.parse(event.body || "{}");

  if (action === "reset_password") {
    const t = { id: uuid(), type: "reset_password", user_email: params?.user_email, createdAt: new Date().toISOString(), status: "done" };
    Tickets.push(t);
    return json({ ok: true, message: `Password reset link sent to ${params?.user_email}`, ticket: t });
  }

  if (action === "create_ticket") {
    const t = { id: uuid(), type: "generic", summary: params?.summary, user_email: params?.user_email, createdAt: new Date().toISOString(), status: "open" };
    Tickets.push(t);
    return json({ ok: true, message: "Ticket created", ticket: t });
  }

  return json({ error: "Unsupported action" }, 400);
};
