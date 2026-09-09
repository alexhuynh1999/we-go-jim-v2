import type { WorkoutSession, WorkoutTemplate, AppSettings } from "./types";
import {
  listSessions,
  listTemplates,
  clearAllData,
  saveSession,
  saveTemplate,
} from "./session-store";
import { loadSettings, saveSettings } from "./settings-store";
import { getCustomExercises, saveCustomExercise, } from "./exercise-store";

/**
 * Schema version for backup files.
 * Increment the major version on breaking changes.
 */
export const CURRENT_VERSION = "1.0";

/**
 * Structure of an exported backup file.
 */
export interface BackupData {
  version: string;
  exportedAt: string;
  workouts: WorkoutSession[];
  templates: WorkoutTemplate[];
  customExercises: unknown[];
  settings: Partial<AppSettings>;
}

/**
 * Generates the filename for a backup export.
 */
export function getBackupFilename(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `we-go-jim-backup-${today}.json`;
}

/**
 * Exports all local data as a BackupData object.
 */
export async function exportAllData(): Promise<BackupData> {
  const [workouts, templates, customExercises] = await Promise.all([
    listSessions(),
    listTemplates(),
    getCustomExercises(),
  ]);

  const settings = loadSettings();

  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    workouts,
    templates,
    customExercises,
    settings,
  };
}

/**
 * Result of a backup validation.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Result of individual item validation.
 */
export interface ImportItemError {
  index: number;
  type: "workout" | "template" | "customExercise";
  id: string | null | undefined;
  reason: string;
}

/**
 * Validates a backup JSON structure.
 * Checks: required keys, version compatibility, array types.
 */
export function validateBackup(data: unknown): ValidationResult {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Backup must be a JSON object" };
  }

  const backup = data as Record<string, unknown>;

  // Check version field
  if (typeof backup.version !== "string" || !backup.version) {
    return { valid: false, error: "Missing or invalid 'version' field" };
  }

  // Check major version compatibility
  const appMajor = CURRENT_VERSION.split(".")[0];
  const fileMajor = backup.version.split(".")[0];
  if (appMajor && fileMajor && appMajor !== fileMajor) {
    return {
      valid: false,
      error: `Major version mismatch: file v${fileMajor}, app v${appMajor}`,
    };
  }

  // Check required fields
  const requiredFields = [
    "exportedAt",
    "workouts",
    "templates",
    "customExercises",
    "settings",
  ] as const;
  for (const field of requiredFields) {
    if (!(field in backup)) {
      return { valid: false, error: `Missing required field: '${field}'` };
    }
  }

  // Check array types
  if (!Array.isArray(backup.workouts)) {
    return { valid: false, error: "'workouts' must be an array" };
  }
  if (!Array.isArray(backup.templates)) {
    return { valid: false, error: "'templates' must be an array" };
  }
  if (!Array.isArray(backup.customExercises)) {
    return { valid: false, error: "'customExercises' must be an array" };
  }

  return { valid: true };
}

/**
 * Validate every individual item in a backup.
 * Returns a list of items with invalid or missing IDs.
 */
export function validateImportItems(backup: BackupData): ImportItemError[] {
  const errors: ImportItemError[] = [];

  for (let i = 0; i < backup.workouts.length; i++) {
    const w = backup.workouts[i];
    if (typeof w?.id !== "string" || !w.id) {
      errors.push({
        index: i,
        type: "workout",
        id: w?.id ?? null,
        reason: !w ? "item is null or undefined" : typeof w.id !== "string" ? `'id' is type '${typeof w.id}', expected string` : "'id' is an empty string",
      });
    }
  }

  for (let i = 0; i < backup.templates.length; i++) {
    const t = backup.templates[i];
    if (typeof t?.id !== "string" || !t.id) {
      errors.push({
        index: i,
        type: "template",
        id: t?.id ?? null,
        reason: !t ? "item is null or undefined" : typeof t.id !== "string" ? `'id' is type '${typeof t.id}', expected string` : "'id' is an empty string",
      });
    }
  }

  for (let i = 0; i < backup.customExercises.length; i++) {
    const e = backup.customExercises[i];
    const obj = e as Record<string, unknown> | null | undefined;
    if (typeof obj?.id !== "string" || !obj.id) {
      errors.push({
        index: i,
        type: "customExercise",
        id: obj?.id as string | null | undefined ?? null,
        reason: !obj ? "item is null or undefined" : typeof obj.id !== "string" ? `'id' is type '${typeof obj.id}', expected string` : "'id' is an empty string",
      });
    }
  }

  return errors;
}

/**
 * Imports backup data, replacing all local data.
 * Validates every item before clearing, so nothing is lost on failure.
 */
export async function importAllData(backup: BackupData): Promise<void> {
  // Validate every item BEFORE clearing
  const itemErrors = validateImportItems(backup);
  if (itemErrors.length > 0) {
    const details = itemErrors
      .slice(0, 5)
      .map((e) => `  ${e.type}[${e.index}]: ${e.reason} (id=${JSON.stringify(e.id)})`)
      .join("\n");
    const suffix = itemErrors.length > 5
      ? `\n  ... and ${itemErrors.length - 5} more`
      : "";
    throw new Error(
      `Import failed: ${itemErrors.length} item(s) have invalid or missing 'id' fields. ` +
      `Every workout, template, and custom exercise needs a valid string 'id'.\n${details}${suffix}`,
    );
  }

  // Clear existing data only after validation passes
  await clearAllData();

  // Import settings
  if (backup.settings && Object.keys(backup.settings).length > 0) {
    const current = loadSettings();
    saveSettings({ ...current, ...backup.settings });
  }

  // Import data
  const ops: Promise<void>[] = [];

  // Import custom exercises
  for (const exercise of backup.customExercises) {
    ops.push(saveCustomExercise(exercise as any));
  }
  for (const workout of backup.workouts) {
    ops.push(saveSession(workout));
  }
  for (const template of backup.templates) {
    ops.push(saveTemplate(template));
  }
  await Promise.all(ops);
}