const Showbox = require("../providers/Showbox.js");

function readCookies() {
  const values = [
    process.env.FEBBOX_COOKIE_1,
    process.env.FEBBOX_COOKIE_2
  ];

  if (process.env.FEBBOX_COOKIES) {
    values.push(...process.env.FEBBOX_COOKIES.split(/\r?\n|\|\|/));
  }

  return [...new Set(values.map(v => String(v || "").trim()).filter(Boolean))].slice(0, 2);
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const type = String(req.query.type || "movie").toLowerCase();
    const id = String(req.query.id || "").trim();
    const season = req.query.season == null ? null : Number(req.query.season);
    const episode = req.query.episode == null ? null : Number(req.query.episode);

    if (!id) return res.status(400).json({ streams: [], error: "Missing IMDb or TMDB id." });
    if (!["movie", "series", "tv"].includes(type)) {
      return res.status(400).json({ streams: [], error: "type must be movie or series." });
    }
    if (type !== "movie" && (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode < 1)) {
      return res.status(400).json({ streams: [], error: "TV requests require season and episode numbers." });
    }

    const cookies = readCookies();
    if (!cookies.length) {
      return res.status(503).json({
        streams: [],
        error: "No FebBox cookies configured. Add FEBBOX_COOKIE_1 and FEBBOX_COOKIE_2 in Vercel Environment Variables."
      });
    }

    let tmdbId = id;
    let tmdbType = type === "series" || type === "tv" ? "tv" : "movie";

    if (id.startsWith("tt")) {
      const converted = await Showbox.convertImdbToTmdb(id);
      if (!converted) return res.status(200).json({ streams: [], error: "Could not convert IMDb ID to TMDB ID." });
      tmdbId = String(converted.tmdbId);
      tmdbType = converted.tmdbType;
    }

    const streams = await Showbox.getStreamsFromTmdbId(
      tmdbType,
      tmdbId,
      season,
      episode,
      process.env.FEBBOX_REGION || "USA7",
      cookies
    );

    return res.status(200).json({
      streams: Array.isArray(streams) ? streams : [],
      testedCookies: cookies.length
    });
  } catch (error) {
    console.error("[Addon Stream Error]", error && error.stack ? error.stack : error);
    return res.status(500).json({
      streams: [],
      error: error && error.message ? error.message : "Stream scraping failed."
    });
  }
};
