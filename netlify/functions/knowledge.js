const { json, KB } = require("./_shared/common.js");

exports.handler = async function() {
  return json(KB.map(k => ({ id: k.id, title: k.title })));
};
