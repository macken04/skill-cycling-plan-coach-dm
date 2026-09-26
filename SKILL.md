---
name: cycling-plan-coach
description: Plan a cyclist's training week as a standalone coaching package with integrated workout building. Use whenever the athlete asks to plan a week or the upcoming week ("plan my week", "build my training week", "week schema", "plan a week workout schedule", or any localized equivalent), or states a goal for the week. The flow reads a per-athlete config, pulls recent Strava data, classifies rider type from the athlete's own power curve, then produces one weekly markdown plan and structured bike workouts (ZWO for Zwift) per structured bike session without relying on another skill. Works for any cyclist, not one fixed person.
metadata:
  author: Elio Struyf <elio@struyfconsulting.be>
  license: MIT
  version: 2.4.0
---

# Cycling plan coach

Turn a short conversation into ready-to-use standalone files for coaching: a weekly markdown plan and the structured bike workouts it references. Workouts are generated as `.zwo` (Zwift). The athlete's identity, goal, language and units come from a config file, not from this skill, so it works for anyone.

## Resolve config first (every run)

Before doing any real work:

1. Look for the config at `athlete.json` (next to this skill).
2. If it exists and parses, load it and go straight to the main workflow.
3. If it is missing or invalid (first run), run the setup flow in `references/onboarding.md`, write `athlete.json`, then continue into the main workflow in the same turn. Do not make the athlete re-invoke the skill after setup.

`athlete.json` is the single source of truth for who the plan is for. Fields are documented in `references/athlete-config.md`.

From the config take, grouped by what they drive:

- **Identity and output:** `name`, `language`, `units`, `styleNotes`.
- **Goal:** `goal`, `targetEvent`, `eventDate`, `riderTypeOverride` (optional).
- **Baseline fitness and physique:** `age`, `gender`, `weightKg`, `fallbackFtp`, `targetWkg`, `bodyCompositionGoal`, `bodyFatPercent`, `restingHr`, `labTestingNotes`.
- **Cycling background and current status:** `cyclingYearsExperience`, `longestEffortCompleted`, `ultraDistanceExperience`, `currentTrainingStatus`, `trainingBreakDuration`.
- **Logistics:** `groupRideDays`, `typicalAvailableDays`, `typicalWorkoutDurationMin`, `maxStructuredSessions`, `strengthDefault`.
- **Physical limiter:** `physicalNotes`, `physicalNotesFrequency`, `physicalNotesAssessed`.
- **Strength background:** `strengthExperience`, `strengthYearsExperience`, `strengthRecentFrequency`, `strengthCurrentLifts`, `strengthInjuryNotes`.
- **Nutrition:** `dietaryRestrictions`, `fuelingNotes`, `fuelingPreference`, `currentEatingPatternNotes`, `currentWeightGoalDirection`.

None of the self-reported fields above are fixed at onboarding: if the athlete mentions a change (an injury clearing up, new lifting experience, a return to consistent training, a newly noticed food sensitivity), update the relevant field in `athlete.json` on the spot rather than only ever asking at first setup.

If `targetEvent` is set and matches an id in `references/events/README.md`, resolve its reference file for course/limiter context; if it doesn't match any registry id, treat it as free text and fall back to generic ultra-endurance heuristics rather than failing to resolve. It overrides session priorities (Step 2) and adds event-specific archetypes (Step 5) regardless of whether a season skeleton exists. When `eventDate` is also set, resolve the season skeleton next (below) before continuing into the main workflow — once it exists, it replaces the generic rolling periodization block in Step 4 with the Base/Deload/Build/Deload/Refine season-macrocycle model.

If `age` is missing from an existing config, ask for it before continuing — it is required to set recovery windows. If `gender` is missing, ask for it or accept a skip; note that it defaults to gender-neutral W/kg benchmarks when absent.

## Resolve the season skeleton (when `targetEvent` and `eventDate` are both set)

Only applies when both fields are set (per `references/macrocycle-model.md`). If `eventDate` is `null`, skip this section entirely — Step 4 uses the generic rolling periodization exactly as it does for an athlete with no event.

