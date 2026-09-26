# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2026-09-26

### Fixed

- **Silent Supabase-linking gap**: `SKILL.md`'s "Sync to Supabase" step previously said, verbatim, to "say nothing about Supabase" whenever `supabaseAthleteId` was `null` — so an athlete who had never linked a web account had no way to discover the web dashboard existed at all, or how to link it, from the coaching conversation itself; that instruction only ever lived in `SKILL.md`/`docs/infra.md` for whoever happened to read the source. Step 7 now tells the athlete, once per unlinked run, how to sign in and link their account, and completes the linking on the spot (looking up their `auth.users` id by email and setting `supabaseAthleteId`) when they confirm they've already signed in and the session has Supabase access — rather than deferring it to some future session that may never come.

### Changed

- **Patch version bump** (`3.1.0` → `3.1.1`): behavior-only fix, no new fields or schema changes — a linked athlete (`supabaseAthleteId` already set) sees no change.

## [3.1.0] - 2026-09-26

### Added

- **Web UI core loop** (`web/`, task B3): a bare-bones Next.js app with Supabase Auth magic-link sign-in and a `/plan` page listing the current week's workouts, each with the five-way status picker (`completed_as_planned`/`completed_easier_than_planned`/`completed_harder_than_planned`/`failed_too_hard`/`skipped`) writing to `workout_logs`. Deployed via the `cycling-plan-coach` Vercel project.
- **`SKILL.md` "Sync to Supabase" step**: after producing the weekly plan/workout files, the skill upserts them into Supabase's `plans`/`workouts` tables for the web UI to read — gated on a new `athlete.json` field, `supabaseAthleteId` (`references/athlete-config.md`), which stays `null` (and this step stays fully skipped, no behavior change) until the athlete has linked their account by signing in at the web app once.

### Changed

- **Minor version bump** (`3.0.0` → `3.1.0`): additive and backwards-compatible — an unlinked athlete (`supabaseAthleteId: null`, the default) sees no change in behavior.

## [3.0.0] - 2026-09-26

### Added

- **Multi-event architecture**: an event registry (`references/events/README.md`) and Badlands Ultra as the first supported event (`references/events/badlands-ultra.md`) — course profile, format rules, event-specific limiters, session archetypes, and a fueling delta on top of the shared nutrition module. Adding a second event is a new registry file, not a restructuring. `athlete-config.md` gains `targetEvent`, `eventDate`, and derived `daysToEvent`; onboarding gains an event branch (supported event / general plan / unlisted event with fallback heuristics), explicit option lists for every closed-choice question, and an open-narrative physical-limiter question the coach weighs alongside the data-derived rider type. `SKILL.md`'s event resolution overrides session priorities and adds event-driven archetypes (long back-to-back days, heat acclimation, overnight/low-sleep simulation, loaded-bike climbing) alongside the standard library. `plan-format.md` gains an event countdown header and fueling subsection.
- **Season macrocycle planning**: once an event and event date are both set, the skill generates and maintains a `season-plan.json` skeleton — a Base/Deload/Build/Deload/Refine phase structure spanning to the event (`references/macrocycle-model.md`) — and a coach-designed B/C trial-event ladder rehearsing the event's own discrete limiters at increasing fidelity, culminating in a near-full-dress rehearsal early in Refine (`references/trial-events.md`). Only the current phase is planned week-by-week; other phases render as a dated one-line summary (`references/season-plan-format.md`). `SKILL.md` wires skeleton generation, phase resolution (recomputed on every read, never trusted stale), and athlete-triggered replanning (illness, missed weeks, a bad trial event, a shifted event date) into the weekly flow, superseding the earlier raw-countdown periodization. Fueling and strength periodization ramp across the season in step with the trial-event ladder (`nutrition.md`'s gut-training g/h checkpoints, `strength-library.md`'s general-prep → max-strength → power/maintenance mapping).
- **Interpretation rules for logged outcomes**: a defined, mechanically-applicable rule table (no "use judgement" left to the coach) for what each logged session status implies — `completed_easier_than_planned` advances progression faster, `failed_too_hard` holds or regresses it, repeated `skipped` resets to Step 1 — in `workout-library.md`, with the equivalent load/rep regression rule in `strength-library.md`. Trial-event outcomes get their own two-part signal (`completionStatus` + `fuelingSignal`, defined in `macrocycle-model.md`): a comfortable dry run can pull the remaining ladder forward, a difficult one or a DNF holds difficulty and can trigger a replan, and a fueling signal (GI distress, bonking) holds the fueling ramp at its last-rehearsed rate rather than advancing (`trial-events.md`, `nutrition.md`). Everything here remains athlete-triggered only — no scheduled or autonomous evaluation is introduced, per `documents/agentic-coach-prd.md`.

### Changed

