<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
  import { listSessions, deleteSession, saveSession } from "../lib/session-store.js";
  import type { WorkoutSession, ExerciseSet } from "../lib/types.js";
  import {
    removeSetFromSession,
    updateSetInSession,
    addSetToSession,
    formatDuration,
    getDurationSeconds,
  } from "../lib/history-utils.js";
  import SetRow from "../lib/SetRow.svelte";

  let sessions = $state<WorkoutSession[]>([]);
  let loading = $state(true);

  $effect(() => {
    listSessions().then((all) => {
      // Only show finished sessions (endedAt !== null), most recent first
      sessions = all.filter((s) => s.endedAt !== null);
      loading = false;
    });
  });

  // Group sessions by month
  let groupedSessions = $derived.by(() => {
    const groups: { month: string; sessions: WorkoutSession[] }[] = [];
    for (const session of sessions) {
      const d = new Date(session.startedAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      let group = groups.find((g) => g.month === monthKey);
      if (!group) {
        group = { month: monthKey, sessions: [] };
        groups.push(group);
      }
      group.sessions.push(session);
    }
    return groups;
  });

  function getDayLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  }

  function getSetCount(session: WorkoutSession): number {
    return session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }

  // ─── Detail view state ───
  let viewingSession = $state<WorkoutSession | null>(null);
  // Track which sets are in "edit" mode: Map<`${exerciseIdx}-${setIdx}`, initialSnapshot>
  let editingSets = $state<Map<string, ExerciseSet>>(new Map());
  // Track which sets have been modified (dirty state for ✓/✗ toggling)
  let dirtySets = $state<Map<string, ExerciseSet>>(new Map());

  // Delete confirmation state
  let showDeleteConfirm = $state(false);
  let sessionToDelete = $state<WorkoutSession | null>(null);

  function viewDetail(session: WorkoutSession) {
    viewingSession = session;
    editingSets = new Map();
    dirtySets = new Map();
  }

  function backToList() {
    viewingSession = null;
    editingSets = new Map();
    dirtySets = new Map();
  }

  // ─── Inline editing ───

  function startEditing(exIdx: number, setIdx: number) {
    const key = `${exIdx}-${setIdx}`;
    const set = viewingSession?.exercises[exIdx]?.sets[setIdx];
    if (!set) return;
    // Snapshot the current values so we can discard
    const newEditing = new Map(editingSets);
    newEditing.set(key, { ...set });
    editingSets = newEditing;
    // Also track current dirty state
    const newDirty = new Map(dirtySets);
    newDirty.set(key, { ...set });
    dirtySets = newDirty;
  }

  function isEditing(exIdx: number, setIdx: number): boolean {
    return editingSets.has(`${exIdx}-${setIdx}`);
  }

  function updateDirtySet(exIdx: number, setIdx: number, updated: ExerciseSet) {
    const key = `${exIdx}-${setIdx}`;
    const newDirty = new Map(dirtySets);
    newDirty.set(key, updated);
    dirtySets = newDirty;
  }

  function saveSet(exIdx: number, setIdx: number) {
    const key = `${exIdx}-${setIdx}`;
    const updated = dirtySets.get(key);
    if (!updated || !viewingSession) return;
    // Apply the update to the session
    const newSession = updateSetInSession(viewingSession, exIdx, setIdx, updated);
    saveSession(newSession);
    viewingSession = newSession;
    // Update the sessions list in-place (for heaviest-set retroactive updates)
    sessions = sessions.map((s) => (s.id === newSession.id ? newSession : s));
    // Clear editing state for this set
    const newEditing = new Map(editingSets);
    newEditing.delete(key);
    editingSets = newEditing;
    const newDirty = new Map(dirtySets);
    newDirty.delete(key);
    dirtySets = newDirty;
  }

  function discardSet(exIdx: number, setIdx: number) {
    const key = `${exIdx}-${setIdx}`;
    const snapshot = editingSets.get(key);
    if (!snapshot || !viewingSession) return;
    // Restore from snapshot
    const newSession = updateSetInSession(viewingSession, exIdx, setIdx, snapshot);
    viewingSession = newSession;
    // Clear editing state
    const newEditing = new Map(editingSets);
    newEditing.delete(key);
    editingSets = newEditing;
    const newDirty = new Map(dirtySets);
    newDirty.delete(key);
    dirtySets = newDirty;
  }

  // ─── Add / delete sets ───

  function handleDeleteSet(exIdx: number, setIdx: number) {
    if (!viewingSession) return;
    const newSession = removeSetFromSession(viewingSession, exIdx, setIdx);
    saveSession(newSession);
    viewingSession = newSession;
    sessions = sessions.map((s) => (s.id === newSession.id ? newSession : s));
    // Clear any editing state for this exercise since indices may have shifted
    editingSets = new Map();
    dirtySets = new Map();
  }

  function handleAddSet(exIdx: number) {
    if (!viewingSession) return;
    const newSession = addSetToSession(viewingSession, exIdx);
    saveSession(newSession);
    viewingSession = newSession;
    sessions = sessions.map((s) => (s.id === newSession.id ? newSession : s));
  }

  // ─── Delete workout ───

  function promptDeleteWorkout(session: WorkoutSession) {
    sessionToDelete = session;
    showDeleteConfirm = true;
  }

  function confirmDeleteWorkout() {
    if (!sessionToDelete) return;
    deleteSession(sessionToDelete.id);
    sessions = sessions.filter((s) => s.id !== sessionToDelete!.id);
    if (viewingSession?.id === sessionToDelete.id) {
      viewingSession = null;
    }
    sessionToDelete = null;
    showDeleteConfirm = false;
  }

  function cancelDeleteWorkout() {
    sessionToDelete = null;
    showDeleteConfirm = false;
  }
