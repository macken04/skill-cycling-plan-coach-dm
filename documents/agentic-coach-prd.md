# Agentic Cycling Coach — PRD

Status: draft, for review. Written to check the existing planning docs
(`multi-event-and-webui-plan.md`, `multi-event-and-webui-tasks.md`) against a
broader brief — turn this into an **agentic coach that supports wider
events** — and to reset the roadmap so implementation tracks that brief
instead of drifting toward a single hardcoded race.

Nothing has been built against the existing plan yet (no `references/events/`
directory, no DB, no frontend exist in this repo as of this review), so this
is a course-correction before Milestone A starts, not a rewrite of shipped
work.

## 1. The brief

Two words carry the weight, and the existing docs under-deliver on both:

- **Wider events** — plural, general. The coach should handle the *range* of
  events a cyclist trains for (gran fondos, road races/crits, stage races,
  time trials, ultra-endurance/gravel, indoor century/sportive, "no event,
  just fitness"), not one named race with a registry format that happens to
  support more later.
- **Agentic** — the coach should act with some autonomy between chat turns:
  notice things (a missed session, a readiness crash, an approaching taper
  window) and say something or adjust the plan, not only compute a new week
  when the athlete opens a chat and types "plan my week."

## 2. Gap analysis: existing plan vs. the brief

### 2.1 Event breadth — designed for one event, not a range

`multi-event-and-webui-plan.md` and Milestone A of the tasks doc are
architecturally fine (a registry + one file per event is extensible) but the
**scope of work only instantiates one event**: A1 is "Event registry +
Badlands Ultra event file," and every other Milestone A task is written
around content that exists to support that single race. Nothing in Milestone
A defines:

- An **event-type taxonomy** (e.g. `ultra-endurance`, `gran-fondo`,
  `road-race-crit`, `stage-race`, `time-trial`, `indoor-sportive`) that
  event-specific files plug into, so a new event is mostly *data*
  (distance, terrain, format rules) against a shared periodization/session
  template for its type — not a bespoke prose file written from scratch
  each time.
- A **second and third event** to prove the registry actually generalizes.
  One instance never exercises the "registry" claim; it just hardcodes
  Badlands with extra indirection.
- What happens for the athlete whose event has **no file and no type
  match** — today's fallback is "generic ultra-endurance heuristics" (A4),
  which is wrong for a crit racer or gran fondo rider with no ultra file.

Net effect: if Milestone A ships as currently scoped, the skill goes from
"no event concept" to "one event, hardcoded," which reads as narrower than
the brief, not broader.

### 2.2 Agentic behavior — not designed at all

Nothing in either existing doc gives the coach any autonomy. The entire
system, including the planned web UI, is pull-only:

- The skill only ever runs when the athlete opens Claude Code and asks for a
  plan. There is no notion of the coach noticing anything between those
  asks.
- Milestone B's web app is explicitly scoped as "viewing plans and logging
  data" — logging is one-directional (athlete → DB). Nothing reads the
  logs back out proactively; the skill only reads them back in "at the next
  planning session" (B4), i.e. still pull, still gated on the athlete
  asking.
- No trigger design exists for the events that should plausibly cause
  unsolicited coach action: a missed key session, three days of no
  logged nutrition, a readiness/ACWR flag while the athlete hasn't opened a
  chat, entering a taper window, an event date arriving.

This is the larger gap of the two — Milestone B builds real infrastructure
(Supabase, a web app) but nothing in it is agentic; it's a logging form.

### 2.3 Scope creep risk in the other direction

Milestone B's phasing (`B1`→`B7`) is sound *as a data/UI plan* but it was
sequenced before the event-breadth or agentic questions were settled, so it
locks in a schema (`events`, `plans`, `workouts`, `workout_logs`,
`nutrition_logs`, `strength_logs`) and a UI scope (view + log) that don't
have anywhere for agentic behavior or event-type generality to attach later
without another schema change. Better to settle sections 3–4 below before
`B2` (schema) is executed.

## 3. Revised functional requirements

### 3.1 Event taxonomy (replaces Milestone A's single-event scope)

- **FR1.** `references/events/README.md` defines event **types**, not just a
  flat list of named events. Each type carries: default periodization shape
  (e.g. countdown base/build/peak/taper vs. rolling), default limiter
  priorities, default session-archetype set, and a fueling delta template.
- **FR2.** A named event (e.g. `badlands-ultra`) is a short file that sets
  type = `ultra-endurance` and overrides only what's race-specific (course,
  cutoffs, gear/logistics, event-specific fueling numbers). It does **not**
  redefine periodization or session selection from scratch.
