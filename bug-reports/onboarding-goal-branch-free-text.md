# Bug report — onboarding goal-branch question is free-text, not a closed choice

## Summary

`references/onboarding.md` question 3 (the goal-branch question) asks the
athlete whether they're training for a specific event or want a general
plan, but implements the "specific event" path as **free text** ("name
it"), matched against the registry afterward. It does not present the
supported event list (currently just Badlands) as explicit pick options.

This contradicts the task spec it was built against
(`documents/multi-event-and-webui-tasks.md`, task **A4**), which says the
goal branch should offer *"the supported list (from the A1 registry) plus
'general training plan'/'no specific event'"* — i.e. a closed-choice list,
consistent with every other categorical question in onboarding (units,
gender, strength default, etc., all of which are tagged `[choice]` with an
explicit option list per A4's own rule that closed-choice questions must
never be "e.g." free-text stand-ins).

## Where

- `references/onboarding.md`, Section 2, question 3 (lines ~20–28 as of
  this report).
- Registry it should be reading options from: `references/events/README.md`
  (currently one row: `badlands-ultra`).
- Task spec being violated: `documents/multi-event-and-webui-tasks.md`,
  task A4 (~lines 79–115), specifically the "Goal branch (event question)"
  bullet.

## Current behavior (reproduced by walking through onboarding live)

Question 3 is asked as an open branch:

> Are you training for a specific event, or do you want a general training
> plan? Options:
> - A specific event — name it (match against the registry ... by alias)
> - A general training plan, not tied to one event.

When the athlete picks "a specific event," they're prompted to type the
event name freely, which is then matched against
`references/events/README.md` aliases. There is no explicit pick-list of
supported events shown up front — the athlete has to already know (or
guess) that Badlands is supported.

## Expected behavior

Per the requested fix: the goal-branch question should present the
athlete with an explicit, closed choice, built dynamically from the event
registry, e.g.:

- **Badlands (Ultra-Distance Gravel Race)** — the one registry entry today
- **General training plan / no specific event**

with the branch logic (3a/3b/3c in the current doc) driven off that
pick, rather than off free-text parsing. As more events are added to
`references/events/README.md`, this list should grow automatically —
**do not hardcode "Badlands" as one of only two permanent options**; the
fix should read the registry's `Display name` column to build the
option list, with "General training plan" always appended last.

An unmatched/untracked event name should stay reachable, but as a
fallback path off the picker (e.g. an "Other event" catch-all option that
then asks for free text), not as the primary way to select a *supported*
event — this preserves the existing 3b behavior (untracked event still
captured as free text, generic ultra-endurance heuristics) without losing
it.

## Suggested fix location

- `references/onboarding.md`: rewrite question 3 as a `[choice]` question
  whose options are generated from `references/events/README.md`'s
  Display name column plus "General training plan," with an "Other event"
  fallback that re-enters the existing free-text 3b flow.
- No changes expected to `references/athlete-config.md` or
  `references/events/README.md` schema — this is purely an onboarding
  UX/question-flow fix.

## How this was found

Live walkthrough of onboarding (no `athlete.json` present, genuine
first-run path), following `SKILL.md` → `references/onboarding.md` exactly
as written, using the interactive picker for `[choice]` questions per the
doc's own instruction. Reached question 3, picked "a specific event," and
was prompted for free text instead of being shown Badlands as a pick
option.
