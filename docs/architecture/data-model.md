# Data Model — Firebase Realtime Database

The app stores everything in a single Firebase Realtime Database (project `fantasy-reality-d7e16`). This document is the authoritative map of paths, what lives at each one, who can read/write, and the conventions for updating them.

## Top-level paths

```
/
├── frtv/                       # Application data (leagues + global settings)
│   ├── league_index            # Array<leagueId> — ordered list of all leagues
│   ├── league_<id>             # League object — one node per league
│   ├── site_announcement       # String/object — global banner shown app-wide
│   └── feature_flags           # Object — feature gating, admin-managed
│
└── frtv_users/                 # User profiles (one node per Firebase Auth uid)
    └── <uid>                   # User object — links Auth uid to league teams
```

## `frtv/league_index`

Ordered array of league IDs. Source of truth for "what leagues exist." Loaded by [src/firebase.js:71-73](src/firebase.js#L71-L73) `loadAllLeagues()`, which iterates the index and pulls each `league_<id>` node.

- **Write:** admin only (rules) — but in practice the app only mutates this on create / duplicate / delete league.
- **Read:** any authenticated user (everyone needs to know what leagues exist to join one).

## `frtv/league_<id>`

The full league object — settings, scoring rules, teams, rosters, weekly scores, audit log, lock state, everything. Accessed via `loadData("league_" + id)` and `saveLeague(league)` ([src/firebase.js:81-88](src/firebase.js#L81-L88)).

- **Write:** any authenticated user (rules permit this so the join-via-invite flow works — joining adds a user to the league's `teams` array, which requires writing the league node). Commissioner-only enforcement happens in the UI, not in the rules.
- **Read:** any authenticated user.

> **Why writes are open:** the alternative would be a Firebase Cloud Function or a separate "join requests" path with admin approval. Both add friction. The current design accepts that a malicious authenticated user could mutate any league, on the bet that the app is small enough and the audit log makes tampering visible.

## `frtv/site_announcement` and `frtv/feature_flags`

Global, admin-managed.

- **Write:** admin only (`auth.token.email === 'scottwpii@gmail.com'`).
- **Read:** any authenticated user.

If `ADMIN_EMAIL` in [src/firebase.js:30](src/firebase.js#L30) ever changes, the matching string in [database.rules.json](database.rules.json) must change too. There is no shared constant — they're two strings that must be kept in sync.

## `frtv_users/<uid>`

One node per Firebase Auth UID. Stores the link between an authenticated user and the team(s) they own across leagues, plus profile info (display name, photo, settings).

- **Write:** the user themselves (`auth.uid === $uid`) or admin.
- **Read:** the user themselves or admin.

Helpers in [src/firebase.js:94-107](src/firebase.js#L94-L107):
- `loadUserProfile(uid)` / `saveUserProfile(uid, profile)`
- `loadAllUserProfiles()` (admin-only at the rules level — fails silently for non-admins via the `try/catch`)
- `deleteUserProfile(uid)` for the Delete Account flow

## Save patterns — read this before adding new writes

There are **three** ways to write league data, and they are not interchangeable.

### `saveLeague(league)` — the default

Granular per-league update via Firebase `update()` on `frtv/league_<id>`. Use this for every in-session league change — scoring, roster swaps, settings, lock-in, etc.

```js
await update(ref(db, "frtv"), { ["league_" + league.id]: league });
```

The `update()` call only touches the one path it's given, so two clients editing different leagues at the same time don't collide.

### `saveAllLeagues(leagues)` — bulk replace, dangerous

Replaces the entire `frtv/league_index` and rewrites every `frtv/league_<id>` node. Use **only** for:
- Joining a league via invite code (touches the index + the joined league)
- Creating or duplicating a league (touches the index + the new league)
- Admin bulk operations (import, seed, clear)

Anything else risks the race condition fixed in v2.1.0.0: if two clients each call `saveAllLeagues` with their own copy of the leagues array, the second write silently destroys the first client's edits.

### `saveData(key, value)` — escape hatch

Generic `set()` against `frtv/<key>`. Used for `league_index`, `site_announcement`, `feature_flags`. Don't use it on `league_<id>` paths — `saveLeague` does that correctly.

## Relevant code

- [src/firebase.js](src/firebase.js) — all read/write helpers, `ADMIN_EMAIL` constant, auth functions
- [database.rules.json](database.rules.json) — security rules (mirror of admin email)
- [firebase.json](firebase.json) — points to `database.rules.json`; no hosting config (Netlify hosts)
- [.firebaserc](.firebaserc) — project alias `default = fantasy-reality-d7e16`

## Deploying rules

```bash
firebase deploy --only database
```

Manual, rarely needed. Netlify deploys handle the app; Firebase CLI handles RTDB rules.

## Future considerations

- **Tribe merge × per-episode scoring cadence (planned, see [BACKLOG.md](../../BACKLOG.md)):** untested interaction. Tribed shows are typically 1×/wk and stay weekly, so realistic user count is small. Before declaring episode mode GA, verify pre-merge tribal attribution still resolves correctly for any league that has crossed a merge and then flipped cadence.
