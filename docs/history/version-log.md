# Fantasy Reality TV — Version History

**Repo:** github.com/scottwp-png/fantasy-reality
**Current Production Version:** v2.4.3.0
**Last Deploy Date:** 2026-05-09
**App.jsx Line Count:** ~5,860
**Deploy Target:** Netlify auto-deploy from GitHub `main` branch

---

## Versioning Scheme

`vMAJOR.MINOR.PATCH.HOTFIX`

| Segment | Meaning |
|---------|---------|
| MAJOR | Architecture or platform changes (new auth system, new DB, major rewrite) |
| MINOR | Feature additions (new screens, new league formats, new UI systems) |
| PATCH | Bug fixes, polish, non-functional changes (legal pages, icon swaps) |
| HOTFIX | Emergency fixes to a specific patch (duplicate state, scope errors) |

---

## Version Log

### v2.4.3.0 — 2026-05-09
Extract scoring engine to `src/scoring.js` (no behavior change). Pure infrastructure commit — enables the regression harness for upcoming per-episode scoring cadence work.
- Pure line-move: `calcContestantWeekPoints`, `calcTeamWeekPoints`, `calcStandings` (~205 lines) moved from `src/App.jsx` to `src/scoring.js`. App.jsx imports the trio; no call-site changes; UI logic untouched.
- CLAUDE.md: scoring-engine carve-out documented under the "One-file React app" convention; one-file rule still applies to UI components and state management.
- Smoke-tested via `_snapshots/` harness — byte-identical `calcStandings` JSON output across 7 synthetic leagues (captains, standard, standard+roto, survivor_pool, elimination_pool, salary_cap, predictions) pre vs post extraction. `npm run build` clean (2.74s).
- Build warnings: pre-existing dynamic+static-import notices on `firebase/auth` and `src/firebase.js` are unchanged by this commit — present on `main` before extraction, out of scope here.
- **Commit:** `487a6ed`

### v2.4.2.0 → v2.4.2.2 — 2026-04-07
Final Lock-In (Heroes) — end-of-season roster lock with same-day UX polish
- **v2.4.2.0** — Introduce Final Lock-In on Captains/Heroes leagues: `closed → open → locked` state machine, commissioner opens the window, players confirm a final roster, eliminated contestants not selectable, depth-chart positions stay editable but contestant swaps end at lock. Read-only "Locked Roster" card visible to all viewers of a locked team. Plus spoiler-protection fix: scan all `weekStatus` entries (not just current week) so blur survives the commissioner advancing past a still-in-grace week, and reveals proceed in chronological order.
- **v2.4.2.1** — Lock-In UX rework: drop the standalone picker, add an inline "Confirm Final Roster" button below the existing depth-chart roster. Waive the weekly 1-swap limit while lock-in is open and the team is unconfirmed (so they can shuffle freely before locking). Hide the swap tracker during lock-in.
- **v2.4.2.2** — Confirm reads `localChart` not `team.depthChart` (in-progress dropdown edits no longer lost), persists depth chart + `weeklyDepthCharts` in the same write, validates all `2 + regularSlots` slots are filled before locking. Swap tracker stays hidden once locked. Commissioner gains per-team Reset, Reopen Lock-In (locked → open), and Cancel Lock-In (any → closed) controls.
- **Commits:** `5c91f77` (v2.4.2.0), `d8eb4f5` (v2.4.2.1), `be826b9` (v2.4.2.2)

### v2.4.1.0 — 2026-03-29
Eliminated contestant visibility, finalized week lock, unfinalize button, roster slot fix
- Week-aware filtering across ScoringTab, WeeklyDraftTab, DepthChartTab — eliminated contestants visible in their elimination week and all prior weeks
- Finalized weeks lock all scoring controls with banner + Unfinalize button
- My Roster ghost slot fix — eliminated players persist in assigned slots with "(eliminated)" label instead of disappearing
- **Commit:** `8f97afb`

