/** Shared IndexedDB adapter — single source of truth for connection and schema. */

export const DB_NAME = "we-go-jim";
export const DB_VERSION = 2;

export const STORE_SESSIONS = "sessions";
export const STORE_TEMPLATES = "templates";
export const STORE_CUSTOM_EXERCISES = "customExercises";
export const STORE_EXERCISE_META = "exerciseMeta";

/** Open the database connection and run schema upgrades if needed. */
export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const store = db.createObjectStore(STORE_SESSIONS, {
          keyPath: "id",
        });
        store.createIndex("startedAt", "startedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_TEMPLATES)) {
        const store = db.createObjectStore(STORE_TEMPLATES, {
          keyPath: "id",
        });
        store.createIndex("lastUsedAt", "lastUsedAt", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CUSTOM_EXERCISES)) {
        db.createObjectStore(STORE_CUSTOM_EXERCISES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_EXERCISE_META)) {
        db.createObjectStore(STORE_EXERCISE_META);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Get a typed object store in the requested transaction mode. */
export function getStore(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode = "readonly",
): IDBObjectStore {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}