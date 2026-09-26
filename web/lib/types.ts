// Mirrors supabase/migrations/20260926171317_initial_schema.sql.

export const SESSION_STATUSES = [
  "completed_as_planned",
  "completed_easier_than_planned",
  "completed_harder_than_planned",
  "failed_too_hard",
  "skipped",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  completed_as_planned: "Completed as planned",
  completed_easier_than_planned: "Completed - felt easier than planned",
  completed_harder_than_planned: "Completed - felt harder than planned",
  failed_too_hard: "Failed - too hard, couldn't complete",
  skipped: "Skipped",
};

export const DAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export type Day = (typeof DAY_ORDER)[number];

export interface Plan {
  id: string;
  athlete_id: string;
  week_start_date: string;
  phase: "base" | "build" | "refine" | null;
  deload: boolean;
  focus: string;
  ftp_used: number | null;
  rider_type: string | null;
  rendered_markdown: string;
}

export interface Event {
  id: string;
  athlete_id: string;
  event_key: string | null;
  event_name: string | null;
  event_date: string;
  notes: string;
}

export interface Workout {
  id: string;
  plan_id: string;
  athlete_id: string;
  day: Day;
  archetype: string;
  target: Record<string, unknown>;
  zwo_content: string | null;
  status: "planned" | "completed" | "skipped";
}

export interface WorkoutLog {
  id: string;
  workout_id: string;
  athlete_id: string;
  status: SessionStatus;
  rpe: number | null;
  notes: string;
  created_at: string;
}

export const CARB_TARGET_STATUSES = ["hit", "missed"] as const;

export type CarbTargetStatus = (typeof CARB_TARGET_STATUSES)[number];

export const CARB_TARGET_STATUS_LABELS: Record<CarbTargetStatus, string> = {
  hit: "Hit carb target",
  missed: "Missed carb target",
};

export interface NutritionLog {
  id: string;
  athlete_id: string;
  log_date: string;
  carbs_g: number | null;
  calories: number | null;
  carb_target_status: CarbTargetStatus | null;
  hydration_note: string;
  body_weight_kg: number | null;
  notes: string;
  created_at: string;
}

export interface ExerciseEntry {
  exercise: string;
  sets: number | null;
  reps: number | null;
  load_kg: number | null;
}

export interface StrengthLog {
  id: string;
  athlete_id: string;
  workout_id: string | null;
  session_name: string;
  status: SessionStatus;
  sets_reps_load: { exercises: ExerciseEntry[] };
  notes: string;
  created_at: string;
}
