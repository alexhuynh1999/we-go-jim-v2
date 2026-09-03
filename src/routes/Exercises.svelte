<script lang="ts">
  import { onMount } from "svelte";
  import type { Exercise } from "./types";
  import {
    listExercises,
    hideBuiltinExercise,
    unhideBuiltinExercise,
    deleteCustomExercise,
    getHiddenExerciseIds,
    saveCustomExercise,
  } from "../lib/exercise-store";
  import CustomExerciseForm from "../lib/CustomExerciseForm.svelte";

  let { onBack = () => {} } = $props();

  let exercises = $state<Exercise[]>([]);
  let hiddenIds = $state<string[]>([]);
  let loading = $state(true);
  let showCreateForm = $state(false);
  let filterMode = $state<"all" | "builtin" | "custom" | "hidden">("all");

  async function loadData() {
    loading = true;
    const [exList, hidden] = await Promise.all([
      listExercises(),
      getHiddenExerciseIds(),
    ]);
    exercises = exList;
    hiddenIds = hidden;
    loading = false;
  }

  onMount(loadData);

  const filteredExercises = $derived(
    exercises.filter((e) => {
      switch (filterMode) {
        case "builtin":
          return e.source === "builtin";
        case "custom":
          return e.source === "user";
        case "hidden":
          return e.source === "builtin" && hiddenIds.includes(e.id);
        default:
          return true;
      }
    }),
  );

  async function handleHide(id: string) {
    await hideBuiltinExercise(id);
    hiddenIds = [...hiddenIds, id];
    // Remove from current list if not in "all" or "hidden" mode
    if (filterMode !== "hidden" && filterMode !== "all") {
      exercises = exercises.filter((e) => e.id !== id);
    }
  }

  async function handleUnhide(id: string) {
    await unhideBuiltinExercise(id);
    hiddenIds = hiddenIds.filter((h) => h !== id);
  }

  async function handleDelete(id: string) {
    await deleteCustomExercise(id);
    exercises = exercises.filter((e) => e.id !== id);
  }

  async function handleSaveCustom(exercise: Exercise) {
    try {
      // Strip Svelte $state proxies — IndexedDB's structured clone algorithm
      // cannot serialize reactive Proxy objects (same fix as #14).
      await saveCustomExercise(JSON.parse(JSON.stringify(exercise)));
    } catch (e) {
      console.error("Failed to save custom exercise:", e);
    }
    showCreateForm = false;
    await loadData();
  }
</script>

