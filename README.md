# Kastoria FM 91.5

Minimal live radio web player for [Kastoria FM 91.5](https://www.kastoriafm.gr).

No login — just the station logo and a live stream player.

## Develop

```bash
npm install
npm run dev
```

The Vite dev/preview server proxies `/stream` to the station’s Shoutcast feed (`http://eco.onestreaming.com:8107/stream`) so the player works without mixed-content issues.

## Build

```bash
npm run build
npm run preview
```

## Stack

- Vite
- Vanilla JS
- Official stream: Kastoria Fm 91.5 (128 kbps MP3)
