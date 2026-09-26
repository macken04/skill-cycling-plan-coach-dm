# Infra (Milestone B)

Provisioned per `documents/multi-event-and-webui-tasks.md` task **B1**. This
records what exists and what future sessions (or the deployed skill/web UI)
need as environment variables. No schema exists yet — that's B2.

## Supabase

- **Project:** `cycling-plan-coach` (org: `davidmacken@gmail.com's Org`)
- **Project ref:** `gurxzxcdxxxezwyatwlf`
- **Region:** `eu-west-1`
- **API URL:** `https://gurxzxcdxxxezwyatwlf.supabase.co`

Env vars a client or the skill's API calls need:

| Variable | Value | Safe to commit? |
|---|---|---|
| `SUPABASE_URL` | `https://gurxzxcdxxxezwyatwlf.supabase.co` | Yes |
| `SUPABASE_ANON_KEY` | `sb_publishable_56rCR16TJJwyA8KVpmO-iw_1xtkI3HU` (or the legacy JWT anon key, same project) | Yes — client-side/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | *(not committed — see below)* | **No, never** |

The service-role key bypasses RLS and is required for the skill's own
server-side writes (posting generated plans/workouts, per B3). It is
intentionally **not** retrievable through the Supabase MCP connector for
security reasons. To make it available to a Claude Code session:

1. In the Supabase dashboard: Project Settings → API → reveal the
   `service_role` secret key for the `cycling-plan-coach` project.
2. In this Claude Code environment's settings (the cloud environment menu →
   Edit), add it as an environment variable named `SUPABASE_SERVICE_ROLE_KEY`.
3. Start a new session — environment variables are read at session start.

**Verified (this session):** the REST endpoint is reachable — a GET to
`{SUPABASE_URL}/rest/v1/` returns a 401 with `apikey` alone (expected: that
introspection route requires `service_role` specifically), confirming
network path and API key both resolve correctly. Full B1 test (a 200 using
the service-role key) is pending until the key above is added to the
environment.

## Vercel

- **Project:** `cycling-plan-coach`
- **Project ID:** `prj_r5kLLrVY9bfKsuZP16ain1cPIXJG`
- **Linked repo:** `macken04/skill-cycling-plan-coach-dm` (auto-deploys on
  push to the production branch once there's a frontend to deploy — none
  yet; that starts at B3)
- **Team/account:** personal account (`davidmacken-3000`, no team created)

No environment variables needed on Vercel yet — those get added once B3's
frontend exists and needs `SUPABASE_URL`/`SUPABASE_ANON_KEY` client-side.

## Next steps (B2)

Write the SQL migration (schema + RLS) per B2's spec, apply it via the
Supabase MCP connector's migration tools, and confirm RLS is actually
enforced (not just declared) before building anything on top of it.
