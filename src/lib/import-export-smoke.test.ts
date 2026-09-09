/**
 * End-to-end smoke test that simulates the exact browser flow.
 *
 * 1. Export data from deployment A (real workouts, templates, custom exercises)
 * 2. Simulate Svelte 5 $state() by wrapping the parsed JSON in deep Proxies
 * 3. Import into deployment B (fresh IndexedDB)
 * 4. Verify everything landed correctly
 * 5. Re-export and verify round-trip fidelity
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  exportAllData,
  importAllData,
  validateBackup,
  validateImportItems,
  type BackupData,
  CURRENT_VERSION,
} from "./data-management.ts";
import { saveSession, listSessions, saveTemplate, listTemplates } from "./session-store.ts";
import { saveCustomExercise, getCustomExercises } from "./exercise-store.ts";
import { saveSettings, loadSettings } from "./settings-store.ts";
import type { WorkoutSession, WorkoutTemplate, Exercise } from "./types.ts";

// ─── Helpers ───

/** Deeply wrap every object in a Proxy, mimicking Svelte 5 $state() */
function deepProxy<T extends object>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => (typeof item === "object" && item !== null ? deepProxy(item) : item)) as unknown as T;
  const proxied: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    proxied[key] = typeof val === "object" && val !== null ? deepProxy(val as object) : val;
  }
  return new Proxy(proxied, {}) as T;
}

function makeSessions(): WorkoutSession[] {
  return [
    {
      id: "test-session-1",
      startedAt: "2024-03-01T09:00:00Z",
      endedAt: "2024-03-01T10:00:00Z",
      templateId: "test-template-1",
      name: "Monday Push",
      exercises: [
        {
          exerciseId: "a1b2c3d4-0001-4000-8000-000000000001",
          exerciseName: "Bench Press (Barbell)",
          fields: ["weight", "reps"],
          muscleGroups: ["chest", "arms"],
          equipment: "barbell",
          sets: [
            { weight: 80, reps: 5, completed: true },
            { weight: 90, reps: 3, completed: true },
            { weight: 100, reps: 1, completed: false, isWarmup: false },
          ],
        },
      ],
    },
    {
      id: "test-session-2",
      startedAt: "2024-03-03T09:00:00Z",
      endedAt: "2024-03-03T10:30:00Z",
      templateId: "test-template-2",
      name: "Wednesday Pull",
      exercises: [
        {
          exerciseId: "a1b2c3d4-0001-4000-8000-000000000015",
          exerciseName: "Deadlift (Barbell)",
          fields: ["weight", "reps"],
          muscleGroups: ["back", "legs"],
          equipment: "barbell",
          sets: [
            { weight: 140, reps: 5, completed: true },
            { weight: 160, reps: 3, completed: true },
          ],
        },
      ],
    },
  ];
}

function makeTemplates(): WorkoutTemplate[] {
  return [
    {
      id: "test-template-1",
      name: "Push Day",
      description: "Chest and shoulders",
      exercises: [
        { exerciseId: "a1b2c3d4-0001-4000-8000-000000000001", equipment: "barbell", setCount: 3, targetReps: 5 },
        { exerciseId: "a1b2c3d4-0001-4000-8000-000000000005", equipment: "barbell", setCount: 3, targetReps: 8 },
      ],
      createdAt: "2024-01-01T00:00:00Z",
      lastUsedAt: "2024-03-01T10:00:00Z",
      useCount: 12,
    },
    {
      id: "test-template-2",
      name: "Pull Day",
      exercises: [
        { exerciseId: "a1b2c3d4-0001-4000-8000-000000000015", equipment: "barbell", setCount: 5, targetReps: 1 },
      ],
      createdAt: "2024-01-01T00:00:00Z",
      lastUsedAt: "2024-03-03T10:30:00Z",
      useCount: 8,
    },
  ];
}

function makeCustomExercises(): Exercise[] {
  return [
    {
      id: "custom-1",
      name: "Landmine Press",
      fields: ["weight", "reps"],
      muscleGroups: ["shoulders"],
      equipment: ["barbell", "other"],
      source: "user",
      notes: "Single arm landmine press",
    },
    {
      id: "custom-2",
      name: "Pallof Press",
      fields: ["weight", "reps", "time"],
      muscleGroups: ["core"],
      equipment: ["cable"],
      source: "user",
    },
  ];
}

