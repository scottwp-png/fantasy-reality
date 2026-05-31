# Fantasy Reality TV — Version History

**Repo:** github.com/scottwp-png/fantasy-reality
**Current Production Version:** v2.4.13.0
**Last Deploy Date:** 2026-05-15
**App.jsx Line Count:** ~6,180
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

### v2.4.13.0 — 2026-05-15
Gender-minimum roster constraint for Heroes (Captains) format. New `captainsConfig.genderedRoster` flag with paired `minMale` / `minFemale` numeric inputs at league creation and in SettingsTab. Live roster validation in `DepthChartTab` — chip showing current `2M / 2F` count, Save button disabled when minimums aren't met, gender labels added to the contestant picker dropdown. Designed for the Love Island launch tomorrow where managers field a 4-person Heroes roster requiring exactly 2 boys + 2 girls. All 10 regression baselines pass byte-identical, `npm run build` clean.
- **Data model — three new fields on `captainsConfig`:**
  - `genderedRoster: boolean` (default `false`) — activates the constraint.
  - `minMale: number` (default `0` when not yet set, default `2` in CreateLeagueScreen).
  - `minFemale: number` (default `0` when not yet set, default `2` in CreateLeagueScreen).
  - Existing Captains leagues without these fields read as `genderedRoster === undefined` → falsy → constraint never applied. Backward-compat is automatic.
  - Lives nested under `captainsConfig` (alongside `regularSlots`) because the constraint is format-specific. Standard's `genderedDraft` flag stays at the root of `standardConfig` — symmetric pattern.
- **CreateLeagueScreen Heroes Config block** at `App.jsx:787-816`. Three new state hooks (`genderedRoster`, `minMale`, `minFemale`) alongside the existing `regularSlots` hook. New checkbox `"Require gender minimums (pairs with contestant gender dropdown)"` styled with the existing `#f5a623` Heroes accent. When checked, reveals two flex-side-by-side numeric `Input`s (Min Male, Min Female) and an inline italic help line. **Create-time validation:** if `minMale + minFemale > regularSlots + 2`, an inline coral error renders below the inputs and `handleSave` blocks creation with an `alert()` until the user adjusts. Matches the user's chosen "warn AND block" model for impossible configurations — keeps a less-savvy commissioner from creating an un-saveable league while still allowing flexibility within achievable configurations.
- **`handleSave` persistence** at `App.jsx:678-696`. Replaces the prior `captainsConfig: { regularSlots: Number(regularSlots) }` literal with the expanded shape including all three new fields. Pre-save validation guard added at the top of `handleSave` for the captains-only impossible-minimums case.
- **SettingsTab integration** at `App.jsx:4665-4716`. Added inside the existing Format card (where `regularSlots` is displayed for Captains). Same checkbox + paired number inputs, but wired directly to `onUpdate({...league, captainsConfig: { ...cfg, ... }})` for immediate per-league persistence via `saveLeague` — no intermediate local state. Same inline error rendering when minimums exceed the roster size. Same italic help copy. Existing leagues with `captainsConfig` populated from before this commit work through the spread (defaults applied via `||`).
- **`DepthChartTab` gender constraint logic** at `App.jsx:2880-2917`. New `useMemo` for `genderCounts` (counts `Male` / `Female` / `unset` across the entire `localChart` — captain + coCaptain + regulars[], slot-agnostic per the locked design). Constants `genderConstraintActive`, `minMaleNeeded`, `minFemaleNeeded`, `genderConstraintMet` derive from the league config. `genderChipLabel` produces the human-readable status string: `"2M / 2F · OK"` when satisfied, `"1M / 3F · Need 1 more M"` when not. Constraint check is `genderCounts.Male >= minMaleNeeded && genderCounts.Female >= minFemaleNeeded` — doesn't require slot completion separately because the minimums force filled slots implicitly.
- **Live counter chip in DepthChartTab header** at `App.jsx:3144-3151`. New `Badge` rendered next to the existing cadence badge. Color-coded via the existing `Badge` component: `#4ecdc4` (teal) when constraint met, `#e94560` (coral) when not. Hidden entirely when `!genderConstraintActive`. Sits in a flex row with `gap:6` and `flexWrap:"wrap"` so the chip + cadence badge wrap gracefully on narrow screens.
- **Save button guard** at `App.jsx:3506-3520`. Sticky-bottom save bar's border + glow color now flips with `genderConstraintMet` (teal when valid, coral when invalid). When invalid, a centered coral one-liner appears above the Discard/Save row repeating the chip label so the player can't miss why save is blocked. Save `<Btn>` receives `disabled={!genderConstraintMet}` plus inline opacity/cursor styling for visual clarity. Backup guard inside `saveDepthChart` (`if (!genderConstraintMet) return;`) prevents any programmatic bypass.
- **Picker dropdown gender labels** at `App.jsx:3091` and `App.jsx:3104`. Each contestant `<option>` in `RosterRow`'s `<select>` now suffixes `(M)` / `(F)` after the contestant name when gender is set — matches the existing pattern that already surfaces tribe and swap status in dropdown options. Contestants with no gender set render without a suffix. Two render sites (tribe-grouped and "no-tribe" optgroups); both updated.
- **Backward compatibility** — every legacy Captains league has `genderedRoster === undefined`, so:
  - `genderConstraintActive === false` → chip hidden, save button never disabled by this constraint, dropdown still shows gender labels (a small but harmless UI improvement on every Captains league).
  - All 10 regression baselines pass byte-identical — none have the flag enabled, so scoring + standings outputs are unchanged.
