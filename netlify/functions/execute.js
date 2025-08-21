const { json } = require("./_shared/common.js");
const supabase = require("./_shared/db.js");

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return json({ ok:false, error:"POST required" }, 405);

    const body = JSON.parse(event.body || "{}");
    const action = body.action;
    const params = body.params || {};

    if (action === "create_ticket") {
      const { title = "Support request", details = "", user_email = "", impact = "unknown", urgency = "medium", type = "generic" } = params;
      const { data, error } = await supabase
        .from("tickets")
        .insert([{ title, details, user_email, impact, urgency, status: "open", type }])
        .select()
        .limit(1)
        .single();
      if (error) return json({ ok:false, error: error.message }, 500);
      return json({ ok:true, ticket: data });
    }

    if (action === "update_ticket") {
      const { id, patch = {} } = params;
      if (!id) return json({ ok:false, error:"id required" }, 400);
      const { data, error } = await supabase
        .from("tickets")
        .update(patch)
        .eq("id", id)
        .select()
        .limit(1)
        .single();
      if (error) return json({ ok:false, error: error.message }, 500);
      return json({ ok:true, ticket: data });
    }

    return json({ ok:false, error:"Unknown action" }, 400);
  } catch (e) {
    return json({ ok:false, error: e.message }, 500);
  }
};
