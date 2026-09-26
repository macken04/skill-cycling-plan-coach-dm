"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  DAY_ORDER,
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  type Plan,
  type SessionStatus,
  type Workout,
  type WorkoutLog,
} from "@/lib/types";

type LoadState = "loading" | "no-session" | "no-plan" | "ready" | "error";

export default function PlanPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [latestLogByWorkout, setLatestLogByWorkout] = useState<
    Record<string, WorkoutLog>
  >({});
  const [savingWorkoutId, setSavingWorkoutId] = useState<string | null>(null);

  const loadPlan = useCallback(async (athleteId: string) => {
    const today = new Date().toISOString().slice(0, 10);

    const { data: plans, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("athlete_id", athleteId)
      .lte("week_start_date", today)
      .order("week_start_date", { ascending: false })
      .limit(1);

    if (planError) {
      setErrorMessage(planError.message);
      setLoadState("error");
      return;
    }

    const currentPlan = plans?.[0] ?? null;
    if (!currentPlan) {
      setLoadState("no-plan");
      return;
    }
    setPlan(currentPlan);

    const { data: workoutRows, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("plan_id", currentPlan.id);

    if (workoutError) {
      setErrorMessage(workoutError.message);
      setLoadState("error");
      return;
    }

    const sorted = [...(workoutRows ?? [])].sort(
      (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    );
    setWorkouts(sorted);

    if (sorted.length > 0) {
      const { data: logRows, error: logError } = await supabase
        .from("workout_logs")
        .select("*")
        .in("workout_id", sorted.map((w) => w.id))
        .order("created_at", { ascending: false });

      if (!logError && logRows) {
        const latest: Record<string, WorkoutLog> = {};
        for (const log of logRows) {
          if (!latest[log.workout_id]) latest[log.workout_id] = log;
        }
        setLatestLogByWorkout(latest);
      }
    }

    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadPlan(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadPlan(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadPlan]);

  async function logWorkout(workoutId: string, status: SessionStatus) {
    if (!session) return;
    setSavingWorkoutId(workoutId);

    const { data, error } = await supabase
      .from("workout_logs")
      .insert({
        workout_id: workoutId,
        athlete_id: session.user.id,
        status,
        source: "web-ui",
      })
      .select()
      .single();

    setSavingWorkoutId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (data) {
      setLatestLogByWorkout((prev) => ({ ...prev, [workoutId]: data }));
    }
  }

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

  if (loadState === "no-plan") {
    return (
      <Centered>
        <p>
          No plan has been generated yet for this week. Run a planning
          session with your coach first.
        </p>
        <button onClick={signOut}>Sign out</button>
      </Centered>
    );
  }

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
        <h1 style={{ fontSize: "1.5rem" }}>This week&apos;s plan</h1>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
          <Link href="/nutrition">Nutrition log</Link>
          <button onClick={signOut}>Sign out</button>
        </nav>
      </header>

      {plan && (
        <p style={{ marginBottom: "1.5rem", color: "#555" }}>
          Week of {plan.week_start_date}
          {plan.phase ? ` - ${plan.phase} phase` : ""}
          {plan.deload ? " (deload)" : ""}
          {plan.focus ? ` - ${plan.focus}` : ""}
        </p>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            latestLog={latestLogByWorkout[workout.id]}
            saving={savingWorkoutId === workout.id}
            onLog={(status) => logWorkout(workout.id, status)}
          />
        ))}
        {workouts.length === 0 && <p>No workouts scheduled this week.</p>}
      </div>
    </main>
  );
}

function WorkoutCard({
  workout,
  latestLog,
  saving,
  onLog,
}: {
  workout: Workout;
  latestLog: WorkoutLog | undefined;
  saving: boolean;
  onLog: (status: SessionStatus) => void;
}) {
  const [selected, setSelected] = useState<SessionStatus>(
    latestLog?.status ?? "completed_as_planned"
  );

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>
          {workout.day} - {workout.archetype}
        </strong>
        {latestLog && (
          <span style={{ color: "#2a7d2a", fontSize: "0.875rem" }}>
            Logged: {SESSION_STATUS_LABELS[latestLog.status]}
          </span>
        )}
      </div>

      <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
        <select
          value={selected}
          onChange={(event) =>
            setSelected(event.target.value as SessionStatus)
          }
          style={{ flex: 1, padding: "0.4rem" }}
        >
          {SESSION_STATUSES.map((status) => (
            <option key={status} value={status}>
              {SESSION_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button disabled={saving} onClick={() => onLog(selected)}>
          {saving ? "Saving..." : latestLog ? "Update" : "Log"}
        </button>
      </div>
    </div>
  );
}

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