- **FR3.** Ship at least **three** named events spanning **at least two
  different types** in the same milestone (e.g. `badlands-ultra`
  [ultra-endurance], one gran fondo or century [endurance/mass-participation],
  one road race or crit [short-format/high-intensity]) — proof that the
  taxonomy generalizes, not just that Badlands has a home.
- **FR4.** Unmatched events fall back to the closest **type** (asked or
  inferred from format description at onboarding: multi-day/self-supported →
  ultra-endurance; single timed effort → time-trial; mass start/short/sprint
  finishes → road-race-crit; etc.), not a single hardcoded "generic ultra"
  fallback.
- **FR5.** "No specific event" remains a first-class path with the existing
  rolling periodization — this is not deprecated by the taxonomy work.

### 3.2 Agentic behaviors (new — not in either existing doc)

- **FR6. Trigger-based re-engagement.** Define concrete triggers that should
  cause the coach to act without the athlete asking:
  - Readiness/ACWR threshold breach (already computed in Step 1 today, just
    never acted on outside an active chat).
  - A key session logged as skipped/missed two weeks running.
  - No nutrition/workout log entries for N days during a build/peak phase.
  - Entering the taper window before a set `eventDate`.
  - `eventDate` passing (post-event debrief / next-block prompt).
- **FR7. Delivery mechanism for autonomous output.** Decide and document how
  a trigger becomes something the athlete sees without opening a chat —
  options in order of buildability: (a) a scheduled job (cron/Supabase Edge
  Function, or a Claude Code trigger if running in an environment that
  supports one) that evaluates triggers against logged data and writes a
  "coach note" row the web UI surfaces on next open; (b) same, but pushed
  via email; (c) a chat-initiated check only, i.e. explicitly descoped for
  v1. This PRD recommends **(a)** as the v1 target — it needs no new
  channel (no email/SMS integration) and fits the Supabase architecture
  already chosen.
- **FR8. Coach notes as a first-class object.** Add a `coach_notes` table
  (or equivalent) distinct from `plans` — timestamped, trigger-tagged,
  human-readable — so the web UI has something to show between planning
  sessions and the skill can read prior notes back in as context.
- **FR9. Bounded autonomy.** Agentic actions are limited to *flagging and
  recommending* (soften next week, prioritize a missing session type,
  suggest logging) — not silently rewriting a plan the athlete hasn't seen.
  Any plan regeneration still happens in a chat-driven planning session per
  the existing "why this needs new infrastructure" reasoning in the plan
  doc; keep that boundary, just add the notice layer on top of it.

### 3.3 Data + web UI (carries Milestone B forward with one addition)

- **FR10.** Everything in Milestone B (`B1`–`B7`) stands as scoped, with one
  schema addition: `coach_notes` (FR8) alongside the existing seven tables,
  added at `B2` rather than bolted on later.
- **FR11.** The frontend's "view" surface (currently just plans + logs) also
  surfaces open `coach_notes` — this is the only UI change needed to expose
  agentic output; no new UI paradigm required.

## 4. Non-goals (explicit, to stop scope drift)