1. Look for `season-plan.json` next to `athlete.json`.
2. **Missing (first run with this event/date):** generate it now, before continuing, using `references/macrocycle-model.md`'s (A9) runway-allocation algorithm — `startDate` = today, `age` from the config for the deload-length table — and `references/trial-events.md`'s (A10) ladder method against the resolved event file's "Limiters this event trains for" section. If `targetEvent` is free text with no registry file to read limiters from, use `trial-events.md`'s degenerate single-rehearsal ladder (§1) instead and say so plainly. Write the file per `macrocycle-model.md`'s schema. If the runway is too tight for the three-phase model (the stop condition in `macrocycle-model.md` step 5), say so plainly instead of generating an invalid skeleton — offer the compressed two-phase alternative or ask about moving the event date — and skip the rest of this section and Step 4's season-driven branch for this run.
3. **Exists:** recompute `currentPhaseId` from today's date against the stored `phases[]` — never trust a stored value, per `macrocycle-model.md`'s "Which phase is current" rule. If `athlete.json`'s `targetEvent`/`eventDate` no longer match what's stored in `season-plan.json`, treat it as a replan trigger (below) rather than silently drifting.
4. **Replanning (FR7 of `documents/season-macrocycle-prd.md`):** only on an explicit athlete report or request — never on your own initiative, per the no-autonomous-replanning principle — a material divergence (illness/injury, a missed block of weeks, a trial event logged with a bad outcome, a request to shift the event date) triggers a replan: keep every phase boundary and trial-event entry whose date has already passed exactly as recorded, and re-run the runway-allocation algorithm and ladder placement from today forward for whatever remains. Set `lastReplannedAt`. State plainly what changed (e.g. "Build is now 2 weeks shorter to make room for the missed 3 weeks").
5. **Past `eventDate`:** say so — the event has already happened — and ask whether this is a new season (new `targetEvent`/`eventDate`) or the athlete wants the generic rolling model instead; don't default to `refine` or silently regenerate.
6. Whenever the skeleton is generated or replanned, also write/update `season-plan.md` per `references/season-plan-format.md` (A12): all 5 phases and the full trial-event ladder at the one-line summary level, with full week-by-week detail only for `currentPhaseId` (referencing this run's weekly plan file, not inlining it).

At the start of every weekly planning run, ask a short weekly-availability intake before training design:

- Available training days for the upcoming week.
- Planned group-ride day(s) for the upcoming week.
- Planned duration per workout day.
- Strength preference this week: strength, core, or both.
- Frequency for strength/core this week (how many times).
- Workout file format: **ZWO** (Zwift). Store `"zwo"` as `workoutFormat` in `athlete.json` after confirmation.
- **Garmin export (optional):** Ask once per session whether the athlete has a Garmin Coach JSON export. If yes, accept the pasted JSON and process it using `references/garmin-data.md` before any session design. If the athlete is on Garmin Connect, point them to the Garmin Workout Importer Chrome extension (https://chromewebstore.google.com/detail/garmin-workout-importer/faebbfokokipdpkbolpbpfadmgdbanpo) to generate the export. If the athlete provides neither Strava access nor a Garmin export, continue with `fallbackFtp` and config values only.

Always offer a one-step option to use predefined values from `athlete.json` profile config (for example: typical training days, `groupRideDays`, `strengthDefault`, and any stored duration preferences). If the athlete chooses profile defaults, confirm what was applied and only ask for overrides.

## Main workflow

### Step 1 - pull data (Garmin export and/or Strava)

Retrieve the athlete's current numbers and recent history. Use whichever sources are available:

**Garmin export (if provided):** Process using `references/garmin-data.md`. Extract FTP, LTHR, zones, readiness (HRV, sleep, body battery, training readiness score), load (ATL, CTL, ACWR, training status, recovery window), and recent activity TSS/NP. These override `fallbackFtp` and enrich the plan with readiness context that Strava cannot provide.

**Strava (if connected):** Tool calls and mapping are in `references/strava-pull.md`. Get: current FTP and zones; gender from the athlete profile (populate `athlete.json` only if the field is currently absent — never overwrite a stated preference); the last 10 to 14 days of activities; and the power-duration curve from the most recent hard ride. Strava activity names are preferred for archetype extraction.

**When both are provided:** Use Garmin for zones, readiness, and load; use Strava for activity names and relative effort. If FTP values differ, note the discrepancy and ask the athlete which to use.

**When neither is available:** Use `fallbackFtp` and continue — age and gender come from the config.

Summarise last week and the readiness state back to the athlete in their language in one or two sentences. If readiness data triggers a plan adjustment, state it explicitly.

### Step 2 - classify rider type (data-driven)

Unless `riderTypeOverride` is set, classify the athlete from their own power curve using `references/rider-types.md`. The classification (sprinter/puncheur, all-rounder, diesel/time-triallist) plus the athlete's `goal` set the session priorities, which sessions to emphasise and which to skip. Do not assume a fixed rider type; derive it. State the detected type and the resulting focus in one line.

If `physicalNotes` is non-empty, weigh it alongside this data-derived classification when Step 3 sets strength/core and session emphasis — it's the athlete's own account of what feels limiting, useful for exactly what a power curve can't show (e.g. a posture or posterior-chain issue on climbs). Treat it as a hypothesis, not a diagnosis: never let it silently override the power-curve-derived rider type, and say so plainly if the two point in different directions.

If `ultraDistanceExperience` is `none` and `targetEvent` resolves to an ultra-distance event file, say so plainly and lean the plan toward that event file's durability/handling/back-to-back-days limiters rather than pure power development — a first-time ultra finish is its own goal, distinct from raw fitness. `cyclingYearsExperience` and `longestEffortCompleted` are context for how aggressively volume can grow week to week, not inputs to the rider-type classification itself (that stays power-curve-derived, per above).

If `targetEvent` resolves to an event file, let its "Limiters this event trains for" section override the session priorities above rather than just informing framing — e.g. `ultra-gravel` deprioritizes VO2max/sprint work in favor of durability, fat-max endurance, back-to-back long days, technical/loose-surface handling, and heat/altitude tolerance, whatever the power-curve-derived rider type would otherwise emphasise. State the override in the same one-line summary as the detected type (e.g. "Detected: puncheur, but Badlands overrides toward durability and fat-max endurance over top-end work").

### Step 3 - confirm intake and session design

Restate the goal from the config in one line, then confirm or complete intake values gathered at the start. Ensure these are explicitly captured: available training days, group-ride day(s), duration per workout day, how many structured key sessions (default `maxStructuredSessions`), indoor or outdoor preference, week's focus, strength mode (strength/core/both), and strength/core frequency. Keep the intake short with the interactive picker when available. Always provide a "use profile defaults" path so the athlete can accept predefined config values and only override what changed. Factor last week's load into the new week.

When strength/core emphasis is chosen for the week, apply `strength-library.md`'s "tune to the athlete" guidance using the Step 2 rider type, any `physicalNotes` hypothesis (e.g. a described lower-back/power-transfer issue on climbs leans the exercise selection toward core and posterior chain), and `strengthExperience`/`strengthInjuryNotes` (e.g. a new lifter gets the conservative first-block progression, not the standard working loads) — name the connection to the athlete in one line when it drives a choice, so the plan visibly reflects what they described rather than silently absorbing it.

### Step 4 - apply the training model

Use the FTP from Strava (fallback: `fallbackFtp`), the rider type from Step 2, and the goal. Convert every % FTP target to watts in the human-readable text using that FTP. Principles and session shapes are in `references/training-model.md`. Always: polarized week, at most `maxStructuredSessions` structured days midweek, group-ride days social with no forced structure, never three hard days back to back, steer by power and allow backing off on feel.

Apply `training-model.md`'s ramp-in guidance using `currentTrainingStatus` (a fallback signal when there's no live Garmin ACWR/training-status yet) and its energy-availability caution using `currentWeightGoalDirection`/`bodyCompositionGoal` — state either explicitly to the athlete in one line when it changes the plan rather than silently applying it.

**When `season-plan.json` was resolved above:** use its `currentPhaseId` phase in place of the generic 3-build+1-taper rolling block below. Base leans endurance/fat-max volume and general-prep strength; either Deload block is a reduced-volume reset — never skipped, never treated as a build week; Build layers the event file's own event-specific archetypes (Step 5) on top of the standard rotation at increasing fidelity; Refine leans race-specific rehearsal and taper, with race week itself (Refine's final block) treated as pre-race rest, not a training week. State the current phase and its one-line focus in the same summary line as Step 2's rider-type/override statement. If a `trialEvents[]` entry falls within the upcoming week, build the week around it as the priority session rather than the standard rotation and say so explicitly. With no `season-plan.json` (no event, or an event with no `eventDate`), use the generic rolling block below exactly as before.

