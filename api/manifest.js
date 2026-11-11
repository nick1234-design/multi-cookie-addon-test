module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({
    id: "com.nick1234.multicookie.test",
    version: "1.1.0",
    name: "Multi-Cookie FebBox Test",
    description: "FebBox stream scraper with two-cookie fallback",
    resources: ["stream"],
    types: ["movie", "series"],
    catalogs: [],
    idPrefixes: ["tt"]
  });
};
