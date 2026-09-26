"use client";

import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/plan`
            : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <main style={{ maxWidth: 420, margin: "4rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
        Cycling Plan Coach
      </h1>

      {status === "sent" ? (
        <p>
          Check <strong>{email}</strong> for a sign-in link. Open it on this
          device to see this week&apos;s plan.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            style={{ padding: "0.5rem", fontSize: "1rem" }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{ padding: "0.5rem", fontSize: "1rem" }}
          >
            {status === "sending" ? "Sending..." : "Send sign-in link"}
          </button>
          {status === "error" && (
            <p style={{ color: "#b00020" }}>{errorMessage}</p>
          )}
        </form>
      )}
    </main>
  );
}
