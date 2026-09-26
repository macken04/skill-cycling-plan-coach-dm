# Multi-event coaching + web UI — task breakdown

Companion to `multi-event-and-webui-plan.md`. Breaks that plan into tasks that
can each be picked up, implemented, and verified independently. Ordered so
every task can be tested before moving to the next.

## Decisions locked in (resolves the plan's "Open decisions" section)

- **Hosting:** Supabase (Postgres + PostgREST + Auth) + Vercel (Next.js), as drafted.
- **Athlete scope (v1):** single-athlete. Schema stays keyed by `athlete_id` for
  future-proofing, but auth/UI logic assumes one athlete.
- **Infra provisioning:** kept as an explicit task (B1) with manual sub-steps,
  rather than assumed to already exist.

## Milestone A — multi-event coaching content

Pure skill/content work: markdown files inside this repo. No external
infra required. Ships as a `SKILL.md` version bump.

- [ ] **A1. Event registry + Badlands Ultra event file**
  - Create `references/events/README.md`: registry format — event id, display
    name, aliases (for matching free-text onboarding answers), event type tag
    (e.g. `ultra-gravel`).
  - Create `references/events/badlands-ultra.md`: course profile
    (distance/elevation/terrain/climate), format rules (self-supported/
    unsupported, cutoffs, checkpoints — **flag as approximate/edition-dependent**
    since these change year to year), the specific limiters it trains for,
    event-specific session archetypes + periodization overlay, gear/logistics
    notes relevant to training, and the event's fueling delta (references
    A2's `nutrition.md` rather than duplicating it — e.g. 90–120 g/h gut
    training, desert heat/electrolyte load, multi-day/resupply-as-fuel-stop
    logistics, sleep-deprivation fueling).
  - Course specifics (exact distance, elevation, cutoffs) need to come from
    real race info, not invented — pull from the race's official site/rules
    before writing this file, and keep the approximate/edition-dependent
    caveat prominent.
  - **Test:** the registry lists `badlands-ultra` with aliases that match
    "Badlands", "Badlands Ultra", "Badlands Gravel Race"; walk through
    onboarding (A5, once written) with each alias and confirm it resolves to
    this file.
  - Depends on: none.

- [ ] **A2. Shared nutrition module**
  - Create `references/nutrition.md`: daily carb periodization (by day
    type — rest/endurance/structured/long), training-day fueling,
    hydration/electrolyte guidance, race-day fueling principles.
  - **Test:** manually trace one rest day, one structured day, and one long
    day through the module and confirm each yields a concrete g/h carb
    target and hydration note, not just prose.
  - Depends on: none.

- [ ] **A3. Config schema additions**
  - Edit `references/athlete-config.md`: add `targetEvent` (event id or
    `null`), `eventDate`, and derived `daysToEvent` to the field table. Note
    that `goal` is auto-populated/confirmed from the event when one is set,
    but stays free text and overridable.
  - **Test:** for a sample config with `targetEvent: "badlands-ultra"` and a
    given `eventDate`, hand-compute `daysToEvent` against a stated "today"
    and confirm the doc's description would produce that number; confirm a
    blank `goal` with an event set gets a sensible default per the doc.
  - Depends on: A1 (event id needs to exist to be a valid reference).

- [ ] **A4. Onboarding event question**
  - Edit `references/onboarding.md`: add the question "Are you training for
    a specific event?" offering the supported list (from the A1 registry)
    or "no specific event", plus event date. Unmatched event names are still
    captured (name + date) and fall back to generic ultra-endurance
    heuristics.
  - **Test:** write out (or run in a scratch chat) three onboarding
    walkthroughs — selects Badlands, says "no event", names an untracked
    event — and confirm each produces the right `athlete.json` fields and
    the right fallback behavior for the untracked case.
  - Depends on: A1, A3.

- [ ] **A5. SKILL.md workflow: event resolution + countdown periodization**
  - Edit `SKILL.md`: config-resolution step also resolves the event file and
    countdown; the training-model step (Step 4) branches to countdown-driven
    periodization (base/build/peak/taper toward `eventDate`) when an event is
    set, instead of the generic rolling 3-build+1-taper block; rider-type
    session priorities can be overridden by the event (e.g. ultra-gravel
    deprioritizes VO2/sprint work in favor of durability, fat-max endurance,
    back-to-back long days, technical/loose-surface handling).
  - **Test:** dry-run "plan my week" for an athlete with `targetEvent` set
    10 weeks out vs. an athlete with no event, using the existing example
    plan in `plan-format.md` as the no-event baseline. Confirm the two runs
    diverge only in the event-driven athlete (correct phase label, no
    VO2/sprint sessions if event overrides say so) and the no-event athlete's
    output is unchanged from current behavior (regression check).
  - Depends on: A1, A3.

- [ ] **A6. New event-driven session archetypes**
  - Edit `references/workout-library.md`: add long back-to-back days, heat
    acclimation, overnight/low-sleep simulation, loaded-bike climbing
    archetypes, plus progression rows for each.
  - **Test:** run each new archetype's spec through the existing validation
    checklist pattern already used for other archetypes in this file (target
    definition, progression steps, rotation-table placement all present).
  - Depends on: A1 (event file's session-archetype list drives which
    archetypes are needed).

