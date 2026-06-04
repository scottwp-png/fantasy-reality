# Fantasy Reality TV — Backlog

> Completed work lives in [docs/history/version-log.md](docs/history/version-log.md). This file is for what's coming next.

**Current Production Version:** v2.6.27.0
**Last Updated:** 2026-06-04

**Medium-term goal:** ship the app on **Google Play via TWA** (Trusted Web Activity). No Mac means iOS via Capacitor is deferred 6+ months — covered by Safari's "Add to Home Screen" in the meantime. The ordering below is organized around what gates the Play Store submission vs. what's post-launch growth.

---

## Now (in flight / next up — all gate the Play Store path)

- [ ] 🔴 **Live draft format** — pre-season snake draft, all managers in real time. Auto-pick on the clock, draft chat, undo timer. Builds on the v2.6.23.2 live-sync foundation. Paired with push notifications below — the engagement loop is "go score the live draft now" → push notification.
- [ ] 🔴 **Push notifications** — browser/OS-level pushes (Firebase Cloud Messaging + VAPID + service-worker push handler). The single biggest reason a user would install from the Play Store over using the PWA — TWA pipes web push through to OS notifications. Paired with live draft above.
- [ ] 🟠 **Social sharing meta tags** — OG/Twitter cards so Reddit/Discord/social link previews show app branding instead of bare URLs. *Promoted from Next.* Play Store listing cross-references the landing page; link previews need to look real.
- [ ] 🟠 **`survivor_pool` comparator bug** — [src/scoring.js:113-115](src/scoring.js#L113-L115) returns `+1` for both `compare(false, null)` and `compare(null, false)`, violating the comparator contract. Output order for tied null-pick vs. eliminated teams is V8-dependent. Two related issues: `isAlive` is literal `null` (not `false`) for no-pick teams due to short-circuit; `total` for no-pick reports as `weeks.length` because `eliminatedWeek` is undefined, rendering "survived all weeks" in UI. *Fix:* explicit tier ordering (alive > eliminated > no-pick) + coerce `isAlive` to boolean. *Promoted from Later — visible scoring bug that would be embarrassing on a public Play Store listing.*
- [ ] 🟠 **MFA on the admin Firebase Auth account** — UID gating (v2.6.24.5) reduces single-point-of-failure, but adding multi-factor to the Firebase Auth account closes the last remaining password-compromise vector. Project-level config, not a code change. *Promoted from Later — security hygiene before broader exposure.*
- [ ] 🟠 **Membership-gated chat reads** — chat path `frtv/league_<id>_chat` is still auth-readable (per v2.6.25.0 deferral). True per-league privacy needs either (a) a sibling members map at the chat path, or (b) moving chat into the league doc and restructuring saveLeague. *Promoted from Next — close the last open privacy gap so the Play Store data-safety form can honestly say "chat is private to league members."*

## Play Store launch (after Now is clear)

- [ ] 🔴 **TWA scaffolding** — Bubblewrap CLI setup on Windows (no Mac needed). App icons at every Android adaptive size + splash screen + monochrome icon. Generate signed `.aab`, test on real devices. Verify deep links — `?join=CODE` invite URLs should open in the installed app, not the browser. ~3–4 days.
- [ ] 🔴 **Play Store submission** — Google Play Console account ($25 one-time). Listing copy (reuse landing-page copy). Screenshots at phone + tablet sizes. Privacy policy + data-safety form + content rating questionnaire. Submit; expect 1 review round. ~3–5 days including review.

## Next (post-Play-Store growth)

- [ ] 🟡 **Max-teams per league** — optional `league.maxTeams` field, enforced at join time. Mostly relevant for Head-to-Head (needs even count). Deferred from v2.6.25.0 — minimal payoff for Heroes/Captains which is the only live format.
- [ ] 🟡 **Teams tab rework** — make useful for regular players: all teams' rosters, H2H records, comparative stats, league-wide views.
- [ ] 🟡 **Desktop/web layout rework** — true multi-column layout with sidebar nav, better use of horizontal space. Mobile-first carries us through Play Store launch; desktop polish is the next visual upgrade. *Explicitly deferred behind Play Store — Play Store is Android-mobile-focused.*
- [ ] 🟡 **Trade system between managers** — two-sided contestant swaps. Propose, counter, accept, veto. Commissioner can enable/disable per league.
- [ ] 🟡 **Re-sortable standings** — currently season-total is the canonical rank; v2.6.25.3 re-ranks on period change but doesn't expose other sort options (best week, worst week, biggest swing, etc.).

## Later (parked until user base warrants)

- [ ] 🟢 **iOS Capacitor path** — revisit when (a) feature velocity has slowed enough to align with App Review cycles, and (b) there's budget for cloud builds (Ionic Appflow / EAS Build ~$30–50/mo) and an OTA update service. Requires Sign in with Apple wired into Firebase Auth. Probably 6+ months out. PWA on Safari → Add to Home Screen covers iOS users in the meantime.
- [ ] 🟢 **Real `members` map at the chat path** — see "Membership-gated chat reads" above; lower priority if chat content stays casual.
- [ ] 🟢 **Self-claim by name match — fuzzy variants.** v2.6.25.8 self-claim requires exact (case-insensitive) match on `team.owner` vs `userProfile.displayName`. Nickname / first-name-only variants (Steve vs Stephen) don't match. Could add a "request claim" flow that pings the commissioner instead of fully self-serve.
- [ ] 🟢 **Payment / ads** — Google AdSense when traffic justifies.
- [ ] 🟢 **Landing page continued refinement** — A/B test copy, testimonials, social proof, more screenshots, actual demo video.
- [ ] 🟢 **Per-team avatar restoration in chat** — was in v2.6.24.0, removed in v2.6.24.2 as visually cluttered. Could come back as a small leading icon next to the name (not a 32px square).
- [ ] 🟢 **Bottom-sheet notification dropdown on mobile.** Current top-right anchored panel works; bottom-sheet would match platform expectations more closely.
- [ ] 🟢 **Dark/light theme toggle.**
- [ ] 🟢 **In-league interactive tour** — follow-up to v2.6.27.0 welcome walkthrough. Anchored to Roster / Scoring / Standings / Chat tabs, runs once when a user first opens a league they're a member of. Deferred pending observation of whether the first-run modal alone closes the gap.

## Ideas (unscheduled)

- Firebase Storage upload for photos (avoid CDN hotlink issues + bigger photo support)
- Screen-recording walkthrough for landing page
- Cast import from URL (AI-powered extraction)
- Per-show Reddit community engagement strategy
- r/FantasyRealityTV subreddit as community hub
- League archives — view a season-complete league's final standings without it cluttering active leagues
- Multi-show stats / cross-league leaderboard (admin view of who's winning across all leagues for the same show)
- Group invite links (public leagues already exist as of v2.6.25.0, but no "join by URL" surface yet)

---

## Recently shipped (last 60 days, abbreviated — full history in version-log.md)

- v2.6.27.0 — First-run walkthrough (5-step welcome modal, auto-opens once after signup, `?` re-launcher) + landing-page FAQ refresh (5 new pre-signup questions)
- v2.6.26.x — Heroes swap banking (optional, configurable cap), per-week vs per-episode swap rule fix, commissioner team-setup bundle (Pending chip + invite-URL pre-fill + bulk add), auto-claim during doJoin
- v2.6.25.x — Public/private leagues + server-side privacy gating, season-complete archiving, Browse Public directory, chat team-name resolution, standings period-aware re-ranking, commissioner-explicit team assignment
- v2.6.24.x — League chat + Lounge tab, notification bell + Clear All, navTarget click-through, mobile dropdown fix, admin UID gating + `email_verified` rules
- v2.6.23.x — Live sync (subscribeLeague), tie-rank handling, Mark Season Complete, "stuck-saving" hotfixes
- v2.6.22.x — Drag-drop rule library, bulk-add rules, bulk-edit toggle, **show-wide scoring cascade** (replaces additive on-read merge)
- v2.6.21.x — Co-commissioner roles + two-tier permissions, audit-log diff content, library/template split
- v2.6.20.x — Episode scoring as drill-in records, auto-lock schedule editor
- v2.6.19.x — Rule library admin descriptions
- v2.6.0.x – v2.6.18.x — Show-wide scoring foundations, admin Shows tab, show cast cascade, library, season-number structured key, season-specific cast list, settings cleanup

---

*Soft-launch / Reddit plan moved to [docs/launch/reddit-soft-launch.md](docs/launch/reddit-soft-launch.md).*

## How to update this file

Any Claude conversation in this project can update this backlog. Just say:
- "Add [item] to the backlog"
- "Move [item] to Now / Next / Later"
- "Change priority on [item]"
- "What's on the backlog?"
