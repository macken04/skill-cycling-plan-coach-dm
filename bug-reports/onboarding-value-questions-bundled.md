# Bug report — onboarding `[value]` questions get bundled into one free-text message instead of asked one at a time

## Summary

`references/onboarding.md` Section 3 (physical profile: age, gender, body
weight, FTP known?, target W/kg) tags age, weight, "do you know your FTP"
(value part), and target W/kg as **[value]** questions. In practice, when
walking through onboarding live, these got asked as a single bundled
free-text message ("Age (years) / Body weight / Your FTP in watts / Target
W/kg, if you have one") instead of one question per turn.

This is a worse experience than the `[choice]` questions get. `[choice]`
questions are already asked one at a time using the interactive picker
(per the doc's own instruction: "use the interactive picker when
available"). `[value]` questions should get the same one-at-a-time,
native Q&A turn-taking — ask a question, get an answer, ask the next —
rather than being collapsed into one multi-part message the athlete has
to parse and answer all at once in free text.

## Where

- `references/onboarding.md`, Section 3 "Physical profile" (questions
  5–9: age, gender, body weight, FTP known, target W/kg), and Section 5
  "Training logistics" (question 13, session duration) has the same
  `[value]` tag and is likely to have the same problem.
- The doc's own tagging legend (top of file) defines `[value]` as: "a
  concrete number or short fact ... Free text is fine because there's
  nothing to categorize" — this correctly says free text is fine for the
  *answer*, but says nothing about how the *questions* should be paced,
  which is what left room for bundling multiple `[value]` questions into
  one message.

## Current behavior (reproduced by walking through onboarding live)

After the goal-branch and event-date/goal questions were asked and
answered individually, gender and "do you know your FTP" were asked
together as one two-part choice picker call, and then age, body weight,
FTP (watts), and target W/kg were all requested in a single message:

> A few numbers to finish the physical profile:
> - Age (years)
> - Body weight (kg or lb)
> - Your FTP in watts
> - Target W/kg, if you have one (optional — default is 3.5 if you skip)

The athlete has to answer four unrelated questions in one reply instead
of a natural back-and-forth.

## Expected behavior

Each `[value]` question (age, then weight, then FTP watts, then target
W/kg, then session duration in Section 5) should be asked as its own
turn: ask one question, wait for the answer, then ask the next. This
matches the one-question-per-turn pacing `[choice]` questions already
get from the interactive picker, and keeps every onboarding question —
choice, value, or narrative — consistent in UX: one thing at a time.

## Suggested fix location

- `references/onboarding.md`: add an explicit pacing rule alongside the
  existing `[choice]`/`[value]`/`[narrative]` tag legend — something
  like: "Ask one question per turn regardless of tag; never bundle
  multiple questions (of any tag) into a single message." This closes
  the gap the current legend leaves open, where `[value]` only says the
  *answer* format is free text, not the *asking* cadence.
- No changes expected to `references/athlete-config.md` schema — this is
  purely an onboarding UX/pacing fix, same category as the goal-branch
  fix in `onboarding-goal-branch-free-text.md`.

## How this was found

Live walkthrough of onboarding (no `athlete.json` present, genuine
first-run path), following `SKILL.md` → `references/onboarding.md`
exactly as written. Reached Section 3 (physical profile) and was asked
age, body weight, FTP, and target W/kg as one bundled free-text message
rather than one question per turn.