### Step 5 - build structured workouts

Build the workout files inside this skill in ZWO format.

- Session archetypes, rotation rules, and progression steps live in `references/workout-library.md`.
- ZWO format spec (Zwift): `references/zwo-format.md` — power as FTP fractions, durations in seconds, XML output.
- Before selecting sessions, check the archetypes extracted from last week's Strava rides (Step 1). Do not repeat the same archetype unless advancing it by one progression step. Use the rotation table in `references/workout-library.md` to pick this week's pair.
- If `targetEvent` resolves to an event file with its own "Session archetypes + periodization overlay" section, treat those as available alongside `workout-library.md`'s standard set when the week's emphasis calls for them (e.g. long back-to-back days, heat acclimation, loaded-bike climbing, technical/loose-surface handling) — build and describe them the same as any other session, honoring the event file's own phase caveats (e.g. a fasted-ride archetype flagged base-phase-only) against the current phase from `season-plan.json` when one exists (Step 4).
- Every structured bike session must produce one workout file per requested format.
- Use `% FTP` for planning and convert to watts in the markdown plan using the week's FTP.
- Store power as FTP fractions and durations in seconds. Add localized `textevent` cues in the athlete's language.
- Keep hard sessions capped by `maxStructuredSessions` and aligned with the polarized model.
- Run through the validation checklist in the relevant format reference before delivering.
- Output every workout file inline as a labeled fenced XML code block so the athlete can read and copy it directly from Claude's UI.