describe("end-to-end import/export smoke test", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
    localStorage.clear();
  });

  afterEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
    localStorage.clear();
  });

  it("full round-trip: seed → export → Proxy-wrap → import → verify → re-export", async () => {
    // ── Phase 1: Seed deployment A ──
    for (const s of makeSessions()) await saveSession(s);
    for (const t of makeTemplates()) await saveTemplate(t);
    for (const e of makeCustomExercises()) await saveCustomExercise(e);
    saveSettings({ restTimerSeconds: 90, weightUnit: "kg", darkMode: "dark" });

    expect(await listSessions()).toHaveLength(2);
    expect(await listTemplates()).toHaveLength(2);
    expect(await getCustomExercises()).toHaveLength(2);
    expect(loadSettings().restTimerSeconds).toBe(90);

    // ── Phase 2: Export ──
    const rawBackup = await exportAllData();
    expect(rawBackup.version).toBe(CURRENT_VERSION);
    expect(rawBackup.workouts).toHaveLength(2);
    expect(rawBackup.templates).toHaveLength(2);
    expect(rawBackup.customExercises).toHaveLength(2);

    // Validation passes
    expect(validateBackup(rawBackup).valid).toBe(true);
    expect(validateImportItems(rawBackup)).toEqual([]);

    // ── Phase 3: Simulate file read + Svelte 5 Proxy wrapping ──
    // JSON.parse/stringify = reading from a file
    const jsonRoundtrip = JSON.parse(JSON.stringify(rawBackup)) as BackupData;
    // Svelte 5 $state() wraps every nested object in Proxies
    const proxyBackup = deepProxy(jsonRoundtrip as unknown as object) as unknown as BackupData;

    // ── Phase 4: Import into deployment B (fresh DB) ──
    indexedDB.deleteDatabase("we-go-jim");
    localStorage.clear();

    // This is the call that was failing with "Proxy object could not be cloned"
    await importAllData(proxyBackup);

    // ── Phase 5: Verify everything landed ──
    const sessions = await listSessions();
    expect(sessions).toHaveLength(2);

    const s1 = sessions.find((s) => s.id === "test-session-1")!;
    expect(s1.name).toBe("Monday Push");
    expect(s1.startedAt).toBe("2024-03-01T09:00:00Z");
    expect(s1.endedAt).toBe("2024-03-01T10:00:00Z");
    expect(s1.templateId).toBe("test-template-1");
    expect(s1.exercises).toHaveLength(1);
    expect(s1.exercises[0]!.exerciseName).toBe("Bench Press (Barbell)");
    expect(s1.exercises[0]!.sets).toHaveLength(3);
    expect(s1.exercises[0]!.sets[0]!.weight).toBe(80);
    expect(s1.exercises[0]!.sets[0]!.completed).toBe(true);
    expect(s1.exercises[0]!.sets[2]!.completed).toBe(false);

    const s2 = sessions.find((s) => s.id === "test-session-2")!;
    expect(s2.name).toBe("Wednesday Pull");
    expect(s2.exercises[0]!.sets[0]!.weight).toBe(140);

    const templates = await listTemplates();
    expect(templates).toHaveLength(2);

    const t1 = templates.find((t) => t.id === "test-template-1")!;
    expect(t1.name).toBe("Push Day");
    expect(t1.description).toBe("Chest and shoulders");
    expect(t1.exercises).toHaveLength(2);
    expect(t1.exercises[0]!.setCount).toBe(3);
    expect(t1.exercises[0]!.targetReps).toBe(5);
    expect(t1.useCount).toBe(12);

    const t2 = templates.find((t) => t.id === "test-template-2")!;
    expect(t2.name).toBe("Pull Day");

    const exercises = await getCustomExercises();
    expect(exercises).toHaveLength(2);

    const e1 = exercises.find((e) => e.id === "custom-1")!;
    expect(e1.name).toBe("Landmine Press");
    expect(e1.notes).toBe("Single arm landmine press");
    expect(e1.source).toBe("user");

    const e2 = exercises.find((e) => e.id === "custom-2")!;
    expect(e2.name).toBe("Pallof Press");
    expect(e2.equipment).toContain("cable");

    const settings = loadSettings();
    expect(settings.restTimerSeconds).toBe(90);
    expect(settings.weightUnit).toBe("kg");
    expect(settings.darkMode).toBe("dark");

    // ── Phase 6: Re-export ──
    const reExport = await exportAllData();
    expect(reExport.version).toBe(CURRENT_VERSION);
    expect(reExport.workouts).toHaveLength(2);
    expect(reExport.templates).toHaveLength(2);
    expect(reExport.customExercises).toHaveLength(2);
    expect(reExport.settings.restTimerSeconds).toBe(90);
  });

  it("rejects import with Proxy-wrapped null id (regression)", async () => {
    const proxyNullId = deepProxy({
      version: CURRENT_VERSION,
      exportedAt: "2024-01-01T00:00:00Z",
      workouts: [],
      templates: [],
      customExercises: [{ id: null, name: "Bad", fields: ["reps"], muscleGroups: ["core"], equipment: ["bodyweight"], source: "user" }] as any,
      settings: {},
    } as unknown as object) as unknown as BackupData;

    await expect(importAllData(proxyNullId)).rejects.toThrow(/invalid or missing/);
  });

  it("import preserves existing data when a bad import is rejected", async () => {
    // Seed data
    await saveSession({
      id: "keep-me",
      startedAt: "2024-01-01T00:00:00Z",
      endedAt: null,
      templateId: null,
      name: "Keep me",
      exercises: [],
    });

    // Attempt bad import
    const bad = {
      version: CURRENT_VERSION,
      exportedAt: "2024-06-01T12:00:00Z",
      workouts: [{} as any],
      templates: [],
      customExercises: [],
      settings: {},
    } as unknown as BackupData;

    await expect(importAllData(bad)).rejects.toThrow(/invalid or missing/);

    // Existing data survives
    const sessions = await listSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.id).toBe("keep-me");
  });
});