# Onboarding - first run

Run this when `athlete.json` is missing or incomplete. Keep it conversational and dynamic, not a form read aloud: ask in the order below, but branch where noted, skip what a prior answer already implies, and only circle back for something missing at the end. Ask in the athlete's language once it is known (start in English, switch as soon as they pick a language). After writing `athlete.json`, continue directly into weekly planning in the same turn.

Every question below is tagged with how to ask it:

- **[choice]** — a definitive/categorical answer. Present the options as an explicit list the athlete picks from (use the interactive picker when available; otherwise a lettered/numbered list). Never phrase these as "e.g." prose that leaves the athlete guessing the valid values.
- **[value]** — a concrete number or short fact (age, weight, FTP, a date). Free text is fine because there's nothing to categorize.
- **[narrative]** — an open invitation for a longer, personal answer. Tell the athlete a few sentences are welcome and useful. Do not offer a pick-list here; the value is in what the athlete chooses to describe.

Ask one question per turn regardless of tag: ask it, wait for the athlete's answer, then ask the next. Never bundle multiple questions — even several **[value]** ones back to back, like age/weight/FTP/target W/kg — into a single message the athlete has to parse and answer all at once. This applies uniformly across choice, value, and narrative questions.

## 1. Language and units

1. **[choice]** Language for your plans? Options: English, Nederlands, Francais, Deutsch, Espanol, Italiano, or name another.
2. **[choice]** Units? Options: metric (km, km/h), imperial (mi, mph).

## 2. Goal branch — what this plan is for

This is the question that shapes everything else, so ask it before the logistics questions below.

