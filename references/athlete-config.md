# athlete.json - the per-athlete config

This file is the single source of truth for who a plan is for. Each user owns their own copy. The skill reads it; it is never edited inside SKILL.md.

| Field | Type | Meaning |
|---|---|---|
| `name` | string | The athlete's name, used in greetings. |
| `language` | string | Output language for everything the athlete reads (e.g. `en`, `nl`, `fr`, `de`, `es`, `it`). Machine keys stay English. |
| `units` | string | `metric` (km, km/h) or `imperial` (mi, mph). Power is always watts; strength uses W/kg regardless. |
| `styleNotes` | string | Writing rules to honor, e.g. tone, banned phrasings. |
| `goal` | string | The athlete's main goal, in their own words. Keep it concrete. The skill plans toward this every week. Auto-suggested from `targetEvent` when one is set, but always overridable. |
| `targetEvent` | string or null | Event id from `references/events/README.md` if the athlete's answer matched the registry; free-text event name if it didn't match; `null` for a general training plan with no specific event. |
| `eventDate` | string or null | ISO date (`YYYY-MM-DD`) of `targetEvent`; `null` when `targetEvent` is `null`. |
| `daysToEvent` | integer or null | Derived at each planning run as `eventDate` minus today; not stored, recomputed live. `null` when `eventDate` is `null`. |
| `physicalNotes` | string | The athlete's own words, from onboarding, describing physical challenges or limiters they feel on the bike (e.g. pain, fatigue, power that won't transfer on climbs). Empty string if the athlete had nothing to add. Read qualitatively alongside the data-derived rider type (`rider-types.md`) when setting session/strength emphasis — a hypothesis to weigh, never a silent override of the power-curve-derived limiter. Not write-once: update it whenever the athlete says it's changed. |
| `physicalNotesFrequency` | string or null | How often the `physicalNotes` issue shows up: `everyRide`, `hardEffortsOrClimbs`, or `occasionally`. `null` if `physicalNotes` was empty (question 10a was skipped). |
| `physicalNotesAssessed` | string or null | Whether the `physicalNotes` issue has been looked at by a physio, doctor, or bike fitter: `yes`, `no`, or `planned`. `null` if `physicalNotes` was empty. |
| `strengthExperience` | string | Lifting background from onboarding: `new` (never really lifted), `returning` (some experience, out of practice), or `experienced` (trains regularly already). Gates how conservatively `strength-library.md` prescribes load for a first strength block. |
| `strengthInjuryNotes` | string | Free text from onboarding on injuries, surgeries, or joint issues relevant to lifting (e.g. a knee that doesn't like deep flexion). Empty string if none. Distinct from `physicalNotes`: this is about what to avoid/adapt when selecting strength exercises, not what limits the athlete on the bike. |
| `dietaryRestrictions` | string[] | Dietary restrictions or allergies to plan fueling around (e.g. `["vegetarian"]`, `["glutenFree", "dairyFree"]`). Empty array if none. |
| `fuelingNotes` | string | Free text from onboarding on fueling products/foods the athlete tolerates well or poorly on the bike (GI distress triggers, brand/food preferences). Empty string if nothing given. Not write-once: update it whenever the athlete reports a new fueling signal. |
| `fuelingPreference` | string | On-bike fueling lean: `gels`, `realFood`, `mixed`, or `noPreference`. |
| `age` | integer | Athlete's age in years. Used to tune recovery expectations (masters athletes 40+ need more recovery between hard sessions) and contextualise W/kg benchmarks. Not available from Strava — always ask at onboarding. |
| `gender` | string | `male`, `female`, or `other`. Pulled from Strava `get_athlete_profile` when available; ask at onboarding if Strava is unreachable. Used to contextualise W/kg benchmarks and training load norms. |
| `weightKg` | number | Body weight in kg (used for W/kg). Imperial users still store kg; convert at onboarding. |
| `fallbackFtp` | integer | FTP in watts to use when Strava is unreachable. Live FTP from Strava overrides it. |
| `targetWkg` | number | Target W/kg for context and progress. |
| `groupRideDays` | string[] | Days that are social group rides by default, e.g. `["Sat","Sun"]`. No structure is forced on these. |
| `typicalAvailableDays` | string[] | Days the athlete usually can train. The weekly intake can narrow this. |
| `typicalWorkoutDurationMin` | number | Default workout duration in minutes (e.g. `60`). The weekly intake can override this per day. |
| `maxStructuredSessions` | integer | Cap on structured key sessions per week (usually 2). |
| `strengthDefault` | string | `strength+core`, `core`, or `none`. |
| `riderTypeOverride` | string or null | Force a rider type (`sprinter`, `allrounder`, `diesel`) instead of deriving it. Null means derive from the power curve. |
| `workoutFormat` | string | Workout file format: always `"zwo"` (Zwift XML). Stored after the athlete confirms during intake. |

## How age and gender influence the plan

- **Age < 40:** standard recovery windows apply (hard day, one easy day, repeat).
- **Age 40–49 (masters):** add an extra easy day between hard sessions when possible; cap weekly TSS slightly lower.
- **Age 50+ (senior masters):** two easy or rest days between hard sessions is the default; volume comes second to quality.
- **Gender:** use gender-appropriate W/kg benchmarks when contextualising progress (e.g. 3.5 W/kg is a different relative level for male vs female athletes). Never adjust raw watt targets — those are FTP-derived and already personalised.

Days use the three-letter English keys `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun` so the app can read them in any language.
