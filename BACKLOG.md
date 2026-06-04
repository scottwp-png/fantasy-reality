# Fantasy Reality TV — Backlog

> Completed work lives in [docs/history/version-log.md](docs/history/version-log.md). This file is for what's coming next.

**Current Production Version:** v2.6.25.8
**Last Updated:** 2026-06-04

---

## Now (in flight / next up)

- [ ] 🔴 **Live draft format** — pre-season snake draft, all managers in real time. Auto-pick on the clock, draft chat, undo timer. Builds on the v2.6.23.2 live-sync foundation. Promised to ship alongside push notifications since the engagement loop is "go score the live draft now" → push notification.
- [ ] 🔴 **Push notifications** — browser/OS-level pushes (Firebase Cloud Messaging + VAPID + service-worker push handler). Paired with live draft above. Most realistic post-MVP engagement layer.
- [ ] 🟡 **Max-teams per league** — optional `league.maxTeams` field, enforced at join time. Mostly relevant for Head-to-Head (needs even count). Deferred from v2.6.25.0 — minimal payoff for Heroes/Captains which is the only live format.
- [ ] 🟡 **Teams tab rework** — make useful for regular players: all teams' rosters, H2H records, comparative stats, league-wide views.

## Next (queued, prioritized)

- [ ] 🟡 **Desktop/web layout rework** — true multi-column layout with sidebar nav, better use of horizontal space. Mobile-first carries us through Reddit traffic; desktop polish is the next visual upgrade.
- [ ] 🟡 **Membership-gated chat reads** — chat path `frtv/league_<id>_chat` is still auth-readable (per v2.6.25.0 deferral). True per-league privacy needs either (a) a sibling members map at the chat path, or (b) moving chat into the league doc and restructuring saveLeague. Pick one when chat content becomes sensitive enough to justify.
- [ ] 🟡 **Trade system between managers** — two-sided contestant swaps. Propose, counter, accept, veto. Commissioner can enable/disable per league.
- [ ] 🟡 **Social sharing meta tags** — OG/Twitter cards so Reddit/Discord/social link previews show app branding instead of bare URLs. Important for the next round of league shares.
- [ ] 🟡 **Re-sortable standings** — currently season-total is the canonical rank; v2.6.25.3 re-ranks on period change but doesn't expose other sort options (best week, worst week, biggest swing, etc.).

## Later (parked until user base warrants)

- [ ] 🟢 **Real `members` map at the chat path** — see "Membership-gated chat reads" above; lower priority if chat content stays casual.
- [ ] 🟢 **Self-claim by name match — fuzzy variants.** v2.6.25.8 self-claim requires exact (case-insensitive) match on `team.owner` vs `userProfile.displayName`. Nickname / first-name-only variants (Steve vs Stephen) don't match. Could add a "request claim" flow that pings the commissioner instead of fully self-serve.
- [ ] 🟢 **Payment / ads** — Google AdSense when traffic justifies.
- [ ] 🟢 **Landing page continued refinement** — A/B test copy, testimonials, social proof, more screenshots, actual demo video.
- [ ] 🟢 **Per-team avatar restoration in chat** — was in v2.6.24.0, removed in v2.6.24.2 as visually cluttered. Could come back as a small leading icon next to the name (not a 32px square).
- [ ] 🟢 **Bottom-sheet notification dropdown on mobile.** Current top-right anchored panel works; bottom-sheet would match platform expectations more closely.
- [ ] 🟢 **survivor_pool sort comparator bug** — [src/scoring.js:113-115](src/scoring.js#L113-L115) returns `+1` for both `compare(false, null)` and `compare(null, false)`, violating the comparator contract. Output order for tied null-pick vs. eliminated teams is V8-dependent. Two related issues: `isAlive` is literal `null` (not `false`) for no-pick teams due to short-circuit; `total` for no-pick reports as `weeks.length` because `eliminatedWeek` is undefined, rendering "survived all weeks" in UI. *Fix:* explicit tier ordering (alive > eliminated > no-pick) + coerce `isAlive` to boolean.
- [ ] 🟢 **Dark/light theme toggle.**
- [ ] 🟢 **MFA on the admin Firebase Auth account** — UID gating (v2.6.24.5) reduces single-point-of-failure, but adding multi-factor to the Firebase Auth account closes the last remaining password-compromise vector. Project-level config, not a code change.

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

- v2.6.25.x — Public/private leagues + server-side privacy gating, season-complete archiving, Browse Public directory, chat team-name resolution, standings period-aware re-ranking, self-claim banner
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
