# Multi-Cookie FebBox Test Add-on

A Stremio stream add-on that discovers FebBox shares through the Showbox provider and retries up to two configured FebBox session cookies when scraping returns no playable streams.

## Configuration

Open `/configure` after deployment. Configure these Vercel Environment Variables:

- `TMDB_API_KEY` — required for IMDb-to-TMDB lookup (if not already set).
- `FEBBOX_COOKIE_1` — first FebBox `ui` token value (token only; do not include the `ui=` prefix).
- `FEBBOX_COOKIE_2` — second FebBox `ui` token value (token only; do not include the `ui=` prefix).
- `FEBBOX_REGION` — optional region, defaults to `USA7`.

Redeploy after changing environment variables. Cookies are not stored in the browser or source repository.

## Routes

- `/configure` — configuration and live scraper test page.
- `/api/manifest` — Stremio add-on manifest.
- `/api/stream?type=movie&id=tt...` — movie streams.
- `/api/stream?type=series&id=tt...&season=1&episode=1` — episode streams.

The stream handler tries the configured cookies in order and returns the first cookie's non-empty stream result. It does not expose cookie values in API responses.
