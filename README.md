# Kastoria FM 91.5

Minimal live radio web player for [Kastoria FM 91.5](https://www.kastoriafm.gr).

No login — just the station logo and a live stream player.

## Develop locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build (local)

```bash
npm run build
npm start
```

Then open `http://localhost:4173`.  
`npm start` serves the built site and proxies `/stream` to the live radio feed (needed because browsers block mixed HTTP audio on HTTPS pages).

## Publish online (recommended: Render)

The live stream is HTTP-only, so this app needs a small Node server in production — a plain static host (GitHub Pages alone) will show the UI but cannot play audio over HTTPS.

1. Merge this branch / push to GitHub (already at `tomopoulost-alt/Kastoriafm`).
2. Go to [https://render.com](https://render.com) and sign in with GitHub.
3. Click **New +** → **Web Service**.
4. Connect the `Kastoriafm` repository.
5. Use these settings:
   - **Branch:** `main` (or this feature branch)
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance type:** Free
6. Click **Create Web Service**.

Render will give you a public URL like `https://kastoriafm.onrender.com`.

Or, if the repo contains `render.yaml`, choose **New +** → **Blueprint** and apply it.

### Free-tier note

On Render’s free plan the service may sleep after inactivity. The first visit after sleep can take ~30–60 seconds to wake.

## Alternative hosts

Any host that can run Node works with the same commands:

```bash
npm install && npm run build && npm start
```

Examples: Railway, Fly.io, a VPS. A `Dockerfile` is included if you prefer container deploys.

## Stack

- Vite + vanilla JS
- Official stream: Kastoria Fm 91.5 (128 kbps MP3 via OneStreaming)
