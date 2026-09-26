# Gap report — onboarding intake is shallow relative to what downstream references expect

## Scope of this document

This is a **gap-flagging brief only**. It documents where `references/onboarding.md`
does not collect information that other reference files either consume, gesture
toward tuning on, or otherwise imply should exist. It deliberately does **not**
propose specific new fields, question wording, or config schema changes — that
design work is intended to happen in a separate follow-up pass.

## Summary of gaps found

1. Onboarding never asks about strength/conditioning background or general
   training history.
2. The one mechanism for surfacing physical weak spots/limiters is a single
   free-text narrative question, asked once, with no structured follow-up and
   no path to revisit it later.
3. Onboarding collects nothing about nutritional preferences, restrictions,
   or sensitivities, despite a fueling model that is meant to be personalized.

## Gap 1 — Strength & conditioning experience / training history

**What onboarding asks today:** Section 5 ("Training logistics," questions
11–16 in `references/onboarding.md`) covers group-ride days, available
training days, session duration, number of structured sessions, and a
strength default (`strength + core` / `core only` / `none`). Nothing asks
about the athlete's lifting experience, training age, typical historical
weekly volume, or any past injury history.

**Where this shows up downstream:** `references/strength-library.md` line 3
says to "tune to the athlete" using rider type and `physicalNotes`, and the
prescriptions it lists start at working loads (e.g. "Back squat ... 4 x 5,
heavy, full control, smooth depth"). There is no field in `athlete.json`
(per `references/athlete-config.md`) capturing whether the athlete has ever
performed these lifts before. A first-time lifter and an experienced one
both flow through the same intake with no differentiating input.

## Gap 2 — Weak-spot / limiter depth

**What onboarding asks today:** A single narrative question (question 10,
"Is there anything that feels like it's holding you back physically on the
bike?"), stored verbatim as `physicalNotes`. It is asked once, at onboarding
only.

**Where this shows up downstream:** `SKILL.md` Step 2/3 and
`references/strength-library.md` both treat `physicalNotes` as "a hypothesis
to weigh, never a silent override" against the data-derived rider type from
`references/rider-types.md`. That design (data first, self-report as
context) is a deliberate existing choice, not itself a gap. The gap is
structural: there is no mechanism to probe further on what the athlete
describes (frequency, severity, which specific efforts trigger it, whether
it has been assessed by anyone), and no mechanism to re-ask or update it once
training is underway — the field is write-once at first run.

**Observed live:** In a first-run walkthrough, the athlete's answer to
question 10 described several distinct things in one free-text response
(a power/output limiter, a specific pain location, and a general fitness/
intensity-tolerance observation). All three were captured verbatim as one
undifferentiated string, with no follow-up question distinguishing them.

## Gap 3 — Nutritional preferences

**What onboarding asks today:** Nothing. There is no question in
`references/onboarding.md`, and no field in `references/athlete-config.md`,
covering dietary restrictions, allergies, GI sensitivities, or fueling
product preference (e.g. gels vs. real food, tolerance for specific carb
sources).

**Where this shows up downstream:** `references/nutrition.md` is a fully
generic, weight-scaled fueling model (g/kg carb targets, ml/h fluid targets,
sodium ranges) that reads only `weightKg` from `athlete.json`. It has no
athlete-specific input to draw on beyond body weight — every athlete of the
same weight receives an identical fueling plan regardless of what they can
tolerate or are willing to eat.

**Related but distinct existing work:** `documents/agentic-coach-prd.md`
(FR3–FR8) scopes a logging/interpretation loop for `nutrition_logs` (e.g. a
"GI distress" or "bonked" signal adjusting future on-bike carb rate). That
workstream assumes a nutrition baseline already exists to adjust *from* — it
does not itself add an onboarding step for capturing dietary preferences or
restrictions, so it does not close this gap.

## How this was found

Live walkthrough of onboarding from a genuine first-run state (no
`athlete.json` present), following `SKILL.md` → `references/onboarding.md`
exactly as written, question by question. Each answer was then cross-checked
against the reference files that consume it downstream
(`references/strength-library.md`, `references/nutrition.md`,
`references/training-model.md`, `references/rider-types.md`) to see whether
those files expect input that onboarding never collects, and against
`documents/agentic-coach-prd.md` to confirm these three gaps are not already
scoped as planned work elsewhere.

## Files reviewed

- `references/onboarding.md`
- `references/athlete-config.md`
- `references/strength-library.md`
- `references/nutrition.md`
- `references/training-model.md`
- `references/rider-types.md`
- `documents/agentic-coach-prd.md`