- **Major version bump** (`2.4.0` → `3.0.0`): the `athlete-config.md`/`athlete.json` shape and the weekly-plan periodization logic both changed in backwards-incompatible ways (event/season fields, phase-driven periodization replacing the raw countdown block).

## [2.4.0] - 2026-09-26

### Added

- **Cycling background & current training status section** in onboarding (`references/onboarding.md`): years cycling, longest effort completed, prior ultra-distance experience, and current training consistency (`consistent`/`returningFromBreak`/`new`) as a self-report fallback for Garmin's live `training_status`/ACWR signal when no Garmin export exists yet. `training-model.md` now has an explicit ramp-in section keyed off `currentTrainingStatus`, and `SKILL.md` Step 2 leans a first-time-ultra plan toward durability/handling per the matched event file.
- **Body composition fields**: `bodyCompositionGoal` and optional `bodyFatPercent`, captured alongside the existing physical-profile questions, plus a one-line caution at onboarding when `significantLoss` is chosen.
- **Resting HR / metabolic baseline section**: `restingHr` and `labTestingNotes` (VO2max/lactate/metabolic test results) as a self-report fallback for athletes without a Garmin export, which otherwise supplies `vo2max`/`lthr` live.
- **Deeper strength background**: `strengthYearsExperience`, `strengthRecentFrequency`, and `strengthCurrentLifts` (current working weights on key lifts) alongside the existing `strengthExperience`/`strengthInjuryNotes`. `strength-library.md` now anchors a first strength block to reported current lifts when given, and adds a short re-ramp for a recently-inactive lifter regardless of lifetime experience level.
- **Current nutrition baseline and energy availability**: `currentEatingPatternNotes` and `currentWeightGoalDirection`. `nutrition.md` and `training-model.md` both gained an explicit energy-availability caution — flagged once, not silently absorbed — when a significant weight-loss goal is combined with high training load or an ultra-distance target.
- Corresponding `athlete-config.md` field documentation for all of the above; `SKILL.md`'s config field list restructured into grouped categories to stay readable at this size.

## [2.3.0] - 2026-09-26

### Added

- **Strength & training background section** in onboarding (`references/onboarding.md`): asks lifting experience (`strengthExperience`: new/returning/experienced) and, when relevant, lifting-specific injury/joint notes (`strengthInjuryNotes`). `strength-library.md` now prescribes a conservative first block (lighter load, higher reps) for a new lifter instead of starting everyone at working loads, and substitutes/regresses exercises that conflict with a named injury.
- **Structured follow-up on the physical-limiter narrative** (onboarding question 10a): when the athlete describes something in question 10, two closed follow-up questions capture how often it shows up (`physicalNotesFrequency`) and whether it's been professionally assessed (`physicalNotesAssessed`). Onboarding and `SKILL.md` now both note that `physicalNotes` and the strength/nutrition fields are not write-once — they're updated whenever the athlete reports a change, not only at first setup.
- **Nutrition preferences section** in onboarding: dietary restrictions/allergies (`dietaryRestrictions`), a free-text fueling-tolerance narrative (`fuelingNotes`), and an on-bike fueling lean (`fuelingPreference`). `nutrition.md` now personalizes concrete food/product suggestions against these fields on top of the existing generic g/kg model.
- New `athlete-config.md` fields documenting all of the above: `physicalNotesFrequency`, `physicalNotesAssessed`, `strengthExperience`, `strengthInjuryNotes`, `dietaryRestrictions`, `fuelingNotes`, `fuelingPreference`.

### Fixed

- Closes the three gaps originally flagged in a since-resolved onboarding gap report: onboarding previously asked nothing about strength/training history, had no structured follow-up or revisit path for the physical-limiter narrative, and asked nothing about nutritional preferences despite a fueling model meant to be personalized.

## [2.2.0] - 2026-06-23

### Added

