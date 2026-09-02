import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  listExercises,
  getExercise,
  saveCustomExercise,
  deleteCustomExercise,
  hideBuiltinExercise,
  unhideBuiltinExercise,
  getHiddenExerciseIds,
  getCustomExercises,
} from "./exercise-store";
import type { Exercise } from "./types";

describe("exercise-store", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
  });

  afterEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
  });

  describe("listExercises", () => {
    it("returns all built-in exercises when no custom exercises exist", async () => {
      const exercises = await listExercises();
      // Built-in count from exercises.json
      expect(exercises.length).toBeGreaterThan(70);
      expect(exercises.every((e) => e.source === "builtin")).toBe(true);
    });

    it("excludes hidden built-in exercises", async () => {
      const benchPress = "a1b2c3d4-0001-4000-8000-000000000001";
      await hideBuiltinExercise(benchPress);
      const exercises = await listExercises();
      expect(exercises.find((e) => e.id === benchPress)).toBeUndefined();
    });

    it("includes custom exercises alongside built-in ones", async () => {
      const custom: Exercise = {
        id: "custom-uuid-1",
        name: "My Custom Lift",
        fields: ["weight", "reps"],
        muscleGroups: ["chest"],
        equipment: ["barbell"],
        source: "user",
      };
      await saveCustomExercise(custom);

      const exercises = await listExercises();
      const found = exercises.find((e) => e.id === "custom-uuid-1");
      expect(found).toBeDefined();
      expect(found?.source).toBe("user");
      expect(found?.name).toBe("My Custom Lift");
    });

    it("does not include deleted custom exercises", async () => {
      const custom: Exercise = {
        id: "custom-uuid-1",
        name: "To Delete",
        fields: ["weight", "reps"],
        muscleGroups: ["chest"],
        equipment: ["barbell"],
        source: "user",
      };
      await saveCustomExercise(custom);
      await deleteCustomExercise("custom-uuid-1");

      const exercises = await listExercises();
      expect(exercises.find((e) => e.id === "custom-uuid-1")).toBeUndefined();
    });
  });

  describe("getExercise", () => {
    it("returns a built-in exercise by id", async () => {
      const ex = await getExercise("a1b2c3d4-0001-4000-8000-000000000001");
      expect(ex).toBeDefined();
      expect(ex?.name).toBe("Bench Press (Barbell)");
    });

    it("returns null for unknown id", async () => {
      const ex = await getExercise("nonexistent");
      expect(ex).toBeNull();
    });

    it("returns a custom exercise by id", async () => {
      const custom: Exercise = {
        id: "custom-abc",
        name: "Custom Test",
        fields: ["time"],
        muscleGroups: ["core"],
        equipment: ["bodyweight"],
        source: "user",
      };
      await saveCustomExercise(custom);
      const ex = await getExercise("custom-abc");
      expect(ex).toBeDefined();
      expect(ex?.name).toBe("Custom Test");
    });
  });

  describe("saveCustomExercise / getCustomExercises", () => {
    it("saves and retrieves custom exercises", async () => {
      const ex1: Exercise = {
        id: "c1",
        name: "Exercise 1",
        fields: ["weight", "reps"],
        muscleGroups: ["legs"],
        equipment: ["barbell"],
        source: "user",
      };
      const ex2: Exercise = {
        id: "c2",
        name: "Exercise 2",
        fields: ["time"],
        muscleGroups: ["full-body"],
        equipment: ["bodyweight"],
        source: "user",
      };
      await saveCustomExercise(ex1);
      await saveCustomExercise(ex2);

      const customs = await getCustomExercises();
      expect(customs).toHaveLength(2);
      expect(customs.find((c) => c.id === "c1")).toEqual(ex1);
    });

    it("overwrites existing custom exercise with same id", async () => {
      await saveCustomExercise({
        id: "c1",
        name: "Original",
        fields: ["reps"],
        muscleGroups: ["core"],
        equipment: ["bodyweight"],
        source: "user",
      });
      await saveCustomExercise({
        id: "c1",
        name: "Updated",
        fields: ["reps"],
        muscleGroups: ["core"],
        equipment: ["bodyweight"],
        source: "user",
      });
      const customs = await getCustomExercises();
      expect(customs).toHaveLength(1);
      expect(customs[0].name).toBe("Updated");
    });
  });

  describe("deleteCustomExercise", () => {
    it("removes a custom exercise", async () => {
      await saveCustomExercise({
        id: "c1",
        name: "To Delete",
        fields: ["reps"],
        muscleGroups: ["core"],
        equipment: ["bodyweight"],
        source: "user",
      });
      await deleteCustomExercise("c1");
      const customs = await getCustomExercises();
      expect(customs).toHaveLength(0);
    });

    it("does nothing when deleting a non-existent exercise", async () => {
      await expect(deleteCustomExercise("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("hideBuiltinExercise / unhideBuiltinExercise / getHiddenExerciseIds", () => {
    it("hides a built-in exercise and returns it in hidden list", async () => {
      await hideBuiltinExercise("a1b2c3d4-0001-4000-8000-000000000001");
      const hidden = await getHiddenExerciseIds();
      expect(hidden).toContain("a1b2c3d4-0001-4000-8000-000000000001");
    });

    it("unhide removes from hidden list", async () => {
      await hideBuiltinExercise("a1b2c3d4-0001-4000-8000-000000000001");
      await unhideBuiltinExercise("a1b2c3d4-0001-4000-8000-000000000001");
      const hidden = await getHiddenExerciseIds();
      expect(hidden).not.toContain("a1b2c3d4-0001-4000-8000-000000000001");
    });

    it("starts with empty hidden list", async () => {
      const hidden = await getHiddenExerciseIds();
      expect(hidden).toEqual([]);
    });

    it("hiding multiple exercises works", async () => {
      await hideBuiltinExercise("a1b2c3d4-0001-4000-8000-000000000001");
      await hideBuiltinExercise("a1b2c3d4-0001-4000-8000-000000000002");
      const hidden = await getHiddenExerciseIds();
      expect(hidden).toHaveLength(2);
    });
  });

  describe("isHidden/isDeleted filtering in listExercises", () => {
    it("combines hidden built-ins, custom exercises, and filters correctly", async () => {
      // Hide one built-in
      await hideBuiltinExercise("a1b2c3d4-0001-4000-8000-000000000001");

      // Add custom exercise
      await saveCustomExercise({
        id: "custom-1",
        name: "Custom",
        fields: ["reps"],
        muscleGroups: ["core"],
        equipment: ["bodyweight"],
        source: "user",
      });

      const exercises = await listExercises();

      // Built-in count should be total - 1 (for hidden), + 1 (for custom)
      const totalBuiltins = 78; // from exercises.json
      expect(exercises.filter((e) => e.source === "builtin")).toHaveLength(totalBuiltins - 1);
      expect(exercises.filter((e) => e.source === "user")).toHaveLength(1);
      expect(exercises.find((e) => e.id === "a1b2c3d4-0001-4000-8000-000000000001")).toBeUndefined();
    });
  });
});