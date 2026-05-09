# Fantasy Reality TV — Claude Onboarding

A fantasy-league manager for reality TV shows (Survivor, Top Chef, Love Island, Bachelor/ette, Bake Off, Traitors, …). Vite + React SPA, Firebase Realtime Database + Firebase Auth, deployed to Netlify from `main` → app.fantasyrealitytv.com.

## Stack

- **Frontend:** React 18 (single-file [src/App.jsx](src/App.jsx)) + Vite 5
- **Backend:** Firebase **Realtime Database** (not Firestore) + Firebase Auth
- **Hosting:** Netlify auto-deploy from GitHub `main`
- **Landing page:** separate Netlify site, source in [landing_page/](landing_page/), manual deploy
- **PWA:** service worker (network-first) + manifest
- **Spreadsheet import:** `xlsx` (SheetJS)

Full tech-stack table, key-file inventory, and important constants live in [docs/history/version-log.md](docs/history/version-log.md) — that's the canonical reference; this section is a 30-second onboarding.

## File layout

| Path | Purpose |
|---|---|
| [src/main.jsx](src/main.jsx) | Entry point + service worker registration |
| [src/App.jsx](src/App.jsx) | Entire UI and logic — ~6,065 lines, **one file by design** |
| [src/firebase.js](src/firebase.js) | Auth + DB helpers, `ADMIN_EMAIL` constant |
| [public/](public/) | `manifest.json`, `sw.js`, icons, `tos.html`, `privacy.html` |
| [dist/](dist/) | Vite build output — gitignored, never edit by hand |
| [landing_page/](landing_page/) | Separate landing site source (manual deploy) |
| [database.rules.json](database.rules.json) | RTDB security rules |
| [firebase.json](firebase.json) | RTDB rules pointer only — hosting is Netlify, not Firebase |
| [.firebaserc](.firebaserc) | Firebase project: `fantasy-reality-d7e16` |
| [netlify.toml](netlify.toml) | Build = `npm run build`, publish = `dist/`, SPA redirect |
| [_data/](_data/) | Local data dumps (xlsx, csv, RTDB exports) — gitignored |

## Conventions actually in use

- **One-file React app.** `App.jsx` holds all components, hooks, scoring rules, and screens. Don't split it without explicit go-ahead — the codebase has been intentionally kept this way through v2.4.x.
- **State management:** local React hooks (`useState` / `useMemo` / `useCallback` / `useRef`). No Redux, no Context provider tree, no Zustand. Persistence goes through [src/firebase.js](src/firebase.js).
- **DB writes:** prefer `saveLeague(league)` (granular `update()` on a single league path) over `saveAllLeagues(leagues)` (bulk replace). The bulk version caused a race condition fixed in v2.1.0.0 — see [docs/architecture/firebase.md](docs/architecture/firebase.md). Use `saveAllLeagues` **only** for join-via-invite, create/duplicate league, and admin bulk ops.
- **DB paths:** app data is namespaced under `frtv/`. User profiles live at `frtv_users/<uid>`. See [docs/architecture/data-model.md](docs/architecture/data-model.md).
- **Admin gating:** `ADMIN_EMAIL = "scottwpii@gmail.com"`, exported from [src/firebase.js:30](src/firebase.js#L30). Mirrored in [database.rules.json](database.rules.json) — keep them in sync if it ever changes.
- **Versioning:** `vMAJOR.MINOR.PATCH.HOTFIX`. Bump in [package.json](package.json) and add a row in [docs/history/version-log.md](docs/history/version-log.md) per release. Scheme defined in version-log.md.

## Deployment flow

1. Commit to `main` → Netlify auto-builds and deploys to `app.fantasyrealitytv.com`.
2. RTDB rules: `firebase deploy --only database` (manual, rarely needed).
3. Landing page: separate Netlify site, manual deploy from [landing_page/](landing_page/).
4. **No staging environment.** `main` = production.

## No-go zones

- Don't edit [dist/](dist/) — it's the build output.
- Don't commit `.env*`, service-account JSON, or RTDB exports.
- Don't push directly to `main` without a clean local `npm run build`.
- Don't refactor [src/App.jsx](src/App.jsx) into multiple files without explicit ask.
- The Firebase web config in [src/firebase.js](src/firebase.js) is **intentional and public-safe** — actual access control is in `database.rules.json`. Do not "fix" it by extracting to env vars.
- Don't add Firestore — this app is RTDB end-to-end.
- Don't introduce Cloud Functions, Firebase Hosting, or Firebase Storage without a design discussion first.

## Where to look next

- [docs/architecture/data-model.md](docs/architecture/data-model.md) — RTDB paths, rules, save patterns
- [docs/architecture/firebase.md](docs/architecture/firebase.md) — auth flow, admin gating, race-condition history
- [docs/scoring/](docs/scoring/) — per-show scoring rule sets (stub; rules currently live in `App.jsx`)
- [docs/formats/](docs/formats/) — H2H, Best Ball, Roto, Salary Cap engines (stub; engines live in `App.jsx`)
- [docs/history/version-log.md](docs/history/version-log.md) — full release history + versioning scheme + tech-stack table
- [docs/launch/reddit-soft-launch.md](docs/launch/reddit-soft-launch.md) — Reddit launch plan
- [BACKLOG.md](BACKLOG.md) — current roadmap (Now / Next / Later)

## Local dev

```bash
npm install
npm run dev       # Vite dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

No test suite configured. UI changes need to be verified in the browser before merging.
