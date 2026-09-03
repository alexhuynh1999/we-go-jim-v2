import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { saveSession, listSessions } from "./session-store";
import type { WorkoutSession } from "./types";

const SESSION_ID = "race-test-session";

function inProgressSession(): WorkoutSession {
  return {
    id: SESSION_ID,
    startedAt: "2024-01-15T10:00:00Z",
    endedAt: null,
    templateId: null,
    name: "Quick Workout",
    exercises: [],
  };
}

function finishedSession(): WorkoutSession {
  return {
    id: SESSION_ID,
    startedAt: "2024-01-15T10:00:00Z",
    endedAt: "2024-01-15T11:00:00Z",
    templateId: null,
    name: "Quick Workout",
    exercises: [],
  };
}

describe("race condition: concurrent writes to same session ID", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
  });

  afterEach(() => {
    indexedDB.deleteDatabase("we-go-jim");
  });

  it("REPRODUCES the bug: fire-and-forget auto-save can overwrite the finished session", async () => {
    // Simulates the bug:
    // 1. Auto-save starts an in-progress write (fire-and-forget)
    // 2. handleFinishWorkout saves the finished session (awaited)
    // 3. The auto-save's write completes AFTER the finished write,
    //    because the auto-save's write was scheduled later (e.g. the
    //    $effect fires right before the reducer sets state to "finished")
    //    and the IndexedDB transaction takes longer.

    async function delayedSave(session: WorkoutSession, delayMs: number): Promise<void> {
      await new Promise((r) => setTimeout(r, delayMs));
      await saveSession(session);
    }

    // Fire the auto-save write — delayed so it fires AFTER the finished write
    const delayedIpPromise = delayedSave(inProgressSession(), 100);

    // Short delay to let the first setTimeout start
    await new Promise((r) => setTimeout(r, 5));

    // handleFinishWorkout saves the finished session immediately
    await saveSession(finishedSession());

    // Now wait for the delayed auto-save to fire and overwrite
    await delayedIpPromise;

    const all = await listSessions();
    const saved = all.find((s) => s.id === SESSION_ID);

    // BUG CONFIRMED: the delayed auto-save overwrote the finished session
    expect(saved?.endedAt).toBeNull();
  }, 10_000);

  it("SERIALISED: promise chain prevents the race", async () => {
    async function delayedSave(session: WorkoutSession, delayMs: number): Promise<void> {
      await new Promise((r) => setTimeout(r, delayMs));
      await saveSession(session);
    }

    let chain: Promise<void> = Promise.resolve();

    function enqueueSave(session: WorkoutSession) {
      chain = chain.then(() => saveSession(session));
    }

    // Enqueue the delayed auto-save first
    chain = chain.then(() => delayedSave(inProgressSession(), 100));

    // Enqueue the finished write — it waits behind the delayed auto-save
    enqueueSave(finishedSession());

    await chain;

    const all = await listSessions();
    const saved = all.find((s) => s.id === SESSION_ID);

    expect(saved?.endedAt).toBe("2024-01-15T11:00:00Z");
  }, 10_000);

  it("SERIALISED survives: rapid auto-saves interleaved with finish", async () => {
    let chain: Promise<void> = Promise.resolve();

    function enqueueSave(session: WorkoutSession) {
      chain = chain.then(async () => {
        await new Promise((r) => setTimeout(r, Math.random() * 20));
        await saveSession(session);
      });
    }

    enqueueSave(inProgressSession());
    enqueueSave(inProgressSession());
    enqueueSave(inProgressSession());
    enqueueSave(inProgressSession());
    enqueueSave(finishedSession());

    await chain;

    const all = await listSessions();
    const saved = all.find((s) => s.id === SESSION_ID);

    expect(saved?.endedAt).toBe("2024-01-15T11:00:00Z");
  }, 10_000);

  it("session appears in History query after the chain resolves", async () => {
    let chain: Promise<void> = Promise.resolve();

    function enqueueSave(session: WorkoutSession) {
      chain = chain.then(() => saveSession(session));
    }

    enqueueSave(inProgressSession());
    enqueueSave(inProgressSession());
    enqueueSave(finishedSession());

    await chain;

    const all = await listSessions();
    const finished = all.filter((s) => s.endedAt !== null);

    expect(finished).toHaveLength(1);
    expect(finished[0].id).toBe(SESSION_ID);
  }, 10_000);
});