# Claude Usage — Chrome extension

A minimal popup that shows your Claude account usage limits (session + weekly),
read from your logged-in claude.ai session.

## Install (unpacked)

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and pick this folder
4. Make sure you're signed in to https://claude.ai, then click the extension icon

## How it works

- `background.js` calls claude.ai's API with your existing session cookie.
  It first tries a direct request from the extension; if the cookie isn't sent
  (Chrome may drop it on cross-site requests), it retries the same request from
  inside an open claude.ai tab, where it's same-origin.
- It probes a few known usage endpoints and remembers the one that works.
- The response is scanned generically for anything that looks like a limit
  bucket (`utilization`, `percent_used`, `used`/`limit`, `remaining`/`limit`,
  plus a `reset*` timestamp), so the popup keeps working if the API shape changes.
- The last successful reading is cached, so the popup shows values instantly and
  still shows something if a refresh fails.

## If it shows "Could not read usage from any known endpoint"

The API path likely changed. Open claude.ai → Settings → Usage with DevTools →
Network, find the request that returns the usage numbers, and add its path to
`CANDIDATE_PATHS` in `background.js` (use `{org}` for the organization UUID).
The error panel lists every path that was tried.

## Files

- `manifest.json` — MV3 manifest
- `background.js` — fetching + normalizing
- `popup.html` / `popup.css` / `popup.js` — the popup UI
- `icons/` — generated icons
