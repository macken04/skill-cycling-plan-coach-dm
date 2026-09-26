"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  STATUS_ROLE,
  STATUS_ROLE_COLOR,
  STATUS_ROLE_LABELS,
  STATUS_ROLE_ORDER,
  type SessionStatus,
  type StatusRole,
} from "@/lib/types";

type LoadState = "loading" | "no-session" | "ready" | "error";

type StatusCounts = Record<SessionStatus, number>;

function emptyCounts(): StatusCounts {
  return {
    completed_as_planned: 0,
    completed_easier_than_planned: 0,
    completed_harder_than_planned: 0,
    failed_too_hard: 0,
    skipped: 0,
  };
}

function addStatus(counts: StatusCounts, status: SessionStatus) {
  counts[status] += 1;
}

function total(counts: StatusCounts): number {
  return SESSION_STATUSES.reduce((sum, s) => sum + counts[s], 0);
}

function roleCounts(counts: StatusCounts): Record<StatusRole, number> {
  const roles: Record<StatusRole, number> = {
    good: 0,
    warning: 0,
    serious: 0,
    critical: 0,
  };
  for (const status of SESSION_STATUSES) {
    roles[STATUS_ROLE[status]] += counts[status];
  }
  return roles;
}

// Monday-start ISO 8601 week, matching the week id convention the skill
// already uses for plan filenames (e.g. "2026-W26").
function isoWeekKey(dateStr: string): string {
  const source = new Date(dateStr);
  const d = new Date(
    Date.UTC(source.getFullYear(), source.getMonth(), source.getDate())
  );
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  d.setUTCDate(d.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const weekNum =
    1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

interface LoggedEntry {
  status: SessionStatus;
  created_at: string;
}

export default function CompliancePage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [byArchetype, setByArchetype] = useState<Map<string, StatusCounts>>(
    new Map()
  );
  const [byExercise, setByExercise] = useState<Map<string, StatusCounts>>(
    new Map()
  );
  const [byWeek, setByWeek] = useState<Map<string, StatusCounts>>(new Map());

  const loadCompliance = useCallback(async (athleteId: string) => {
    const [{ data: workoutRows, error: workoutError }, { data: strengthRows, error: strengthError }] =
      await Promise.all([
        supabase
          .from("workout_logs")
          .select("status, created_at, workouts(archetype)")
          .eq("athlete_id", athleteId)
          .order("created_at", { ascending: false })
          .limit(300),
        supabase
          .from("strength_logs")
          .select("status, created_at, session_name")
          .eq("athlete_id", athleteId)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);

    if (workoutError || strengthError) {
      setErrorMessage((workoutError ?? strengthError)!.message);
      setLoadState("error");
      return;
    }

    const archetypeMap = new Map<string, StatusCounts>();
    const weekEntries: LoggedEntry[] = [];

    type WorkoutLogJoinRow = {
      status: SessionStatus;
      created_at: string;
      workouts: { archetype: string } | { archetype: string }[] | null;
    };

    for (const row of (workoutRows ?? []) as WorkoutLogJoinRow[]) {
      const joined = Array.isArray(row.workouts) ? row.workouts[0] : row.workouts;
      const archetype = joined?.archetype ?? "Unknown archetype";
      const counts = archetypeMap.get(archetype) ?? emptyCounts();
      addStatus(counts, row.status);
      archetypeMap.set(archetype, counts);
      weekEntries.push({ status: row.status, created_at: row.created_at });
    }

    const exerciseMap = new Map<string, StatusCounts>();
    for (const row of (strengthRows ?? []) as {
      status: SessionStatus;
      created_at: string;
      session_name: string;
    }[]) {
      const counts = exerciseMap.get(row.session_name) ?? emptyCounts();
      addStatus(counts, row.status);
      exerciseMap.set(row.session_name, counts);
      weekEntries.push({ status: row.status, created_at: row.created_at });
    }

    const weekMap = new Map<string, StatusCounts>();
    for (const entry of weekEntries) {
      const key = isoWeekKey(entry.created_at);
      const counts = weekMap.get(key) ?? emptyCounts();
      addStatus(counts, entry.status);
      weekMap.set(key, counts);
    }
    const sortedWeekMap = new Map(
      [...weekMap.entries()].sort(([a], [b]) => a.localeCompare(b))
    );

    setByArchetype(archetypeMap);
    setByExercise(exerciseMap);
    setByWeek(sortedWeekMap);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      loadCompliance(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) {
          loadCompliance(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadCompliance]);

  async function signOut() {
    await supabase.auth.signOut();
    setLoadState("no-session");
  }

  if (loadState === "loading") {
    return <Centered>Loading...</Centered>;
  }

  if (loadState === "no-session") {
    return (
      <Centered>
        <p>You&apos;re not signed in.</p>
        <p>
          <Link href="/login">Sign in</Link>
        </p>
      </Centered>
    );
  }

  if (loadState === "error") {
    return (
      <Centered>
        <p style={{ color: "#b00020" }}>Something went wrong: {errorMessage}</p>
      </Centered>
    );
  }

  const hasData = byArchetype.size > 0 || byExercise.size > 0;

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "0 1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "1.5rem",
        }}
      >
        <h1 style={{ fontSize: "1.5rem" }}>Compliance</h1>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
          <Link href="/plan">This week&apos;s plan</Link>
          <Link href="/nutrition">Nutrition log</Link>
          <Link href="/strength">Strength log</Link>
          <button onClick={signOut}>Sign out</button>
        </nav>
      </header>

      {!hasData && (
        <p>No logged sessions yet -- log a workout or strength session first.</p>
      )}

      {hasData && (
        <>
          <StatusLegend />

          <Section title="By bike archetype">
            {byArchetype.size === 0 ? (
              <p style={{ color: "#777" }}>No bike sessions logged yet.</p>
            ) : (
              [...byArchetype.entries()].map(([archetype, counts]) => (
                <NamedBar key={archetype} name={archetype} counts={counts} />
              ))
            )}
            <StatusTable rows={[...byArchetype.entries()]} firstColumnLabel="Archetype" />
          </Section>

          <Section title="By strength session">
            {byExercise.size === 0 ? (
              <p style={{ color: "#777" }}>No strength sessions logged yet.</p>
            ) : (
              [...byExercise.entries()].map(([name, counts]) => (
                <NamedBar key={name} name={name} counts={counts} />
              ))
            )}
            <StatusTable rows={[...byExercise.entries()]} firstColumnLabel="Session" />
          </Section>

          <Section title="Trend by week (bike + strength combined)">
            {byWeek.size === 0 ? (
              <p style={{ color: "#777" }}>Not enough logged data yet.</p>
            ) : (
              [...byWeek.entries()].map(([week, counts]) => (
                <NamedBar key={week} name={week} counts={counts} />
              ))
            )}
            <StatusTable rows={[...byWeek.entries()]} firstColumnLabel="Week" />
          </Section>
        </>
      )}
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{title}</h2>
      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
        {children}
      </div>
    </section>
  );
}

function StatusLegend() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "1rem",
        marginBottom: "1.5rem",
        fontSize: "0.85rem",
      }}
    >
      {STATUS_ROLE_ORDER.map((role) => (
        <div key={role} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: STATUS_ROLE_COLOR[role],
              display: "inline-block",
            }}
          />
          <span>{STATUS_ROLE_LABELS[role]}</span>
        </div>
      ))}
    </div>
  );
}

