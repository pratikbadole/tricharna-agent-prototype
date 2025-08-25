import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

export async function handler(event) {
  const email = event.queryStringParameters.email;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ ok:false, error:'Missing email' }) };
  }
  try {
    const { data, error } = await supabase.from('admins').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw error;
    const isAdmin = !!data;
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok:true, isAdmin })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok:false, error:e.message })
    };
  }
}
