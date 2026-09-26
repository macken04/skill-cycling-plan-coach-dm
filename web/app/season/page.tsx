"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  SEASON_PHASE_LABELS,
  TRIAL_EVENT_COMPLETION_STATUS_LABELS,
  TRIAL_EVENT_FUELING_SIGNAL_LABELS,
  type SeasonPlan,
  type TrialEvent,
  type TrialEventSpec,
} from "@/lib/types";

type LoadState = "loading" | "no-session" | "no-season-plan" | "ready" | "error";

function daysUntil(dateStr: string): number {
  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function weeksBetween(startStr: string, endStr: string): string {
  const days = Math.round(
    (new Date(endStr).getTime() - new Date(startStr).getTime()) / 86_400_000
  );
  const weeks = Math.floor(days / 7);
  const extraDays = days % 7;
  return extraDays === 0 ? `${weeks} wk` : `${weeks} wk + ${extraDays}d`;
}

// Mirrors references/trial-events.md's spec -> one-line summary, per the
// example rows in references/season-plan-format.md.
function specSummary(spec: TrialEventSpec): string {
  const parts: string[] = [];

  if (spec.distance_km != null) {
    parts.push(
      Array.isArray(spec.distance_km)
        ? `${spec.distance_km[0]}-${spec.distance_km[1]} km`
        : `${spec.distance_km} km`
    );
  }
  if (spec.elevation_m != null) {
    parts.push(
      Array.isArray(spec.elevation_m)
        ? `~${spec.elevation_m[0]}-${spec.elevation_m[1]} m`
        : `~${spec.elevation_m} m`
    );
  }
  if (spec.loaded_bike) parts.push("loaded-bike");
  if (spec.overnight) parts.push("overnight");
  if (spec.opportunistic_resupply) parts.push("opportunistic resupply");
  parts.push(
    spec.terrain_fidelity === "high"
      ? "high-fidelity terrain"
      : "representative terrain"
  );

  return parts.join(", ");
}

export default function SeasonPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [seasonPlan, setSeasonPlan] = useState<SeasonPlan | null>(null);

  const loadSeasonPlan = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("season_plans")
      .select("*")
      .eq("athlete_id", athleteId)
      .limit(1);

    if (error) {
      setErrorMessage(error.message);
      setLoadState("error");
      return;
    }

    const plan = data?.[0] ?? null;
    if (!plan) {
      setLoadState("no-season-plan");
      return;
    }
    setSeasonPlan(plan);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      loadSeasonPlan(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (newSession) {
          loadSeasonPlan(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadSeasonPlan]);

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

  if (loadState === "no-season-plan") {
    return (
      <Centered>
        <p>
          No season plan yet. This appears once your coach sets a target
          event with an event date.
        </p>
        <p>
          <Link href="/plan">Back to this week&apos;s plan</Link>
        </p>
      </Centered>
    );
  }

  const plan = seasonPlan!;
  const days = daysUntil(plan.event_date);
  const currentPhaseLabel = SEASON_PHASE_LABELS[plan.current_phase_id];
  const currentPhase = plan.phases.find((p) => p.id === plan.current_phase_id);
  const sortedTrialEvents = [...plan.trial_events].sort((a, b) =>
    a.target_date.localeCompare(b.target_date)
  );
  const loggedTrialEvents = sortedTrialEvents.filter(
    (e) => e.status === "logged" && e.outcome
  );

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
        <h1 style={{ fontSize: "1.5rem" }}>Season plan</h1>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
          <Link href="/plan">This week&apos;s plan</Link>
          <button onClick={signOut}>Sign out</button>
        </nav>
      </header>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
          {plan.target_event} ({plan.event_date})
        </div>
        <div style={{ fontSize: "0.9rem", color: "#555", marginTop: "0.25rem" }}>
          {days >= 0 ? days : 0} days to event · Current phase:{" "}
          <strong>{currentPhaseLabel}</strong>
        </div>
        <div style={{ fontSize: "0.85rem", color: "#777", marginTop: "0.25rem" }}>
          Season: {plan.start_date} → {plan.event_date} (
          {weeksBetween(plan.start_date, plan.event_date)}) · Deload length:{" "}
          {plan.deload_weeks} week{plan.deload_weeks === 1 ? "" : "s"} per block
          {plan.last_replanned_at
            ? ` · Last replanned ${new Date(plan.last_replanned_at).toLocaleDateString()}`
            : ""}
        </div>
      </div>

      <Section title="Phases">
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Phase</th>
              <th style={thStyle}>Dates</th>
              <th style={thStyle}>Length</th>
              <th style={thStyle}>Focus</th>
            </tr>
          </thead>
          <tbody>
            {plan.phases.map((phase) => {
              const isCurrent = phase.id === plan.current_phase_id;
              return (
                <tr
                  key={phase.id}
                  style={isCurrent ? { background: "#eef2ff" } : undefined}
                >
                  <td style={tdStyle}>
                    {isCurrent ? <strong>{phase.label}</strong> : phase.label}
                  </td>
                  <td style={tdStyle}>
                    {phase.start_date} – {phase.end_date}
                  </td>
                  <td style={tdStyle}>{weeksBetween(phase.start_date, phase.end_date)}</td>
                  <td style={tdStyle}>
                    {phase.focus}
                    {isCurrent ? " (current)" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>

      <Section title="Trial-event ladder">
        {sortedTrialEvents.length === 0 ? (
          <p style={{ color: "#777" }}>No trial events on the ladder.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Rung</th>
                <th style={thStyle}>Category</th>
                <th style={thStyle}>Target date</th>
                <th style={thStyle}>Phase</th>
                <th style={thStyle}>Spec</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrialEvents.map((event: TrialEvent) => (
                <tr key={event.id}>
                  <td style={tdStyle}>{event.id.toUpperCase()}</td>
                  <td style={tdStyle}>{event.category}</td>
                  <td style={tdStyle}>{event.target_date}</td>
                  <td style={tdStyle}>{SEASON_PHASE_LABELS[event.phase_id]}</td>
                  <td style={tdStyle}>{specSummary(event.spec)}</td>
                  <td style={tdStyle}>
                    {event.status === "logged" ? "Logged" : "Planned"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {loggedTrialEvents.length > 0 && (
          <div style={{ marginTop: "0.75rem", display: "grid", gap: "0.35rem" }}>
            {loggedTrialEvents.map((event) => (
              <p key={event.id} style={{ fontSize: "0.85rem", color: "#555", margin: 0 }}>
                <strong>{event.id.toUpperCase()}</strong>{" "}
                {TRIAL_EVENT_COMPLETION_STATUS_LABELS[event.outcome!.completion_status]}
                {" — "}
                {TRIAL_EVENT_FUELING_SIGNAL_LABELS[event.outcome!.fueling_signal]}
                {event.outcome!.notes ? `. ${event.outcome!.notes}` : "."}
              </p>
            ))}
          </div>
        )}
      </Section>

      {currentPhase && (
        <Section title={`Current phase: ${currentPhase.label}`}>
          <p style={{ margin: 0 }}>
            {currentPhase.start_date} – {currentPhase.end_date}
          </p>
          <p style={{ margin: 0 }}>{currentPhase.focus}</p>
          <p style={{ margin: 0 }}>
            <Link href="/plan">This week&apos;s plan →</Link>
          </p>
        </Section>
      )}
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "2rem" }}>
      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>{title}</h2>
      <div style={{ display: "grid", gap: "0.5rem" }}>{children}</div>
    </section>
  );
}

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.85rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.4rem",
  borderBottom: "1px solid #ddd",
  color: "#777",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "0.4rem",
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