- **Pairs with v2.4.12.0** — the contestant gender dropdown shipped in the prior release populates the data this constraint reads. Together they form the complete "2 boys + 2 girls roster" enforcement path for the Love Island launch.
- **Out of scope (deferred):**
  - **v2.4.14.0 (planned next):** Captains episodesPerWeek extension. Today's commit doesn't touch the `getDraftWeek` resolver gate (still Standard-only) or `weeklyDepthCharts` keying. In an episode-mode Captains league with `episodesPerWeek > 1`, swap-once-per-week semantics still operate on a per-episode basis. To be fixed before kickoff tomorrow.
  - Per-slot gender constraints (e.g., "Hero must be Female"). Today's check is roster-wide and slot-agnostic only.
  - Auto-greying picker dropdown options that would violate the constraint — the live counter + disabled save covers the feedback loop. Could be added later as polish.
  - Show-wide scoring (Item 3 from the user's morning priority list) and PDF media-pack ingestion (Item 2). Both explicitly deferred.
- **Browser smoke verified** — checkbox + paired inputs visible in Settings → Format card on existing Love Island Captains league; chip renders in Depth Chart header with correct color coding; Save guard disables when constraint not met; `(M)` / `(F)` suffixes visible in slot picker dropdown; non-Captains leagues unaffected.
- `src/scoring.js` untouched. `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (2.66s).
- **Commit:** `3e12896`

### v2.4.12.0 — 2026-05-15
Contestant gender field promoted to an always-visible dropdown in `AddContestantModal`. Previously the field was a free-text `<Input>` gated to Standard format + `genderedDraft` enabled — a typo trap (`"male"` vs `"Male"` vs `"M"` would break gendered-draft matching), and unusable for non-Standard formats that nonetheless want gender as contestant metadata. Now: 2-option `<Select>` (`Male` / `Female`) with an explicit `— Not set —` empty option, rendered for every league regardless of format. Foundational for the upcoming Captains 2M/2F roster validation (v2.4.13.0). All 10 regression baselines pass byte-identical, `npm run build` clean.
- **`AddContestantModal` change** at `App.jsx:4821-4838`. Removed the `showGender = league.format === "standard" && league.standardConfig?.genderedDraft` gate entirely. The free-text `<Input label="Gender Category" placeholder="e.g. Male, Female" .../>` is replaced with `<Select label="Gender" .../>` using the existing `Select` component at `App.jsx:495`. Options: `[{value:"", label:"— Not set —"}, {value:"Male", label:"Male"}, {value:"Female", label:"Female"}]`.
- **Controlled vocabulary, no typos.** Existing leagues with gender entered as the exact strings `"Male"` / `"Female"` continue to work — those values match the dropdown options byte-for-byte. Existing leagues with stored variants (`"male"`, `"M"`, `"non-binary"`, etc.) will see the dropdown render as `— Not set —` until re-saved. **Not a migration trigger;** values are only rewritten when the modal saves, so legacy data is preserved on read.
- **Two-options decision.** Standard's gendered-draft logic at `App.jsx:2660-2675` and the upcoming Captains 2M/2F validation both assume two categories for the equal-split math. Including a third option (Non-binary / Other) would break gendered-draft if any contestant had it selected — at minimum requires a "third bucket goes where?" rule that doesn't exist. Deferred. Two options is the locked design until the upstream constraint logic supports more.
- **Always-visible decision.** Gender as contestant metadata is useful regardless of format — non-Standard leagues benefit from displaying gender pills in roster lists, Captains will need it for the 2M/2F constraint, future formats may use it too. The cost of always showing the field is one extra UI element per contestant; the benefit is having data populated when downstream features need it.
- **No data-model change.** `contestant.gender` field continues to be a free-form string stored at `league.contestants[i].gender`. Only the input UI changed. `AddContestantModal`'s save path at `App.jsx:4810` still does `gender: gender.trim()` — the trim is now a no-op (dropdown values are exact) but harmless to keep.
- **Bulk import path unaffected.** XLSX-driven contestant import (Bulk Add Contestants) still accepts free-form gender strings. If a sheet has `"male"` (lowercase), it imports as `"male"` and would render as `— Not set —` in the dropdown until a commissioner re-edits. Bringing the bulk importer onto the controlled vocabulary is deferred to a follow-up; not blocking tonight's launch.
- **What this enables next:** v2.4.13.0 will introduce a `captainsConfig.genderedRoster` flag and live 2M/2F validation in `DepthChartTab`, slot-agnostic across the 4-person roster (Hero + Side-Kick + 2 Vigilantes). Reading `c.gender === "Male"` / `"Female"` from the dropdown's controlled values means the validation logic doesn't need to handle case-folding or aliases. v2.4.13.0 will also extend the `getDraftWeek` resolver and `episodesPerWeek` UI from Standard-only (v2.4.11.0) to Captains, enforcing weekly roster swap when N>1 episodes per week.
- **Browser smoke verified** — dropdown renders on every league regardless of format. Three options visible, existing un-set contestants render as `— Not set —`, save+reopen round-trips the selected value correctly. Verified on the user's existing Love Island Standard league plus other formats.
- `src/scoring.js` untouched. `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (3.60s).
- **Commit:** `f679030`

### v2.4.11.0 — 2026-05-15
Phase 3 Commits A+B — foundational layer for decoupling draft cadence from scoring cadence in Standard-format leagues. Adds `league.episodesPerWeek` (default 1, integer ≥ 1) plus a new `getDraftWeek` resolver in `src/scoring.js` that maps a scoring unit (episode) to the draft-week key used in `team.weeklyRosters`. When `episodesPerWeek === N > 1` in episode-mode Standard leagues, one roster covers N consecutive episodes — drafts happen weekly, scoring stays per-episode. Both league-creation (Commit A) and existing-league editing in SettingsTab (Commit B) ship together so the field can be tested against existing leagues. Draft tab UI labeling and other roster-display copy still pending (Commits C/D). All 10 regression baselines pass byte-identical, `npm run build` clean.
- **New top-level league field** `league.episodesPerWeek` at the same level as `scoringCadence` / `format`. Integer ≥ 1, default 1. Persisted via the existing `saveLeague` path; no new RTDB paths, no rules change. Deliberately NOT nested under `standardConfig` even though Standard is the only consumer in this arc — the field is format-agnostic in concept (Captains / Best Ball / Roto could reuse it later for swap/roster-move cadence) and lifting it to league root avoids a future migration.
- **`getDraftWeek(league, weekOrEpisode)` helper** added to `src/scoring.js` as a new export. Pure data-transform — no React, no Firebase. Returns the input unchanged when (a) `episodesPerWeek` is `1` or undefined, (b) `scoringCadence !== "episode"`, or (c) `format !== "standard"`. Otherwise returns `Math.ceil(Number(weekOrEpisode) / n)`. Three layered safety guards mean the helper is safe to call from any code path; misuse degrades to current behavior. Comment block documents the contract above the function.
- **Two scoring-engine re-routes** in `src/scoring.js`, both Standard-format roster lookups:
  - `calcTeamWeekPoints` at line 22 (was line 13 pre-edit): `team.weeklyRosters?.[weekNum]` → `team.weeklyRosters?.[String(getDraftWeek(league, weekNum))]`.
  - `calcStandings` Roto category aggregation at line 133 (was line 124 pre-edit): `team.weeklyRosters?.[w]` → `team.weeklyRosters?.[String(getDraftWeek(league, w))]`.
  - `weeklyScores` lookups stay keyed by episode — only the roster source maps through the resolver. The two keys diverge when N>1; this is the whole point.
  - Both lookups gained a `String()` wrap for consistent key typing. Pre-baseline-verification risk was that the wrap might change lookup semantics; in practice JS object key coercion makes string/number indistinguishable for the values stored here, and **all 10 regression baselines passed byte-identical** without any synthetic JSON modification — confirming the wrap is a no-op for existing leagues.
- **CreateLeagueScreen input** at `App.jsx:797-804`. New `useState` hook `episodesPerWeek` defaulting to `1` (alongside `picksPerManager` / `genderedDraft`). Conditional `Input` element rendered inside the existing `STANDARD CONFIG` block, gated on `scoringCadence === "episode"`. Numeric input, `min=1, max=14`. Help-text microcopy: _"How many episodes air per week. Drafts happen once per week; scoring stays per episode. Set to 1 if each episode is its own week."_ Hidden in weekly-mode leagues entirely (per the design decision — weekly mode has no episode concept and the field would be meaningless).
- **Persistence in `handleSave`** at `App.jsx:686`. New line `episodesPerWeek: Number(episodesPerWeek) || 1` appended after the format-config branches. Falls back to 1 if the input is empty or NaN. Sits next to the format-specific config slots but at the league root, not nested.
- **SettingsTab input** (Commit B, bundled into this release) at `App.jsx:4618-4627`. New conditional block inside the existing Scoring Rhythm card, gated on `league.scoringCadence === "episode" && league.format === "standard"`. Same numeric `Input` styling and microcopy as the create-screen version. `onChange` writes `onUpdate({...league, episodesPerWeek: Number(e.target.value) || 1})` — direct persistence via the existing per-league save path, no intermediate local state. Hidden in weekly-mode leagues and in non-Standard formats. Sits below the Per-Episode Scoring toggle but above the existing _"You can change this later. Switching mid-season may change weekly rollup behavior — recommended for new leagues."_ caveat — which now applies to both the cadence toggle and the new field.
- **Backward compatibility** — legacy leagues without `episodesPerWeek` read as `undefined` → `n = league?.episodesPerWeek || 1` → resolver returns the input unchanged → `weeklyRosters` lookup behavior byte-identical. Existing weekly-mode leagues also unaffected (helper short-circuits on `scoringCadence !== "episode"`). Captains / Survivor-Pool / Salary-Cap / Predictions / Elimination-Pool leagues unaffected (helper short-circuits on `format !== "standard"`).
- **What this commit does NOT yet enable end-to-end** — although you can now create a Standard episode-mode league with N>1 from the CreateLeagueScreen, the Draft tab's week selector still labels by episode (Commit C will replace it with a period selector showing `"Week 1 (Eps 1-N)"` etc.). Functionally the draft will work — picking at "episode 1" writes to `weeklyRosters[1]` which under the new semantics covers episodes 1..N — but the UI labels are temporarily misleading. SettingsTab editing for existing leagues lands in Commit B; roster-display copy in TeamsTab / StandingsTab lands in Commit D.
- **Empty-roster behavior** (per the locked design decision) — episodes inside an undrafted week score zero. No carry-over from the previous week. Commissioner must redraft at each week boundary.
- **Out-of-scope (deferred to later commits in the Phase 3 arc):**
  - **Commit C** — WeeklyDraftTab period selector. Week dropdown becomes a period dropdown when N>1; labels show episode ranges. New `periodLabel` helper alongside the existing `cadenceLabel`.
  - **Commit D** — Roster display copy in TeamsTab / StandingsTab / Scoring tab "current week" indicator. Show both episode and week (`"Ep 5 · Wk 2"`) where relevant.
  - Captains / Best Ball / Roto / Salary Cap support — Standard-only per the locked design.
- **Browser smoke verified** for the SettingsTab edit path on an existing Love Island Standard league — the Episodes per week input appears in the Scoring Rhythm card when Per-Episode Scoring is on. Vite HMR cache required a dev-server restart on Windows before the change became visible; the underlying source/conditional was correct from the first edit. **Not yet smoke-tested end-to-end:** full N>1 flow (draft a roster at week 1, score episodes 1..N against that roster, advance to week 2 and confirm empty-roster gives zero points). 10/10 regression baselines passing byte-identical is the load-bearing safety: existing leagues without `episodesPerWeek` short-circuit through the resolver unchanged, so the risk of this release breaking any current league is bounded to the new-feature opt-in path. Rollback path on prod is `git revert` on this commit; no schema change to undo.
- `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (2.41s after the bundled SettingsTab edit).
- **Commit:** `35af0dc`

### v2.4.10.0 — 2026-05-15
Standard-format draft now has commissioner escape hatches: a **Reset Draft** button and **manual roster editing** on the Done screen. Surfaces in response to a real test-draft mistake — previously, once `currentPick >= totalPicks` the Done screen was a dead end with no way to fix wrong picks short of editing RTDB directly. Reset goes back to Setup; manual edit lets the commissioner add/remove contestants per team without reshuffling the snake order. `src/scoring.js` untouched, 10/10 regression baselines pass, `npm run build` clean.
- **`resetDraft()` helper** added next to `startDraft` / `makePick`. Single atomic `onUpdate` write: clears every team's `weeklyRosters[draftWeek]` to `[]` and sets `draftStatus[draftWeek] = { started: false, currentPick: 0, startedAt: null }`. The reset lands on the Setup screen because `started: false`. Guards with `window.confirm("Reset {cadenceLabel} draft? All picks will be cleared.")` — matches the `startDraft` restart-confirm pattern shipped in 2.4.9.0.
- **Reset Draft button placement** — visible on both the in-progress screen (under the contestant list / empty state) and the Done screen (below the team-card grid). Not visible on Setup, where Start Draft already covers the same intent (with its own confirm if picks exist). Styling: muted/secondary — `background:"transparent",border:"1px solid #2a2a4a",color:"#8888aa"`. Deliberately distinct from the primary coral CTA so it reads as a destructive escape hatch, not a primary action.
- **`removeFromRoster(teamId, contestantId)` and `addToRoster(teamId, contestantId)`** added alongside `resetDraft`. Each performs a single atomic `onUpdate` touching only `teams[].weeklyRosters[draftWeek]`. `draftStatus` is intentionally NOT touched — `currentPick` stays at `totalPicks` regardless of actual roster sizes, so Done remains Done after edits. Means the commissioner can have a 1-pick or 3-pick team in a 2-pick league if they have reason to; no auto-correction.
- **Done-screen team cards now editable** at `App.jsx:2685-2725`. Replaced the comma-separated read-only roster string with:
  - Pill chips for each contestant, each with a × remove button (`removeFromRoster`).
  - "empty" placeholder italic text when roster is empty.
  - `<select>` dropdown labeled "+ Add contestant…" populated from `available` (= `activeContestants - draftedThisWeek`, same filter the draft uses). Selecting an option calls `addToRoster` and resets the dropdown to the placeholder via `e.target.value=""`.
- **Layout change on Done card** — flex-wrap row replaced with `display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))"`. Wider cards fit the picker dropdown; auto-fill keeps the layout responsive. Outer celebration container loses its blanket `textAlign:"center"` (now applied only to the 🎉 header) so per-card content stays left-aligned.
- **Helper hint copy** under the 🎉 header on Done: _"Tap × to remove or use the dropdown to add. Commissioner overrides bypass snake order and gender quotas."_ Sets expectation that manual edits are a power-user tool, not a guarded draft action.
- **Gendered-draft quota intentionally bypassed** by manual edit. `addToRoster` does not consult `genderCounts` — it appends whatever contestant the commissioner picks. Reasoning: the commissioner is the league authority; if a fix requires temporarily breaking quota balance, that's a legitimate use case. The quota is enforced only inside the snake-draft loop (via `filteredAvailable` in `makePick`).
- **In-progress remains pick-only** — no per-team editing while mid-draft. The cursor-driven snake order is incompatible with manual edits to non-current teams, so the only escape from in-progress is Reset → restart. Done is the dedicated manual-edit surface.
- **Available pool for manual add** uses the same `eliminatedWeek` filter as the snake draft (`activeContestants` at `App.jsx:2569-2573`). Contestants eliminated in earlier weeks stay pickable for the week of their elimination, then disappear from later weeks — matches existing draft behavior. Re-adding a removed contestant works because `removeFromRoster` updates `weeklyRosters`, which feeds `draftedThisWeek`, which feeds `available`.
- **No new RTDB paths, no rules changes.** All writes ride the existing `onUpdate(league) → persistLeague → saveLeague` path. Atomic semantics — every UI action is a single league-level write.
- **Out-of-scope (deferred):** per-pick undo (would need a persisted pick log), pre-draft "build manually without drafting" entry point, manager-side editing, trading between teams as a single transaction.
- **Browser smoke verified** — Reset from Done → lands on Setup, all rosters cleared. Reset from in-progress → same. Remove on Done → contestant returns to the Add dropdown immediately. Add on Done → contestant disappears from every team's Add dropdown. Done state preserved across all manual edits regardless of resulting roster sizes.
- `src/scoring.js` untouched. `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS. `npm run build` clean (3.04s).
- **Commit:** `5683242`

### v2.4.9.0 — 2026-05-09
Standard-format draft cursor now persists to the league object so the in-progress state survives a refresh. Smallest viable fix to make the existing `WeeklyDraftTab` actually usable end-to-end — previously a refresh mid-draft would drop the user back to the Setup screen even though committed picks were already in `weeklyRosters`. Commissioner-only flow remains the only consumer; no manager-side UI, no real-time sync, no timer / auto-pick / undo / audit-trail (all explicit non-goals for this commit). All 10 regression baselines pass byte-identical, `npm run build` clean.
- **New persisted field `league.draftStatus`** at the league-object root (sibling of `teams`, `standardConfig`, `weeklyScores`). Shape: `{ [String(week)]: { started: bool, currentPick: number, startedAt: number|null } }`. Keyed by week-as-string to match `weeklyRosters` / `weeklyScores` convention. `startedAt` is `Date.now()` at start, **stored for future audit/debug — not read by any current logic** (inline comment at the read site documents this). Default for missing entries: `{ started: false, currentPick: 0, startedAt: null }`.
- **Persistence boundary** — no new RTDB paths, no rules changes. Writes ride the existing `onUpdate(league) → persistLeague → saveLeague` path at `App.jsx:4902-4905`. `setLeagues(updated)` runs synchronously before the awaited Firebase write, so the next render reads the new cursor immediately — same pattern existing `makePick` / `weeklyRosters` mutations rely on.
- **`WeeklyDraftTab` refactor** at `App.jsx:2536-2588` — replaced the two local `useState` hooks (`draftStarted`, `currentPick`) with a single derived `status` object read from `league.draftStatus?.[draftWeek]`. All three downstream usages (`draftStarted` ⇒ `status.started`, `currentPick` ⇒ `status.currentPick`, snake-order helper, gendered-draft filter, "Round N, Pick M of T" header, Done detection) flow from the same source. No changes to `getCurrentTeamId`, `getInverseDraftOrder`, the `draftedThisWeek` memo, or any UI block.
- **`startDraft()` now safe** — guards with `window.confirm("This week already has picks. Restart will clear all picks for this week. Continue?")` when any team has a non-empty `weeklyRosters[draftWeek]`. Matches the existing destructive-action pattern (e.g. unfinalize). On proceed, atomically writes both `teams.weeklyRosters[draftWeek] = []` and `draftStatus[draftWeek] = { started: true, currentPick: 0, startedAt: Date.now() }` in a single `onUpdate(updated)` call.
- **`makePick(contestantId)` atomic write** — single `onUpdate(updated)` carries both the `weeklyRosters` append and the `draftStatus[draftWeek].currentPick + 1` cursor bump. Removed the local `setCurrentPick(prev => prev + 1)` line; the next render reads the new cursor from the league object. No risk of partial state where the roster updated but the cursor didn't (or vice versa).
- **Re-entry path** — when the tab mounts and `status.started === true && status.currentPick < totalPicks`, render branches directly into the in-progress UI with the right team on the clock and the right pick number. No separate "Resume Draft" button — the persisted cursor IS the resume affordance; binary state (started/not-started) keeps the UX clean.
- **Week selector cleanup** at `App.jsx:2615` — dropped the `setDraftStarted(false); setCurrentPick(0)` side effects from the `Select` `onChange`. Switching weeks just re-derives `status` from the new `draftWeek` key. No state to reset, no stale-cursor bug possible.
- **Empty-state fallback** added inside the in-progress UI at `App.jsx:2680-2688`. Three branches via cascading ternary on `filteredAvailable.length === 0`:
  - `(league.contestants||[]).length === 0` → "No contestants in the Cast yet. Add contestants on the Cast tab before drafting." (the case that triggered the smoke regression — fresh league, draft started, blank contestant list because Cast was empty.)
  - `config.genderedDraft && available.length > 0` → "No eligible contestants for {currentTeam.name} — gender quota reached. Check Cast or league settings." (gender-quota-exhausted case for the gendered-draft variant.)
  - else → "No contestants available to draft this {episode|week}." (generic fallback — covers all-eliminated and all-already-drafted edge cases.)
  - Pre-existing UX gap that became reachable across refreshes once cursor persistence landed; same `EmptyState` component already used for the `numTeams < 2` guard at `App.jsx:2619`.
- **Backward compatibility** — leagues with no `draftStatus` field read the default `{ started: false, currentPick: 0, startedAt: null }` and behave identically to pre-2.4.9.0 from a fresh-Setup-screen standpoint. Heroes / Captains / Survivor-Pool / Elimination-Pool / Salary-Cap / Predictions leagues never mount `WeeklyDraftTab` (gated by `league.format === "standard"` at `App.jsx:1026`), so they're untouched.
- **Out-of-scope (deferred to a real draft-system arc):** pick timer / clock, auto-pick on expiry, manager-side draft UI, real-time multi-device cursor sync, undo last pick, search / filter / sort on available list, push notifications, persisted pick-history audit trail, RTDB rules for per-pick eligibility enforcement.
- **Browser smoke verified** — fresh draft start → 2-3 picks → hard refresh → in-progress UI restored with correct team on the clock and correct "Pick N of M" → finish to Done screen. Restart confirm dialog fires when re-clicking Start Draft on a week with existing picks; Cancel preserves state, OK clears roster and resets cursor. Empty-state fallback verified by starting a draft with no contestants in Cast — friendly message renders instead of blank screen.
- `src/scoring.js` untouched. `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (2.69s).
- **Commit:** `9fd3c4a`

