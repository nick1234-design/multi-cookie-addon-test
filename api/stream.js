const Showbox = require("../providers/Showbox.js");
const { getCookies } = require("../lib/cookie-store");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  try {
    const type = String(req.query.type || "movie").toLowerCase();
    let id = String(req.query.id || "").trim();
    let season = req.query.season == null ? null : Number(req.query.season);
    let episode = req.query.episode == null ? null : Number(req.query.episode);

    // Stremio encodes series episode IDs as IMDbID:season:episode.
    if ((type === "series" || type === "tv") && (season == null || episode == null)) {
      const parts = id.split(":");
      if (parts.length >= 3) {
        id = parts[0];
        season = Number(parts[1]);
        episode = Number(parts[2]);
      }
    }

    if (!id) return res.status(400).json({ streams: [], error: "Missing IMDb or TMDB id." });
    if (!["movie", "series", "tv"].includes(type)) {
      return res.status(400).json({ streams: [], error: "type must be movie or series." });
    }
    if (type !== "movie" && (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode < 1)) {
      return res.status(400).json({ streams: [], error: "TV requests require season and episode numbers." });
    }

    const cookies = await getCookies();
    if (!cookies.length) {
      return res.status(503).json({
        streams: [],
        error: "No FebBox cookies configured. Open the add-on /configure page and save your cookies."
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

    const args = [
      tmdbType,
      tmdbId,
      season,
      episode,
      process.env.FEBBOX_REGION || "USA7"
    ];

    if (req.query.compare === "1") {
      const cookieResults = [];
      const combined = [];
      for (let index = 0; index < cookies.length; index++) {
        const result = await Showbox.getStreamsFromTmdbId(
          ...args,
          [cookies[index]]
        );
        const list = Array.isArray(result) ? result : [];
        cookieResults.push({ cookie: index + 1, streamCount: list.length });
        combined.push(...list);
      }
      return res.status(200).json({
        streams: combined,
        testedCookies: cookies.length,
        cookieResults
      });
    }

    const streams = await Showbox.getStreamsFromTmdbId(
      ...args,
      cookies
    );

    return res.status(200).json({
      streams: Array.isArray(streams) ? streams : [],
      testedCookies: cookies.length,
      mode: "fallback"
    });
  } catch (error) {
    console.error("[Addon Stream Error]", error && error.stack ? error.stack : error);
    return res.status(500).json({
      streams: [],
      error: error && error.message ? error.message : "Stream scraping failed."
    });
  }
};
