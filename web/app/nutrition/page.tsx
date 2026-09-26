"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  CARB_TARGET_STATUSES,
  CARB_TARGET_STATUS_LABELS,
  type CarbTargetStatus,
  type NutritionLog,
} from "@/lib/types";

type LoadState = "loading" | "no-session" | "ready" | "error";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function NutritionPage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [saving, setSaving] = useState(false);

  const [logDate, setLogDate] = useState(today());
  const [carbsG, setCarbsG] = useState("");
  const [calories, setCalories] = useState("");
  const [carbTargetStatus, setCarbTargetStatus] =
    useState<CarbTargetStatus>("hit");
  const [hydrationNote, setHydrationNote] = useState("");
  const [bodyWeightKg, setBodyWeightKg] = useState("");
  const [notes, setNotes] = useState("");

  const loadLogs = useCallback(async (athleteId: string) => {
    const { data, error } = await supabase
      .from("nutrition_logs")
      .select("*")
      .eq("athlete_id", athleteId)
      .order("log_date", { ascending: false })
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
    setLogDate(today());
    setCarbsG("");
    setCalories("");
    setCarbTargetStatus("hit");
    setHydrationNote("");
    setBodyWeightKg("");
    setNotes("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    setSaving(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("nutrition_logs")
      .upsert(
        {
          athlete_id: session.user.id,
          log_date: logDate,
          carbs_g: carbsG === "" ? null : Number(carbsG),
          calories: calories === "" ? null : Number(calories),
          carb_target_status: carbTargetStatus,
          hydration_note: hydrationNote,
          body_weight_kg: bodyWeightKg === "" ? null : Number(bodyWeightKg),
          notes,
        },
        { onConflict: "athlete_id,log_date" }
      )
      .select()
      .single();

    setSaving(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (data) {
      setLogs((prev) => {
        const withoutSameDay = prev.filter((log) => log.id !== data.id);
        return [data, ...withoutSameDay].sort((a, b) =>
          a.log_date < b.log_date ? 1 : -1
        );
      });
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
        <h1 style={{ fontSize: "1.5rem" }}>Nutrition log</h1>
        <nav style={{ display: "flex", gap: "1rem", alignItems: "baseline" }}>
          <Link href="/plan">This week&apos;s plan</Link>
          <Link href="/strength">Strength log</Link>
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
          <label style={{ display: "grid", gap: "0.25rem" }}>
            Date
            <input
              type="date"
              value={logDate}
              max={today()}
              onChange={(event) => setLogDate(event.target.value)}
              required
              style={{ padding: "0.4rem" }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            Carb target
            <select
              value={carbTargetStatus}
              onChange={(event) =>
                setCarbTargetStatus(event.target.value as CarbTargetStatus)
              }
              style={{ padding: "0.4rem" }}
            >
              {CARB_TARGET_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {CARB_TARGET_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            Carbs (g)
            <input
              type="number"
              min="0"
              value={carbsG}
              onChange={(event) => setCarbsG(event.target.value)}
              style={{ padding: "0.4rem", width: "8rem" }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            Calories
            <input
              type="number"
              min="0"
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
              style={{ padding: "0.4rem", width: "8rem" }}
            />
          </label>

          <label style={{ display: "grid", gap: "0.25rem" }}>
            Body weight (kg)
            <input
              type="number"
              min="0"
              step="0.1"
              value={bodyWeightKg}
              onChange={(event) => setBodyWeightKg(event.target.value)}
              style={{ padding: "0.4rem", width: "8rem" }}
            />
          </label>
        </div>

        <label style={{ display: "grid", gap: "0.25rem" }}>
          Hydration note
          <input
            type="text"
            placeholder="e.g. felt dehydrated by the last hour"
            value={hydrationNote}
            onChange={(event) => setHydrationNote(event.target.value)}
            style={{ padding: "0.4rem" }}
          />
        </label>

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
          {saving ? "Saving..." : "Log day"}
        </button>
        {errorMessage && (
          <p style={{ color: "#b00020" }}>{errorMessage}</p>
        )}
      </form>

      <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>History</h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {logs.map((log) => (
          <NutritionLogCard key={log.id} log={log} />
        ))}
        {logs.length === 0 && <p>No nutrition entries logged yet.</p>}
      </div>
    </main>
  );
}

function NutritionLogCard({ log }: { log: NutritionLog }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "0.75rem 1rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{log.log_date}</strong>
        <span
          style={{
            color: log.carb_target_status === "missed" ? "#b00020" : "#2a7d2a",
            fontSize: "0.875rem",
          }}
        >
          {log.carb_target_status
            ? CARB_TARGET_STATUS_LABELS[log.carb_target_status]
            : "No target status"}
        </span>
      </div>
      <p style={{ margin: "0.4rem 0", color: "#555", fontSize: "0.9rem" }}>
        {log.carbs_g !== null ? `${log.carbs_g} g carbs` : "Carbs not logged"}
        {log.calories !== null ? ` - ${log.calories} kcal` : ""}
        {log.body_weight_kg !== null ? ` - ${log.body_weight_kg} kg` : ""}
      </p>
      {log.hydration_note && (
        <p style={{ margin: "0.2rem 0", fontSize: "0.9rem" }}>
          Hydration: {log.hydration_note}
        </p>
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