- **Not multi-sport.** "Wider events" means a wider range of *cycling*
  events (road, gravel, ultra, indoor, TT). Running/triathlon/other sports
  are out of scope unless the athlete's brief says otherwise — flag this as
  an assumption to confirm (see §6).
- **Not multi-athlete/coach-of-coaches.** Single-athlete v1 stands, per the
  existing plan's resolved decision. The `athlete_id`-keyed schema still
  future-proofs this; it's just not being built now.
- **Not full autonomy.** The coach never regenerates or overwrites a plan
  without a chat session; agentic behavior is limited to noticing and
  surfacing (FR9).
- **Not a new communication channel.** No email/SMS/push integration in v1
  (FR7 option (a) only) unless the athlete explicitly asks for one later.

## 5. Revised roadmap

Renumbers/reorders the existing tasks doc rather than replacing it —
`multi-event-and-webui-tasks.md`'s task bodies (test criteria, dependencies)
are still valid content; the change is **sequence and added scope**, folded
in as follows:

1. **Milestone A′ — event taxonomy** (was: Milestone A)
   - A1′: `references/events/README.md` as a **type taxonomy** (FR1), not
     just a flat registry.
   - A1a–A1c: three named event files across ≥2 types (FR3), each a thin
     override of its type (FR2) — Badlands Ultra is one of these three, not
     the only one.
   - A2–A8 as already scoped (nutrition module, config fields, onboarding,
     `SKILL.md` workflow, new archetypes, plan format, version bump) —
     unchanged, but A4 (onboarding fallback) and A5 (event resolution)
     updated to resolve by **type** first (FR4).
2. **Milestone B′ — data + web UI + agentic notes** (was: Milestone B)
   - B1–B7 unchanged, **except** B2's schema also creates `coach_notes`
     (FR10), and B7's "polish" scope includes surfacing open notes (FR11).
3. **Milestone C — agentic trigger loop** (new)
   - C1: Define the trigger list (FR6) and their evaluation logic as a
     spec (reuse existing readiness/ACWR logic from `SKILL.md` Step 1 —
     don't reimplement it, extract it so both the chat flow and the
     scheduled job call the same logic).
   - C2: Build the scheduled evaluator (FR7 option (a)) that reads
     `workout_logs`/`nutrition_logs`/`events` and writes `coach_notes`.
   - C3: Surface `coach_notes` in the frontend (ties to B7/FR11) and have
     the skill read recent open notes back in at the next planning session.
   - Depends on: Milestone B′ (needs the data layer to evaluate against).

Milestone A′ can still ship standalone as a skill release, same as today.
Milestone C is new work, not a reshuffling of existing tasks — size it
separately when picked up.

## 6. Open questions (need the athlete/product owner's call)

1. **Multi-sport?** Confirmed out of scope per §4 unless told otherwise —
   flagging because "agentic coach" read alone could imply broader scope
   than "wider cycling events."
2. **Notification channel for agentic notes (FR7)** — is in-app-on-next-open
   sufficient for v1, or does day-to-day usefulness require a push (email at
   minimum) so a taper warning doesn't sit unread until the athlete happens
   to open the web app?
3. **Which second/third events (FR3)** — name two concrete events (a fondo
   and a road race/crit are suggested placeholders above) so A1a–A1c isn't
   blocked on invented examples the way A1's Badlands file already flags
   real course data as a dependency.

## 7. Success metrics

- Adding a **fourth** named event after Milestone A′ ships takes editing one
  short file (course/format/fueling deltas) with no changes to
  `SKILL.md`, `training-model.md`, or `workout-library.md` — proves the
  taxonomy, not just the registry, generalizes.
- At least one agentic trigger (FR6) fires correctly against a seeded test
  dataset without any chat session running, and produces a `coach_notes` row
  the frontend displays before the athlete's next planning chat.
- No plan is ever generated or overwritten outside a chat session (FR9
  regression check — the autonomy boundary holds).