### v2.4.8.0 — 2026-05-09
Format descriptions in the league-create form and settings tab now reflect each league's cadence. Episode-mode leagues see cadence-aware copy on the four formats whose mechanics involve scoring frequency (Standard, Heroes, Predictions, Elimination Pool). Phase 2 Commit D — final commit of the per-episode scoring cadence work.

Phase 1 wired the helpers + presets behind a flag; Commit A (v2.4.5.0) added the `episodes[]` data model; Commit B (v2.4.6.0) exposed the cadence toggle UI; Commit C (v2.4.7.0) added the post-finalize advance nudge banner; Commit D closes the Phase 2 scope by making the format-description copy cadence-aware. All 10 regression baselines pass byte-identical, `npm run build` clean.
- **`FORMAT_INFO` const → `formatInfo(arg)` function** at `App.jsx:244`. Returns the same shape as the old static const (object keyed by format with `name`/`desc`/`icon`). `arg` is either a `league` object or a `{ scoringCadence }` shape; cadence defaults to `"weekly"` when undefined. Pure factory — same input always produces same output. `src/scoring.js` untouched.
- **Compound-semantic phrasing for `standard.desc` and `captains.desc`** — append-clause pattern, NOT a "Per-episode" adjective swap. The locked Phase 4 design keeps roster moves weekly across all leagues (snake redraft each week, captains swap once per week); only scoring goes per-episode. So:
  - `standard.desc` weekly: `"Weekly snake redraft. Each manager picks contestants each week. Draft order is inverse of YTD standings. Season-long points race."` (byte-identical to current)
  - `standard.desc` episode: `"Weekly snake redraft. Each manager picks contestants each week, scoring per episode. Draft order is inverse of YTD standings. Season-long points race."`
  - `captains.desc` weekly: unchanged
  - `captains.desc` episode: `", scoring per episode"` appended after `"reorganize depth chart"`
  - Inline ternary inside the function: `` `...each week${cadence === "episode" ? ", scoring per episode" : ""}.` ``
