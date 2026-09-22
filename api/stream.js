import { getTestStreams } from "../lib/test-provider.js";

export default async function handler(req, res) {
  try {
    const streams = await getTestStreams();

    res.status(200).json({
      streams
    });
  } catch (error) {
    console.error("[Addon]", error.message);

    res.status(500).json({
      streams: []
    });
  }
}