- **Muscle Tension (MT) session archetype** in `references/workout-library.md`. Structure: 3-5 × 6-8 min at 55-65 RPM / 70-80% FTP, seated with high resistance. Targets neuromuscular recruitment and climbing-specific leg force with low cardio cost.
- **Stomps session archetype** — 6-10 × 10-12s maximal seated efforts from a rolling start in the biggest gear. Pure neuromuscular power development, distinct from sprint intervals.
- **Descending Intervals (DI) archetype** — maximal efforts that decrease in duration each rep (e.g. 3 min → 2 min → 1 min), 110+ RPM. Trains the ability to produce power when already fatigued.
- **Progression rows for Muscle Tension and Stomps** in the archetype progression table.
- **4-week block periodization** guidance in `references/training-model.md`: 3 progressive build weeks followed by 1 taper/test week (segment attempt or time trial). Includes a 2+1 variant for masters athletes (50+).
- **Muscle Tension and Stomps** added to the standard session shapes section of `references/training-model.md`.
- **Garmin Coach Export integration** (`references/garmin-data.md`). The skill now accepts a pasted Garmin JSON export (produced by the [Garmin Workout Importer](https://chromewebstore.google.com/detail/garmin-workout-importer/faebbfokokipdpkbolpbpfadmgdbanpo) Chrome extension) as a first-class data source alongside Strava. Fields covered: FTP, VO2max, LTHR, 7-zone power model, 5-zone HR model, readiness (HRV, body battery, sleep score), training load (ATL, CTL, ACWR, training status, recovery window), and recent activities with TSS/NP.
- **Readiness-driven plan adjustments** — training readiness score, HRV status, and ACWR now trigger automatic load adjustments (soften hard sessions when score < 40 or ACWR > 1.3; prime the athlete to push when score ≥ 70 and ACWR is in the optimal range).
- **NP/FTP classification table** for Garmin activities (which lack workout names): maps the NP-to-FTP ratio to an effort tier (endurance, tempo, sweet spot, over-threshold, VO2max/anaerobic).
- **Readiness header line** in the weekly plan format (`references/plan-format.md`) — surfaces score, HRV, sleep, ACWR, training status, and recovery window at a glance when Garmin data is provided.
- **Weekly intake prompt** in `SKILL.md` now explicitly asks whether the athlete has a Garmin export and directs Garmin Connect users to the Chrome extension.

### Changed

- **Cadence targets** added to all existing hard session archetypes in `references/workout-library.md` (Sweet spot 85-95 RPM, Threshold 85-95 RPM, Over-unders 90-100 RPM, VO2max 90-100 RPM, 40/20s 95-105 RPM, 30/15s 95-105 RPM) and to Endurance Z2 (85-95 RPM).
- **Step 1 (data pull)** in `SKILL.md` restructured to handle three scenarios: Garmin only, Strava only, or both. When both are present, Garmin supplies zones and readiness; Strava supplies activity names for archetype extraction.

## [2.1.0] - 2026-06-12

### Added

- **30/15s (Rønnestad) workout archetype** in `references/workout-library.md`. Structure: 3 sets × 13 reps, 30 s @ 110–115% FTP / 15 s @ ~50–55%, 3 min recovery between sets. Includes cadence cues and a progression table (2×13 → 3×13 → 3×13 @ 112–115%).
- **Progression row for 30/15s (Rønnestad)** in the archetype progression table.

### Changed

- **Rotation table** updated so 30/15s (Rønnestad) occupies the former VO2max slot for all rider types, backed by Rønnestad et al. research showing 3 × 13 reps produces significantly greater VO2max and power gains than 4–5 min evenly-paced intervals. Classic VO2max (4×4 min) is retained as an explicit fallback substitute.
- **Example polarised week**: Tuesday's session changed from `VO2max 5×4` to `30/15s Rønnestad 3×13`.

## [2.0.0] - 2026-06-11

### Added

- Version metadata field to `SKILL.md` frontmatter.

### Changed

- **Output file naming conventions** updated throughout the skill.
- **Workout format specifications** refactored across `SKILL.md`, `references/athlete-config.md`, and `references/plan-format.md` to reflect ZWO-only output.

### Removed

- **Garmin FIT format support** — `references/garmin-connect-format.md` and all associated FIT generation documentation removed. ZWO is now the sole structured workout output format.

### Fixed

- Regex in `scripts/build-skills.sh` that failed to update the version field in `SKILL.md` frontmatter.

## [1.0.0] - 2026-06-10

### Added

- Initial release of the unified **cycling-plan-coach** skill, consolidating the previous `cycling-week-coach` and `zwo-workout-builder` into a single skill.
- Athlete configuration system (`references/athlete-config.md`) for per-athlete identity, goals, language, and units.
- Onboarding flow (`references/onboarding.md`) for gathering new athlete data.
- Strava integration reference (`references/strava-pull.md`) for pulling recent activities and extracting archetypes.
- Rider type classification (`references/rider-types.md`): sprinter/puncheur, all-rounder, diesel.
- Standard workout library (`references/workout-library.md`) with VO2max, Sweet spot, Threshold, 40/20s, and Over-unders archetypes, rotation table, and progression steps.
- ZWO format specification (`references/zwo-format.md`) covering all block types and file structure.
- Garmin FIT format specification (`references/garmin-connect-format.md`) with Python generation script.
- Strength and core exercise library (`references/strength-library.md`) tailored for cyclists.
- Training model principles (`references/training-model.md`) covering polarised and base-build-peak structures.
- Plan format reference (`references/plan-format.md`) for weekly markdown output structure.
- GitHub Actions release workflow (`.github/workflows/release.yml`).
- Build script (`scripts/build-skills.sh`) for packaging skill artefacts.
