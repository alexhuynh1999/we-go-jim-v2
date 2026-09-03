<script lang="ts">
  import type { Exercise, TemplateExercise, Equipment } from "./types";
  import { listExercises } from "./exercise-store";
  import ExercisePickerInline from "./ExercisePickerInline.svelte";

  const ALL_EQUIPMENT: { value: Equipment; label: string }[] = [
    { value: "barbell", label: "Barbell" },
    { value: "dumbbell", label: "Dumbbell" },
    { value: "machine", label: "Machine" },
    { value: "cable", label: "Cable" },
    { value: "bodyweight", label: "Bodyweight" },
    { value: "kettlebell", label: "Kettlebell" },
    { value: "smith-machine", label: "Smith Machine" },
    { value: "plate-loaded", label: "Plate Loaded" },
    { value: "other", label: "Other" },
  ];

  let {
    initialName = "",
    initialExercises = [] as TemplateExercise[],
    onSave = (_name: string, _exercises: TemplateExercise[]) => {},
    onCancel = () => {},
  } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(initialName);
  // svelte-ignore state_referenced_locally
  let templateExercises = $state<(TemplateExercise & { exerciseName: string })[]>(
    initialExercises.map((te) => ({
      ...te,
      exerciseName: "",
    })),
  );
  let showPicker = $state(false);
  let exercises = $state<Exercise[]>([]);
  let exerciseNameMap = $state(new Map<string, string>());

  // Load exercise catalog for name resolution
  $effect(() => {
    listExercises().then((result) => {
      exercises = result;
      const map = new Map<string, string>();
      for (const ex of result) {
        map.set(ex.id, ex.name);
      }
      exerciseNameMap = map;
      // Resolve exercise names for initial exercises
      templateExercises = templateExercises.map((te) => ({
        ...te,
        exerciseName: exerciseNameMap.get(te.exerciseId) ?? "Unknown",
      }));
    });
  });

  function getExerciseName(id: string): string {
    return exerciseNameMap.get(id) ?? "Unknown";
  }

  function handleAddExercise(exercise: Exercise) {
    const alreadyAdded = templateExercises.some((te) => te.exerciseId === exercise.id);
    if (alreadyAdded) return;

    templateExercises = [
      ...templateExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        equipment: (exercise.equipment[0] ?? "bodyweight") as Equipment,
        setCount: 3,
      },
    ];
  }

  function removeExercise(index: number) {
    templateExercises = templateExercises.filter((_, i) => i !== index);
  }

  function updateEquipment(index: number, equipment: Equipment) {
    templateExercises = templateExercises.map((te, i) =>
      i === index ? { ...te, equipment } : te,
    );
  }

  function updateSetCount(index: number, delta: number) {
    templateExercises = templateExercises.map((te, i) => {
      if (i !== index) return te;
      const newCount = Math.max(1, Math.min(20, te.setCount + delta));
      return { ...te, setCount: newCount };
    });
  }

  function moveExercise(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= templateExercises.length) return;
    const exercises = [...templateExercises];
    const [moved] = exercises.splice(fromIdx, 1);
    if (!moved) return;
    exercises.splice(toIdx, 0, moved);
    templateExercises = exercises;
  }

  function handleSave() {
    if (!name.trim() || templateExercises.length === 0) return;
    const exercises: TemplateExercise[] = templateExercises.map(
      ({ exerciseName: _, ...rest }) => rest,
    );
    onSave(name.trim(), exercises);
  }

  const isValid = $derived(name.trim().length > 0 && templateExercises.length > 0);
</script>