- **Symmetric phrasing for `predictions.desc` and `elimination_pool.desc`** — these mechanics are genuinely cadence-symmetric (the format mechanic IS the cadence — you predict each week or each episode), so mechanical word swap is correct:
  - `predictions.desc`: `` `Commissioner creates questions each ${cadence === "episode" ? "episode" : "week"}. ...` ``
  - `elimination_pool.desc`: `` `Each ${cadence === "episode" ? "episode" : "week"}, pick one contestant ...` ``
- **`survivor_pool.desc` and `salary_cap.desc` unchanged** — no week/episode reference in these descriptions, function returns identical strings regardless of cadence.
- **Backward compatibility** — weekly cadence path is byte-identical to the old static const for every format. Existing weekly leagues see exactly the same description copy as before. Episode cadence path is the only behavioral change, and only visible to leagues opted in via the Commit B toggle (or created with episode-preset shows like Big Brother / Love Island / Love Is Blind).
- **Call-site refactor — 7 sites + 1 local-var rename:**
  - 3 CreateLeagueScreen sites at `App.jsx:767`, `773`, `983` pass `formatInfo({ scoringCadence })` from local state. Critical discipline: NOT `SHOW_PRESETS[showType]?.scoringCadence` (that was the Heroes-config inline-ternary trap fixed in Commit B; same trap avoided here).
  - 4 saved-league sites at `App.jsx:1060` (LeagueDashboard header), `4521` (SettingsTab Format card title — two refs on one line), `4523` (SettingsTab Format card desc), and `4792` (JoinConfirmModal local-var capture) pass `formatInfo(league)` directly.
  - JoinConfirmModal local var renamed `formatInfo` → `fmtInfo` to avoid TDZ shadowing of the new outer function. Single internal reference at `App.jsx:4812` updated.
