<script lang="ts">
  import { exportAllData, importAllData, validateBackup, getBackupFilename, type BackupData } from "../lib/data-management.js";
  import { clearAllData } from "../lib/session-store.js";
  import { listSessions, listTemplates } from "../lib/session-store.js";

  let {
    onback = undefined as (() => void) | undefined,
  } = $props();

  // ─── State ───
  let busy = $state(false);
  let statusMessage = $state<string | null>(null);
  let statusType = $state<"success" | "error" | null>(null);

  // Import flow state
  let importPreview = $state<{
    workoutCount: number;
    templateCount: number;
    version: string;
    exportedAt: string;
  } | null>(null);
  let importData = $state<BackupData | null>(null);
  let typedConfirm = $state("");

  // Clear flow state
  let showClearConfirm = $state(false);
  let clearTyped = $state("");

  // Stats for clear modal
  let sessionCount = $state(0);
  let templateCount = $state(0);

  function showStatus(msg: string, type: "success" | "error") {
    statusMessage = msg;
    statusType = type;
    setTimeout(() => {
      statusMessage = null;
      statusType = null;
    }, 3000);
  }

  // ─── Export ───
  async function handleExport() {
    busy = true;
    try {
      const backup = await exportAllData();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getBackupFilename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showStatus("Backup downloaded successfully", "success");
    } catch (err) {
      showStatus(`Export failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    } finally {
      busy = false;
    }
  }

  // ─── Import ───
  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const raw = JSON.parse(reader.result as string);
        const validation = validateBackup(raw);
        if (!validation.valid) {
          showStatus(`Import validation failed: ${validation.error}`, "error");
          return;
        }
        const backup = raw as BackupData;
        importPreview = {
          workoutCount: backup.workouts.length,
          templateCount: backup.templates.length,
          version: backup.version,
          exportedAt: backup.exportedAt,
        };
        importData = backup;
        typedConfirm = "";
      } catch {
        showStatus("Invalid JSON file", "error");
      }
    };
    reader.readAsText(file);
    // Reset the input so re-selecting the same file triggers change
    input.value = "";
  }

  async function confirmImport() {
    if (!importData || typedConfirm !== "REPLACE") return;
    busy = true;
    try {
      await importAllData(importData);
      importPreview = null;
      importData = null;
      typedConfirm = "";
      showStatus("Data imported successfully. All previous data has been replaced.", "success");
    } catch (err) {
      showStatus(`Import failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    } finally {
      busy = false;
    }
  }

  function cancelImport() {
    importPreview = null;
    importData = null;
    typedConfirm = "";
  }

  // ─── Clear All Data ───
  async function prepareClear() {
    try {
      const sessions = await listSessions();
      const templates = await listTemplates();
      sessionCount = sessions.length;
      templateCount = templates.length;
    } catch {
      sessionCount = 0;
      templateCount = 0;
    }
    showClearConfirm = true;
    clearTyped = "";
  }

  async function confirmClear() {
    if (clearTyped !== "RESET") return;
    busy = true;
    try {
      await clearAllData();
      showClearConfirm = false;
      clearTyped = "";
      showStatus("All data has been cleared.", "success");
    } catch (err) {
      showStatus(`Clear failed: ${err instanceof Error ? err.message : "Unknown error"}`, "error");
    } finally {
      busy = false;
    }
  }

  function cancelClear() {
    showClearConfirm = false;
    clearTyped = "";
  }
</script>

<div class="data-page">
  <header class="page-header">
    <button class="back-btn" onclick={() => onback?.()}>
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h2>Data Management</h2>
  </header>

  {#if statusMessage}
    <div class="toast" class:toast-error={statusType === "error"} class:toast-success={statusType === "success"}>
      <span class="material-symbols-outlined toast-icon">
        {statusType === "error" ? "error" : "check_circle"}
      </span>
      {statusMessage}
    </div>
  {/if}

  <section class="data-group">
    <h3 class="group-label">Backup</h3>

    <!-- Export -->
    <button class="action-row" onclick={handleExport} disabled={busy}>
      <div class="action-icon-wrap">
        <span class="material-symbols-outlined action-icon">file_download</span>
      </div>
      <div class="action-info">
        <span class="action-label">Export Data</span>
        <span class="action-desc">Download a JSON backup of all workouts, templates, and settings</span>
      </div>
      <span class="material-symbols-outlined action-chevron">download</span>
    </button>

    <!-- Import -->
    <label class="action-row" class:disabled={busy}>
      <div class="action-icon-wrap">
        <span class="material-symbols-outlined action-icon">file_upload</span>
      </div>
      <div class="action-info">
        <span class="action-label">Import Data</span>
        <span class="action-desc">Restore from a backup file — replaces all current data</span>
      </div>
      <span class="material-symbols-outlined action-chevron">upload</span>
      <input
        type="file"
        accept=".json,application/json"
        class="file-input"
        onchange={handleFileSelect}
        aria-label="Select backup file to import"
      />
    </label>
  </section>

  <section class="data-group data-group--danger">
    <h3 class="group-label group-label--danger">Danger Zone</h3>

    <!-- Clear All Data -->
    <button class="action-row action-row--danger" onclick={prepareClear} disabled={busy}>
      <div class="action-icon-wrap action-icon-wrap--danger">
        <span class="material-symbols-outlined action-icon action-icon--danger">delete_forever</span>
      </div>
      <div class="action-info">
        <span class="action-label action-label--danger">Clear All Data</span>
        <span class="action-desc">Permanently delete all workouts, templates, and settings</span>
      </div>
      <span class="material-symbols-outlined action-chevron action-chevron--danger">chevron_right</span>
    </button>
  </section>
</div>

<!-- ─── Import Preview Modal ─── -->
{#if importPreview}
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Import preview"
    tabindex="0"
    onclick={cancelImport}
    onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') cancelImport(); }}
  >
    <div class="modal-sheet" onclick={(e: MouseEvent) => e.stopPropagation()} role="presentation">
      <div class="modal-header">
        <span class="material-symbols-outlined modal-header-icon">file_upload</span>
        <h3 class="modal-title">Import Backup</h3>
      </div>

      <div class="modal-body">
        <p class="modal-warning">
          This will <strong>replace all current data</strong> with the backup contents.
          This action cannot be undone.
        </p>
        <div class="preview-stats">
          <div class="preview-stat">
            <span class="preview-stat-label">Backup version</span>
            <span class="preview-stat-value">{importPreview.version}</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Exported at</span>
            <span class="preview-stat-value">{importPreview.exportedAt}</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Workouts</span>
            <span class="preview-stat-value">{importPreview.workoutCount}</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Templates</span>
            <span class="preview-stat-value">{importPreview.templateCount}</span>
          </div>
        </div>
      </div>

      <div class="modal-confirm">
        <p class="confirm-label">
          Type <strong>REPLACE</strong> to confirm
        </p>
        <input
          type="text"
          class="confirm-input"
          bind:value={typedConfirm}
          placeholder="type REPLACE"
          disabled={busy}
        />
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn--cancel" onclick={cancelImport} disabled={busy}>
          Cancel
        </button>
        <button
          class="modal-btn modal-btn--danger"
          onclick={confirmImport}
          disabled={typedConfirm !== "REPLACE" || busy}
        >
          {busy ? "Importing…" : "Replace Data"}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ─── Clear All Data Modal ─── -->
{#if showClearConfirm}
  <div
    class="modal-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Clear all data confirmation"
    tabindex="0"
    onclick={cancelClear}
    onkeydown={(e: KeyboardEvent) => { if (e.key === 'Escape') cancelClear(); }}
  >
    <div class="modal-sheet" onclick={(e: MouseEvent) => e.stopPropagation()} role="presentation">
      <div class="modal-header modal-header--danger">
        <span class="material-symbols-outlined modal-header-icon modal-header-icon--danger">warning</span>
        <h3 class="modal-title">Clear All Data</h3>
      </div>

      <div class="modal-body">
        <p class="modal-warning">
          This will permanently delete all your workout data. This action <strong>cannot be undone</strong>.
        </p>
        <div class="preview-stats">
          <div class="preview-stat">
            <span class="preview-stat-label">Workouts</span>
            <span class="preview-stat-value">{sessionCount}</span>
          </div>
          <div class="preview-stat">
            <span class="preview-stat-label">Templates</span>
            <span class="preview-stat-value">{templateCount}</span>
          </div>
        </div>
      </div>

      <div class="modal-confirm">
        <p class="confirm-label">
          Type <strong>RESET</strong> to confirm
        </p>
        <input
          type="text"
          class="confirm-input"
          bind:value={clearTyped}
          placeholder="type RESET"
          disabled={busy}
        />
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn--cancel" onclick={cancelClear} disabled={busy}>
          Cancel
        </button>
        <button
          class="modal-btn modal-btn--danger"
          onclick={confirmClear}
          disabled={clearTyped !== "RESET" || busy}
        >
          {busy ? "Clearing…" : "Delete Everything"}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .data-page {
    padding: var(--space-container-padding, 24px) var(--space-gutter, 16px);
    max-width: 480px;
    margin: 0 auto;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: var(--space-stack-md, 24px);
  }
  .page-header h2 {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-lg-mobile, 28px);
    font-weight: 600;
    line-height: var(--text-headline-lg-mobile-lh, 36px);
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }
  .back-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    color: var(--on-surface, #1b1c1c);
    flex-shrink: 0;
    transition: background 0.2s;
  }
  .back-btn:hover {
    background: var(--surface-container, #f0eded);
  }

  /* ─── Toast ─── */
  .toast {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    border-radius: var(--radius-md, 0.5rem);
    margin-bottom: var(--space-stack-sm, 12px);
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body, Inter, sans-serif);
    animation: slideIn 0.3s ease;
  }
  .toast-success {
    background: var(--primary-container, #4a5d4e);
    color: var(--on-primary-container, #c0d5c2);
  }
  .toast-error {
    background: var(--error-container, #ffdad6);
    color: var(--on-error-container, #93000a);
  }
  .toast-icon {
    font-size: 20px;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* ─── Data groups ─── */
  .data-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-stack-sm, 12px);
    margin-bottom: var(--space-stack-md, 24px);
  }
  .data-group--danger {
    margin-top: var(--space-stack-md, 24px);
    padding-top: var(--space-stack-md, 24px);
    border-top: 1px solid var(--outline-variant, #c3c8c1);
  }

  .group-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-md, 14px);
    font-weight: 600;
    line-height: var(--text-label-md-lh, 20px);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--outline, #737872);
    margin: 0;
    padding: 0 8px;
  }
  .group-label--danger {
    color: var(--error, #ba1a1a);
  }

  /* ─── Action rows ─── */
  .action-row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: var(--radius-xl, 1rem);
    background: var(--surface-container-low, #f6f3f2);
    cursor: pointer;
    transition: transform 0.15s, opacity 0.2s;
    text-align: left;
    font-family: inherit;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
    position: relative;
    overflow: hidden;
  }
  .action-row:active {
    transform: scale(0.98);
  }
  .action-row.disabled {
    opacity: 0.6;
    cursor: default;
  }
  .action-row--danger {
    border: 1px solid var(--error-container, #ffdad6);
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .action-icon-wrap {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-full, 9999px);
    flex-shrink: 0;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  }
  .action-icon-wrap--danger {
    background: var(--error-container, #ffdad6);
  }

  .action-icon {
    font-size: 22px;
    color: var(--primary, #334537);
    font-variation-settings: 'FILL' 1;
  }
  .action-icon--danger {
    color: var(--error, #ba1a1a);
  }

  .action-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .action-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
  }
  .action-label--danger {
    color: var(--error, #ba1a1a);
  }
  .action-desc {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    font-weight: 400;
  }
  .action-chevron {
    font-size: 20px;
    color: var(--outline, #737872);
  }
  .action-chevron--danger {
    color: var(--error, #ba1a1a);
  }

  /* ─── Modal ─── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 16px;
  }
  .modal-sheet {
    width: 100%;
    max-width: 400px;
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-xl, 1rem) var(--radius-xl, 1rem) 0 0;
    padding: 24px;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  .modal-header--danger .modal-header-icon {
    color: var(--error, #ba1a1a);
  }
  .modal-header-icon {
    font-size: 28px;
    color: var(--primary, #334537);
    font-variation-settings: 'FILL' 1;
  }
  .modal-header-icon--danger {
    color: var(--error, #ba1a1a);
  }
  .modal-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }

  .modal-body {
    margin-bottom: 20px;
  }
  .modal-warning {
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    line-height: 1.5;
    margin: 0 0 16px 0;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .preview-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .preview-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: var(--surface-container-low, #f6f3f2);
    padding: 12px;
    border-radius: var(--radius-md, 0.5rem);
  }
  .preview-stat-label {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
    font-weight: 500;
  }
  .preview-stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-variant-numeric: tabular-nums;
  }

  .modal-confirm {
    margin-bottom: 20px;
  }
  .confirm-label {
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 8px 0;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .confirm-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface-container-low, #f6f3f2);
    color: var(--on-surface, #1b1c1c);
    font-size: 16px;
    font-weight: 600;
    font-family: var(--font-body, Inter, sans-serif);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    outline: none;
    transition: border-color 0.2s;
  }
  .confirm-input:focus {
    border-color: var(--primary, #334537);
  }

  .modal-actions {
    display: flex;
    gap: 12px;
  }
  .modal-btn {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .modal-btn:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .modal-btn--cancel {
    background: var(--surface-container-high, #eae7e7);
    color: var(--on-surface, #1b1c1c);
  }
  .modal-btn--danger {
    background: var(--error, #ba1a1a);
    color: var(--on-error, #ffffff);
  }
</style>