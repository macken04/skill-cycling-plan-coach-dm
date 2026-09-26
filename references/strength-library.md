# Strength and core library (cycling-focused)

Generic exercise bank. Translate exercise names, load cues, and rest cues into the athlete's language when building the session. Goal is durable force and stability, not mass. Once or twice a week, never the day before VO2max or threshold. Tune to the athlete: more posterior chain for power, more single-leg and core for stability. If the athlete's onboarding `physicalNotes` describes a specific sensation (e.g. lower-back fatigue or power not transferring on climbs), lean the selection toward the exercises that address it (posterior chain, anti-rotation core) rather than the default split — it's a hypothesis from the athlete's own account, worth testing even without a data signal to confirm it.

**First block for a new lifter:** if `strengthExperience` is `new`, don't start at the working loads in the tables below. For the first 2-3 weeks, use bodyweight or light-load versions of the same movement patterns, higher rep ranges (e.g. 3 x 10-12 instead of 4 x 5), and spend the early sets on the movement pattern and control rather than load — then progress into the standard prescriptions once form is solid. If `strengthExperience` is `returning`, start at reduced load (roughly one progression step back) for the first 1-2 sessions rather than the full working load. `experienced` athletes start directly at the prescriptions below.

**Anchor to what the athlete actually reports:** if `strengthCurrentLifts` gives concrete numbers, use those as the literal starting point for the first block instead of the generic conservative default above — it's a better estimate than any heuristic. Also check `strengthRecentFrequency` regardless of `strengthExperience`: an otherwise `experienced` lifter at `none` or low frequency in the last 2-3 months still gets a short re-ramp (one progression step back for the first 1-2 sessions) before returning to their reported working weights, the same as a `returning` lifter. If `strengthInjuryNotes` names a joint or movement to avoid or adapt (e.g. a knee that doesn't tolerate deep flexion), substitute or regress the affected exercise (e.g. box squat depth, or swap Bulgarian split squat for a step-up) rather than prescribing it as written.

## Strength (legs and posterior chain)

| Exercise | Sets x Reps | Load / cue | Rest |
|---|---|---|---|
| Back squat (or trap-bar deadlift) | 4 x 5 | heavy, full control, smooth depth | 2-3 min |
| Romanian deadlift | 3 x 8 | posterior chain, hinge from the hips | 90 s |
| Bulgarian split squat | 3 x 8 / leg | dumbbells, balance and single-leg force | 90 s |
| Step-up | 3 x 8 / leg | controlled up and down | 90 s |
| Calf raise | 3 x 12 | slow, full range | 60 s |
| Hip thrust | 3 x 8 | glute drive, short pause at top | 90 s |

## Core (trunk and stability)

| Exercise | Sets x Reps | Load / cue | Rest |
|---|---|---|---|
| Plank | 3 x 45 s | brace hard, hold riding position | 45 s |
| Side plank | 3 x 30-45 s / side | hips high | 45 s |
| Pallof press | 3 x 10 / side | anti-rotation, resist the cable | 45 s |
| Dead bug | 3 x 10 / side | low back to the floor | 45 s |
| Bird dog | 3 x 10 / side | slow, no hip wobble | 45 s |

## Building a session

- Full strength session: 2-3 strength lifts + 2 core moves.
- Core only: 3-4 core moves.
- Warm up 5-10 min before loading. Progress by load on the compounds, not by adding reps.
- List each chosen exercise in the strength-section table from `plan-format.md`: exercise name, sets × reps, load/cue, and rest.
