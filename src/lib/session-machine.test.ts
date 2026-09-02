import { describe, it, expect } from "vitest";
import { sessionReducer } from "./session-machine";
import type { SessionMachineState, WorkoutSession } from "./types";

function makeSession(overrides?: Partial<WorkoutSession>): WorkoutSession {
  return {
    id: "test-1",
    startedAt: "2024-01-15T10:00:00Z",
    endedAt: null,
    templateId: null,
    name: "Quick Workout",
    exercises: [
      {
        exerciseId: "ex-1",
        exerciseName: "Bench Press",
        fields: ["weight", "reps"],
        muscleGroups: ["chest"],
        equipment: "barbell",
        sets: [],
      },
    ],
    ...overrides,
  };
}

describe("sessionReducer", () => {
  it("starts in idle with no session", () => {
    const state: SessionMachineState = {
      state: "idle",
      session: null,
    };
    expect(state.state).toBe("idle");
    expect(state.session).toBeNull();
  });

  it("START_SESSION transitions to in-progress with session", () => {
    const initial: SessionMachineState = { state: "idle", session: null };
    const session = makeSession();
    const next = sessionReducer(initial, { type: "START_SESSION", session });
    expect(next.state).toBe("in-progress");
    expect(next.session).toEqual(session);
  });

  it("FINISH_SESSION transitions from in-progress to finished", () => {
    const initial: SessionMachineState = {
      state: "in-progress",
      session: makeSession(),
    };
    const next = sessionReducer(initial, { type: "FINISH_SESSION" });
    expect(next.state).toBe("finished");
    // Session should have endedAt set
    expect(next.session?.endedAt).not.toBeNull();
  });

  it("FINISH_SESSION does nothing when idle", () => {
    const initial: SessionMachineState = { state: "idle", session: null };
    const next = sessionReducer(initial, { type: "FINISH_SESSION" });
    expect(next).toEqual(initial);
  });

  it("ABANDON_SESSION returns to idle", () => {
    const initial: SessionMachineState = {
      state: "in-progress",
      session: makeSession(),
    };
    const next = sessionReducer(initial, { type: "ABANDON_SESSION" });
    expect(next.state).toBe("idle");
    expect(next.session).toBeNull();
  });

  it("RESUME_SESSION transitions idle to in-progress", () => {
    const initial: SessionMachineState = { state: "idle", session: null };
    const session = makeSession();
    const next = sessionReducer(initial, {
      type: "RESUME_SESSION",
      session,
    });
    expect(next.state).toBe("in-progress");
    expect(next.session).toEqual(session);
  });

  it("RESUME_SESSION works when coming from finished (re-open)", () => {
    const initial: SessionMachineState = {
      state: "finished",
      session: makeSession({ endedAt: "2024-01-15T11:00:00Z" }),
    };
    const session = makeSession({ endedAt: null });
    const next = sessionReducer(initial, {
      type: "RESUME_SESSION",
      session,
    });
    expect(next.state).toBe("in-progress");
    expect(next.session?.endedAt).toBeNull();
  });

  it("START_SESSION sets endedAt to null on the newly started session", () => {
    const initial: SessionMachineState = { state: "idle", session: null };
    const session = makeSession({ endedAt: "2024-01-15T11:00:00Z" });
    const next = sessionReducer(initial, { type: "START_SESSION", session });
    expect(next.state).toBe("in-progress");
    expect(next.session?.endedAt).toBeNull();
  });

  it("FINISH_SESSION sets endedAt timestamp on the session", () => {
    const initial: SessionMachineState = {
      state: "in-progress",
      session: makeSession({ endedAt: null }),
    };
    const next = sessionReducer(initial, { type: "FINISH_SESSION" });
    expect(next.session?.endedAt).not.toBeNull();
    expect(typeof next.session?.endedAt).toBe("string");
  });
});