import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
  saveTemplate,
  loadTemplate,
  listTemplates,
  deleteTemplate,
  getHeaviestSetForExercise,
  clearAllData,
} from "./session-store";
import type { WorkoutSession, WorkoutTemplate } from "./types";

function makeSession(overrides?: Partial<WorkoutSession>): WorkoutSession {
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
        sets: [
          { weight: 80, reps: 5 },
          { weight: 100, reps: 3 },
        ],
      },
    ],
    ...overrides,
  };
}

function makeTemplate(overrides?: Partial<WorkoutTemplate>): WorkoutTemplate {
  return {
    id: "template-1",
    name: "Push Day",
    exercises: [
      {
        exerciseId: "ex-bench",
        equipment: "barbell",
        setCount: 3,
      },
    ],
    createdAt: "2024-01-01T08:00:00Z",
    lastUsedAt: "2024-01-15T10:00:00Z",
    useCount: 5,
    ...overrides,
  };
}

describe("session-store", () => {
  beforeEach(() => {
    // Clear all IndexedDB databases before each test
    indexedDB.deleteDatabase("we-go-jim");
  });

  afterEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
  });

  describe("saveSession / loadSession", () => {
    it("saves and loads a session by id", async () => {
      const session = makeSession();
      await saveSession(session);
      const loaded = await loadSession("session-1");
      expect(loaded).toEqual(session);
    });

    it("returns null for a non-existent session", async () => {
      const loaded = await loadSession("non-existent");
      expect(loaded).toBeNull();
    });

    it("overwrites an existing session with the same id", async () => {
      await saveSession(makeSession({ name: "Original" }));
      await saveSession(makeSession({ name: "Updated" }));
      const loaded = await loadSession("session-1");
      expect(loaded?.name).toBe("Updated");
    });
  });

  describe("listSessions", () => {
    it("returns an empty list when no sessions exist", async () => {
      const sessions = await listSessions();
      expect(sessions).toEqual([]);
    });

    it("lists all saved sessions in reverse chronological order", async () => {
      await saveSession(
        makeSession({
          id: "s1",
          startedAt: "2024-01-15T10:00:00Z",
        }),
      );
      await saveSession(
        makeSession({
          id: "s2",
          startedAt: "2024-01-16T10:00:00Z",
        }),
      );
      await saveSession(
        makeSession({
          id: "s3",
          startedAt: "2024-01-14T10:00:00Z",
        }),
      );
      const sessions = await listSessions();
      expect(sessions.map((s) => s.id)).toEqual(["s2", "s1", "s3"]);
    });
  });

  describe("deleteSession", () => {
    it("deletes a session by id", async () => {
      await saveSession(makeSession());
      await deleteSession("session-1");
      const loaded = await loadSession("session-1");
      expect(loaded).toBeNull();
    });
  });

  describe("saveTemplate / loadTemplate", () => {
    it("saves and loads a template by id", async () => {
      const template = makeTemplate();
      await saveTemplate(template);
      const loaded = await loadTemplate("template-1");
      expect(loaded).toEqual(template);
    });

    it("returns null for a non-existent template", async () => {
      const loaded = await loadTemplate("non-existent");
      expect(loaded).toBeNull();
    });
  });

  describe("listTemplates", () => {
    it("returns an empty list when no templates exist", async () => {
      const templates = await listTemplates();
      expect(templates).toEqual([]);
    });

    it("lists templates sorted by lastUsedAt descending", async () => {
      await saveTemplate(
        makeTemplate({
          id: "t1",
          lastUsedAt: "2024-01-10T10:00:00Z",
        }),
      );
      await saveTemplate(
        makeTemplate({
          id: "t2",
          lastUsedAt: "2024-01-20T10:00:00Z",
        }),
      );
      const templates = await listTemplates();
      expect(templates.map((t) => t.id)).toEqual(["t2", "t1"]);
    });
  });

  describe("deleteTemplate", () => {
    it("deletes a template by id", async () => {
      await saveTemplate(makeTemplate());
      await deleteTemplate("template-1");
      const loaded = await loadTemplate("template-1");
      expect(loaded).toBeNull();
    });
  });

  describe("getHeaviestSetForExercise", () => {
    it("returns null when no sessions exist", async () => {
      const result = await getHeaviestSetForExercise("ex-bench");
      expect(result).toBeNull();
    });

    it("returns the heaviest set from all sessions for an exercise", async () => {
      await saveSession(
        makeSession({
          id: "s1",
          startedAt: "2024-01-14T10:00:00Z",
          exercises: [
            {
              exerciseId: "ex-bench",
              exerciseName: "Bench Press",
              fields: ["weight", "reps"],
              muscleGroups: ["chest"],
              equipment: "barbell",
              sets: [
                { weight: 80, reps: 5 },
                { weight: 90, reps: 3 },
              ],
            },
          ],
        }),
      );
      await saveSession(
        makeSession({
          id: "s2",
          startedAt: "2024-01-15T10:00:00Z",
          exercises: [
            {
              exerciseId: "ex-bench",
              exerciseName: "Bench Press",
              fields: ["weight", "reps"],
              muscleGroups: ["chest"],
              equipment: "barbell",
              sets: [
                { weight: 100, reps: 3 },
                { weight: 60, reps: 10, isWarmup: true },
              ],
            },
          ],
        }),
      );
      const result = await getHeaviestSetForExercise("ex-bench");
      expect(result?.weight).toBe(100);
    });

    it("excludes in-progress sessions", async () => {
      await saveSession(
        makeSession({
          id: "s-in-progress",
          endedAt: null, // in-progress
          exercises: [
            {
              exerciseId: "ex-bench",
              exerciseName: "Bench Press",
              fields: ["weight", "reps"],
              muscleGroups: ["chest"],
              equipment: "barbell",
              sets: [{ weight: 999, reps: 1 }],
            },
          ],
        }),
      );
      await saveSession(
        makeSession({
          id: "s-completed",
          endedAt: "2024-01-15T11:00:00Z",
          exercises: [
            {
              exerciseId: "ex-bench",
              exerciseName: "Bench Press",
              fields: ["weight", "reps"],
              muscleGroups: ["chest"],
              equipment: "barbell",
              sets: [{ weight: 80, reps: 8 }],
            },
          ],
        }),
      );
      const result = await getHeaviestSetForExercise("ex-bench");
      expect(result?.weight).toBe(80); // 999 is from in-progress, should be excluded
    });

    it("returns null if exercise not found in any session", async () => {
      await saveSession(makeSession());
      const result = await getHeaviestSetForExercise("ex-squat");
      expect(result).toBeNull();
    });
  });

  describe("clearAllData", () => {
    it("removes all sessions and templates", async () => {
      await saveSession(makeSession());
      await saveTemplate(makeTemplate());
      await clearAllData();
      expect(await listSessions()).toEqual([]);
      expect(await listTemplates()).toEqual([]);
    });
  });

  describe("persistence flow (auto-save pattern)", () => {
    it("persists and retrieves an in-progress session", async () => {
      const session = makeSession({ endedAt: null });
      await saveSession(session);
      const loaded = await loadSession(session.id);
      expect(loaded).not.toBeNull();
      expect(loaded?.endedAt).toBeNull();
    });

    it("persists mutation updates (re-save with new data)", async () => {
      const session = makeSession({ endedAt: null });
      await saveSession(session);

      // Simulate adding a set (mutation)
      const updated = {
        ...session,
        exercises: [
          {
            ...session.exercises[0],
            sets: [...session.exercises[0].sets, { weight: 100, reps: 5 }],
          },
        ],
      };
      await saveSession(updated);

      const loaded = await loadSession(session.id);
      expect(loaded?.exercises[0].sets).toHaveLength(3);
      expect(loaded?.exercises[0].sets[2]?.weight).toBe(100);
    });

    it("persists finish (sets endedAt) and the finished session is retrievable", async () => {
      const session = makeSession({ endedAt: null });
      await saveSession(session);

      const finished = {
        ...session,
        endedAt: "2024-01-15T11:30:00Z",
      };
      await saveSession(finished);

      const loaded = await loadSession(session.id);
      expect(loaded?.endedAt).toBe("2024-01-15T11:30:00Z");
    });

    it("detects an in-progress session via listSessions", async () => {
      await saveSession(makeSession({ id: "s-finished", endedAt: "2024-01-15T11:00:00Z" }));
      await saveSession(makeSession({ id: "s-ip", endedAt: null }));

      const all = await listSessions();
      const inProgress = all.find((s) => s.endedAt === null);
      expect(inProgress).not.toBeNull();
      expect(inProgress?.id).toBe("s-ip");
    });

    it("deleting an in-progress session removes it from the store", async () => {
      await saveSession(makeSession({ id: "s-ip", endedAt: null }));
      await deleteSession("s-ip");
      const loaded = await loadSession("s-ip");
      expect(loaded).toBeNull();
    });
  });

  describe("history filtering", () => {
    it("listSessions returns only finished sessions when filtered in application code", async () => {
      await saveSession(makeSession({ id: "f1", startedAt: "2024-01-15T10:00:00Z", endedAt: "2024-01-15T11:00:00Z" }));
      await saveSession(makeSession({ id: "ip", startedAt: "2024-01-17T10:00:00Z", endedAt: null }));
      await saveSession(makeSession({ id: "f2", startedAt: "2024-01-16T10:00:00Z", endedAt: "2024-01-16T11:00:00Z" }));

      const all = await listSessions();
      const finished = all.filter((s) => s.endedAt !== null);
      expect(finished).toHaveLength(2);
      // Should be sorted by startedAt descending: f2 (Jan 16) then f1 (Jan 15)
      expect(finished.map((s) => s.id)).toEqual(["f2", "f1"]);
    });
  });
});