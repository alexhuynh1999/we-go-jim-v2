<script lang="ts">
  import type { Exercise } from "./types";
  import { listExercises } from "./exercise-store";

  let {
    onAdd = (_: Exercise) => {},
    addedIds = new Set<string>(),
  } = $props();

  let exercises = $state<Exercise[]>([]);
  let search = $state("");

  $effect(() => {
    listExercises().then((result) => {
      exercises = result;
    });
  });

  const filteredExercises = $derived(
    search.trim() === ""
      ? exercises
      : exercises.filter((e) =>
          e.name.toLowerCase().includes(search.toLowerCase()),
        ),
  );
</script>

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
  {#each filteredExercises as exercise}
    <button
      class="exercise-item"
      onclick={() => onAdd(exercise)}
      class:added={addedIds.has(exercise.id)}
    >
      <div class="exercise-item-info">
        <span class="exercise-item-name">{exercise.name}</span>
        <span class="exercise-item-meta">
          {exercise.muscleGroups.join(", ")} · {exercise.equipment.join(", ")}
        </span>
      </div>
      {#if addedIds.has(exercise.id)}
        <span class="added-check material-symbols-outlined">check_circle</span>
      {:else}
        <span class="add-icon material-symbols-outlined">add_circle</span>
      {/if}
    </button>
  {/each}
</div>

{#if filteredExercises.length === 0}
  <div class="no-results">
    <span class="material-symbols-outlined no-results-icon">search_off</span>
    <p>No exercises found for "{search}"</p>
  </div>
{/if}

<style>
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

  .no-results {
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