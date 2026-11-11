# Multi-Cookie FebBox Test Add-on

Stremio add-on for FebBox-backed movie and TV episode stream discovery.

## First-time setup

1. Connect a Redis/Upstash database to this Vercel project and set only its connection URL as `REDIS_URL` in Vercel Environment Variables. This is persistent private storage; FebBox cookies are entered on the configuration page, not in Vercel variables.
2. Deploy the project.
3. Open `/configure`.
4. On the first save, create a configuration password (at least 10 characters), then paste one or two FebBox `ui` cookie tokens and save.
5. On later visits, enter the same configuration password to update the cookies.

Cookie values are stored in Redis and never sent back to the browser after saving. Do not share your configuration password or FebBox tokens.

## Routes

- `/configure` — secure cookie setup and movie/TV scraper test page.
- `/api/manifest` — Stremio manifest.
- `/stream/movie/tt1234567.json` — movie stream request.
- `/stream/series/tt1234567:1:1.json` — TV season 1 episode 1 stream request.
- `/api/stream?type=movie&id=tt1234567` — direct movie test.
- `/api/stream?type=series&id=tt1234567&season=1&episode=1` — direct episode test.

The stream handler tries saved cookies in order and falls back to the second when the first returns no streams.
