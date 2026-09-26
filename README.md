# cycling-plan-coach

A reusable Claude skill that acts as a standalone cycling coach. It reads a per-athlete config, pulls recent training/readiness data from Strava and/or Garmin, classifies the athlete's rider type from their own power curve, and outputs a weekly coaching package: a markdown week plan plus importable `.zwo` bike workouts for structured days — personalized against a deep athlete profile (training background, physical limiters, strength history, nutrition preferences) gathered at onboarding, and, when the athlete is training toward a specific supported event, an event-aware plan that leans the week toward that event's own limiters.

It works for any cyclist. Nothing about the athlete is hardcoded in the skill; it all lives in `athlete.json`.

## What it needs

- A connected Strava account (FTP, recent rides, power curve) and/or a pasted Garmin Coach JSON export (`references/garmin-data.md`) for zones, readiness (HRV, sleep, training status/ACWR), and load. Either, both, or neither work — without any data source the skill falls back to the FTP and self-reported baseline in the config.
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

If the athlete names a supported event at onboarding (currently Badlands Ultra — a self-supported ultra-distance gravel race; see `references/events/README.md` for the registry), the plan leans toward that event's own limiters (durability, fueling, terrain/handling, heat, etc.) instead of a generic rider-type template, and gains an event countdown and fueling guidance in the weekly output (`references/events/badlands-ultra.md`, `references/nutrition.md`). An unsupported/unlisted event is still captured and falls back to generic ultra-endurance heuristics. Longer-term, multi-month season planning (a Base/Build/Refine macrocycle with deloads and a coach-designed B/C trial-event ladder toward the event — see `documents/season-macrocycle-prd.md`) is defined in `references/macrocycle-model.md`, `references/trial-events.md`, and `references/season-plan-format.md`, but not yet wired into the weekly flow — see `documents/multi-event-and-webui-tasks.md` for current status.

## How it decides

The coaching is data-driven, not a fixed template. Each week the skill:

1. loads your config,
2. pulls your recent Strava and/or Garmin data and reviews last week, including readiness if Garmin is connected,
3. classifies your rider type from your power curve (sprinter/puncheur, all-rounder, diesel) and combines that with your goal — and, if set, your target event's own limiters — to set session priorities, weighing any physical limiter you've described as a hypothesis alongside the data,
4. asks what the week allows,
5. builds a polarized week toward your goal, personalizing strength/core and fueling guidance against your background and preferences,
6. outputs the files in your language and units.

See `references/` for the config schema, onboarding, rider-type logic, plan format, Strava/Garmin mapping, training model, strength library, workout library, nutrition, event files, and ZWO format.

## Output

- `YYYY-Wnn-plan.md` - the full weekly plan in readable markdown, including event countdown/fueling sections when applicable.
- `*.zwo` - one per structured bike session.
- `YYYY-Wnn-strength.md` (optional) - full gym session details when strength work is scheduled.

## Note

This skill makes general endurance-training assumptions from public training principles. It is not medical advice or a substitute for a coach or physician. Build intensity around how you feel, and check with a professional for health concerns.

## License

MIT. See [LICENSE](LICENSE).

<br />
<br />

[![Visitors](https://api.visitorbadge.io/api/visitors?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fskill-cycling-plan-coach&countColor=%23263759)](https://visitorbadge.io/status?path=https%3A%2F%2Fgithub.com%2Festruyf%2Fskill-cycling-plan-coach)