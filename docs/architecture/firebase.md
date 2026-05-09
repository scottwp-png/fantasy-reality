# Firebase — Auth and DB Conventions

Single Firebase project (`fantasy-reality-d7e16`) provides both auth and the database. This doc covers the patterns the app actually uses; for the path layout itself see [data-model.md](data-model.md).

## SDK and config

The app uses the modular Firebase Web SDK v10 (`firebase` on npm). All initialization lives in [src/firebase.js:15-28](src/firebase.js#L15-L28):

```js
const firebaseConfig = { apiKey: "AIzaSy…", authDomain: …, databaseURL: …, … }
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)
const auth = getAuth(app)
```

**The `apiKey` is intentionally hardcoded.** Firebase Web SDK keys are public client identifiers, not secrets — actual access control is enforced by [database.rules.json](database.rules.json) using `auth.uid` and `auth.token.email`. Do not move this config to environment variables; doing so adds a build-time secret-handling problem with no security benefit.

## Authentication

Two providers, both wrapped in [src/firebase.js](src/firebase.js):

- **Email + password** — `signUp(email, password, displayName)`, `signIn(email, password)`, `resetPassword(email)`. `signUp` calls `updateProfile` to set the display name in the same flow.
- **Google sign-in** — `signInWithGoogle()` uses a popup, not a redirect.

Auth state is observed via `onAuthChange(callback)`, a thin wrapper around `onAuthStateChanged`. The app subscribes once at mount in [src/App.jsx](src/App.jsx) and rerenders on changes.

Sign-out is `signOut()` (re-exported under that name to avoid colliding with the Firebase function). Account deletion is two steps:

1. `deleteUserProfile(uid)` — removes `frtv_users/<uid>`.
2. `deleteAuthAccount()` — removes the Firebase Auth user. Dynamically imports `deleteUser` to keep the main bundle small.

If step 2 fails (e.g. user needs to reauthenticate), step 1 has already removed the profile. Account-deletion UX should warn the user that this is non-atomic.

## Admin gating

```js
export const ADMIN_EMAIL = "scottwpii@gmail.com"
```

Two enforcement layers:

1. **Rules layer** ([database.rules.json](database.rules.json)) — only this email can write `league_index`, `site_announcement`, `feature_flags`, and read other users' profiles.
2. **UI layer** — App.jsx gates the admin tab and commissioner-override controls on `currentUser.email === ADMIN_EMAIL`.

The rules string and the constant must stay in sync. Changing the admin requires editing **both** [src/firebase.js:30](src/firebase.js#L30) and [database.rules.json](database.rules.json), then deploying rules with `firebase deploy --only database`.

## Database write patterns

See [data-model.md § Save patterns](data-model.md#save-patterns--read-this-before-adding-new-writes) for the canonical rules. Summary:

| Helper | When to use | When NOT to use |
|---|---|---|
| `saveLeague(league)` | Any in-session league edit (scoring, roster, settings, lock) | Bulk replace, league_index |
| `saveAllLeagues(leagues)` | Join via invite, create/duplicate league, admin bulk ops | In-session edits — causes the v2.1.0.0 race |
| `saveData(key, value)` | `league_index`, `site_announcement`, `feature_flags` | League nodes |
| `saveUserProfile(uid, …)` | User-owned profile data | League data |

The race condition that drove the introduction of `saveLeague` (v2.1.0.0): `saveAllLeagues` does a `set()` that replaces every league node. If two clients both load → edit → call `saveAllLeagues`, the second write erases the first. `saveLeague` uses `update()` on a single league path, so writes from different clients editing different leagues never collide.

## Reads

`loadData(key, fallback)` is the generic getter — wraps `get(ref(db, "frtv/" + key))` and returns `fallback` on null/error. The `try/catch` swallows errors and returns the fallback, so callers don't have to handle network failures explicitly.

All reads in the app are one-shot `get()`s today. There are no `onValue` listeners — changes from another client only appear after a manual refresh. Real-time sync is on the backlog (BACKLOG.md → Next).

## What's *not* in this stack

- **No Firestore.** Despite Firestore being the more commonly used Firebase DB, this app is pure Realtime Database. Don't introduce Firestore — the SDK, query model, and rules language are different.
- **No Cloud Functions.** All logic is client-side.
- **No Firebase Hosting.** App is hosted on Netlify; [firebase.json](firebase.json) only configures RTDB rules deployment.
- **No Storage.** Photo uploads currently use external CDNs (hotlinking). Migration to Firebase Storage is in BACKLOG.md → Ideas.

## When something goes wrong

- **"PERMISSION_DENIED" on a write** — check whether the user is authenticated, and whether the path requires admin (see [database.rules.json](database.rules.json)).
- **Edits silently disappear** — almost always means `saveAllLeagues` was used where `saveLeague` should have been. Audit recent code for the wrong helper.
- **Auth state flickers on reload** — `onAuthChange` fires once with `null` before resolving. UI should show a loading state, not an unauthenticated state, until the first definite resolution.
