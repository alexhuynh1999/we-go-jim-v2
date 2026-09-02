<script lang="ts">
  import type { SessionExercise, ExerciseSet } from "./types";
  import SetRow from "./SetRow.svelte";

  let {
    exercise = {
      exerciseId: "",
      exerciseName: "",
      fields: [] as string[],
      muscleGroups: [] as string[],
      equipment: "bodyweight" as const,
      sets: [] as ExerciseSet[],
    } as SessionExercise,
    lastSessionSet = null as ExerciseSet | null,
    totalExercises = 0,
    index = 0,
    onUpdateSets = (_sets: ExerciseSet[]) => {},
    onAddSet = (_e: MouseEvent) => {},
    onDeleteExercise = (_e: MouseEvent) => {},
    onMoveUp = () => {},
    onMoveDown = () => {},
  } = $props();
</script>

<div class="exercise-card">
  <div class="card-header">
    <div class="card-header-left">
      <div class="move-buttons">
        {#if index > 0}
          <button class="move-btn" onclick={(e: MouseEvent) => { e.stopPropagation(); onMoveUp(); }} aria-label="Move exercise up">
            <span class="material-symbols-outlined">keyboard_arrow_up</span>
          </button>
        {/if}
        {#if index < totalExercises - 1}
          <button class="move-btn" onclick={(e: MouseEvent) => { e.stopPropagation(); onMoveDown(); }} aria-label="Move exercise down">
            <span class="material-symbols-outlined">keyboard_arrow_down</span>
          </button>
        {/if}
      </div>
      <div class="exercise-info">
        <span class="exercise-name">{exercise.exerciseName}</span>
        <span class="exercise-equipment">{exercise.equipment}</span>
      </div>
    </div>
    <button class="trash-btn" onclick={(e: MouseEvent) => onDeleteExercise(e)} aria-label="Remove exercise">
      <span class="material-symbols-outlined">delete</span>
    </button>
  </div>

  <div class="sets-list">
    {#each exercise.sets as set, i}
      <SetRow
        {set}
        fields={exercise.fields}
        {lastSessionSet}
        index={i}
        onUpdate={(updated: ExerciseSet) => {
          const newSets = exercise.sets.map((s, idx) => (idx === i ? updated : s));
          onUpdateSets(newSets);
        }}
        onDelete={(e: MouseEvent) => {
          e.preventDefault();
          const newSets = exercise.sets.filter((_, idx) => idx !== i);
          onUpdateSets(newSets);
        }}
      />
    {/each}
  </div>

  <button class="add-set-btn" onclick={(e: MouseEvent) => onAddSet(e)}>
    <span class="material-symbols-outlined">add</span>
    <span>Add Set</span>
  </button>
</div>

<style>
  .exercise-card {
    background: var(--surface, #fcf9f8);
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-xl, 1rem);
    overflow: hidden;
    margin-bottom: 12px;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: var(--surface-container-low, #f6f3f2);
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .card-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .move-buttons {
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-right: 2px;
  }

  .move-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 0;
    height: 18px;
    width: 20px;
    border-radius: var(--radius-sm, 0.25rem);
    transition: color 0.1s, background 0.1s;
    line-height: 1;
  }
  .move-btn:hover {
    color: var(--primary, #334537);
    background: var(--surface-container, #f0eded);
  }
  .move-btn .material-symbols-outlined {
    font-size: 18px;
    font-variation-settings: 'FILL' 0;
  }

  .exercise-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .exercise-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .exercise-equipment {
    font-size: 11px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    text-transform: capitalize;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .trash-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 4px;
    border-radius: var(--radius-full, 9999px);
    transition: color 0.15s, background 0.15s;
  }
  .trash-btn:hover,
  .trash-btn:focus-visible {
    color: var(--error, #ba1a1a);
    background: var(--error-container, #ffdad6);
  }

  .sets-list {
    padding: 10px 16px;
  }

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
</style>