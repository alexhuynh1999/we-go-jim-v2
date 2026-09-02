<script lang="ts">
  import { onMount } from "svelte";
  import type { Exercise } from "./types";
  import { listExercises } from "./exercise-store";

  let {
    onAdd = (_e: Exercise) => {},
    onDone = (_e: MouseEvent) => {},
  } = $props();

  let exercises = $state<Exercise[]>([]);
  let search = $state("");
  let addedIds = $state(new Set<string>());
  let loading = $state(true);

  onMount(async () => {
    exercises = await listExercises();
    loading = false;
  });

  const filteredExercises = $derived(
    search.trim() === ""
      ? exercises
      : exercises.filter((e) =>
          e.name.toLowerCase().includes(search.toLowerCase()),
        ),
  );

  function handleAdd(exercise: Exercise) {
    addedIds.add(exercise.id);
    onAdd(exercise);
  }
</script>

<div class="picker-overlay" onclick={(e: MouseEvent) => onDone(e)} role="dialog" aria-label="Exercise picker">
  <div class="picker-sheet" onclick={(e: MouseEvent) => e.stopPropagation()} role="document">
    <div class="picker-header">
      <h2 class="picker-title">Add Exercises</h2>
      <button class="done-btn" onclick={(e: MouseEvent) => onDone(e)}>Done</button>
    </div>

    <div class="search-wrap">
      <span class="material-symbols-outlined search-icon">search</span>
      <input
        type="text"
        class="search-input"
        placeholder="Search exercises…"
        bind:value={search}
      />
    </div>

    <div class="exercise-list">
      {#if loading}
        <div class="loading">Loading exercises…</div>
      {:else}
        {#each filteredExercises as exercise}
          <button
            class="exercise-item"
            onclick={() => handleAdd(exercise)}
            class:added={addedIds.has(exercise.id)}
          >
            <div class="exercise-item-info">
              <span class="exercise-item-name">{exercise.name}</span>
              <span class="exercise-item-meta">
                {exercise.muscleGroups.join(", ")} · {exercise.equipment.join(", ")}
                {#if exercise.source === "user"}
                  <span class="custom-badge">Custom</span>
                {/if}
              </span>
            </div>
            {#if addedIds.has(exercise.id)}
              <span class="added-check material-symbols-outlined">check_circle</span>
            {:else}
              <span class="add-icon material-symbols-outlined">add_circle</span>
            {/if}
          </button>
        {/each}
      {/if}
    </div>

    {#if !loading && filteredExercises.length === 0}
      <div class="no-results">
        <span class="material-symbols-outlined no-results-icon">search_off</span>
        <p>No exercises found for "{search}"</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 300;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .picker-sheet {
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-2xl, 1.5rem) var(--radius-2xl, 1.5rem) 0 0;
    width: 100%;
    max-width: 480px;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
  }

  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 12px;
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .picker-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }

  .done-btn {
    padding: 8px 20px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .done-btn:hover {
    opacity: 0.9;
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .search-icon {
    font-size: 20px;
    color: var(--outline, #737872);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 8px 0;
    font-size: 15px;
    color: var(--on-surface, #1b1c1c);
    outline: none;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .search-input::placeholder {
    color: var(--outline, #737872);
  }

  .exercise-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .exercise-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 12px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .exercise-item:hover {
    background: var(--surface-container-low, #f6f3f2);
  }
  .exercise-item:active {
    background: var(--surface-container, #f0eded);
  }

  .exercise-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .exercise-item-name {
    font-size: 15px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
  }

  .exercise-item-meta {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
  }

  .custom-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.03em;
    color: var(--primary, #334537);
    background: var(--primary-fixed, #d3e8d5);
    padding: 1px 6px;
    border-radius: var(--radius-sm, 0.25rem);
    margin-left: 4px;
    vertical-align: middle;
  }

  .add-icon,
  .added-check {
    font-size: 22px;
    font-variation-settings: 'FILL' 1;
  }
  .add-icon {
    color: var(--outline, #737872);
  }
  .added-check {
    color: var(--primary, #334537);
  }

  .no-results,
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 20px;
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .no-results-icon {
    font-size: 32px;
    color: var(--outline, #737872);
  }
</style>