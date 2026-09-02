import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSettings,
  saveSettings,
  getDefaultWeightUnit,
  type PersistedSettings,
} from "./settings-store";
import type { AppSettings } from "./types";

const STORAGE_KEY = "we-go-jim-settings";

function clearStorage() {
  localStorage.clear();
}

const defaults: AppSettings = {
  restTimerSeconds: 150,
  weightUnit: "kg",
  darkMode: "system",
};

describe("settings-store", () => {
  beforeEach(() => {
    clearStorage();
  });

  describe("getDefaultWeightUnit", () => {
    it("returns 'lb' for US/Imperial locales", () => {
      // Simulate US locale
      const mockLanguage = "en-US";
      const result = getDefaultWeightUnit(mockLanguage);
      expect(result).toBe("lb");
    });

    it("returns 'lb' for en-US variants", () => {
      expect(getDefaultWeightUnit("en-US")).toBe("lb");
      expect(getDefaultWeightUnit("en-UK")).toBe("lb"); // en-UK is unusual but uses imperial
    });

    it("returns 'kg' for non-US locales", () => {
      expect(getDefaultWeightUnit("en-AU")).toBe("kg");
      expect(getDefaultWeightUnit("fr-FR")).toBe("kg");
      expect(getDefaultWeightUnit("de-DE")).toBe("kg");
      expect(getDefaultWeightUnit("ja-JP")).toBe("kg");
      expect(getDefaultWeightUnit("zh-CN")).toBe("kg");
    });

    it("falls back to 'kg' for unknown locales", () => {
      expect(getDefaultWeightUnit("xx-XX")).toBe("kg");
    });
  });

  describe("loadSettings", () => {
    it("returns defaults when nothing is stored", () => {
      const settings = loadSettings();
      expect(settings.restTimerSeconds).toBe(150);
      expect(settings.darkMode).toBe("system");
    });

    it("returns defaults when stored value is invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not-json");
      const settings = loadSettings();
      expect(settings.restTimerSeconds).toBe(150);
    });

    it("merges stored values with defaults (partial save)", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ restTimerSeconds: 90 }),
      );
      const settings = loadSettings();
      expect(settings.restTimerSeconds).toBe(90);
      expect(settings.darkMode).toBe("system");
    });

    it("loads all stored settings", () => {
      const stored: PersistedSettings = {
        restTimerSeconds: 60,
        weightUnit: "lb",
        darkMode: "dark",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
      const settings = loadSettings();
      expect(settings.restTimerSeconds).toBe(60);
      expect(settings.weightUnit).toBe("lb");
      expect(settings.darkMode).toBe("dark");
    });

    it("coerces weightUnit to 'kg' or 'lb'", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ weightUnit: "invalid" }),
      );
      const settings = loadSettings("de-DE");
      expect(settings.weightUnit).toBe("kg");
    });

    it("coerces darkMode to 'light', 'dark', or 'system'", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ darkMode: "invalid" }),
      );
      const settings = loadSettings();
      expect(settings.darkMode).toBe("system");
    });

    it("coerces restTimerSeconds to a non-negative integer", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ restTimerSeconds: -10 }),
      );
      const settings = loadSettings();
      expect(settings.restTimerSeconds).toBe(0);
    });

    it("coerces non-numeric restTimerSeconds to default", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ restTimerSeconds: "abc" }),
      );
      const settings = loadSettings();
      expect(settings.restTimerSeconds).toBe(150);
    });
  });

  describe("saveSettings", () => {
    it("persists settings to localStorage", () => {
      const settings: AppSettings = {
        restTimerSeconds: 90,
        weightUnit: "lb",
        darkMode: "dark",
      };
      saveSettings(settings);
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.restTimerSeconds).toBe(90);
      expect(parsed.weightUnit).toBe("lb");
      expect(parsed.darkMode).toBe("dark");
    });
  });

  describe("round-trip", () => {
    it("save then load returns the same settings", () => {
      const settings: AppSettings = {
        restTimerSeconds: 45,
        weightUnit: "lb",
        darkMode: "light",
      };
      saveSettings(settings);
      const loaded = loadSettings();
      expect(loaded).toEqual(settings);
    });

    it("loadSettings infers default weightUnit when not stored", () => {
      // When weightUnit is not set, it should use locale default
      const result = loadSettings("en-US");
      expect(result.weightUnit).toBe("lb");
    });

    it("stored weightUnit overrides locale-default", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ weightUnit: "kg" }),
      );
      const result = loadSettings("en-US");
      expect(result.weightUnit).toBe("kg");
    });
  });
});