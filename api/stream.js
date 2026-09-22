import Showbox from "../providers/Showbox.js";

export default async function handler(req, res) {
  try {
    res.status(200).json({
      loaded: true,
      showboxLoaded: typeof Showbox
    });
  } catch (error) {
    console.error("[Addon]", error);

    res.status(500).json({
      loaded: false,
      error: error.message
    });
  }
}