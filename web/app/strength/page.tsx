"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  SESSION_STATUSES,
  SESSION_STATUS_LABELS,
  type ExerciseEntry,
  type SessionStatus,
  type StrengthLog,
} from "@/lib/types";

type LoadState = "loading" | "no-session" | "ready" | "error";

const EMPTY_EXERCISE: ExerciseEntry = {
  exercise: "",
  sets: null,
  reps: null,
  load_kg: null,
};

export default function StrengthPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<StrengthLog[]>([]);
  const [saving, setSaving] = useState(false);

  const [sessionName, setSessionName] = useState("");
  const [status, setStatus] = useState<SessionStatus>("completed_as_planned");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { ...EMPTY_EXERCISE },
  ]);
  const [notes, setNotes] = useState("");

  const loadLogs = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("strength_logs")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setErrorMessage(error.message);
      setLoadState("error");
      return;
    }

    setLogs(data ?? []);
    setLoadState("ready");
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setLoadState("no-session");
        return;
      }
      setSession(data.session);
      loadLogs(data.session.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession) {
          loadLogs(newSession.user.id);
        } else {
          setLoadState("no-session");
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadLogs]);

  function resetForm() {
    setSessionName("");
    setStatus("completed_as_planned");
    setExercises([{ ...EMPTY_EXERCISE }]);
    setNotes("");
  }

  function updateExercise(
    index: number,
    field: keyof ExerciseEntry,
    value: string
  ) {
    setExercises((prev) =>
      prev.map((entry, i) => {
        if (i !== index) return entry;
        if (field === "exercise") {
          return { ...entry, exercise: value };
        }
        return { ...entry, [field]: value === "" ? null : Number(value) };
      })
    );
  }

  function addExerciseRow() {
    setExercises((prev) => [...prev, { ...EMPTY_EXERCISE }]);
  }

  function removeExerciseRow(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setErrorMessage("");

    const cleanedExercises = exercises.filter((entry) => entry.exercise.trim() !== "");

    const { data, error } = await supabase
      .from("strength_logs")
      .insert({
        athlete_id: session.user.id,
        session_name: sessionName,
        status,
        sets_reps_load: { exercises: cleanedExercises },
        notes,
      })
      .select()
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setLogs((prev) => [data, ...prev]);
    }
    resetForm();
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
        <h1 style={{ fontSize: "1.5rem" }}>Strength log</h1>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
          <Link href="/plan">This week&apos;s plan</Link>
          <Link href="/nutrition">Nutrition log</Link>
          <Link href="/compliance">Compliance</Link>
          <button onClick={signOut}>Sign out</button>
        </nav>
      </header>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "0.75rem",
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ display: "grid", gap: "0.25rem", flex: 1 }}>
            Session name
            <input
              type="text"
              placeholder="e.g. Max-strength lower body"
              value={sessionName}
              onChange={(event) => setSessionName(event.target.value)}
              required
              style={{ padding: "0.4rem" }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as SessionStatus)
              }
              style={{ padding: "0.4rem" }}
            >
              {SESSION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {SESSION_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          <span>Exercises</span>
          {exercises.map((entry, index) => (
            <div
              key={index}
              style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
            >
              <input
                type="text"
                placeholder="Exercise"
                value={entry.exercise}
                onChange={(event) =>
                  updateExercise(index, "exercise", event.target.value)
                }
                style={{ padding: "0.4rem", flex: 2, minWidth: "10rem" }}
              />
              <input
                type="number"
                min="0"
                placeholder="Sets"
                value={entry.sets ?? ""}
                onChange={(event) =>
                  updateExercise(index, "sets", event.target.value)
                }
                style={{ padding: "0.4rem", width: "5rem" }}
              />
              <input
                type="number"
                min="0"
                placeholder="Reps"
                value={entry.reps ?? ""}
                onChange={(event) =>
                  updateExercise(index, "reps", event.target.value)
                }
                style={{ padding: "0.4rem", width: "5rem" }}
              />
              <input
                type="number"
                min="0"
                step="0.5"
                placeholder="Load (kg)"
                value={entry.load_kg ?? ""}
                onChange={(event) =>
                  updateExercise(index, "load_kg", event.target.value)
                }
                style={{ padding: "0.4rem", width: "7rem" }}
              />
              <button
                type="button"
                onClick={() => removeExerciseRow(index)}
                disabled={exercises.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addExerciseRow} style={{ justifySelf: "start" }}>
            Add exercise
          </button>
        </div>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={2}
            style={{ padding: "0.4rem", fontFamily: "inherit" }}
          />
        </label>

        <button type="submit" disabled={saving} style={{ padding: "0.5rem" }}>
          {saving ? "Saving..." : "Log session"}
        </button>
        {errorMessage && <p style={{ color: "#b00020" }}>{errorMessage}</p>}
      </form>

      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>History</h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {logs.map((log) => (
          <StrengthLogCard key={log.id} log={log} />
        ))}
        {logs.length === 0 && <p>No strength sessions logged yet.</p>}
      </div>
    </main>
  );
}

function StrengthLogCard({ log }: { log: StrengthLog }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "0.75rem 1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{log.session_name}</strong>
        <span
          style={{
            color: log.status === "failed_too_hard" ? "#b00020" : "#2a7d2a",
            fontSize: "0.875rem",
          }}
        >
          {SESSION_STATUS_LABELS[log.status]}
        </span>
      </div>
      {log.sets_reps_load.exercises.length > 0 && (
        <ul style={{ margin: "0.4rem 0", paddingLeft: "1.2rem", fontSize: "0.9rem" }}>
          {log.sets_reps_load.exercises.map((entry, index) => (
            <li key={index}>
              {entry.exercise}
              {entry.sets !== null ? ` - ${entry.sets}x` : ""}
              {entry.reps !== null ? `${entry.reps}` : ""}
              {entry.load_kg !== null ? ` @ ${entry.load_kg} kg` : ""}
            </li>
          ))}
        </ul>
      )}
      {log.notes && (
        <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>{log.notes}</p>
      )}
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