function NamedBar({ name, counts }: { name: string; counts: StatusCounts }) {
  const roles = roleCounts(counts);
  const totalCount = total(counts);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}
      >
        <span>{name}</span>
        <span style={{ color: "#777" }}>
          {totalCount} session{totalCount === 1 ? "" : "s"}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          height: 24,
          borderRadius: "0 4px 4px 0",
          overflow: "hidden",
          background: "#eee",
        }}
      >
        {STATUS_ROLE_ORDER.map((role, index) => {
          const count = roles[role];
          if (count === 0) return null;
          const pct = (count / totalCount) * 100;
          const isLast = STATUS_ROLE_ORDER.slice(index + 1).every(
            (r) => roles[r] === 0
          );
          return (
            <div
              key={role}
              title={`${STATUS_ROLE_LABELS[role]}: ${count} (${pct.toFixed(0)}%)`}
              style={{
                width: `${pct}%`,
                background: STATUS_ROLE_COLOR[role],
                marginRight: isLast ? 0 : 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: role === "warning" ? "#3a2c00" : "#fff",
                fontSize: "0.75rem",
              }}
            >
              {pct >= 15 ? count : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusTable({
  rows,
  firstColumnLabel,
}: {
  rows: [string, StatusCounts][];
  firstColumnLabel: string;
}) {
  if (rows.length === 0) return null;
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "0.8rem",
        marginTop: "0.5rem",
      }}
    >
      <thead>
        <tr>
          <th style={thStyle}>{firstColumnLabel}</th>
          {SESSION_STATUSES.map((status) => (
            <th key={status} style={thStyle}>
              {SESSION_STATUS_LABELS[status]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([name, counts]) => (
          <tr key={name}>
            <td style={tdStyle}>{name}</td>
            {SESSION_STATUSES.map((status) => (
              <td key={status} style={tdStyle}>
                {counts[status]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.35rem",
  borderBottom: "1px solid #ddd",
  color: "#777",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "0.35rem",
  borderBottom: "1px solid #eee",
};

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        maxWidth: 420,
        margin: "4rem auto",
        padding: "0 1rem",
        display: "grid",
        gap: "0.75rem",
      }}
    >
      {children}
    </main>
  );
}
