module.exports = function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    id: "com.nick1234.multicookie.febbox",
    version: "1.2.0",
    name: "Multi-Cookie FebBox",
    description: "FebBox movie and TV episode streams with automatic two-cookie fallback",
    resources: ["stream"],
    types: ["movie", "series"],
    catalogs: [],
    idPrefixes: ["tt"]
  });
};
