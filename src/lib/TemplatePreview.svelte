<script lang="ts">
  import type { WorkoutTemplate, Exercise } from "./types";
  import { listExercises } from "./exercise-store";

  let {
    template = null as WorkoutTemplate | null,
    onStart = () => {},
    onBack = () => {},
  } = $props();

  let exercises = $state<Exercise[]>([]);
  let exerciseNameMap = $state(new Map<string, string>());

  $effect(() => {
    listExercises().then((result) => {
      exercises = result;
      const map = new Map<string, string>();
      for (const ex of result) {
        map.set(ex.id, ex.name);
      }
      exerciseNameMap = map;
    });
  });

  function getExerciseName(exerciseId: string): string {
    return exerciseNameMap.get(exerciseId) ?? "Unknown Exercise";
  }

  const totalSets = $derived(
    template?.exercises.reduce((acc, te) => acc + te.setCount, 0) ?? 0,
  );
</script>

{#if template}
  <div class="preview-page">
    <div class="preview-header">
      <button class="back-btn" onclick={(e: MouseEvent) => onBack()} aria-label="Back">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h2 class="preview-title">{template.name}</h2>
    </div>

    <div class="preview-stats">
      <div class="preview-stat">
        <span class="preview-stat-value">{template.exercises.length}</span>
        <span class="preview-stat-label">Exercises</span>
      </div>
      <div class="preview-stat">
        <span class="preview-stat-value">{totalSets}</span>
        <span class="preview-stat-label">Total Sets</span>
      </div>
      {#if template.useCount > 0}
        <div class="preview-stat">
          <span class="preview-stat-value">{template.useCount}</span>
          <span class="preview-stat-label">Times Used</span>
        </div>
      {/if}
    </div>

    <div class="preview-exercise-list">
      <h3 class="section-label">Exercises</h3>
      {#each template.exercises as te, i}
        <div class="preview-exercise-item">
          <div class="pe-order">{i + 1}</div>
          <div class="pe-info">
            <span class="pe-name">{getExerciseName(te.exerciseId)}</span>
            <span class="pe-meta">{te.equipment} · {te.setCount} sets</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="preview-actions">
      <button class="start-btn" onclick={(e: MouseEvent) => onStart()}>
        <span class="material-symbols-outlined">play_arrow</span>
        <span>Start Workout</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .preview-page {
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 64px);
    max-width: 480px;
    margin: 0 auto;
    padding: 0 0 16px;
  }

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px var(--space-gutter, 16px);
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
    position: sticky;
    top: 0;
    background: var(--surface, #fcf9f8);
    z-index: 10;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    color: var(--on-surface, #1b1c1c);
    transition: background 0.15s;
    padding: 0;
  }
  .back-btn:hover {
    background: var(--surface-container, #f0eded);
  }

  .preview-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
    flex: 1;
  }

  .preview-stats {
    display: flex;
    gap: 12px;
    padding: 16px var(--space-gutter, 16px);
  }

  .preview-stat {
    flex: 1;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-lg, 0.75rem);
    padding: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .preview-stat-value {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: 20px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
  }

  .preview-stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .section-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-md, 14px);
    font-weight: 600;
    line-height: var(--text-label-md-lh, 20px);
    letter-spacing: var(--text-label-md-ls, 0.05em);
    text-transform: uppercase;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 8px 0;
    padding: 0 var(--space-gutter, 16px);
  }

  .preview-exercise-list {
    flex: 1;
    padding: 8px var(--space-gutter, 16px);
  }

  .preview-exercise-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface-container-low, #f6f3f2);
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-lg, 0.75rem);
    margin-bottom: 8px;
  }

  .pe-order {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary-fixed, #d3e8d5);
    border-radius: var(--radius-full, 9999px);
    font-size: 13px;
    font-weight: 600;
    color: var(--on-primary-fixed, #0e1f13);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .pe-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .pe-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .pe-meta {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
    text-transform: capitalize;
  }

  .preview-actions {
    padding: 12px var(--space-gutter, 16px);
    border-top: 1px solid var(--outline-variant, #c3c8c1);
    background: var(--surface, #fcf9f8);
    position: sticky;
    bottom: 0;
  }

  .start-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: var(--radius-lg, 0.75rem);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .start-btn:hover {
    opacity: 0.9;
  }
</style>