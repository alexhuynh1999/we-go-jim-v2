import type { ExerciseSet } from "./types";

/**
 * Returns the "best" set from a list by priority:
 * 1. weight present → max weight (tie-break: higher reps)
 * 2. no weight, reps present → max reps
 * 3. distance present → max distance
 * 4. time only → max duration
 * 5. weight + time → max weight (tie-break: higher duration)
 *
 * Warm-up sets (isWarmup === true) are excluded.
 * Returns null if no non-warmup sets exist.
 */
export function getHeaviestSet(
  sets: ExerciseSet[],
): ExerciseSet | null {
  const workingSets = sets.filter((s) => !s.isWarmup);
  if (workingSets.length === 0) return null;

  const hasWeight = workingSets.some((s) => s.weight !== undefined);
  if (hasWeight) {
    return workingSets.reduce((best, current) => {
      const bestWeight = best.weight ?? 0;
      const currentWeight = current.weight ?? 0;
      if (currentWeight > bestWeight) return current;
      if (currentWeight === bestWeight) {
        // Tie-break: higher reps
        const bestReps = best.reps ?? 0;
        const currentReps = current.reps ?? 0;
        if (currentReps > bestReps) return current;
        // Tie-break: higher duration (for weight+time exercises)
        const bestDur = best.duration ?? 0;
        const currentDur = current.duration ?? 0;
        if (currentDur > bestDur) return current;
      }
      return best;
    });
  }

  const hasReps = workingSets.some((s) => s.reps !== undefined);
  if (hasReps) {
    return workingSets.reduce((best, current) => {
      return (current.reps ?? 0) > (best.reps ?? 0) ? current : best;
    });
  }

  const hasDistance = workingSets.some((s) => s.distance !== undefined);
  if (hasDistance) {
    return workingSets.reduce((best, current) => {
      return (current.distance ?? 0) > (best.distance ?? 0) ? current : best;
    });
  }

  // Fallback: max duration
  return workingSets.reduce((best, current) => {
    return (current.duration ?? 0) > (best.duration ?? 0) ? current : best;
  });
}