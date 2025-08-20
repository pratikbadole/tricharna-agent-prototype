const { json, uuid } = require("./_shared/common.js");

// In-memory demo store (keep simple for now)
const TICKETS = [];

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return json({ error: "Method not allowed" }, 405);
  const { action, params } = JSON.parse(event.body || "{}");

  if (action === "reset_password") {
    const t = { id: uuid(), type: "reset_password", user_email: params?.user_email || null, status: "done", createdAt: new Date().toISOString() };
    TICKETS.push(t);
    return json({ ok: true, message: `Password reset link sent to ${params?.user_email || "user"}`, ticket: t });
  }

  if (action === "create_ticket") {
    const t = {
      id: uuid(),
      type: "generic",
      title: params?.title || "New ticket",
      details: params?.details || "",
      impact: params?.impact || "unknown",
      urgency: params?.urgency || "medium",
      user_email: params?.user_email || null,
      status: "open",
      createdAt: new Date().toISOString()
    };
    TICKETS.push(t);
    return json({ ok: true, message: "Ticket created", ticket: t });
  }

  return json({ error: "Unsupported action" }, 400);
};
