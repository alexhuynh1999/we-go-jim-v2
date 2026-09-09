import { describe, it, expect } from "vitest";
import { maybeAutofillSet } from "./autofill-set";
import type { ExerciseSet, Field } from "./types";

describe("maybeAutofillSet", () => {
  describe("trigger condition — does not fire", () => {
    it("returns the updated set unchanged when completed is false (un-completing)", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { weight: 100, reps: 8, completed: false },
      ];
      const updated: ExerciseSet = { weight: 100, reps: 8, completed: false };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      expect(result).toBe(updated);
    });

    it("returns updated set unchanged when index is 0 (first set)", () => {
      const sets: ExerciseSet[] = [{ weight: 135, reps: 10, completed: true }];
      const updated: ExerciseSet = { completed: true };
      const result = maybeAutofillSet(sets, updated, 0, ["weight", "reps"]);
      expect(result).toBe(updated);
    });

    it("returns updated set unchanged when the original set has partial input", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { weight: 135, completed: true },
      ];
      const updated: ExerciseSet = { weight: 135, completed: true };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      expect(result).toBe(updated);
    });

    it("returns updated set unchanged when no preceding completed set has data", () => {
      const sets: ExerciseSet[] = [
        {}, // empty, never filled
        {}, // target set — empty
      ];
      const updated: ExerciseSet = { completed: true };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      expect(result).toBe(updated);
    });

    it("returns updated set unchanged when preceding sets are incomplete (no completed flag)", () => {
      const sets: ExerciseSet[] = [
        { weight: 225, reps: 5 }, // has data but not completed
        {}, // target
      ];
      const updated: ExerciseSet = { completed: true };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      expect(result).toBe(updated);
    });
  });

  describe("trigger condition — fires", () => {
    it("autofills weight and reps from the immediate preceding completed set", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        {},
      ];
      const updated: ExerciseSet = { completed: true };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
      expect(result.completed).toBe(true);
    });

    it("scans backwards past incomplete sets to find the nearest completed set", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { weight: 155, reps: 8 }, // not completed
        {}, // target
      ];
      const updated: ExerciseSet = { completed: true };
      const result = maybeAutofillSet(sets, updated, 2, ["weight", "reps"]);
      // Should skip set 1 (not completed), copy from set 0
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
    });

    it("copies from set index 1 when set 1 is completed and set 0 is not", () => {
      const sets: ExerciseSet[] = [
        { weight: 100, reps: 5 }, // has data but not completed
        { weight: 135, reps: 10, completed: true },
        {}, // target
      ];
      const updated: ExerciseSet = { completed: true };
      const result = maybeAutofillSet(sets, updated, 2, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
    });
  });

  describe("copy behavior", () => {
    it("copies weight and reps from source (weight+reps category)", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
    });

    it("copies duration and distance from source (time+distance category)", () => {
      const sets: ExerciseSet[] = [
        { duration: 600, distance: 5, completed: true },
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["time", "distance"]);
      expect(result.duration).toBe(600);
      expect(result.distance).toBe(5);
    });

    it("copies only applicable primary fields for weight+time category", () => {
      const sets: ExerciseSet[] = [
        { weight: 20, duration: 30, reps: 10, completed: true },
        {},
      ];
      // Exercise with weight+time fields — reps is not applicable
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "time"]);
      expect(result.weight).toBe(20);
      expect(result.duration).toBe(30);
      expect(result.reps).toBeUndefined();
    });

    it("does NOT copy isWarmup from the source set", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, isWarmup: true, completed: true },
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
      expect(result.isWarmup).toBeUndefined();
    });

    it("does NOT copy notes from the source set", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, notes: "slow reps", completed: true },
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
      expect(result.notes).toBeUndefined();
    });

    it("keeps completed flag as true on the target set", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result.completed).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles weight=0 as empty (no data)", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { weight: 0, reps: 0 }, // weight=0 considered empty for the check
      ];
      const updated: ExerciseSet = { weight: 0, reps: 0, completed: true };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      // Original had weight=0, which counts as empty — so autofill fires
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
    });

    it("copies only defined fields from source (source may not have all fields)", () => {
      const sets: ExerciseSet[] = [
        { reps: 10, completed: true }, // no weight
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result.weight).toBeUndefined();
      expect(result.reps).toBe(10);
    });

    it("set with isWarmup but no data still counts as empty", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { isWarmup: true }, // warmup but no data
      ];
      const updated: ExerciseSet = { isWarmup: true, completed: true };
      const result = maybeAutofillSet(sets, updated, 1, ["weight", "reps"]);
      // Empty set (no primary data) — autofill fires
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
    });

    it("handles empty exercise fields list gracefully", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        {},
      ];
      // No applicable fields means "everything is empty" and "nothing to copy"
      const result = maybeAutofillSet(sets, { completed: true }, 1, []);
      expect(result).toEqual({ completed: true });
    });
  });

  describe("scenario examples from spec", () => {
    it("Scenario: Set1 completed 135x10, Set2 empty → autofills 135x10", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
      expect(result.completed).toBe(true);
    });

    it("Scenario: Set1 completed, Set2 NOT completed, Set3 empty → autofills from Set1", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { weight: 155, reps: 8 }, // has data, NOT completed
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 2, ["weight", "reps"]);
      // Skips set 2 (not completed), copies from set 1
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
    });

    it("Scenario: Set1 empty never filled, Set2 empty → no autofill", () => {
      const sets: ExerciseSet[] = [
        {}, // never filled
        {},
      ];
      const result = maybeAutofillSet(sets, { completed: true }, 1, ["weight", "reps"]);
      expect(result).toEqual({ completed: true });
    });

    it("Scenario: Set1 completed, Set2 weight=135 reps empty → partial input, no autofill", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { weight: 135 }, // partial input
      ];
      const result = maybeAutofillSet(sets, { weight: 135, completed: true }, 1, ["weight", "reps"]);
      // Original has weight=135 (not empty), so skip autofill
      expect(result).toEqual({ weight: 135, completed: true });
    });

    it("Scenario: Set1 completed, Set2 isWarmup empty → autofills primary fields", () => {
      const sets: ExerciseSet[] = [
        { weight: 135, reps: 10, completed: true },
        { isWarmup: true },
      ];
      const result = maybeAutofillSet(sets, { isWarmup: true, completed: true }, 1, ["weight", "reps"]);
      expect(result.weight).toBe(135);
      expect(result.reps).toBe(10);
      expect(result.isWarmup).toBe(true); // preserves warmup flag
      expect(result.completed).toBe(true);
    });
  });
});