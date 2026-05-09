# Fantasy Reality TV — Backlog

> Completed work lives in [docs/history/version-log.md](docs/history/version-log.md). This file is for what's coming next.

**Current Production Version:** v2.4.2.2
**Last Updated:** 2026-05-09

---

## Now (in flight / next up)

- [ ] 🔴 **Per-episode scoring cadence** — refactor scoring from per-week to per-episode. Commissioner scores each episode individually (Ep 1, Ep 2, …), not "Week 1." Standings update after each scored episode. Covers all show cadences: 1×/wk (Survivor), 3×/wk (Big Brother), 5–6×/wk (Love Island). Weekly rollups still available in standings. *Critical for DAW metrics and high-frequency shows.*
- [ ] 🟡 **Shows management / Commissioner tab** — admin-facing tools for managing show metadata, contestant lists, episode tracking.
- [ ] 🟡 **Teams tab rework** — make useful for regular players: all teams' rosters, H2H records, comparative stats, league-wide views.

## Next (queued, prioritized)

- [ ] 🟡 **Desktop/web layout rework** — true multi-column layout with sidebar nav, better use of horizontal space.
- [ ] 🟡 **Admin scoring cascade** — global admin sets contestant actions per show per episode, cascades to all leagues with matching scoring metrics. *e.g. Top Chef Ep 3: Anthony won Quickfire → all TC leagues auto-score it.*
- [ ] 🟡 **Real-time sync** — Firebase `onValue` listeners so changes from other users appear without manual refresh.
- [ ] 🟡 **Scoring templates** — add Love Island USA/UK templates, refine existing per show.
- [ ] 🟡 **Social sharing** — OG meta tags so Reddit/social link previews show app branding. Share league invite on social. *Important for Reddit launch.*

## Later (parked until user base warrants)

- [ ] 🟢 **Notifications** — roster lock reminders, scoring alerts, episode standings updates.
- [ ] 🟢 **Payment / ads** — Google AdSense when traffic justifies.
- [ ] 🟢 **Landing page continued refinement** — A/B test copy, testimonials, social proof, multi-show screenshots.
- [ ] 🟢 **Global roster lock** tied to show air times.
- [ ] 🟢 **League chat / comments.**
- [ ] 🟢 **Trade system** between managers.

## Ideas (unscheduled)

- Firebase Storage upload for photos (avoid CDN hotlink issues)
- Screen-recording walkthrough for landing page
- Dark/light theme toggle
- Cast import from URL (AI-powered extraction)
- Per-show Reddit community engagement strategy
- r/FantasyRealityTV subreddit as community hub

---

*Soft-launch / Reddit plan moved to [docs/launch/reddit-soft-launch.md](docs/launch/reddit-soft-launch.md).*

## How to update this file

Any Claude conversation in this project can update this backlog. Just say:
- "Add [item] to the backlog"
- "Move [item] to Now / Next / Later"
- "Change priority on [item]"
- "What's on the backlog?"
