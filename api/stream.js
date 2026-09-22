const { getStreamsFromTmdbId } = require("../providers/Showbox.js");

export default async function handler(req, res) {
    try {
        const { type, id } = req.query;

        if (!type || !id) {
            return res.status(400).json({
                streams: [],
                error: "Missing type or id"
            });
        }

        // Stremio IDs can arrive as IMDb IDs such as tt0133093.
        const streams = await getStreamsFromTmdbId(
            type === "series" ? "tv" : "movie",
            id
        );

        return res.status(200).json({
            streams: Array.isArray(streams) ? streams : []
        });

    } catch (error) {
        console.error("[Addon Stream Error]", error);

        return res.status(500).json({
            streams: [],
            error: error.message
        });
    }
}