- **Audit verification** — pre-edit grep returned 8 `FORMAT_INFO` references (1 declaration + 7 reading sites). Post-edit grep returns 1 `FORMAT_INFO` hit (a documentation reference inside the new function's comment block describing the prior shape) and 0 functional references. All 7 reading sites converted; no third-location consumers missed.
- **Browser smoke verified** — descriptions live-update across all four cadence-relevant formats when the cadence toggle flips in CreateLeagueScreen. The showType cascade still resets cadence to the new preset (Commit B's behavior preserved). Visual transitions clean.
- `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (2.92s).
- **Commit:** `ebba3fa`

### v2.4.7.0 — 2026-05-09
After finalizing a week or episode, commissioners now see an inline "Score [next] next →" banner in the Scoring tab. The banner is a proactive next-step affordance, particularly valuable for batch-scoring high-frequency shows like Big Brother and Love Island. Phase 2 Commit C of per-episode scoring cadence work. Phase 1 wired the helpers + presets behind a flag; Commit A (v2.4.5.0) added the `episodes[]` data model; Commit B (v2.4.6.0) exposed the cadence toggle UI; Commit C is the post-finalize ergonomic win. All 10 regression baselines pass byte-identical, `npm run build` clean.
- **Banner placement** — inserted at `App.jsx:2210-2220`, immediately after the existing `FINALIZED WEEK LOCKED BANNER` block. Shows at the top of ScoringTab regardless of which week is selected.
- **Show condition** — `onUpdate && league.weekStatus?.[String(league.currentWeek||1)]?.status === "finalized"`. `onUpdate` gates this to commissioner view; read-only viewers don't see an advance CTA they can't action.
- **Cadence-aware copy** via `cadenceLabel(league, n)`:
  - Weekly leagues: `"Week 3 finalized. Score Week 4 next →"`
  - Episode leagues: `"Episode 3 finalized. Score Episode 4 next →"`
- **Visual** — coral accent (`#e94560` with `#e9456011` background, `#e9456033` border) to differentiate from the existing teal locked banner and match the app's primary CTA color. Same dimensions and flex pattern as the locked banner (`padding:"10px 14px"`, `borderRadius:8`, `marginBottom:16`, `display:flex`, `justifyContent:space-between`, `alignItems:center`, `gap:8`, `flexWrap:wrap`).
- **Persistence semantics** — banner is keyed to `currentWeek`, not `selectedWeek`. It persists even when the commissioner navigates back to view a prior week. Disappears automatically on advance (`currentWeek+1` is not yet finalized → condition false) or unfinalize (`weekStatus[currentWeek]` deleted → condition false). No auto-dismiss timer; no manual dismiss control. Inline comment at line 2211 documents the keying.
- **Co-existence with locked banner** — when `selectedWeek === currentWeek` AND the week is finalized, both the locked banner and the advance nudge render stacked. Locked banner offers Unfinalize; advance banner offers Advance. Different actions, mild visual stack, no functional conflict.
- **Cap behavior** — verified no season-length / max-week / total-episodes field exists anywhere in the codebase. `advanceWeek` at `App.jsx:2101-2133` is unconditional. The only `maxWeek` references are XLSX-import-side artifacts (highest week found in imported sheets), not season caps. Banner show-condition needs no cap-side guard. If a season cap is ever added (e.g., `league.totalEpisodes`), the condition would extend to `&& (league.currentWeek||1) < league.totalEpisodes`.
- **Out-of-scope decisions** — bottom-of-tab "Advance to {next} →" button at `App.jsx:2491` stays as-is. There's slight redundancy with the new banner's Advance button when both are visible (banner = post-finalize nudge; bottom button = always-on neutral-state action), but refactoring is out of scope for Commit C.
- **Browser smoke** — verified all four observable states (hidden when unfinalized, visible with correct copy when finalized, disappears on Advance, disappears on Unfinalize) plus visual stack with locked banner. Stack reads clean; mobile wrap degrades gracefully.
- `src/scoring.js` untouched. `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (2.56s).
- **Commit:** `d93dcfc`

### v2.4.6.0 — 2026-05-09
Cadence is now configurable per-league for the first time. Phase 2 Commit B of per-episode scoring cadence work — exposes the `scoringCadence` toggle to two UI surfaces (league-create `CreateLeagueScreen` and league-settings `SettingsTab`). Phase 1 wired the helpers + presets behind a flag; Commit A (v2.4.5.0) added the `episodes[]` data model; Commit B is what users actually see. All 10 regression baselines pass byte-identical, `npm run build` clean.
- **CreateLeagueScreen toggle** — new "Per-Episode Scoring" checkbox inserted as the first item in the Settings toggles section (above H2H). Visual pattern matches the H2H toggle: label-wrapped checkbox, `padding:"12px 14px"`, `background:"#12121f"`, `borderRadius:10`, `border:"1px solid #1e1e38"`, 18px checkbox at `#e94560`, 13pt title, 11pt `#6a6a8a` description. New local `scoringCadence` state defaults to `SHOW_PRESETS["survivor"]?.scoringCadence` (initial showType). Persisted into the new league via `handleSave`.
- **SettingsTab card** — new "Scoring Rhythm" card inserted in the General section between Linked Scoring and the Format card. Outer card matches the canonical SettingsTab pattern (`marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38"`) — same pattern as 11 other cards in SettingsTab. Reads from `league.scoringCadence`; persists via `onUpdate({...league, scoringCadence: <new>})` which bubbles to `saveLeague`.
- **Microcopy** below each control (identical text on both surfaces): _"You can change this later. Switching mid-season may change weekly rollup behavior — recommended for new leagues."_ Rendered as 11pt italic `#6a6a8a` with `lineHeight:1.4`.
- **Preset cascade** — extended the existing `useEffect` at `App.jsx:622-631`. When `showType` changes, the cascade now also runs `setScoringCadence(preset.scoringCadence || "weekly")` alongside the existing `setFormat` and `setScoringRules` calls. Manual toggle override persists until the user changes `showType` again, at which point the preset re-asserts. Inline comment at lines 627-628 documents the semantics.
- **Heroes config inline ternary fix** — Phase 1 introduced inline ternaries reading `SHOW_PRESETS[showType]?.scoringCadence` for three CreateLeagueScreen sites: the standard-config "Picks Per Manager (per week/episode)" label, the H2H description, and the Best Ball description. With the toggle now exposing manual override, those three labels would show stale copy if the user flipped the toggle without changing `showType`. Switched all three to read from local `scoringCadence` state. Post-fix audit: `grep -n "SHOW_PRESETS\[showType\]\?\.scoringCadence" src/App.jsx` returns zero hits — every in-scope reference now reads from local state. Out-of-scope inline ternaries (six sites reading `league.scoringCadence` against saved leagues) unchanged.
- `src/scoring.js` untouched. `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification. `npm run build` clean (2.82s).
- Legacy leagues without `scoringCadence` continue to default to `"weekly"` via the helper fallback. `league.scoringCadence === undefined` is treated identically to `"weekly"` everywhere it's read. No migration.
- **Commit:** `f4963c1`

### v2.4.5.0 — 2026-05-09
Phase 2 Commit A of per-episode scoring cadence work. Adds `league.episodes` metadata model with lazy-seed helper. Pure data-model addition — no UI consumers, no scoring impact. All 10 regression baselines pass byte-identical with synthetic JSONs unchanged.
- Add `ensureEpisode(league, n)` helper in `src/App.jsx` (alongside the cadence helper cluster). Stores per-episode metadata at `league.episodes[String(N)] = { title, airDate }` keyed as an object map matching the existing `weekStatus` / `weeklyScores` / `weeklyDepthCharts` convention (RTDB-friendly, no array-as-object footgun).
- airDate inference is lazy: prefer `weekStatus[N].finalizedAt` as the historical signal for already-finalized weeks; fall back to `Date.now()` when no finalizedAt exists (new week, unfinalized week, or pre-Phase-2 league missing episodes). Optional chaining mandatory — unfinalized weeks may have `weekStatus[N]` populated as `{}` with no finalizedAt. No-op if `episodes[N]` already exists; first-seed wins.
- Wired into exactly four save sites — the three save paths that establish or mutate episode state, no broader propagation:
  1. **League-create `handleSave`** — seeds `episodes["1"] = { title: "", airDate: <createdAt> }` on every newly-created league.
  2. **`advanceWeek`** — seeds `episodes[String(nextWeek)]` when the commissioner advances; new weeks have no `weekStatus[N+1]` yet so airDate falls through to `Date.now()`.
  3. **`weekStatus` writes — finalize** — `ensureEpisode` runs after weekStatus is set so the just-set `finalizedAt` aligns with episode `airDate` (same `Date.now()` call chain). Defensive comment in helper warns against introducing timestamp drift.
  4. **`weekStatus` writes — unfinalize** — `ensureEpisode` runs *before* the `delete updatedStatus[String(N)]` so the historical `finalizedAt` is still readable as the airDate fallback for pre-Phase-2 leagues being unfinalized post-deploy.
- `src/scoring.js` untouched. `episodes[]` is pure metadata, never read by `calcContestantWeekPoints` / `calcTeamWeekPoints` / `calcStandings`. Regression confirms: `node _snapshots/diff-against-baseline.mjs` → 10/10 PASS without any synthetic JSON modification.
- Verified zero consumers in `src/App.jsx`: `grep "league\.episodes\|\.episodes\["` returns one hit (the comment line inside `ensureEpisode`'s documentation block) and zero functional reads. UI exposure is Phase 2 Commit B+ work.
- `npm run build` clean.
- **Commit:** `1648e7d`

### v2.4.4.0 — 2026-05-09
Label-only refactor behind `scoringCadence` flag. No behavior change in default-weekly mode. All 10 regression baselines pass.
- Add `cadenceWord(league)`, `cadenceShort(league)`, `cadenceLabel(league, n)` helpers in `src/App.jsx` (alongside `isLockInEligible` cluster). UI strings only — `src/scoring.js` stays pure data-transform per the no-go-zone rule.
- Helpers default to "Week"/"Wk" when `league.scoringCadence` is missing or `"weekly"`; emit "Episode"/"Ep" when explicitly `"episode"`. `cadenceLabel(league, null)` returns just the unit word so call sites tolerate missing `n`. Helper block carries an explicit comment that `cadenceShort` does NOT derive from `cadenceWord` via `.slice(0,2)` (would yield the wrong "We" for "Week").
- Replaced ~80 hardcoded "Week N", "Wk N", "Weekly X", "this week", "each week", and lower-case "weekly" user-facing strings across Scoring tab, Standings, Roster/Depth-Chart tab, Weekly Draft, Weekly Pick (elim_pool), Survivor Pool, Predictions, Lock-In banner, Spoiler Protection settings, Best Ball banner, Admin overview, Activity feed, XLSX import dialog, league-link description, and the spoiler-blur overlay. Variable names (`weeklyScores`, `weekStatus`, `eliminatedWeek`, `currentWeek`, `lastWeekPts`, `bestWk`, etc.), function names (`WeeklyDraftTab`, `WeeklyBreakdownSection`, `reverseWeek`, `advanceWeek`), tab IDs (`weekly-pick`, `weekly-draft`), and code comments untouched.
- Added `scoringCadence` to every `SHOW_PRESETS` entry: `"weekly"` for survivor, top_chef, bake_off, the_traitors, the_bachelor, the_challenge, drag_race, amazing_race, love_is_blind, custom; `"episode"` for big_brother, love_island.
- Six asymmetric "Weekly X" / "Episode X" sites use inline ternaries (per design — no `cadenceAdj` helper because "Weekly paired matchups" → "Per-episode paired matchups" doesn't share a clean adjective form): H2H matchup description in league-create, elimination_pool tab label, Weekly Draft section title, Weekly Swap tracker, Weekly Pick section title, and the lock-in cancellation confirm message. League-create form sites use `SHOW_PRESETS[showType]?.scoringCadence` since no `league` exists yet.
- **Note:** existing weekly-cadence leagues will see "Score Week" on the Score-Events tab title instead of "Score Episode" (which was incorrect copy regardless of cadence — pre-existing inconsistency where `view === "events"` rendered "Score Episode" while `view === "summary"` rendered "Week Summary"). Both now use `cadenceWord(league)` so the labels match.
- **Out of scope (deferred to Phase 2 carryover in BACKLOG.md):** FORMAT_INFO descriptions ("Weekly snake redraft…"), the FAQ format-explanation paragraph, and the site-announcement placeholder example are global / pre-league marketing copy with no `league` or selected `showType` context. Will revisit when cadence toggle ships in league-create / league-settings UI.
- No UI exposure for the toggle yet — Phase 1 wires the helper and presets only; league-create form and settings UI are Phase 2 work.
- Verified `node _snapshots/diff-against-baseline.mjs` → all 10 baselines (9 synthetic + sanitized real-league) byte-identical pre/post. `npm run build` clean (2.82s).
- **Commit:** `e247ad1`

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
