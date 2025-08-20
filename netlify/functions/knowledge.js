const { json } = require("./_shared/common.js");
const fs = require("fs");
const path = require("path");

exports.handler = async function() {
  try {
    const p = path.join(__dirname, "_shared", "embeddings.json");
    const raw = fs.readFileSync(p, "utf8");
    const items = JSON.parse(raw).items || [];
    return json(items.map(i => ({ id: i.filename, title: i.title })));
  } catch {
    return json([{ id: "kb", title: "Knowledge base not built yet" }]);
  }
};
