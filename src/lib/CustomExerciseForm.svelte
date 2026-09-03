<script lang="ts">
  import type { Exercise, Field, Equipment, MuscleGroup, ExerciseSource } from "./types";
  import { generateExerciseId } from "./exercise-store";

  let {
    onSave = (_: Exercise) => {},
    onCancel = () => {},
  } = $props();

  const ALL_FIELDS: { value: Field; label: string }[] = [
    { value: "weight", label: "Weight" },
    { value: "reps", label: "Reps" },
    { value: "time", label: "Time" },
    { value: "distance", label: "Distance" },
    { value: "notes", label: "Notes" },
  ];

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

  const ALL_MUSCLE_GROUPS: { value: MuscleGroup; label: string }[] = [
    { value: "chest", label: "Chest" },
    { value: "back", label: "Back" },
    { value: "legs", label: "Legs" },
    { value: "shoulders", label: "Shoulders" },
    { value: "arms", label: "Arms" },
    { value: "core", label: "Core" },
    { value: "full-body", label: "Full Body" },
  ];

  let name = $state("");
  let selectedFields = $state<Field[]>(["weight", "reps"]);
  let selectedEquipment = $state<Equipment[]>(["bodyweight"]);
  let selectedMuscleGroups = $state<MuscleGroup[]>([]);
  let notes = $state("");
  let showAdvanced = $state(false);

  function toggleField(field: Field) {
    if (selectedFields.includes(field)) {
      selectedFields = selectedFields.filter((f) => f !== field);
      if (selectedFields.length === 0) selectedFields = [field]; // keep at least one
    } else {
      selectedFields = [...selectedFields, field];
    }
  }

  function toggleEquipment(equip: Equipment) {
    if (selectedEquipment.includes(equip)) {
      selectedEquipment = selectedEquipment.filter((e) => e !== equip);
      if (selectedEquipment.length === 0) selectedEquipment = [equip];
    } else {
      selectedEquipment = [...selectedEquipment, equip];
    }
  }

  function toggleMuscleGroup(mg: MuscleGroup) {
    if (selectedMuscleGroups.includes(mg)) {
      selectedMuscleGroups = selectedMuscleGroups.filter((m) => m !== mg);
    } else {
      selectedMuscleGroups = [...selectedMuscleGroups, mg];
    }
  }

  function handleSave() {
    if (!name.trim()) return;

    const exercise: Exercise = {
      id: generateExerciseId(),
      name: name.trim(),
      fields: [...selectedFields],
      muscleGroups:
        selectedMuscleGroups.length > 0 ? [...selectedMuscleGroups] : ["full-body"],
      equipment: [...selectedEquipment],
      source: "user" as ExerciseSource,
      notes: notes.trim() || undefined,
    };

    onSave(exercise);
  }

  const isValid = $derived(name.trim().length > 0);
</script>

<div class="form-overlay" onclick={(e) => e.target === e.currentTarget && onCancel()} role="dialog" aria-label="Create custom exercise" tabindex="-1" onkeydown={(e) => e.key === 'Escape' && onCancel()}>
  <div class="form-sheet">
    <div class="form-header">
      <h2 class="form-title">Create Exercise</h2>
      <button class="cancel-btn" onclick={onCancel}>
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <div class="form-body">
      <!-- Name -->
      <div class="field-group">
        <label class="field-label" for="exercise-name">Exercise Name</label>
        <input
          id="exercise-name"
          type="text"
          class="text-input"
          placeholder="e.g. Bulgarian Split Squat"
          bind:value={name}
        />
      </div>

      <!-- Fields (fixed order: weight, reps, time, distance, notes) -->
      <div class="field-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="field-label">Input Fields</label>
        <p class="field-hint">What inputs should each set have?</p>
        <div class="chip-grid">
          {#each ALL_FIELDS as f}
            <button
              class="chip"
              class:chip--active={selectedFields.includes(f.value)}
              onclick={() => toggleField(f.value)}
            >
              {f.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Equipment -->
      <div class="field-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="field-label">Equipment</label>
        <p class="field-hint">What equipment does this exercise use?</p>
        <div class="chip-grid">
          {#each ALL_EQUIPMENT as eq}
            <button
              class="chip"
              class:chip--active={selectedEquipment.includes(eq.value)}
              onclick={() => toggleEquipment(eq.value)}
            >
              {eq.label}
            </button>
          {/each}
        </div>
      </div>

      <!-- Advanced toggle -->
      <button class="advanced-toggle" onclick={() => (showAdvanced = !showAdvanced)}>
        <span class="material-symbols-outlined toggle-icon">
          {showAdvanced ? "expand_less" : "expand_more"}
        </span>
        <span>Advanced</span>
      </button>

      {#if showAdvanced}
        <!-- Muscle Groups -->
        <div class="field-group">
  <!-- svelte-ignore a11y_label_has_associated_control -->
          <label class="field-label">Muscle Groups</label>
          <p class="field-hint">Which muscles does this exercise target?</p>
          <div class="chip-grid">
            {#each ALL_MUSCLE_GROUPS as mg}
              <button
                class="chip"
                class:chip--active={selectedMuscleGroups.includes(mg.value)}
                onclick={() => toggleMuscleGroup(mg.value)}
              >
                {mg.label}
              </button>
            {/each}
          </div>
        </div>

        <!-- Notes -->
        <div class="field-group">
          <label class="field-label" for="exercise-notes">Notes (optional)</label>
          <textarea
            id="exercise-notes"
            class="text-input text-area"
            placeholder="Form cues, tips, or description…"
            bind:value={notes}
          ></textarea>
        </div>
      {/if}
    </div>

    <div class="form-footer">
      <button class="save-btn" onclick={handleSave} disabled={!isValid}>
        Save Exercise
      </button>
    </div>
  </div>
</div>

<style>
  .form-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 400;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .form-sheet {
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

  .form-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 20px 12px;
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .form-title {
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

  .form-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .field-group {
    margin-bottom: 20px;
  }

  .field-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    margin-bottom: 4px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .field-hint {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 8px 0;
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

  .text-area {
    min-height: 80px;
    resize: vertical;
    line-height: 1.5;
  }

  .chip-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    padding: 6px 14px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-full, 9999px);
    background: var(--surface, #fcf9f8);
    color: var(--on-surface-variant, #434843);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
    -webkit-tap-highlight-color: transparent;
  }
  .chip:hover {
    background: var(--surface-container, #f0eded);
  }
  .chip--active {
    background: var(--primary-fixed, #d3e8d5);
    color: var(--on-primary-fixed, #0e1f13);
    border-color: var(--primary, #334537);
  }

  .advanced-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 0;
    border: none;
    background: transparent;
    color: var(--primary, #334537);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    margin-bottom: 16px;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .toggle-icon {
    font-size: 20px;
  }

  .form-footer {
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
</style>