### Step 6 - produce the files

Save everything to `/mnt/user-data/outputs/` and present it. If that path is unavailable, deliver all files inline in the response instead. Human-readable text in the config `language`; distances and speeds in the config `units`. Machine keys stay English; filenames stay lowercase-hyphenated and neutral.

1. One weekly plan markdown file, named by week id using ISO 8601 week numbering (e.g. `2026-W26-plan.md`; note week 1 may start in late December of the prior year). Follow the structure in `references/plan-format.md`. Include: week id, goal, detected rider type, FTP used, one-line last-week summary, day-by-day schedule table, structured session detail blocks (% FTP and converted watts), group-ride guidance, and strength/core exercises (mapped from `references/strength-library.md`).
2. One ZWO workout file per structured bike session, built using `references/zwo-format.md`. On-screen cues in the config language. Rendered inline as a fenced XML code block. Filenames must be listed in the markdown plan under their matching day.
3. When there is a full gym session, add a dedicated markdown file (e.g. `2026-W26-strength.md`) with sets, reps, rest, and coaching cues in the config language. Reference it from the main plan.
4. When a `season-plan.json` was generated or replanned this run, also save/update `season-plan.md` (per `references/season-plan-format.md`) alongside the weekly files, pointing its current-phase section at this run's weekly plan file.

## Quality checks before delivering

1. A weekly markdown plan file exists and includes all required sections (week id, goal, focus, FTP used, rider type, last-week summary, day-by-day schedule table, structured session detail blocks).
2. FTP used in the markdown plan equals the live FTP (or the stated fallback when Strava is unavailable).
3. Every structured bike day in the markdown references exactly one workout file per requested format; watt targets in markdown match the % FTP targets at the stated FTP.
4. Session priorities match the detected rider type and the goal, or the resolved event's override when `targetEvent` is set and the two diverge.
5. The week works toward the goal, structured days capped, group days social, strength off the pre-interval day, last week factored in.
6. Every workout file passes the validation checklist in its format reference (`references/zwo-format.md` for ZWO) and is rendered inline as a labeled fenced code block.
7. All human-readable text is in the config language and units, honoring `styleNotes`. State the week id, focus, detected rider type, last week in one line, and which files you created.
8. When `targetEvent`/`eventDate` are both set, `season-plan.json`'s `currentPhaseId` was recomputed against today's date (not trusted stale), the stated phase in Step 4's summary line matches it, and `season-plan.md` was written/updated to match — regenerated or replanned this run if it didn't already exist or a divergence was reported.