### v2.4.0.0 — 2026-03-29
Final Polish Push: spoiler color leak fix, scoring tab for all users, team history depth, commissioner transfer confirmation
- Spoiler color leak fix (grayscale + neutral color)
- Scoring tab visible to all users (read-only Summary + Scoring Rules)
- Team History per-week breakdown (roster + individual scores with role/multiplier)
- Transfer Commissioner two-step confirmation
- **Commit:** `d2de316`

### v2.3.0.1 → v2.3.0.6 — 2026-03-29
Join-flow hotfixes and invite-code stabilization
- v2.3.0.6: fix join modal never appearing (missing `open` prop) — `4c96bef`
- v2.3.0.5: add join loading state + surface real error messages — `241d568`
- v2.3.0.4: add Regenerate Code button, restore `maxLength=8` for backward compat — `2001d25`
- v2.3.0.3: standardize all invite codes to 6 characters — `e126807`
- v2.3.0.2: hotfix join league flow (3 bugs) — `137db7e`
- v2.3.0.1: hotfix try/catch on `handleJoin` to surface invite code errors — `9cfca6b`
- *Adjacent:* Add `firebase.json` and `.firebaserc` for database rules deployment — `77aebf7`

### v2.3.0.0 — 2026-03-29
Quality Pass: bug fixes, UX simplification, preview gates, dashboard improvements
- Delete Account fix
- Join League code length fix (6→8 char support)
- Auth simplified to 2 tabs
- FAQ removed from app
- Settings → My Account with editable display name
- Preview gates on untested formats
- Standings rework (week/overall dropdown + cast scores)
- Settings pill sections
- Heroes re-swap dropdown fix
- Error handling on join/save
- **Commit:** `dad5e3e`

### v2.2.1.0 — 2026-03-29
Legal footer, TOS/privacy pages, new PWA icons
- Added legal footer to AppHome with links to TOS, Privacy Policy, and contact email
- Added standalone `public/tos.html` and `public/privacy.html` pages (dark-themed, FRTV branding)
- Replaced PWA icons (`icon-192.png`, `icon-512.png`) with retro TV + trophy design
- **Commit:** `387fa95`

### v2.2.0.0 — 2026-03-29
formatPts display consistency, invite flow polish, spoiler protection
- Fixed `formatPts` to display points consistently across all views
- Polished invite code flow (auto-populate from URL, error messages, confirmation step)
- Added spoiler protection toggle for league results
- **Commit:** `c35a530`

### v2.1.0.0 — 2026-03-26 to 2026-03-29
Race condition fix, Firebase security rules, code review cleanup
- Fixed race condition: switched to granular Firebase saves via `saveLeague`/`persistLeague`
- Implemented Firebase security rules
- Code review cleanup pass
- **Commits:** `d1f2f70`, `48c5f3f`

### v2.0.1.0 — 2026-03-26
Medals, avatars, headshot crop+zoom, decimal scoring, service worker fix
- Added medals and avatars on standings/teams
- Added headshot crop + zoom functionality
- Added decimal scoring setting with 2dp precision
- Fixed service worker: switched from cache-first to network-first to prevent stale builds
- **Commits:** `dcf818d`, `b58e125`, `5379542`, `97bdc9d`

### v2.0.0.0 — 2026-03-26
Headshots, team customization, settings screen, photo management, bio formatting
- Major UI overhaul: headshot system, team customization options
- New settings screen
- Photo management (upload, crop, display)
- Bio formatting support
- **Commit:** `76387dc`

### v1.9.2.0 — 2026-03-19 to 2026-03-25
Reverse week, commissioner roster override, code review cleanup
- Added reverse-week scoring mechanic
- Commissioner can now override rosters
- Landing page mobile fix
- Code review: removed dead code, trimmed 48KB seed data
- **Commits:** `33c8e77`, `03c872e`

