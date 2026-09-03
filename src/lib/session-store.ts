import type { WorkoutSession, WorkoutTemplate, ExerciseSet } from "./types";
import { getHeaviestSet } from "./heaviest-set";
import {
  openDB,
  getStore,
  STORE_SESSIONS,
  STORE_TEMPLATES,
  STORE_CUSTOM_EXERCISES,
  STORE_EXERCISE_META,
} from "./db";

// ─── Session operations ───

export async function saveSession(session: WorkoutSession): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_SESSIONS, "readwrite");
    const request = store.put(session);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function loadSession(
  id: string,
): Promise<WorkoutSession | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_SESSIONS);
    const request = store.get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as WorkoutSession) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function listSessions(): Promise<WorkoutSession[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_SESSIONS);
    const index = store.index("startedAt");
    const request = index.getAll();

    request.onsuccess = () => {
      db.close();
      // Sort descending by startedAt (most recent first)
      const sessions = (request.result as WorkoutSession[]).sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
      );
      resolve(sessions);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteSession(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_SESSIONS, "readwrite");
    const request = store.delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// ─── Template operations ───

export async function saveTemplate(
  template: WorkoutTemplate,
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_TEMPLATES, "readwrite");
    const request = store.put(template);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function loadTemplate(
  id: string,
): Promise<WorkoutTemplate | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_TEMPLATES);
    const request = store.get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as WorkoutTemplate) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function listTemplates(): Promise<WorkoutTemplate[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_TEMPLATES);
    const index = store.index("lastUsedAt");
    const request = index.getAll();

    request.onsuccess = () => {
      db.close();
      // Sort descending by lastUsedAt (most recently used first)
      const templates = (request.result as WorkoutTemplate[]).sort(
        (a, b) =>
          new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime(),
      );
      resolve(templates);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, STORE_TEMPLATES, "readwrite");
    const request = store.delete(id);
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

// ─── Heaviest set lookup ───

/**
 * Finds the heaviest set for a given exercise across all completed sessions.
 * Scans all sessions (excluding in-progress sessions where endedAt is null).
 */
export async function getHeaviestSetForExercise(
  exerciseId: string,
): Promise<ExerciseSet | null> {
  const sessions = await listSessions();
  const completedSessions = sessions.filter((s) => s.endedAt !== null);

  // Collect all non-warmup sets for this exercise, chronologically ordered
  const allSets: ExerciseSet[] = [];
  for (const session of completedSessions) {
    for (const exercise of session.exercises) {
      if (exercise.exerciseId === exerciseId) {
        // We want the latest session's sets first for context,
        // but heaviest-set logic is pure so order doesn't matter
        allSets.push(...exercise.sets);
      }
    }
  }

  return getHeaviestSet(allSets);
}

/**
 * Clears all data from both stores. Used for import/replace and settings reset.
 */
export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORE_SESSIONS, STORE_TEMPLATES, STORE_CUSTOM_EXERCISES, STORE_EXERCISE_META],
      "readwrite",
    );
    tx.objectStore(STORE_SESSIONS).clear();
    tx.objectStore(STORE_TEMPLATES).clear();
    tx.objectStore(STORE_CUSTOM_EXERCISES).clear();
    tx.objectStore(STORE_EXERCISE_META).clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}