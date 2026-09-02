import { writable, derived } from "svelte/store";
import type { AppSettings, DarkModeSetting } from "./types";
import { loadSettings, saveSettings } from "./settings-store";

function createSettingsStore() {
  const initial = loadSettings();
  const { subscribe, set, update } = writable<AppSettings>(initial);

  return {
    subscribe,
    /** Persist and broadcast a full settings object. */
    set(settings: AppSettings) {
      saveSettings(settings);
      set(settings);
    },
    /** Merge partial updates into current settings. */
    patch(partial: Partial<AppSettings>) {
      update((current) => {
        const next = { ...current, ...partial };
        saveSettings(next);
        return next;
      });
    },
  };
}

export const settings = createSettingsStore();

/**
 * Derived store: the effective dark mode, resolved against system preference.
 */
export const effectiveDarkMode = derived(
  settings,
  ($settings): boolean => {
    if ($settings.darkMode === "dark") return true;
    if ($settings.darkMode === "light") return false;
    // 'system' — check prefers-color-scheme
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  },
);