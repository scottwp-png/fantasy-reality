# Fantasy Reality TV

Fantasy-league manager for reality TV shows — Survivor, Top Chef, Love Island, Bachelor/ette, Bake Off, Traitors, and more. Live at **[app.fantasyrealitytv.com](https://app.fantasyrealitytv.com)**.

Vite + React SPA backed by Firebase (Realtime Database + Auth), deployed to Netlify from `main`.

## Quick start

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Requires Node 18+.

## Repo map

- [src/](src/) — application source. `App.jsx` is the whole app; `firebase.js` is the auth + DB layer.
- [public/](public/) — PWA manifest, service worker, icons, legal pages.
- [docs/](docs/) — architecture, scoring, formats, version history, launch planning.
- [database.rules.json](database.rules.json) — Firebase Realtime Database security rules.
- [BACKLOG.md](BACKLOG.md) — current roadmap.
- [CLAUDE.md](CLAUDE.md) — onboarding doc for working in this repo with Claude Code.

## Deploying

- **App** — push to `main`; Netlify auto-builds and ships to `app.fantasyrealitytv.com`.
- **Database rules** — `firebase deploy --only database` (manual, rare).
- **Landing page** — separate Netlify site, sourced from [landing_page/](landing_page/), deployed manually.

There is no staging environment. `main` is production.

## More

See [CLAUDE.md](CLAUDE.md) for full conventions, the save-pattern contract, no-go zones, and pointers into [docs/](docs/).