</script>

<div class="history-page">
  {#if viewingSession}
    <!-- ─── Detail View ─── -->
    <div class="detail-view">
      <!-- Detail header -->
      <div class="detail-header">
        <button class="back-btn" onclick={backToList}>
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="detail-header-info">
          <h2 class="detail-title">{viewingSession.name}</h2>
          <span class="detail-subtitle">
            {getDayLabel(viewingSession.startedAt)}
            {#if viewingSession.endedAt}
              · {formatDuration(getDurationSeconds(viewingSession.startedAt, viewingSession.endedAt))}
            {/if}
            · {getSetCount(viewingSession)} sets
          </span>
        </div>
        <button class="delete-workout-btn" onclick={() => promptDeleteWorkout(viewingSession!)} aria-label="Delete workout">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>

      <!-- Exercises -->
      <div class="detail-exercises">
        {#each viewingSession.exercises as exercise, exIdx}
          <div class="detail-exercise-card">
            <div class="detail-exercise-header">
              <span class="detail-exercise-name">{exercise.exerciseName}</span>
              <span class="detail-exercise-equipment">{exercise.equipment}</span>
            </div>

            <div class="detail-sets-list">
              {#each exercise.sets as set, setIdx}
                <div class="detail-set-row">
                  {#if isEditing(exIdx, setIdx)}
                    <!-- Edit mode -->
                    <SetRow
                      set={dirtySets.get(`${exIdx}-${setIdx}`) ?? set}
                      fields={exercise.fields}
                      index={setIdx}
                      showComplete={false}
                      onUpdate={(updated: ExerciseSet) => updateDirtySet(exIdx, setIdx, updated)}
                      onDelete={(e: MouseEvent) => {
                        e.preventDefault();
                        handleDeleteSet(exIdx, setIdx);
                      }}
                      onComplete={() => {}}
                      lastSessionSet={null}
                    />
                    <div class="edit-actions">
                      <button class="edit-action-btn save-btn" onclick={() => saveSet(exIdx, setIdx)} aria-label="Save set">
                        <span class="material-symbols-outlined">check</span>
                      </button>
                      <button class="edit-action-btn discard-btn" onclick={() => discardSet(exIdx, setIdx)} aria-label="Discard changes">
                        <span class="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  {:else}
                    <!-- Read-only mode -->
                    <div class="readonly-set">
                      <span class="set-label">Set {setIdx + 1}</span>
                      <div class="set-values">
                        {#if exercise.fields.includes("weight") && exercise.fields.includes("reps")}
                          <span class="set-value">{set.weight ?? "—"} kg</span>
                          <span class="set-sep">×</span>
                          <span class="set-value">{set.reps ?? "—"} reps</span>
                        {:else if exercise.fields.includes("time") && exercise.fields.includes("distance")}
                          <span class="set-value">{set.duration ? `${Math.round(set.duration / 60)} min` : "—"}</span>
                          <span class="set-sep">·</span>
                          <span class="set-value">{set.distance ?? "—"} km</span>
                        {:else if exercise.fields.includes("reps") && !exercise.fields.includes("weight")}
                          <span class="set-value">{set.reps ?? "—"} reps</span>
                        {:else if exercise.fields.includes("time") && !exercise.fields.includes("distance")}
                          <span class="set-value">{set.duration ?? "—"} s</span>
                        {:else if exercise.fields.includes("weight") && exercise.fields.includes("time")}
                          <span class="set-value">{set.weight ?? "—"} kg</span>
                          <span class="set-sep">·</span>
                          <span class="set-value">{set.duration ?? "—"} s</span>
                        {:else}
                          <span class="set-value">{set.weight ?? set.reps ?? set.duration ?? set.distance ?? "—"}</span>
                        {/if}
                        {#if set.notes}
                          <span class="set-notes">{set.notes}</span>
                        {/if}
                      </div>
                      <div class="readonly-actions">
                        <button class="set-action-btn" onclick={() => startEditing(exIdx, setIdx)} aria-label="Edit set">
                          <span class="material-symbols-outlined">edit</span>
                        </button>
                        <button class="set-action-btn set-action-btn--danger" onclick={() => handleDeleteSet(exIdx, setIdx)} aria-label="Delete set">
                          <span class="material-symbols-outlined">remove_circle</span>
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            </div>

            <button class="add-set-btn" onclick={() => handleAddSet(exIdx)}>
              <span class="material-symbols-outlined">add</span>
              <span>Add Set</span>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- ─── List View ─── -->
    <header class="page-header">
      <h2>History</h2>
    </header>

    {#if loading}
      <p class="loading-text">Loading...</p>
    {:else if sessions.length === 0}
      <EmptyState
        icon="calendar_month"
        title="No Workouts Yet"
        description="Your completed workouts will appear here, grouped by month. Start logging to build your history."
        action={{ label: "Start a Workout", onclick: () => navigateTo("home") }}
      />
    {:else}
      {#each groupedSessions as group}
        <div class="month-group">
          <h3 class="month-label">{group.sessions[0]?.startedAt ? new Date(group.sessions[0].startedAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : ""}</h3>
          {#each group.sessions as session}
            <div class="history-card" onclick={() => viewDetail(session)} role="button" tabindex="0" onkeydown={(e) => e.key === "Enter" && viewDetail(session)}>
              <div class="hc-header">
                <span class="hc-day">{getDayLabel(session.startedAt)}</span>
                <span class="hc-name">{session.name}</span>
              </div>
              <div class="hc-stats">
                <span class="hc-stat">
                  <span class="hc-stat-value">{session.exercises.length}</span>
                  <span class="hc-stat-label">exercises</span>
                </span>
                <span class="hc-stat-divider">·</span>
                <span class="hc-stat">
                  <span class="hc-stat-value">{getSetCount(session)}</span>
                  <span class="hc-stat-label">sets</span>
                </span>
                {#if session.endedAt}
                  <span class="hc-stat-divider">·</span>
                  <span class="hc-stat">
                    <span class="hc-stat-value">{formatDuration(getDurationSeconds(session.startedAt, session.endedAt))}</span>
                    <span class="hc-stat-label"></span>
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/each}
    {/if}
  {/if}
</div>

<!-- ─── Delete Workout Bottom-Sheet Modal ─── -->
{#if showDeleteConfirm && sessionToDelete}
  <div class="delete-overlay" onclick={cancelDeleteWorkout} role="dialog" aria-label="Delete workout confirmation">
    <div class="delete-sheet" onclick={(e) => e.stopPropagation()} role="document">
      <div class="delete-icon-wrap">
        <span class="material-symbols-outlined delete-icon">delete</span>
      </div>
      <h3 class="delete-title">Delete Workout?</h3>
      <div class="delete-info">
        <p class="delete-name">{sessionToDelete.name}</p>
        <p class="delete-meta">
          {getDayLabel(sessionToDelete.startedAt)}
          · {sessionToDelete.exercises.length} exercises
          · {getSetCount(sessionToDelete)} sets
          {#if sessionToDelete.endedAt}
            · {formatDuration(getDurationSeconds(sessionToDelete.startedAt, sessionToDelete.endedAt))}
          {/if}
        </p>
      </div>
      <p class="delete-warning">This action cannot be undone.</p>
      <div class="delete-actions">
        <button class="delete-btn delete-btn--cancel" onclick={cancelDeleteWorkout}>
          Cancel
        </button>
        <button class="delete-btn delete-btn--delete" onclick={confirmDeleteWorkout}>
          <span class="material-symbols-outlined">delete</span>
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .history-page {
    padding: var(--space-container-padding, 24px) var(--space-gutter, 16px);
    max-width: 480px;
    margin: 0 auto;
    min-height: 100%;
  }

  .page-header h2 {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-lg-mobile, 28px);
    font-weight: 600;
    line-height: var(--text-headline-lg-mobile-lh, 36px);
    color: var(--on-surface, #1b1c1c);
    margin: 0 0 16px 0;
  }

  .loading-text {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    text-align: center;
    padding: 32px 16px;
  }

  .month-group {
    margin-bottom: 24px;
  }

  .month-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-md, 14px);
    font-weight: 600;
    line-height: var(--text-label-md-lh, 20px);
    letter-spacing: var(--text-label-md-ls, 0.05em);
    text-transform: uppercase;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 8px 0;
  }

  .history-card {
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-xl, 1rem);
    padding: 14px 16px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    margin-bottom: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .history-card:hover {
    background: var(--surface-container, #f0eded);
  }
  .history-card:focus-visible {
    outline: 2px solid var(--primary, #334537);
    outline-offset: 2px;
  }

  .hc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .hc-day {
    font-size: 13px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-stats {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hc-stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hc-stat-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-stat-label {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-stat-divider {
    color: var(--outline, #737872);
    font-size: 14px;
  }

  /* ─── Detail View ─── */

  .detail-view {
    padding-bottom: 32px;
  }

  .detail-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 20px;
    padding-top: 4px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--on-surface, #1b1c1c);
    padding: 4px;
    margin-top: 2px;
    border-radius: var(--radius-full, 9999px);
    transition: background 0.15s;
  }
  .back-btn:hover {
    background: var(--surface-container, #f0eded);
  }

  .detail-header-info {
    flex: 1;
  }

  .detail-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0 0 2px 0;
  }

  .detail-subtitle {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .delete-workout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 6px;
    border-radius: var(--radius-full, 9999px);
    transition: color 0.15s, background 0.15s;
  }
  .delete-workout-btn:hover {
    color: var(--error, #ba1a1a);
    background: var(--error-container, #ffdad6);
  }

  /* ─── Detail Exercise Cards ─── */

  .detail-exercises {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .detail-exercise-card {
    background: var(--surface, #fcf9f8);
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-xl, 1rem);
    overflow: hidden;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  }

  .detail-exercise-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--surface-container-low, #f6f3f2);
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .detail-exercise-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .detail-exercise-equipment {
    font-size: 11px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    text-transform: capitalize;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .detail-sets-list {
    padding: 8px 16px;
  }

  /* ─── Read-only set row ─── */

  .detail-set-row {
    margin-bottom: 4px;
  }

  .readonly-set {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-md, 0.5rem);
    margin-bottom: 4px;
  }

  .set-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    min-width: 36px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .set-values {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
    flex-wrap: wrap;
  }

  .set-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .set-sep {
    color: var(--outline, #737872);
    font-size: 14px;
  }

  .set-notes {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
    font-style: italic;
    font-family: var(--font-body, Inter, sans-serif);
    margin-left: 4px;
  }

  .readonly-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
  }

  .set-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 4px;
    border-radius: var(--radius-full, 9999px);
    opacity: 0.5;
    transition: opacity 0.15s, color 0.15s, background 0.15s;
  }
  .set-action-btn:hover,
  .set-action-btn:focus-visible {
    opacity: 1;
  }
  .set-action-btn:hover {
    color: var(--primary, #334537);
    background: var(--surface-container, #f0eded);
  }
  .set-action-btn--danger:hover {
    color: var(--error, #ba1a1a);
    background: var(--error-container, #ffdad6);
  }

  /* ─── Edit mode actions ─── */

  .edit-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px 8px;
  }

  .edit-action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    font-size: 18px;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .save-btn {
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
  }

  .discard-btn {
    background: var(--surface-container-high, #eae7e7);
    color: var(--on-surface, #1b1c1c);
  }

  .edit-action-btn:hover {
    opacity: 0.85;
  }

  /* ─── Add Set Button ─── */

  .add-set-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: calc(100% - 32px);
    margin: 0 16px 12px;
    padding: 10px;
    border: 1px dashed var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: transparent;
    color: var(--on-surface-variant, #434843);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .add-set-btn:hover {
    background: var(--surface-container-low, #f6f3f2);
    color: var(--primary, #334537);
  }

  .add-set-btn .material-symbols-outlined {
    font-size: 18px;
  }

  /* ─── Delete confirmation bottom sheet ─── */

  .delete-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 500;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 16px;
  }

  .delete-sheet {
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-2xl, 1.5rem) var(--radius-2xl, 1.5rem) 0 0;
    width: 100%;
    max-width: 480px;
    padding: 24px 24px 32px;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
    text-align: center;
  }

  .delete-icon-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }

  .delete-icon {
    font-size: 40px;
    color: var(--error, #ba1a1a);
  }

  .delete-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0 0 12px 0;
  }

  .delete-info {
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-lg, 0.75rem);
    padding: 14px;
    margin-bottom: 12px;
  }

  .delete-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    margin: 0 0 4px 0;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .delete-meta {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    margin: 0;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .delete-warning {
    font-size: 13px;
    color: var(--error, #ba1a1a);
    margin: 0 0 20px 0;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .delete-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .delete-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .delete-btn--cancel {
    background: var(--surface-container-high, #eae7e7);
    color: var(--on-surface, #1b1c1c);
  }

  .delete-btn--delete {
    background: var(--error-container, #ffdad6);
    color: var(--on-error-container, #410002);
  }

  .delete-btn:hover {
    opacity: 0.9;
  }
</style>