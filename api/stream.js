import Showbox from "../providers/Showbox.js";

export default async function handler(req, res) {
    try {
        const { type, id } = req.query;

        if (!id) {
            return res.status(400).json({
                streams: [],
                error: "Missing id"
            });
        }

        let tmdbId = id;
        let tmdbType = type === "series" ? "tv" : "movie";

        // Convert IMDb IDs such as tt0133093 to TMDB IDs
        if (id.startsWith("tt")) {
            const converted = await Showbox.convertImdbToTmdb(id);

            if (!converted) {
                return res.status(200).json({
                    streams: [],
                    error: "Could not convert IMDb ID to TMDB ID"
                });
            }

            tmdbId = converted.tmdbId;
            tmdbType = converted.tmdbType;
        }

        console.log(
            `[Addon] Request: ${tmdbType}/${tmdbId}`
        );

        const streams = await Showbox.getStreamsFromTmdbId(
            tmdbType,
            tmdbId
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