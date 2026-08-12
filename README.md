# Kastoria FM 91.5

Minimal live radio web player / PWA for [Kastoria FM 91.5](https://www.kastoriafm.gr).

No login — logo, live player, and install-to-home-screen.

## Local development

```bash
npm install
npm run dev
```

Opens under `http://localhost:5173/webapp/`.

## WordPress: `kastoriafm.gr/webapp`

```bash
npm run build:wordpress
```

Upload everything inside `wordpress/` to `public_html/webapp/`.

See `wordpress/UPLOAD.md` for full Greek instructions.

Visitors get an installable app (PWA). On Android Chrome: **Εγκατάσταση εφαρμογής**. On iPhone: Share → Add to Home Screen.

## Production Node host (Render / VPS)

```bash
npm run build
npm start
```

Note: if you deploy the Node server at site root, change `base` in `vite.config.js` from `/webapp/` to `/` first.

## Stack

- Vite + vanilla JS + PWA
- Official stream: Kastoria Fm 91.5 (128 kbps MP3)
- WordPress path uses `stream.php` so HTTPS pages can play the HTTP stream
