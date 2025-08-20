const { json, Tickets, uuid } = require("./_shared/common.js");

exports.handler = async function(event) {
  if (event.httpMethod === "GET") {
    return json(Tickets);
  }
  if (event.httpMethod === "POST") {
    const { summary, user_email } = JSON.parse(event.body || "{}");
    const t = { id: uuid(), type: "generic", summary, user_email, createdAt: new Date().toISOString(), status: "open" };
    Tickets.push(t);
    return json({ ok: true, ticket: t });
  }
  return json({ error: "Method not allowed" }, 405);
};
