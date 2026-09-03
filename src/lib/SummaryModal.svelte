<script lang="ts">
  import type { WorkoutSession } from "./types";

  let {
    session = null as WorkoutSession | null,
    onDone = (_e: MouseEvent) => {},
    onSaveAsTemplate = (_e: MouseEvent) => {},
    showSaveAsTemplate = true,
  } = $props();

  // svelte-ignore state_referenced_locally
  let sessionName = $state(session?.name ?? "Quick Workout");

  const durationSeconds = $derived.by(() => {
    if (!session?.startedAt || !session?.endedAt) return 0;
    return Math.floor(
      (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
    );
  });

  const exerciseCount = $derived(session?.exercises.length ?? 0);
  const setCount = $derived(
    session?.exercises.reduce((acc, ex) => acc + ex.sets.length, 0) ?? 0,
  );

  const totalVolume = $derived.by(() => {
    if (!session) return 0;
    let vol = 0;
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (set.weight && set.reps) {
          vol += set.weight * set.reps;
        }
      }
    }
    return vol;
  });

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function formatVolume(vol: number): string {
    if (vol === 0) return "—";
    if (vol >= 100000) return `${(vol / 1000).toFixed(0)}k`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(1)}k`;
    return vol.toLocaleString();
  }
</script>

{#if session}
  <div class="modal-overlay" onclick={(e) => e.target === e.currentTarget && onDone(e)} role="dialog" aria-label="Workout summary" tabindex="-1" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && onDone(e)}>
    <div class="modal-sheet">
      <div class="modal-header">
        <span class="material-symbols-outlined modal-icon">celebration</span>
        <h2 class="modal-title">Workout Complete</h2>
      </div>

      <!-- Editable name -->
      <div class="name-field">
        <label for="session-name" class="name-label">Workout Name</label>
        <input
          id="session-name"
          type="text"
          class="name-input"
          bind:value={sessionName}
        />
      </div>

      <!-- Stats grid -->
      <div class="stats-grid">
        <div class="stat-item">
          <span class="stat-value">{formatDuration(durationSeconds)}</span>
          <span class="stat-label">Duration</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{exerciseCount}</span>
          <span class="stat-label">Exercises</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{setCount}</span>
          <span class="stat-label">Sets</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{formatVolume(totalVolume)}</span>
          <span class="stat-label">Volume</span>
        </div>
      </div>

      <!-- Exercise list -->
      <div class="summary-exercises">
        <h3 class="summary-section-label">Exercises</h3>
        {#each session.exercises as exercise}
          <div class="summary-exercise-row">
            <span class="summary-exercise-name">{exercise.exerciseName}</span>
            <span class="summary-exercise-sets">{exercise.sets.length} sets</span>
          </div>
        {/each}
      </div>

      <!-- Actions -->
      <div class="modal-actions">
        {#if showSaveAsTemplate}
          <button class="action-btn action-secondary" onclick={(e: MouseEvent) => onSaveAsTemplate(e)}>
            <span class="material-symbols-outlined">save</span>
            Save as Template
          </button>
        {/if}
        <button class="action-btn action-primary" onclick={(e: MouseEvent) => onDone(e)}>
          Done
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .modal-sheet {
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-2xl, 1.5rem);
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    overflow-y: auto;
    padding: 24px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    text-align: center;
  }

  .modal-icon {
    font-size: 36px;
    color: var(--primary, #334537);
  }

  .modal-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: 24px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }

  .name-field {
    margin-bottom: 20px;
  }

  .name-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--outline, #737872);
    display: block;
    margin-bottom: 6px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .name-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface-container-low, #f6f3f2);
    color: var(--on-surface, #1b1c1c);
    font-size: 16px;
    font-weight: 500;
    outline: none;
    font-family: var(--font-body, Inter, sans-serif);
    transition: border-color 0.15s;
  }
  .name-input:focus {
    border-color: var(--primary, #334537);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .stat-item {
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-lg, 0.75rem);
    padding: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .stat-value {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: 22px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
  }

  .stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .summary-exercises {
    margin-bottom: 20px;
  }

  .summary-section-label {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--outline, #737872);
    margin: 0 0 8px 0;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .summary-exercise-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }
  .summary-exercise-row:last-child {
    border-bottom: none;
  }

  .summary-exercise-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .summary-exercise-sets {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .modal-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .action-primary {
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
  }

  .action-secondary {
    background: var(--surface-container-high, #eae7e7);
    color: var(--on-surface, #1b1c1c);
  }

  .action-btn:hover {
    opacity: 0.9;
  }
</style>