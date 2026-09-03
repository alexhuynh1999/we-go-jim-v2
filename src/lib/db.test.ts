import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  openDB,
  DB_NAME,
  STORE_SESSIONS,
  STORE_TEMPLATES,
  STORE_CUSTOM_EXERCISES,
  STORE_EXERCISE_META,
} from "./db";

describe("db adapter", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase(DB_NAME);
  });

  afterEach(() => {
    indexedDB.deleteDatabase(DB_NAME);
  });

  describe("openDB", () => {
    it("opens a connection successfully", async () => {
      const db = await openDB();
      expect(db).toBeInstanceOf(IDBDatabase);
      db.close();
    });

    it("creates all four stores on first open", async () => {
      const db = await openDB();
      const storeNames = Array.from(db.objectStoreNames);
      expect(storeNames).toContain(STORE_SESSIONS);
      expect(storeNames).toContain(STORE_TEMPLATES);
      expect(storeNames).toContain(STORE_CUSTOM_EXERCISES);
      expect(storeNames).toContain(STORE_EXERCISE_META);
      expect(storeNames).toHaveLength(4);
      db.close();
    });

    it("creates indices on the sessions store", async () => {
      const db = await openDB();
      const tx = db.transaction(STORE_SESSIONS, "readonly");
      const store = tx.objectStore(STORE_SESSIONS);
      const indexNames = Array.from(store.indexNames);
      expect(indexNames).toContain("startedAt");
      db.close();
    });

    it("creates indices on the templates store", async () => {
      const db = await openDB();
      const tx = db.transaction(STORE_TEMPLATES, "readonly");
      const store = tx.objectStore(STORE_TEMPLATES);
      const indexNames = Array.from(store.indexNames);
      expect(indexNames).toContain("lastUsedAt");
      db.close();
    });

    it("does not recreate stores on subsequent opens", async () => {
      const db1 = await openDB();
      db1.close();

      const db2 = await openDB();
      const storeNames = Array.from(db2.objectStoreNames);
      expect(storeNames).toHaveLength(4);
      db2.close();
    });
  });
});