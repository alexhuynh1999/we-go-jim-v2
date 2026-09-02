import type { Exercise } from "./types";
import builtinExercises from "../data/exercises.json";

const DB_NAME = "we-go-jim";
const DB_VERSION = 2;

const CUSTOM_EXERCISES_STORE = "customExercises";
const EXERCISE_META_STORE = "exerciseMeta";
const HIDDEN_BUILTINS_KEY = "hiddenBuiltins";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sessions")) {
        const store = db.createObjectStore("sessions", { keyPath: "id" });
        store.createIndex("startedAt", "startedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("templates")) {
        const store = db.createObjectStore("templates", { keyPath: "id" });
        store.createIndex("lastUsedAt", "lastUsedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(CUSTOM_EXERCISES_STORE)) {
        db.createObjectStore(CUSTOM_EXERCISES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(EXERCISE_META_STORE)) {
        db.createObjectStore(EXERCISE_META_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getStore(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = "readonly",
): IDBObjectStore {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

// ─── Hidden built-in exercises ───

/**
 * Get the list of hidden built-in exercise IDs.
 */
export async function getHiddenExerciseIds(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    try {
      const store = getStore(db, EXERCISE_META_STORE);
      const request = store.get(HIDDEN_BUILTINS_KEY);
      request.onsuccess = () => {
        db.close();
        resolve((request.result as string[]) ?? []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    } catch (e) {
      db.close();
      reject(e);
    }
  });
}

/**
 * Mark a built-in exercise as hidden. Custom exercises should be hard-deleted instead.
 */
export async function hideBuiltinExercise(id: string): Promise<void> {
  const hidden = await getHiddenExerciseIds();
  if (hidden.includes(id)) return; // already hidden
  hidden.push(id);
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, EXERCISE_META_STORE, "readwrite");
    const request = store.put(hidden, HIDDEN_BUILTINS_KEY);
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

/**
 * Unhide a previously hidden built-in exercise.
 */
export async function unhideBuiltinExercise(id: string): Promise<void> {
  const hidden = await getHiddenExerciseIds();
  const filtered = hidden.filter((h) => h !== id);
  if (filtered.length === hidden.length) return; // wasn't hidden
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, EXERCISE_META_STORE, "readwrite");
    const request = store.put(filtered, HIDDEN_BUILTINS_KEY);
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

// ─── Custom exercises ───

/**
 * Get all custom exercises from IndexedDB.
 */
export async function getCustomExercises(): Promise<Exercise[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, CUSTOM_EXERCISES_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      db.close();
      resolve(request.result as Exercise[]);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Save (insert or update) a custom exercise.
 */
export async function saveCustomExercise(exercise: Exercise): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, CUSTOM_EXERCISES_STORE, "readwrite");
    const request = store.put(exercise);
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

/**
 * Hard-delete a custom exercise. Built-in exercises should use hideBuiltinExercise instead.
 */
export async function deleteCustomExercise(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, CUSTOM_EXERCISES_STORE, "readwrite");
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

// ─── Combined catalog ───

/**
 * Get the full exercise catalog: built-in exercises (minus hidden ones)
 * plus custom exercises.
 */
export async function listExercises(): Promise<Exercise[]> {
  const [hiddenIds, customExercises] = await Promise.all([
    getHiddenExerciseIds(),
    getCustomExercises(),
  ]);

  const builtins = (builtinExercises as Exercise[]).filter(
    (ex) => !hiddenIds.includes(ex.id),
  );

  return [...builtins, ...customExercises];
}

/**
 * Get a single exercise by id, checking built-ins and custom exercises.
 */
export async function getExercise(
  id: string,
): Promise<Exercise | null> {
  // Check built-ins first
  const builtin = (builtinExercises as Exercise[]).find((e) => e.id === id);
  if (builtin) {
    const hiddenIds = await getHiddenExerciseIds();
    if (hiddenIds.includes(id)) return null;
    return builtin;
  }

  // Check custom exercises
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = getStore(db, CUSTOM_EXERCISES_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      db.close();
      resolve((request.result as Exercise) ?? null);
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

/**
 * Generate a runtime v4-style UUID for custom exercises.
 */
export function generateExerciseId(): string {
  return crypto.randomUUID();
}