- [ ] **A7. Plan output format: countdown header + fueling section**
  - Edit `references/plan-format.md`: add the optional event countdown/phase
    header line (following the existing optional-line pattern used by the
    Readiness line) and a fueling subsection; add a race-day fueling/pacing
    deliverable format for use once close to the event.
  - **Test:** render a sample plan snippet with the new header line and
    fueling subsection filled in and confirm it reads consistently with the
    existing example plan in the same file.
  - Depends on: A2, A5.

- [ ] **A8. Version bump, changelog, description updates**
  - Bump `package.json` version (breaking config shape → major bump, e.g.
    `2.2.0` → `3.0.0`).
  - Add a `CHANGELOG.md` entry at the top describing multi-event + nutrition
    support.
  - Update `SKILL.md` frontmatter `version` (or confirm the build script
    stamps it) and the `README.md`/`SKILL.md` descriptions to mention
    multi-event + nutrition support.
  - **Test:** run `npm run build`; confirm `cycling-plan-coach.skill` is
    produced and the staged `SKILL.md` inside it has `version: 3.0.0`
    stamped; confirm `CHANGELOG.md` has the new entry at the top.
  - Depends on: A1–A7 (bump happens once the content behind it exists).

## Milestone B — persistent data + web UI

Requires external infra. Sequenced exactly as the plan's phased delivery so
each phase closes a working loop before the next adds scope.

- [ ] **B1. Provision infra**
  - Manual (user): create a Supabase project; record the project URL, anon
    key, and service-role key. Create a Vercel project (can stay empty for
    now, just linked to this repo or a new one for the frontend).
  - Scripted/documented once credentials exist: store the service-role key
    as an environment variable in the Claude Code environment; document the
    required env var names (e.g. in a new `docs/infra.md` or this repo's
    README) so future sessions know what to expect.
  - **Test:** `curl` the Supabase REST endpoint (`GET {SUPABASE_URL}/rest/v1/`
    with the `apikey`/service-role header) from the Claude Code environment
    and confirm a 200/expected response — proves the env var and network
    path both work.
  - Depends on: none (blocked on user action).

- [ ] **B2. Schema + RLS policies**
  - Write a SQL migration (e.g. `db/schema.sql` or a Supabase migrations
    folder) creating the seven tables from the plan: `athletes`, `events`,
    `plans`, `workouts`, `workout_logs`, `nutrition_logs`, `strength_logs`,
    with the columns listed in the plan doc's schema table.
  - Add RLS policies scoped by `athlete_id` (kept even in single-athlete v1,
    per the plan's future-proofing rationale).
  - **Test:** apply the migration to the Supabase project; query each table
    via `curl`/psql and confirm the expected columns exist; insert a second
    dummy `athlete_id` row and confirm a query filtered to the real
    `athlete_id` cannot see it (RLS is actually enforced, not just declared).
  - Depends on: B1.

- [ ] **B3. Core loop, minimal**
  - Update the skill so it posts a generated plan + its workouts to the API
    (via `curl` + service key) instead of, or alongside, local files.
  - Build a bare-bones Next.js page on Vercel listing the current week's
    workouts with a "mark complete" action that writes to `workout_logs`.
  - **Test (end-to-end):** run the skill to generate a week; query
    `plans`/`workouts` via `curl` and confirm the rows exist and match the
    generated content. Load the frontend page, mark one workout complete,
    and confirm a `workout_logs` row appears with the correct `workout_id`
    and `status`.
  - Depends on: B2.

- [ ] **B4. Nutrition logging UI**
  - Add a daily entry form + history view to the frontend, writing to
    `nutrition_logs`.
  - Update the skill's Step 1 (data pull) to read recent `nutrition_logs`
    back in and factor them into fueling notes.
  - **Test:** log 3 days of nutrition via the UI; run the skill's weekly
    planning flow and confirm the generated plan's summary references the
    logged data (e.g. mentions average carb intake or a hydration gap).
  - Depends on: B3.

- [ ] **B5. S&C logging UI**
  - Add the same log/view pattern for `strength_logs` (sets/reps/load done,
    notes).
  - **Test:** mark a strength session complete via the UI; confirm the
    `strength_logs` row has correct sets/reps/load and shows up in a history
    view.
  - Depends on: B3.

- [ ] **B6. Fold in Milestone A on top of the data layer**
  - Wire the multi-event/nutrition logic from Milestone A into the DB-backed
    flow: `events` table gets populated from `targetEvent`/`eventDate`;
    `plans` rows carry the countdown-driven `phase` (base/build/peak/taper)
    instead of only appearing in local markdown.
  - **Test (end-to-end):** run the skill for an athlete with
    `targetEvent: badlands-ultra`; confirm an `events` row is created, the
    resulting `plans` row's `phase` column matches the countdown-driven phase
    for that athlete's `daysToEvent`, and the frontend plan viewer displays
    the event countdown correctly.
  - Depends on: Milestone A complete, B3.

- [ ] **B7. Polish**
  - Add an event countdown view, compliance/trend charts, and a taper/
    race-week view to the frontend.
  - **Test:** manual UI walkthrough — countdown view shows the correct
    days-to-event; a trend chart reflects at least 2 weeks of logged data;
    the taper/race-week view activates within the correct window before
    `eventDate` per the periodization rules from A5.
  - Depends on: B4, B5, B6.

## Suggested execution order

Milestone A (A1→A8) can ship on its own as a skill release. Milestone B can
start in parallel from B1 once Supabase/Vercel accounts exist, but B6
specifically needs Milestone A finished first — everything else in B is
independent of A.
