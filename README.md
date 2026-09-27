# cycling-plan-coach

A reusable Claude skill that acts as a standalone cycling coach. It reads a per-athlete config, pulls recent training/readiness data from Strava and/or Garmin (and, optionally, a connected WHOOP account for daily recovery/sleep/strain and per-workout strain/HR), classifies the athlete's rider type from their own power curve, and outputs a weekly coaching package: a markdown week plan plus importable `.zwo` bike workouts for structured days — personalized against a deep athlete profile (training background, physical limiters, strength history, nutrition preferences) gathered at onboarding, and, when the athlete is training toward a specific supported event, an event-aware plan that leans the week toward that event's own limiters. When an event date is set, it also builds and maintains a multi-month season macrocycle (Base/Build/Refine with deloads and a coach-designed B/C trial-event ladder) and reads back logged session and trial-event outcomes to adjust progression, fueling ramp, and the remaining season — all athlete-triggered, never on a timer.

It works for any cyclist. Nothing about the athlete is hardcoded in the skill; it all lives in `athlete.json`.

## What it needs

- A connected Strava account (FTP, recent rides, power curve) and/or a pasted Garmin Coach JSON export (`references/garmin-data.md`) for zones, readiness (HRV, sleep, training status/ACWR), and load. Either, both, or neither work — without any data source the skill falls back to the FTP and self-reported baseline in the config.
- Optionally, a connected WHOOP account (`/connections` in the web dashboard, no manual export) for daily recovery/sleep/strain feeding the same readiness logic Garmin drives, plus per-workout strain/HR matched back to logged sessions (`references/whoop-data.md`, `documents/whoop-integration-plan.md`).
- No second workout skill is required. ZWO creation is built in via `references/workout-library.md` and `references/zwo-format.md`.

## Install

Download the `cycling-plan-coach.skill` file and drop it into your Claude skills directory.

## Usage

Once installed, invoke the skill from Claude with:

```
/cycling-plan-coach
```

Or ask naturally — phrases like "plan my week", "build my training week", or "make me a training plan for the upcoming week" trigger it automatically.

## First run

On first use, the skill runs a conversational onboarding (`references/onboarding.md`) and writes `athlete.json` before doing anything else. It covers the goal (a specific event, if one is supported, or a general plan), cycling background, physical profile, a narrative question on physical limiters, strength/training history, resting HR and any lab testing, logistics, and nutrition preferences — a real baseline, not just name/FTP/goal. Once the config exists, it continues with the data pull and weekly planning. After that, ask it to "plan my week" and it reads the config each time; nothing is fixed forever — tell it when something's changed (an injury clearing up, a new PB, a shifted goal) and it updates the config on the spot.

## Event-specific coaching

If the athlete names a supported event at onboarding (currently Badlands Ultra — a self-supported ultra-distance gravel race; see `references/events/README.md` for the registry), the plan leans toward that event's own limiters (durability, fueling, terrain/handling, heat, etc.) instead of a generic rider-type template, and gains an event countdown and fueling guidance in the weekly output (`references/events/badlands-ultra.md`, `references/nutrition.md`). An unsupported/unlisted event is still captured and falls back to generic ultra-endurance heuristics.

When the event also has an `eventDate`, the skill generates and maintains a multi-month season macrocycle: a Base/Deload/Build/Deload/Refine phase skeleton spanning to the event, a coach-designed B/C trial-event ladder rehearsing the event's specific limiters at increasing fidelity, and a fueling/strength periodization ramped to match (`references/macrocycle-model.md`, `references/trial-events.md`, `references/season-plan-format.md`, per `documents/season-macrocycle-prd.md`). Only the current phase is planned week-by-week; other phases show as a dated one-line summary until the athlete reaches them. Logging a session or trial-event outcome — too hard, easier than planned, GI distress, a comfortably-finished dry run, and so on — feeds a defined rule table (`references/workout-library.md`, `references/strength-library.md`, `references/trial-events.md`, `references/nutrition.md`) that adjusts progression, the fueling ramp, or the remaining ladder, stated explicitly in the next plan; a material divergence (illness, missed weeks, a bad trial event, a shifted event date) triggers a replan of the remaining skeleton without rewriting completed weeks. All of this is athlete-triggered only — nothing runs on a timer (`documents/agentic-coach-prd.md`). See `documents/multi-event-and-webui-tasks.md` for current status (Milestone A and Milestone B both complete: `web/` for the frontend — plan/nutrition/strength logging, compliance/trend views, and a season-plan view backed by Supabase — and `docs/infra.md` for infra and the one remaining manual step, an athlete signing in once to link their account).

## How it decides

The coaching is data-driven, not a fixed template. Each week the skill:

1. loads your config,
2. pulls your recent Strava and/or Garmin data and reviews last week, including readiness if Garmin and/or WHOOP is connected,
3. classifies your rider type from your power curve (sprinter/puncheur, all-rounder, diesel) and combines that with your goal — and, if set, your target event's own limiters — to set session priorities, weighing any physical limiter you've described as a hypothesis alongside the data,
4. asks what the week allows,
5. builds a polarized week toward your goal, personalizing strength/core and fueling guidance against your background and preferences,
6. outputs the files in your language and units.

See `references/` for the config schema, onboarding, rider-type logic, plan format, Strava/Garmin/WHOOP mapping, training model, strength library, workout library, nutrition, event files, and ZWO format.

## Output

- `YYYY-Wnn-plan.md` - the full weekly plan in readable markdown, including event countdown/fueling sections when applicable.
- `*.zwo` - one per structured bike session.
- `YYYY-Wnn-strength.md` (optional) - full gym session details when strength work is scheduled.
- `season-plan.json` / `season-plan.md` (optional) - the season macrocycle skeleton and its rendered summary, generated once an event with an `eventDate` is set; regenerated only when the athlete reports a material change.

## Note

This skill makes general endurance-training assumptions from public training principles. It is not medical advice or a substitute for a coach or physician. Build intensity around how you feel, and check with a professional for health concerns.

## License

MIT. See [LICENSE](LICENSE).

<br />
<br />

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fskill-cycling-plan-coach&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fskill-cycling-plan-coach)