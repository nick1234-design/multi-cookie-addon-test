import Showbox from "../providers/Showbox.js";
import fs from "fs";
import path from "path";

export default async function handler(req, res) {
    try {
        const { type, id } = req.query;

        if (!id) {
            return res.status(400).json({
                streams: [],
                error: "Missing id"
            });
        }

        // Load all cookies from cookies.txt
        const cookiesPath = path.join(process.cwd(), "cookies.txt");
        const cookiesContent = fs.readFileSync(cookiesPath, "utf8");

        const userCookies = cookiesContent
            .split(/\r?\n/)
            .map(cookie => cookie.trim())
            .filter(Boolean);

        console.log(
            `[Addon] Loaded ${userCookies.length} cookies for direct multi-cookie test.`
        );

        let tmdbId = id;
        let tmdbType = type === "series" ? "tv" : "movie";

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

        console.log(`[Addon] Request: ${tmdbType}/${tmdbId}`);

        const streams = await Showbox.getStreamsFromTmdbId(
            tmdbType,
            tmdbId,
            null,
            null,
            null,
            userCookies
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