3. **[choice]** Are you training for a specific event, or do you want a general training plan? Build the option list dynamically from the `Display name` column of `references/events/README.md` (one option per registry row, growing automatically as events are added — never hardcode a specific event as one of only two permanent options), then append two fixed options last:
   - *(one option per row in the event registry, e.g. "Badlands (Ultra-Distance Gravel Race)")*
   - Other event (not in the list above) — name it (free text, then match against the registry's aliases as a fallback; if it now matches a row, treat it as 3a; otherwise go to 3b).
   - A general training plan, not tied to one event.

   **3a. Matched event** (picked directly from the list, or matched via the "Other event" fallback). Ask **[value]** "What's the event date?" and set `targetEvent` to the matched event id and `eventDate` accordingly. Confirm the goal in one line using the event's own framing (e.g. "training toward Badlands on 2027-08-31") — the athlete can still override with their own words in question 4.

   **3b. Unmatched event name** (from the "Other event" fallback, still not found in the registry). Still capture it as `targetEvent` (free text, no registry id) and ask for the date. Tell the athlete this event isn't in the supported list yet, so the plan will use generic ultra-endurance heuristics rather than an event-specific overlay.

   **3c. No event.** Set `targetEvent` to `null` and `eventDate` to `null`. Continue to question 4 for the goal in the athlete's own words.

4. **[value]** What is your main goal this season? Keep it concrete: a group pace, a climb, a time, a race result. If an event was matched in 3a, this can simply confirm or sharpen that framing (e.g. "finish inside the cutoff and stay upright on the descents") rather than restate the event name.

## 3. Physical profile

5. **[value]** How old are you? (age in years — used to set recovery expectations)
6. **[choice]** Gender? Options: male, female, other, prefer not to say. Used to contextualise W/kg benchmarks; a skip is fine.
7. **[value]** Body weight? (kg or lb; convert to kg)
8. **[choice]** Do you know your FTP? Options: yes (give a number in watts), no (estimate it later from Strava).
9. **[value]** Target W/kg, if you have one? (optional; default 3.5)

> **Gender note:** If Strava is reachable it will be pulled automatically from the athlete profile. Still ask at onboarding so the config is complete before the first Strava pull, and to allow the athlete to correct it.

## 4. What's holding you back — in your own words

10. **[narrative]** Is there anything that feels like it's holding you back physically on the bike? Describe it in your own words — pain, fatigue, or power you can't seem to put down, especially on climbs or hard efforts. A few sentences are more useful here than a quick label.

    For example, an athlete might say: *"When climbing up steep gradients, I feel like I am dragging on the bike. I feel pain in my lower back. I feel like I cannot apply the power that my legs have to the bike. This is something I feel like I need to work on."* That kind of detail is exactly what's useful — it points at something like a posture/core/posterior-chain limiter that a power curve alone can't surface.

    Store the answer verbatim as `physicalNotes` in `athlete.json` (empty string if the athlete has nothing to add — don't force an answer). Treat it as a **hypothesis to weigh, not a diagnosis**: when Step 2/3 of the main workflow sets session and strength/core emphasis, read `physicalNotes` alongside the data-derived rider type from `rider-types.md`, never in place of it. If the two disagree (e.g. the narrative suggests a strength limiter but the power curve looks fine), say so plainly rather than picking one silently.

    **10a. Structured follow-up** (only if question 10 described an actual issue — skip entirely if the athlete had nothing to add). The narrative alone doesn't say how often it matters or whether it's been looked at, so ask two quick closed questions before moving on. If the athlete's answer bundled more than one distinct thing (e.g. a power limiter and a pain location), ask these about whichever one they'd flag as most relevant to training — the full verbatim answer is already preserved in `physicalNotes`, this just adds two data points on top of it.

    - **[choice]** How often does this come up — every ride, mainly on hard efforts or climbs, or only occasionally? Options: every ride, mainly hard efforts/climbs, occasionally. Store as `physicalNotesFrequency`.
    - **[choice]** Has this been looked at by a physio, doctor, or bike fitter? Options: yes, no, not yet but planning to. Store as `physicalNotesAssessed`.

    Mention once, briefly, that this isn't fixed forever — the athlete can tell you at any point that it's changed, better, worse, or gone, and you'll update `physicalNotes` (and the two follow-up fields) then, rather than only ever asking at first setup.

## 5. Strength & training background

11. **[choice]** Have you strength-trained before — things like squats, deadlifts, or similar barbell/dumbbell lifts? Options:
    - New to it / never really lifted
    - Some experience, but out of practice
    - Yes, I train regularly already

    Store as `strengthExperience`: `new`, `returning`, or `experienced`. This gates how `strength-library.md` prescribes load: a first-time lifter starts conservative (lighter load, more form-focused reps) before working up to the standard prescriptions; an experienced lifter can start there directly.

12. **[value]** (skip if the athlete just picked "yes, I train regularly already" above) Any past injuries, surgeries, or joint issues that matter for lifting — knees, back, shoulders, or anything else? Optional, free text, leave blank if nothing comes to mind. Store as `strengthInjuryNotes` (empty string if skipped). This is separate from `physicalNotes` above: it's specifically about what to avoid or adapt when selecting strength exercises, not about what limits the athlete on the bike.

## 6. Training logistics

13. **[choice]** Which days are your group or social rides? Options: Mon/Tue/Wed/Thu/Fri/Sat/Sun (multi-select); default Saturday and Sunday if skipped.
14. **[choice]** Which days can you usually train? Options: Mon/Tue/Wed/Thu/Fri/Sat/Sun (multi-select); default all if skipped.
15. **[value]** Typical session duration? (minutes per workout, e.g. 60 or 90; the weekly intake can vary this per day)
16. **[choice]** How many structured key sessions per week? Options: 1, 2, 3. Default 2.
17. **[choice]** Strength by default? Options: strength + core, core only, none.
18. **[narrative]** Any writing preferences? (tone, things to avoid; optional — free text, no wrong answer)

## 7. Nutrition preferences

19. **[choice]** Any dietary restrictions or allergies I should plan fueling around? Options (multi-select): none, vegetarian, vegan, gluten-free, dairy-free, other (name it). Store as `dietaryRestrictions` (string array; empty array for "none").
20. **[narrative]** Anything you've noticed about fueling on the bike — foods or products that upset your stomach during hard or long rides, or ones you know you tolerate well? A few sentences is useful: brand names, food types, whatever you've noticed, even if it's never been formally diagnosed. Store as `fuelingNotes` verbatim (empty string if nothing to add).
21. **[choice]** For on-bike fueling, do you lean toward gels/drink mix, real food, or a mix of both? Options: mostly gels/drink mix, mostly real food, a mix of both, no preference yet. Store as `fuelingPreference`.

## Write the config

Map the answers onto the fields in `athlete-config.md` and write `athlete.json`, including `targetEvent`, `eventDate`, and `physicalNotes` (plus `physicalNotesFrequency` / `physicalNotesAssessed` when question 10a was asked) from the goal branch and narrative questions above, and `strengthExperience`, `strengthInjuryNotes`, `dietaryRestrictions`, `fuelingNotes`, and `fuelingPreference` from the new sections above. Set `riderTypeOverride` to null so the skill derives the rider type from data. Confirm in one line — goal, event if any, and that a physical note was captured if given — and continue to the weekly plan.

None of `physicalNotes`, the strength background, or the nutrition fields are fixed forever: if the athlete brings up a change later (an injury clearing up, a new sensitivity, more lifting experience), update the relevant field(s) in `athlete.json` on the spot rather than treating onboarding as the only time these are ever asked.

If FTP is unknown, set `fallbackFtp` to a conservative estimate (e.g. 2.5 W/kg times weight) and tell the athlete the first Strava pull or an FTP test will replace it.
