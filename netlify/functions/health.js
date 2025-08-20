const { json } = require("./_shared/common.js");

exports.handler = async function() {
  return json({ ok: true });
};
