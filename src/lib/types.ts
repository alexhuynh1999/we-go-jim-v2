// ─── Exercise catalog types ───

export type Field = "weight" | "reps" | "time" | "distance" | "notes";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "smith-machine"
  | "plate-loaded"
  | "other";

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "full-body";

export type ExerciseSource = "builtin" | "user";

export type Exercise = {
  id: string;
  name: string;
  fields: Field[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  notes?: string;
  source: ExerciseSource;
  isHidden?: boolean;
};

// ─── Template types ───

export type TemplateExercise = {
  exerciseId: string;
  equipment: Equipment;
  setCount: number;
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  targetDistance?: number;
  warmUpSets?: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  description?: string;
  exercises: TemplateExercise[];
  createdAt: string; // ISO 8601
  lastUsedAt: string; // ISO 8601
  useCount: number;
};

// ─── Session / set types ───

export type ExerciseSet = {
  weight?: number;
  reps?: number;
  duration?: number; // seconds
  distance?: number;
  notes?: string;
  isWarmup?: boolean;
  completed?: boolean;
};

export type SessionExercise = {
  exerciseId: string;
  exerciseName: string;
  fields: Field[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  sets: ExerciseSet[];
};

export type WorkoutSession = {
  id: string;
  startedAt: string; // ISO 8601
  endedAt: string | null; // null = in-progress
  templateId: string | null;
  name: string;
  exercises: SessionExercise[];
};

// ─── Rest timer state ───

export type RestTimerState = {
  remaining: number; // seconds remaining
  total: number; // total seconds (to derive progress)
  running: boolean;
};

// ─── Session machine states ───

export type SessionState = "idle" | "in-progress" | "finished";

export type SessionAction =
  | { type: "START_SESSION"; session: WorkoutSession }
  | { type: "FINISH_SESSION" }
  | { type: "ABANDON_SESSION" }
  | { type: "RESUME_SESSION"; session: WorkoutSession };

export type SessionMachineState = {
  state: SessionState;
  session: WorkoutSession | null;
};

// ─── Settings types ───

export type WeightUnit = "kg" | "lb";
export type DistanceUnit = "km" | "mi";
export type DarkModeSetting = "light" | "dark" | "system";

export type AppSettings = {
  restTimerSeconds: number;
  weightUnit: WeightUnit;
  darkMode: DarkModeSetting;
};