const { getStatus, saveCookies } = require("../lib/cookie-store");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    if (req.method === "GET") {
      return res.status(200).json(await getStatus());
    }
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use GET or POST." });
    }
    const result = await saveCookies(req.body || {});
    return res.status(200).json({ ok: true, ...result });
  } catch (error) {
    console.error("[Cookie Settings]", error.message);
    const status = /Incorrect|password|Enter at least/i.test(error.message) ? 400 : 503;
    return res.status(status).json({ error: error.message || "Could not save cookie settings." });
  }
};
