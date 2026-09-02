import { describe, it, expect } from "vitest";
import {
  removeSetFromSession,
  updateSetInSession,
  addSetToSession,
  formatDuration,
  getDurationSeconds,
  groupSessionsByMonth,
} from "./history-utils";
import type { WorkoutSession } from "./types";

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
      {
        exerciseId: "ex-squat",
        exerciseName: "Squat",
        fields: ["weight", "reps"],
        muscleGroups: ["legs"],
        equipment: "barbell",
        sets: [{ weight: 140, reps: 5 }],
      },
    ],
    ...overrides,
  };
}

describe("removeSetFromSession", () => {
  it("removes a set from an exercise when there are multiple sets", () => {
    const session = makeSession();
    const updated = removeSetFromSession(session, 0, 0); // remove first set of bench
    expect(updated.exercises).toHaveLength(2);
    expect(updated.exercises[0]!.sets).toHaveLength(1);
    expect(updated.exercises[0]!.sets[0]).toEqual({ weight: 100, reps: 3 });
  });

  it("removes the entire exercise when deleting the last set", () => {
    const session = makeSession();
    const updated = removeSetFromSession(session, 1, 0); // remove only set of squat
    expect(updated.exercises).toHaveLength(1);
    expect(updated.exercises[0]!.exerciseId).toBe("ex-bench");
  });

  it("removes multiple exercises when their last sets are removed", () => {
    const session = makeSession();
    const updated = removeSetFromSession(removeSetFromSession(session, 0, 0), 0, 0);
    // Removing bench's second set (now at index 0 after first removal) removes bench entirely
    // Squat is still there
    expect(updated.exercises).toHaveLength(1);
    expect(updated.exercises[0]!.exerciseId).toBe("ex-squat");
  });

  it("returns empty exercises array when removing all sets from all exercises", () => {
    const session = makeSession();
    // Remove squat's only set
    const afterSquat = removeSetFromSession(session, 1, 0);
    // Remove bench's first set
    const afterFirst = removeSetFromSession(afterSquat, 0, 0);
    // Remove bench's last set
    const afterSecond = removeSetFromSession(afterFirst, 0, 0);
    expect(afterSecond.exercises).toHaveLength(0);
  });

  it("does not mutate the original session", () => {
    const session = makeSession();
    const updated = removeSetFromSession(session, 0, 0);
    expect(session.exercises[0]!.sets).toHaveLength(2);
    expect(updated.exercises[0]!.sets).toHaveLength(1);
  });
});

describe("updateSetInSession", () => {
  it("updates a specific set's values", () => {
    const session = makeSession();
    const updated = updateSetInSession(session, 0, 0, { weight: 85, reps: 6 });
    expect(updated.exercises[0]!.sets[0]).toEqual({ weight: 85, reps: 6 });
    expect(updated.exercises[0]!.sets[1]).toEqual({ weight: 100, reps: 3 });
  });

  it("does not mutate the original session", () => {
    const session = makeSession();
    updateSetInSession(session, 0, 0, { weight: 85, reps: 6 });
    expect(session.exercises[0]!.sets[0]).toEqual({ weight: 80, reps: 5 });
  });
});

describe("addSetToSession", () => {
  it("appends a new empty set to the specified exercise", () => {
    const session = makeSession();
    const updated = addSetToSession(session, 0);
    expect(updated.exercises[0]!.sets).toHaveLength(3);
    expect(updated.exercises[0]!.sets[2]).toEqual({});
  });
});

describe("formatDuration", () => {
  it("formats seconds as M:SS", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65)).toBe("1:05");
    expect(formatDuration(3661)).toBe("61:01");
    expect(formatDuration(150)).toBe("2:30");
  });
});

describe("getDurationSeconds", () => {
  it("returns the difference in seconds between two ISO timestamps", () => {
    expect(getDurationSeconds("2024-01-15T10:00:00Z", "2024-01-15T11:00:00Z")).toBe(3600);
    expect(getDurationSeconds("2024-01-15T10:00:00Z", "2024-01-15T10:30:00Z")).toBe(1800);
  });
});

describe("groupSessionsByMonth", () => {
  it("groups sessions by month in chronological order", () => {
    const sessions = [
      makeSession({ id: "s1", startedAt: "2024-01-15T10:00:00Z" }),
      makeSession({ id: "s2", startedAt: "2024-02-10T10:00:00Z" }),
      makeSession({ id: "s3", startedAt: "2024-01-20T10:00:00Z" }),
    ];
    const groups = groupSessionsByMonth(sessions);
    expect(groups).toHaveLength(2);
    // January group should have 2 sessions
    const janGroup = groups.find((g) => g.monthKey === "2024-01");
    expect(janGroup?.sessions).toHaveLength(2);
    // February group should have 1 session
    const febGroup = groups.find((g) => g.monthKey === "2024-02");
    expect(febGroup?.sessions).toHaveLength(1);
  });

  it("returns empty array for empty input", () => {
    expect(groupSessionsByMonth([])).toEqual([]);
  });
});