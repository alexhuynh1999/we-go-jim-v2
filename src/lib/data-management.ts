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
 * Imports backup data, replacing all local data.
 * The caller MUST validate before calling this.
 */
export async function importAllData(backup: BackupData): Promise<void> {
  // Clear existing data
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