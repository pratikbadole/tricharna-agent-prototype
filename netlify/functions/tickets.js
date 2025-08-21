const { json } = require("./_shared/common.js");
const supabase = require("./_shared/db.js");

exports.handler = async (event) => {
  try {
    const email = event.queryStringParameters?.email || null;
    let query = supabase.from("tickets").select("*").order("created_at", { ascending: false });
    if (email) query = query.eq("user_email", email);
    const { data, error } = await query;
    if (error) return json({ ok:false, error: error.message }, 500);
    return json({ ok:true, tickets: data });
  } catch (e) {
    return json({ ok:false, error: e.message }, 500);
  }
};