<div class="builder-overlay" onclick={(e) => e.target === e.currentTarget && onCancel()} role="dialog" aria-label="Template builder" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && onCancel()}>
  <div class="builder-sheet">
    <div class="builder-header">
      <h2 class="builder-title">Template Builder</h2>
      <button class="cancel-btn" onclick={(e: MouseEvent) => onCancel()}>
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <div class="builder-body">
      <!-- Template name -->
      <div class="field-group">
        <label class="field-label" for="template-name">Template Name</label>
        <input
          id="template-name"
          type="text"
          class="text-input"
          placeholder="e.g. Push Day"
          bind:value={name}
        />
      </div>

      <!-- Add exercise button -->
      <button class="add-exercise-btn" onclick={() => (showPicker = true)}>
        <span class="material-symbols-outlined">add</span>
        <span>Add Exercise</span>
      </button>

      <!-- Exercise list -->
      {#if templateExercises.length === 0}
        <div class="empty-exercises">
          <span class="material-symbols-outlined empty-icon">fitness_center</span>
          <p>Add exercises to build your template</p>
        </div>
      {:else}
        <div class="exercise-list">
          {#each templateExercises as te, i}
            <div class="template-exercise-item">
              <div class="te-header">
                <div class="te-move-buttons">
                  {#if i > 0}
                    <button class="te-move-btn" onclick={() => moveExercise(i, i - 1)} aria-label="Move up">
                      <span class="material-symbols-outlined">keyboard_arrow_up</span>
                    </button>
                  {/if}
                  {#if i < templateExercises.length - 1}
                    <button class="te-move-btn" onclick={() => moveExercise(i, i + 1)} aria-label="Move down">
                      <span class="material-symbols-outlined">keyboard_arrow_down</span>
                    </button>
                  {/if}
                </div>
                <span class="te-name">{te.exerciseName || getExerciseName(te.exerciseId)}</span>
                <button class="te-remove-btn" onclick={() => removeExercise(i)} aria-label="Remove exercise">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
              <div class="te-config">
                <div class="config-field">
                  <label class="config-label" for="equipment-{i}">Equipment</label>
                  <select
                    class="config-select"
                    id="equipment-{i}"
                    value={te.equipment}
                    onchange={(e) => updateEquipment(i, (e.target as HTMLSelectElement).value as Equipment)}
                  >
                    {#each ALL_EQUIPMENT as eq}
                      <option value={eq.value}>{eq.label}</option>
                    {/each}
                  </select>
                </div>
                <div class="config-field">
                  <!-- svelte-ignore a11y_label_has_associated_control -->
            <label class="config-label">Sets</label>
                  <div class="stepper">
                    <button
                      class="stepper-btn"
                      onclick={() => updateSetCount(i, -1)}
                      disabled={te.setCount <= 1}
                      aria-label="Decrease sets"
                    >
                      <span class="material-symbols-outlined">remove</span>
                    </button>
                    <span class="stepper-value">{te.setCount}</span>
                    <button
                      class="stepper-btn"
                      onclick={() => updateSetCount(i, 1)}
                      disabled={te.setCount >= 20}
                      aria-label="Increase sets"
                    >
                      <span class="material-symbols-outlined">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <div class="builder-footer">
      <button class="save-btn" onclick={handleSave} disabled={!isValid}>
        Save Template
      </button>
    </div>
  </div>
</div>

{#if showPicker}
  <div class="picker-wrapper" onclick={(e) => e.target === e.currentTarget && (showPicker = false)} role="dialog" aria-label="Exercise picker" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && (showPicker = false)}>
    <div class="picker-sheet">
      {#key showPicker}
        <ExercisePickerInline
          onAdd={handleAddExercise}
          addedIds={new Set(templateExercises.map((te) => te.exerciseId))}
        />
      {/key}
      <div class="picker-footer">
        <button class="picker-done-btn" onclick={() => (showPicker = false)}>
          Done Adding
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .builder-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 400;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .builder-sheet {
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-2xl, 1.5rem) var(--radius-2xl, 1.5rem) 0 0;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
  }

  .builder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 12px;
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .builder-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }

  .cancel-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-full, 9999px);
    cursor: pointer;
    color: var(--on-surface-variant, #434843);
    transition: background 0.15s;
    padding: 0;
  }
  .cancel-btn:hover {
    background: var(--surface-container, #f0eded);
  }

  .builder-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .field-group {
    margin-bottom: 16px;
  }

  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    margin-bottom: 6px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .text-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface-container-low, #f6f3f2);
    color: var(--on-surface, #1b1c1c);
    font-size: 15px;
    outline: none;
    transition: border-color 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
    box-sizing: border-box;
  }
  .text-input:focus {
    border-color: var(--primary, #334537);
  }
  .text-input::placeholder {
    color: var(--outline, #737872);
  }

  .add-exercise-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 12px;
    border: 1px dashed var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: transparent;
    color: var(--primary, #334537);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 16px;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .add-exercise-btn:hover {
    background: var(--surface-container-low, #f6f3f2);
  }

  .empty-exercises {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px;
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .empty-icon {
    font-size: 32px;
    color: var(--outline, #737872);
  }

  .exercise-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .template-exercise-item {
    background: var(--surface-container-low, #f6f3f2);
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-lg, 0.75rem);
    padding: 12px;
  }

  .te-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  .te-move-buttons {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .te-move-btn {
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
    transition: color 0.1s;
    line-height: 1;
  }
  .te-move-btn:hover {
    color: var(--primary, #334537);
  }
  .te-move-btn .material-symbols-outlined {
    font-size: 18px;
  }

  .te-name {
    flex: 1;
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .te-remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 2px;
    border-radius: var(--radius-full, 9999px);
    transition: color 0.1s;
  }
  .te-remove-btn:hover {
    color: var(--error, #ba1a1a);
  }
  .te-remove-btn .material-symbols-outlined {
    font-size: 18px;
  }

  .te-config {
    display: flex;
    gap: 16px;
  }

  .config-field {
    flex: 1;
  }

  .config-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--outline, #737872);
    margin-bottom: 4px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .config-select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-sm, 0.375rem);
    background: var(--surface, #fcf9f8);
    color: var(--on-surface, #1b1c1c);
    font-size: 13px;
    font-weight: 500;
    outline: none;
    font-family: var(--font-body, Inter, sans-serif);
    cursor: pointer;
  }
  .config-select:focus {
    border-color: var(--primary, #334537);
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-sm, 0.375rem);
    overflow: hidden;
    background: var(--surface, #fcf9f8);
  }

  .stepper-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--on-surface, #1b1c1c);
    transition: background 0.1s;
  }
  .stepper-btn:hover:not(:disabled) {
    background: var(--surface-container, #f0eded);
  }
  .stepper-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
  .stepper-btn .material-symbols-outlined {
    font-size: 16px;
  }

  .stepper-value {
    min-width: 24px;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .builder-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--outline-variant, #c3c8c1);
  }

  .save-btn {
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .save-btn:hover:not(:disabled) {
    opacity: 0.9;
  }
  .save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .picker-wrapper {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 450;
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

  .picker-footer {
    width: 100%;
    padding: 8px 20px 20px;
  }

  .picker-done-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .picker-done-btn:hover {
    opacity: 0.9;
  }
</style>