# FatSecret integration — task breakdown

Companion to `fatsecret-integration-plan.md`. Implements issue
[#42](https://github.com/macken04/skill-cycling-plan-coach-dm/issues/42).
Each task is independently implementable and testable; sequenced so every
task can be verified before the next depends on it.

**Status:** not started. Mirrors the shape `whoop-integration-tasks.md` used
for issue #39, scaled down to match this integration's much smaller
footprint — per the plan doc's "Recommended approach," this is a
Claude-native MCP connector with **zero backend code, schema, or credential
footprint in this repo**, so there is no `W-A`/`W-B`-style infra milestone
here: no Supabase migration, no Next.js route handlers, no Vault secrets.

## Decisions locked in (see the plan doc's "Resolved decisions" for the full rationale)

- **V1 scope:** diary-only — read-back (`get_user_food_entries`) and
  per-food logging (`add_food_entry`), both already supported end-to-end by
  `fcoury/fatsecret-mcp` as-is. One-tap meal-plan push is a deferred
  fast-follow (`F-D`), not a v1 blocker.
- **Connector strategy:** fork `fcoury/fatsecret-mcp` ourselves rather than
  wait on upstream, so `F-D` has a timeline this project controls. This
  repo's docs point athletes at our fork, not upstream.
- **API tier:** free Basic tier (5,000 calls/day, US-only food dataset,
  visible FatSecret attribution required) — sufficient for one athlete's
  personal use. Not revisited unless the athlete later needs non-US food
  data.
- **No separate PRD** — this doc pair is it, same as WHOOP's.

## Milestone F-A — Connector setup (manual account work + reference docs)

- [ ] **FA1. Fork `fcoury/fatsecret-mcp`; register + authorize**
  - Manual (user): register a FatSecret Platform API application (Basic
    edition, free) and record the consumer key/secret.
  - Manual (user): fork `fcoury/fatsecret-mcp` to an account under this
    project's control (no code changes yet — this task only establishes the
    repo `F-D` will later extend and that this project's docs will point
    to, per the locked-in connector-strategy decision).
  - Manual (user): run the fork's own OAuth onboarding tooling
    (`start_oauth_flow`/`complete_oauth_flow`/`set_credentials`, per its
    README) once, locally, to authorize against the athlete's own FatSecret
    account. The resulting per-user token persists in the athlete's own
    `~/.fatsecret-mcp-config.json` — entirely outside this repo's trust
    boundary, identical to how Strava's connector already works. **No
    token, secret, or credential of any kind is ever stored in this repo,
    Supabase, or Vercel.**
  - **Test:** with the connector configured, confirm `search_foods`,
    `get_user_food_entries`, and `add_food_entry` each work end-to-end
    against a real FatSecret account.
  - Depends on: none (blocked on user action: FatSecret developer account +
    fork + local OAuth authorization).

- [ ] **FA2. `references/fatsecret-data.md`**
  - New reference file mirroring `references/strava-pull.md`: which MCP
    tool calls to use to (a) read back the athlete's recent FatSecret diary
    (`get_user_food_entries`) the same way `nutrition_logs` is read today,
    and (b) log an item (`add_food_entry`). State explicitly that this app
    remains the source of truth for fueling *targets*
    (`references/nutrition.md`) — FatSecret only ever holds *actual* logged
    intake to compare against, since no macro/calorie-target-setting
    endpoint exists in FatSecret's API at all.
  - Note the `saved_meal.*` gap and point to `F-D` rather than promising
    meal-plan push in v1.
  - **Test:** same bar as `garmin-data.md`'s own — for a sample FatSecret
    diary payload, hand-trace the doc's rules to a concrete actual-vs-target
    fueling sentence (or explicit "no target set") and confirm it's
    unambiguous.
  - Depends on: FA1 (need real tool-call shapes to document precisely,
    though a draft can start in parallel from the Platform API docs).

## Milestone F-B — Wire into the coaching flow

- [ ] **FB1. `SKILL.md` Step 1: FatSecret diary read-back**
  - Alongside the existing `nutrition_logs`/Garmin/WHOOP reads: when the
    athlete has FatSecret connected (their own local MCP config — no
    Supabase flag or connection row needed; attempt the tool call and
    handle "not connected"/unavailable gracefully, same as how Strava's
    connector is optional today), call `get_user_food_entries` for the
    recent window and fold the actual-vs-target comparison into fueling
    guidance the same way `nutrition_logs`' `carb_target_status` is folded
    in today.
  - **Test:** dry-run "plan my week" with FatSecret connected vs. not
    connected; confirm the guidance differs only when connected, and the
    not-connected case is byte-for-byte unchanged from current behavior
    (regression check, per the plan's non-goals).
  - Depends on: FA2.

- [ ] **FB2. `references/onboarding.md`: FatSecret question tier**
  - Add one new optional question, same tier/wording pattern as
    Garmin/WHOOP/Strava: does the athlete want to connect FatSecret; link to
    `references/fatsecret-data.md`'s connector setup instructions (`FA1`).
  - **Test:** dry-run onboarding for a new athlete and confirm the question
    appears at the same point/tier as the other optional connectors, and
    skipping it leaves nothing broken downstream.
  - Depends on: FA2.

## Milestone F-C — Docs, version bump, changelog

- [ ] **FC1. `README.md` "what it needs" list**
  - One line noting FatSecret as an optional connected nutrition source,
    matching how Strava/Garmin/WHOOP are already listed.
  - Depends on: FB1.

- [ ] **FC2. Version bump + changelog**
  - Bump `package.json`/`SKILL.md` version (additive feature → minor bump).
  - Add a `CHANGELOG.md` entry: optional FatSecret diary read-back and
    per-food logging, folded into fueling guidance.
  - **Test:** `npm run build` produces the packaged skill with the bumped
    version stamped in `SKILL.md`'s frontmatter; `CHANGELOG.md` has the new
    entry at the top.
  - Depends on: FB1, FB2.

## Milestone F-D — Saved-meal push (deferred fast-follow, not a v1 blocker)

- [ ] **FD1. Add `saved_meal.*` calls to our fork**
  - Implement `saved_meal.create`, `saved_meal.edit`, `saved_meal_item.add`,
    `saved_meal_item.edit` in the forked connector (`FA1`), matching
    FatSecret's documented request/response shape for each.
  - **Test:** create a saved meal via the new tool calls against a real
    FatSecret account and confirm it appears correctly as a reusable saved
    meal in the FatSecret app.
  - Depends on: FA1.

- [ ] **FD2. `SKILL.md` fueling-guidance step: push the week's planned meals**
  - Offer to push the week's planned meals to FatSecret as one saved meal
    when asked. Check for `saved_meal.*` tool availability first and
    gracefully fall back to `add_food_entry`-per-item, or to just stating
    the plan in markdown as today, when it's absent (e.g., the athlete
    hasn't updated their local fork yet).
  - **Test:** dry-run with the new tools available vs. not available;
    confirm the fallback chain produces sensible, non-broken output in both
    cases.
  - Depends on: FD1, FB1.

## Suggested execution order

`F-A` first (manual account/fork setup + reference doc — nothing else can
be tested without a real connected account and documented tool-call
shapes). `F-B` next, once `F-A`'s tool shapes are documented. `F-C`
(version bump) waits until `F-B`'s user-visible behavior exists. `F-D` is a
deferred fast-follow and does not block shipping `F-A`–`F-C` as v1.