### v1.9.1.0 — 2026-03-19
Admin email, feedback button, Firebase security rules
- Added admin email contact
- Added feedback button (with subsequent fix)
- Firebase security rules prepared
- Hotfixes: removed undefined `pendingJoinCode` in AuthScreen, removed duplicate `featureFlags` declaration
- **Commits:** `b034aca`, `e48634d`, `c669a0a`, `3392d7b`

### v1.9.0.0 — 2026-03-19
Invite links, auto-join from URL, team reassign, visual polish, feature flags
- Invite link system with `?join=CODE` URL support
- Auto-join flow after authentication
- Team reassignment capability
- Visual polish pass
- Feature flags system introduced
- **Commit:** `006061d`

### v1.8.0.0 — 2026-03-19
Sprint 2+3: H2H, Best Ball, Roto, Salary Cap, audit log, feature flags, responsive
- Four new league formats: Head-to-Head, Best Ball, Rotisserie, Salary Cap
- Audit log for commissioner actions
- Feature flags infrastructure
- Responsive layout improvements
- **Commit:** `ab4d579`

### v1.6.0.0 — 2026-03-19
3 new formats, create league wizard, custom scoring rules
- League creation wizard
- Custom scoring rule definitions
- H2H and Best Ball settings
- **Commit:** `cec850a`

### v1.5.0.0 — 2026-03-18
Heroes rebrand, emoji removal, scoring templates, 5 new shows
- Rebranded to "Heroes" theme (later evolved)
- Removed emojis from UI
- Full scoring templates system
- Added Love is Blind and 4 other show presets
- **Commits:** `980d6c1`, `a4a5316`, `ff0cbb4`, `666817b`

### v1.4.x — 2026-03-18
Hot picks, team history, expandable standings, visual polish
- v1.4.1.2: Fixed registration check to use Firebase Auth
- v1.4.1.0: Hot picks, team history, expandable standings, home rank
- v1.4.0.0: Visual polish — Outfit font, pill tabs, richer standings, modern cards
- **Commits:** `199ffde`, `410ba33`, `a9ca1ad`

### v1.3.x — 2026-03-17
Admin panel, announcements, linked scoring safety
- v1.3.2.0: Computed hasChanges, discard buttons, FAQ, mobile touch targets, admin manage tab, season progress bar, new favicon
- v1.3.0.0: Linked scoring safety, danger zone rework, admin panel, announcements
- **Commits:** `62fefbc`, `9cfed60`

### v1.2.0.x — 2026-03-17
Self-service league creation, commissioner roles
- Self-service league creation flow
- Commissioner role system
- Fixed duplicate linked scoring and transfer commissioner
- Responsive layout
- **Commits:** `e3fd86d`, `4766b0f`, `7cccb20`

### v1.1.0.0 — 2026-03-17
Firebase Auth (email + Google sign-in)
- **Commit:** `0d7a184`

### v1.0.0.1 — 2026-03-17
Initial Vite project
- **Commit:** `cee3e80`

---

## Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Frontend | React (single-file App.jsx) via Vite |
| Database | Firebase Realtime Database |
| Auth | Firebase Auth (email + Google sign-in) |
| Hosting | Netlify (auto-deploy from GitHub `main`) |
| PWA | Service worker (network-first), manifest.json |
| Landing Page | Separate Netlify site (fanciful-mooncake), manual deploy |

## Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/App.jsx` | Entire app UI and logic | ~5,693 |
| `src/firebase.js` | Firebase config, auth, DB helpers | ~101 |
| `public/manifest.json` | PWA manifest | 14 |
| `public/sw.js` | Service worker | — |
| `public/tos.html` | Terms of Service (standalone) | — |
| `public/privacy.html` | Privacy Policy (standalone) | — |

## Important Constants

| Constant | Location | Value |
|----------|----------|-------|
| ADMIN_EMAIL | `src/firebase.js` | scottwpii@gmail.com |
| Firebase project | `src/firebase.js` | fantasy-reality-d7e16 |
| App domain | Netlify | app.fantasyrealitytv.com |
| Landing page domain | Netlify | fantasyrealitytv.com |
