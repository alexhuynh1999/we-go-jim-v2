import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  exportAllData,
  importAllData,
  type BackupData,
  validateBackup,
  getBackupFilename,
  CURRENT_VERSION,
} from "./data-management";
import { saveSettings } from "./settings-store";
import { saveCustomExercise, getCustomExercises, } from "./exercise-store";
import type { AppSettings, WorkoutSession, WorkoutTemplate, Exercise } from "./types";
import {
  saveSession,
  listSessions,
  saveTemplate,
  listTemplates,
  clearAllData,
} from "./session-store";

function makeSession(
  overrides?: Partial<WorkoutSession>,
): WorkoutSession {
  return {
    id: "session-1",
    startedAt: "2024-01-15T10:00:00Z",
    endedAt: "2024-01-15T11:00:00Z",
    templateId: null,
    name: "Quick Workout",
    exercises: [
      {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        fields: ["weight", "reps"],
        muscleGroups: ["chest"],
        equipment: "barbell",
        sets: [{ weight: 80, reps: 5 }],
      },
    ],
    ...overrides,
  };
}

function makeTemplate(
  overrides?: Partial<WorkoutTemplate>,
): WorkoutTemplate {
  return {
    id: "template-1",
    name: "Push Day",
    exercises: [
      { exerciseId: "ex-bench", equipment: "barbell", setCount: 3 },
    ],
    createdAt: "2024-01-01T08:00:00Z",
    lastUsedAt: "2024-01-15T10:00:00Z",
    useCount: 5,
    ...overrides,
  };
}

describe("data-management", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
    localStorage.clear();
  });

  afterEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
  });

  describe("getBackupFilename", () => {
    it("generates a filename with today's date", () => {
      const filename = getBackupFilename();
      const today = new Date().toISOString().slice(0, 10);
      expect(filename).toBe(`we-go-jim-backup-${today}.json`);
    });
  });

  describe("exportAllData", () => {
    it("exports an empty backup when no data exists", async () => {
      const backup = await exportAllData();
      expect(backup.version).toBe(CURRENT_VERSION);
      expect(backup.exportedAt).toBeTruthy();
      expect(backup.workouts).toEqual([]);
      expect(backup.templates).toEqual([]);
      expect(backup.customExercises).toEqual([]);
      expect(backup.settings).toEqual({
        restTimerSeconds: 150,
        weightUnit: "lb",
        darkMode: "system",
      });
    });

    it("includes all saved sessions and templates", async () => {
      await saveSession(makeSession({ id: "s1" }));
      await saveTemplate(makeTemplate({ id: "t1" }));
      saveSettings({
        restTimerSeconds: 90,
        weightUnit: "kg",
        darkMode: "dark",
      });

      const backup = await exportAllData();
      expect(backup.workouts).toHaveLength(1);
      expect(backup.workouts[0]?.id).toBe("s1");
      expect(backup.templates).toHaveLength(1);
      expect(backup.templates[0]?.id).toBe("t1");
      expect(backup.settings.restTimerSeconds).toBe(90);
    });

    it("includes custom exercises in export", async () => {
      const custom: Exercise = {
        id: "custom-export-1",
        name: "Custom Export Test",
        fields: ["time"],
        muscleGroups: ["core"],
        equipment: ["bodyweight"],
        source: "user",
      };
      await saveCustomExercise(custom);
      const backup = await exportAllData();
      expect(backup.customExercises).toHaveLength(1);
      expect(backup.customExercises[0]?.name).toBe("Custom Export Test");
    });
  });

  describe("validateBackup", () => {
    it("accepts a valid backup", () => {
      const backup: BackupData = {
        version: CURRENT_VERSION,
        exportedAt: "2024-01-15T10:00:00Z",
        workouts: [],
        templates: [],
        customExercises: [],
        settings: {},
      };
      const result = validateBackup(backup);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects missing version", () => {
      const result = validateBackup({} as BackupData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("version");
    });

    it("rejects wrong major version", () => {
      const [major] = CURRENT_VERSION.split(".");
      const wrongMajor = `${Number(major) + 1}.0`;
      const result = validateBackup({
        version: wrongMajor,
        exportedAt: "",
        workouts: [],
        templates: [],
        customExercises: [],
        settings: {},
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Major version mismatch");
    });

    it("accepts same-major version differences", () => {
      const [major] = CURRENT_VERSION.split(".");
      const patchBump = `${major}.${Number(major ?? "0") + 1}.99`;
      const result = validateBackup({
        version: patchBump,
        exportedAt: "",
        workouts: [],
        templates: [],
        customExercises: [],
        settings: {},
      });
      expect(result.valid).toBe(true);
    });

    it("rejects missing workouts field", () => {
      const result = validateBackup({
        version: CURRENT_VERSION,
        exportedAt: "",
        templates: [],
        customExercises: [],
        settings: {},
      } as unknown as BackupData);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("workouts");
    });

    it("rejects non-array workouts", () => {
      const result = validateBackup({
        version: CURRENT_VERSION,
        exportedAt: "",
        workouts: "not-array",
        templates: [],
        customExercises: [],
        settings: {},
      } as unknown as BackupData);
      expect(result.valid).toBe(false);
    });
  });

  describe("importAllData", () => {
    it("replaces all existing data with backup data", async () => {
      // Seed some data
      await saveSession(makeSession({ id: "old-session" }));
      await saveTemplate(makeTemplate({ id: "old-template" }));
      saveSettings({
        restTimerSeconds: 300,
        weightUnit: "lb",
        darkMode: "light",
      });

      // Import new data
      const backup: BackupData = {
        version: CURRENT_VERSION,
        exportedAt: "2024-06-01T12:00:00Z",
        workouts: [makeSession({ id: "new-session" })],
        templates: [makeTemplate({ id: "new-template" })],
        customExercises: [],
        settings: { restTimerSeconds: 60, weightUnit: "kg", darkMode: "dark" },
      };

      await importAllData(backup);

      // Old data should be gone
      const sessions = await listSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0]?.id).toBe("new-session");

      const templates = await listTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0]?.id).toBe("new-template");
    });

    it("restores custom exercises on import", async () => {
      const custom: Exercise = {
        id: "custom-backup-1",
        name: "Custom Backup Exercise",
        fields: ["weight", "reps"],
        muscleGroups: ["chest"],
        equipment: ["dumbbell"],
        source: "user",
        notes: "Test notes",
      };
      await saveCustomExercise(custom);

      // Export
      const backup = await exportAllData();
      expect(backup.customExercises).toHaveLength(1);
      expect(backup.customExercises[0]?.name).toBe("Custom Backup Exercise");

      // Clear and import back
      await clearAllData();
      await importAllData(backup);

      const restored = await getCustomExercises();
      expect(restored).toHaveLength(1);
      expect(restored[0]?.name).toBe("Custom Backup Exercise");
      expect(restored[0]?.source).toBe("user");
    });

    it("handles empty backup data", async () => {
      await saveSession(makeSession({ id: "s1" }));
      const backup: BackupData = {
        version: CURRENT_VERSION,
        exportedAt: "2024-01-01T00:00:00Z",
        workouts: [],
        templates: [],
        customExercises: [],
        settings: {},
      };
      await importAllData(backup);
      expect(await listSessions()).toEqual([]);
      expect(await listTemplates()).toEqual([]);
    });
  });
});