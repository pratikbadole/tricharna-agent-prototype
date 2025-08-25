const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email || '';
  if (!email) {
    return { statusCode: 400, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false, error:'email required' }) };
  }
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (error) {
      return { statusCode: 500, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false, error: error.message }) };
    }
    const isAdmin = Array.isArray(data) && data.length > 0;
    return { statusCode: 200, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:true, isAdmin }) };
  } catch (e) {
    return { statusCode: 500, headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ok:false, error: e.message }) };
  }
};