<div class="exercises-page">
  <header class="page-header">
    <button class="back-btn" onclick={onBack} aria-label="Back to settings">
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <h2>Exercises</h2>
    <button class="add-btn" onclick={() => (showCreateForm = true)} aria-label="Create custom exercise">
      <span class="material-symbols-outlined">add</span>
    </button>
  </header>

  <!-- Filter tabs -->
  <div class="filter-row">
    {#each [
      { value: "all", label: "All" },
      { value: "builtin", label: "Built-in" },
      { value: "custom", label: "Custom" },
      { value: "hidden", label: "Hidden" },
    ] as tab}
      <button
        class="filter-chip"
        class:filter-chip--active={filterMode === tab.value}
        onclick={() => (filterMode = tab.value as typeof filterMode)}
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#if loading}
    <div class="loading-state">
      <p>Loading exercises…</p>
    </div>
  {:else if filteredExercises.length === 0}
    <div class="empty-state">
      <span class="material-symbols-outlined empty-icon">fitness_center</span>
      <p class="empty-text">
        {#if filterMode === "hidden"}
          No hidden exercises.
        {:else if filterMode === "custom"}
          No custom exercises yet. Tap + to create one.
        {:else}
          No exercises found.
        {/if}
      </p>
    </div>
  {:else}
    <div class="exercise-list">
      {#each filteredExercises as exercise (exercise.id)}
        <div class="exercise-row" class:exercise-row--hidden={exercise.source === "builtin" && hiddenIds.includes(exercise.id)}>
          <div class="exercise-row-info">
            <span class="exercise-row-name">{exercise.name}</span>
            <span class="exercise-row-meta">
              {exercise.fields.join(", ")}
              · {exercise.equipment.join(", ")}
              · {exercise.muscleGroups.join(", ")}
              {#if exercise.source === "user"}
                <span class="source-badge source-badge--custom">Custom</span>
              {:else}
                <span class="source-badge source-badge--builtin">Built-in</span>
              {/if}
              {#if exercise.source === "builtin" && hiddenIds.includes(exercise.id)}
                <span class="source-badge source-badge--hidden">Hidden</span>
              {/if}
            </span>
            {#if exercise.notes}
              <span class="exercise-row-notes">{exercise.notes}</span>
            {/if}
          </div>
          <div class="exercise-row-actions">
            {#if exercise.source === "builtin"}
              {#if hiddenIds.includes(exercise.id)}
                <button
                  class="action-btn action-btn--unhide"
                  onclick={() => handleUnhide(exercise.id)}
                  aria-label="Unhide exercise"
                >
                  <span class="material-symbols-outlined">visibility</span>
                </button>
              {:else}
                <button
                  class="action-btn action-btn--hide"
                  onclick={() => handleHide(exercise.id)}
                  aria-label="Hide exercise"
                >
                  <span class="material-symbols-outlined">visibility_off</span>
                </button>
              {/if}
            {:else}
              <button
                class="action-btn action-btn--delete"
                onclick={() => handleDelete(exercise.id)}
                aria-label="Delete custom exercise"
              >
                <span class="material-symbols-outlined">delete</span>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

{#if showCreateForm}
  <CustomExerciseForm
    onSave={handleSaveCustom}
    onCancel={() => (showCreateForm = false)}
  />
{/if}

<style>
  .exercises-page {
    padding: var(--space-container-padding, 24px) var(--space-gutter, 16px);
    max-width: 480px;
    margin: 0 auto;
    min-height: 100vh;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .page-header h2 {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-lg-mobile, 28px);
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
    flex: 1;
  }

  .back-btn,
  .add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    color: var(--on-surface-variant, #434843);
    transition: background 0.15s;
  }
  .back-btn:hover,
  .add-btn:hover {
    background: var(--surface-container, #f0eded);
  }

  .filter-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    overflow-x: auto;
    padding-bottom: 4px;
  }

  .filter-chip {
    padding: 6px 14px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-full, 9999px);
    background: var(--surface, #fcf9f8);
    color: var(--on-surface-variant, #434843);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .filter-chip:hover {
    background: var(--surface-container, #f0eded);
  }
  .filter-chip--active {
    background: var(--primary-fixed, #d3e8d5);
    color: var(--on-primary-fixed, #0e1f13);
    border-color: var(--primary, #334537);
  }

  .exercise-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .exercise-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-lg, 0.75rem);
    transition: background 0.15s;
  }
  .exercise-row--hidden {
    opacity: 0.6;
  }

  .exercise-row-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .exercise-row-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .exercise-row-meta {
    font-size: 11px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
    line-height: 1.4;
  }

  .exercise-row-notes {
    font-size: 12px;
    color: var(--tertiary, #444138);
    font-style: italic;
    font-family: var(--font-body, Inter, sans-serif);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .source-badge {
    display: inline-block;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 1px 5px;
    border-radius: var(--radius-sm, 0.25rem);
    margin-left: 4px;
    vertical-align: middle;
    text-transform: uppercase;
  }
  .source-badge--builtin {
    color: var(--secondary, #845333);
    background: var(--secondary-fixed, #ffdbc8);
  }
  .source-badge--custom {
    color: var(--primary, #334537);
    background: var(--primary-fixed, #d3e8d5);
  }
  .source-badge--hidden {
    color: var(--on-surface-variant, #434843);
    background: var(--surface-container, #f0eded);
  }

  .exercise-row-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    padding: 0;
  }
  .action-btn .material-symbols-outlined {
    font-size: 18px;
  }

  .action-btn--hide,
  .action-btn--unhide {
    background: transparent;
    color: var(--outline, #737872);
  }
  .action-btn--hide:hover,
  .action-btn--unhide:hover {
    background: var(--surface-container, #f0eded);
    color: var(--on-surface, #1b1c1c);
  }

  .action-btn--delete {
    background: transparent;
    color: var(--outline, #737872);
  }
  .action-btn--delete:hover {
    background: var(--error-container, #ffdad6);
    color: var(--error, #ba1a1a);
  }

  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .empty-icon {
    font-size: 36px;
    color: var(--outline, #737872);
    margin-bottom: 12px;
  }

  .empty-text {
    margin: 0;
    line-height: 1.5;
  }
</style>