const { json, getWeather } = require("./_shared/common.js");

exports.handler = async function(event) {
  const url = new URL(event.rawUrl);
  const city = url.searchParams.get("city") || "Frankfurt";
  const w = await getWeather(city);
  return json(w);
};
