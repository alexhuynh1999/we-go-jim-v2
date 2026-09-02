import type { AppSettings, DarkModeSetting, WeightUnit } from "./types";

const STORAGE_KEY = "we-go-jim-settings";

/**
 * Storable shape — matches AppSettings without defaults injected.
 */
export interface PersistedSettings {
  restTimerSeconds?: number;
  weightUnit?: WeightUnit;
  darkMode?: DarkModeSetting;
}

const DEFAULT_REST_TIMER = 150;
const DEFAULT_DARK_MODE: DarkModeSetting = "system";

/**
 * Returns the default weight unit based on locale.
 * US/Imperial locales → lb, everything else → kg.
 */
export function getDefaultWeightUnit(
  locale: string = "en-US",
): WeightUnit {
  // US locale and related imperial-using regions default to lb
  const imperialLocales = ["en-US", "en-UK", "en-GB", "en-CA"];
  const lang = locale.slice(0, 5);
  return imperialLocales.includes(lang) ? "lb" : "kg";
}

function isWeightUnit(v: unknown): v is WeightUnit {
  return v === "kg" || v === "lb";
}

function isDarkModeSetting(v: unknown): v is DarkModeSetting {
  return v === "light" || v === "dark" || v === "system";
}

/**
 * Load settings from localStorage, merging with defaults.
 * Pass a locale string to infer default weightUnit when not stored.
 */
export function loadSettings(
  locale: string = typeof navigator !== "undefined"
    ? navigator.language
    : "en-US",
): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        restTimerSeconds: DEFAULT_REST_TIMER,
        weightUnit: getDefaultWeightUnit(locale),
        darkMode: DEFAULT_DARK_MODE,
      };
    }

    const stored: PersistedSettings = JSON.parse(raw);
    const restTimerSeconds =
      typeof stored.restTimerSeconds === "number" &&
      !Number.isNaN(stored.restTimerSeconds)
        ? Math.max(0, Math.floor(stored.restTimerSeconds))
        : DEFAULT_REST_TIMER;

    const weightUnit =
      stored.weightUnit !== undefined && isWeightUnit(stored.weightUnit)
        ? stored.weightUnit
        : getDefaultWeightUnit(locale);

    const darkMode =
      stored.darkMode !== undefined && isDarkModeSetting(stored.darkMode)
        ? stored.darkMode
        : DEFAULT_DARK_MODE;

    return { restTimerSeconds, weightUnit, darkMode };
  } catch {
    return {
      restTimerSeconds: DEFAULT_REST_TIMER,
      weightUnit: getDefaultWeightUnit(locale),
      darkMode: DEFAULT_DARK_MODE,
    };
  }
}

/**
 * Persist settings to localStorage.
 */
export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      restTimerSeconds: settings.restTimerSeconds,
      weightUnit: settings.weightUnit,
      darkMode: settings.darkMode,
    }),
  );
}