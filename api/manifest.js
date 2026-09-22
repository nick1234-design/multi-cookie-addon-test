export default function handler(req, res) {
  res.status(200).json({
    id: "com.nick215.multicookie.test",
    version: "1.0.0",
    name: "Multi-Cookie Test",
    description: "Testing quota-based multi-cookie selection",
    resources: ["stream"],
    types: ["movie", "series"],
    catalogs: []
  });
}