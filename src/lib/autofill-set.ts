import type { ExerciseSet, Field } from "./types";

/**
 * Maps exercise schema Field names to the corresponding ExerciseSet property keys.
 * The schema uses "time" but the set stores it as "duration".
 */
const FIELD_TO_SET_KEY: Record<Field, keyof ExerciseSet> = {
  weight: "weight",
  reps: "reps",
  time: "duration",
  distance: "distance",
  notes: "notes", // not a primary field, but included for completeness
};

/** ExerciseSet keys that are considered "primary numeric fields" for autofill. */
const PRIMARY_SET_KEYS: ReadonlySet<keyof ExerciseSet> = new Set([
  "weight",
  "reps",
  "duration",
  "distance",
]);

/**
 * Derive the set keys that are both primary and applicable to this exercise.
 */
function applicableSetKeys(fields: Field[]): (keyof ExerciseSet)[] {
  return fields
    .map((f) => FIELD_TO_SET_KEY[f])
    .filter((k): k is keyof ExerciseSet => k !== undefined && PRIMARY_SET_KEYS.has(k));
}

/**
 * Check whether a set has any applicable primary field with a non-null,
 * non-undefined, non-zero value.
 */
function hasAnyPrimaryField(
  set: ExerciseSet,
  keys: (keyof ExerciseSet)[],
): boolean {
  return keys.some((k) => {
    const value = set[k];
    return value !== undefined && value !== null && value !== 0;
  });
}

/**
 * If the user taps "complete" on an empty set, autofill its primary fields
 * from the closest preceding completed set that has data.
 *
 * @param sets All sets in the current exercise (before this update).
 * @param updatedSet The incoming updated set (with the user's changes).
 * @param updatedIndex The index of the set being updated.
 * @param fields The exercise's field schema (which fields apply).
 * @returns The (possibly autofilled) set to use.
 */
export function maybeAutofillSet(
  sets: ExerciseSet[],
  updatedSet: ExerciseSet,
  updatedIndex: number,
  fields: Field[],
): ExerciseSet {
  // ─── Trigger conditions ───────────────────────────────────
  // Must be a completion action
  if (!updatedSet.completed) return updatedSet;
  // Not the first set (no predecessor)
  if (updatedIndex <= 0) return updatedSet;

  // Determine which primary set keys apply to this exercise
  const primaryKeys = applicableSetKeys(fields);
  if (primaryKeys.length === 0) return updatedSet;

  // Get the original set before this update
  const originalSet = sets[updatedIndex] ?? {};

  // Only autofill if the original set was completely empty (no primary data)
  if (hasAnyPrimaryField(originalSet, primaryKeys)) return updatedSet;

  // ─── Scan backwards for a source set ──────────────────────
  for (let j = updatedIndex - 1; j >= 0; j--) {
    const candidate = sets[j];
    if (!candidate) continue;

    // Must be completed AND have at least one primary field with data
    if (!candidate.completed) continue;
    if (!hasAnyPrimaryField(candidate, primaryKeys)) continue;

    // ─── Merge ─────────────────────────────────────────────
    const merged: ExerciseSet = { ...updatedSet };
    for (const k of primaryKeys) {
      const sourceValue = candidate[k];
      if (sourceValue !== undefined) {
        (merged as Record<string, unknown>)[k] = sourceValue;
      }
    }

    return merged;
  }

  // No suitable source found
  return updatedSet;
}