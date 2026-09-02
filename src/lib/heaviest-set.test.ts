import { describe, it, expect } from "vitest";
import { getHeaviestSet } from "./heaviest-set";
import type { ExerciseSet } from "./types";

describe("getHeaviestSet", () => {
  it("returns null for an empty array", () => {
    expect(getHeaviestSet([])).toBeNull();
  });

  it("returns null when all sets are warm-ups", () => {
    const sets: ExerciseSet[] = [
      { weight: 60, reps: 5, isWarmup: true },
      { weight: 80, reps: 3, isWarmup: true },
    ];
    expect(getHeaviestSet(sets)).toBeNull();
  });

  it("returns the only set when there is one non-warmup set", () => {
    const sets: ExerciseSet[] = [{ weight: 100, reps: 5 }];
    expect(getHeaviestSet(sets)).toEqual({ weight: 100, reps: 5 });
  });

  it("picks the set with highest weight, tie-breaking with higher reps", () => {
    const sets: ExerciseSet[] = [
      { weight: 80, reps: 10 },
      { weight: 100, reps: 5 },
      { weight: 100, reps: 8 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.weight).toBe(100);
    expect(result?.reps).toBe(8);
  });

  it("filters out warm-up sets from weight comparison", () => {
    const sets: ExerciseSet[] = [
      { weight: 40, reps: 10, isWarmup: true },
      { weight: 80, reps: 8 },
      { weight: 60, reps: 12 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.weight).toBe(80);
  });

  it("falls back to max reps when no weight field is present", () => {
    const sets: ExerciseSet[] = [
      { reps: 10 },
      { reps: 15 },
      { reps: 12 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.reps).toBe(15);
  });

  it("falls back to max distance when no weight or reps", () => {
    const sets: ExerciseSet[] = [
      { distance: 2.5 },
      { distance: 5.0 },
      { distance: 1.0 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.distance).toBe(5.0);
  });

  it("falls back to max duration when only time fields are present", () => {
    const sets: ExerciseSet[] = [
      { duration: 30 },
      { duration: 60 },
      { duration: 45 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.duration).toBe(60);
  });

  it("prioritises weight over reps when both are present on different sets", () => {
    const sets: ExerciseSet[] = [
      { reps: 20 },
      { weight: 50, reps: 5 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.weight).toBe(50);
  });

  it("prioritises weight over distance", () => {
    const sets: ExerciseSet[] = [
      { distance: 10 },
      { weight: 100, reps: 1 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.weight).toBe(100);
  });

  it("handles weight+time exercises (loaded carries)", () => {
    const sets: ExerciseSet[] = [
      { weight: 40, duration: 30 },
      { weight: 50, duration: 20 },
      { weight: 50, duration: 25 },
    ];
    const result = getHeaviestSet(sets);
    expect(result?.weight).toBe(50);
    expect(result?.duration).toBe(25); // tie-break: higher duration
  });

  it("returns null for empty sets after filtering warm-ups", () => {
    const sets: ExerciseSet[] = [
      { isWarmup: true, reps: 10 },
      { isWarmup: true, reps: 12 },
    ];
    expect(getHeaviestSet(sets)).toBeNull();
  });
});