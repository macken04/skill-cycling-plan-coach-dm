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

// B7 compliance/trend view: each FR3 status reads as one of a fixed set of
// four severity roles (good/warning/serious/critical), never a plain
// identity color, since the status inherently means "did this go well" -
// per dataviz's status-color rule. `completed_easier_than_planned` and
// `completed_as_planned` share "good" (both on-track outcomes); `skipped`
// is "serious" (a training gap) rather than "critical", which is reserved
// for an attempted-and-overreached session.
export type StatusRole = "good" | "warning" | "serious" | "critical";

export const STATUS_ROLE: Record<SessionStatus, StatusRole> = {
  completed_as_planned: "good",
  completed_easier_than_planned: "good",
  completed_harder_than_planned: "warning",
  skipped: "serious",
  failed_too_hard: "critical",
};

// Fixed status scale (light-surface steps), per the dataviz skill's palette
// reference -- never themed, always paired with the icon/label below.
export const STATUS_ROLE_COLOR: Record<StatusRole, string> = {
  good: "#0ca30c",
  warning: "#fab219",
  serious: "#ec835a",
  critical: "#d03b3b",
};

export const STATUS_ROLE_LABELS: Record<StatusRole, string> = {
  good: "On track (as planned / easier)",
  warning: "Harder than planned",
  serious: "Skipped",
  critical: "Failed - too hard",
};

// Segment order is fixed (never reshuffled), a mild-to-severe reading order.
export const STATUS_ROLE_ORDER: StatusRole[] = [
  "good",
  "warning",
  "serious",
  "critical",
];

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

export interface CoachNote {
  id: string;
  athlete_id: string;
  workout_log_id: string | null;
  strength_log_id: string | null;
  note: string;
  created_at: string;
}
