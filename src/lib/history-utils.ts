import type { WorkoutSession, ExerciseSet, SessionExercise } from "./types";

/**
 * Removes a set from a session exercise.
 * If the set was the last set in the exercise, the entire exercise is removed.
 * Otherwise, just the set is removed.
 *
 * Returns the updated session (shallow copy with updated exercises array).
 */
export function removeSetFromSession(
  session: WorkoutSession,
  exerciseIndex: number,
  setIndex: number,
): WorkoutSession {
  const exercises = session.exercises.map((ex, i) => {
    if (i !== exerciseIndex) return ex;
    const newSets = ex.sets.filter((_, sIdx) => sIdx !== setIndex);
    return { ...ex, sets: newSets };
  });

  // Remove exercises that have no sets left
  const filteredExercises = exercises.filter((ex) => ex.sets.length > 0);

  return { ...session, exercises: filteredExercises };
}

/**
 * Updates a specific set in a session exercise.
 */
export function updateSetInSession(
  session: WorkoutSession,
  exerciseIndex: number,
  setIndex: number,
  updatedSet: ExerciseSet,
): WorkoutSession {
  const exercises = session.exercises.map((ex, i) => {
    if (i !== exerciseIndex) return ex;
    const newSets = ex.sets.map((s, sIdx) => (sIdx === setIndex ? updatedSet : s));
    return { ...ex, sets: newSets };
  });
  return { ...session, exercises };
}

/**
 * Adds a new empty set to an exercise in a session.
 */
export function addSetToSession(
  session: WorkoutSession,
  exerciseIndex: number,
): WorkoutSession {
  const exercises = session.exercises.map((ex, i) => {
    if (i !== exerciseIndex) return ex;
    return { ...ex, sets: [...ex.sets, {} as ExerciseSet] };
  });
  return { ...session, exercises };
}

/**
 * Returns a formatted duration string from ISO start/end timestamps.
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Returns the duration in seconds between two ISO timestamps.
 */
export function getDurationSeconds(
  startedAt: string,
  endedAt: string,
): number {
  return Math.floor(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
}

/**
 * Groups sessions by month label for display.
 */
export type MonthGroup = {
  monthKey: string;
  label: string;
  sessions: WorkoutSession[];
};

export function groupSessionsByMonth(
  sessions: WorkoutSession[],
): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const session of sessions) {
    const d = new Date(session.startedAt);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
    let group = groups.find((g) => g.monthKey === monthKey);
    if (!group) {
      group = { monthKey, label, sessions: [] };
      groups.push(group);
    }
    group.sessions.push(session);
  }
  return groups;
}