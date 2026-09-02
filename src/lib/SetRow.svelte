<script lang="ts">
  import type { ExerciseSet, Field } from "./types";
  import { settings } from "./settings.js";
  import { convertWeight } from "./unit-convert.js";

  let {
    set = { reps: 0 } as ExerciseSet,
    fields = [] as Field[],
    lastSessionSet = null as ExerciseSet | null,
    index = 0,
    showComplete = false as boolean,
    onUpdate = (_: ExerciseSet) => {},
    onDelete = (_e: MouseEvent) => {},
    onComplete = (_e: MouseEvent) => {},
  } = $props();

  const hasWeight = $derived(fields.includes("weight"));
  const hasReps = $derived(fields.includes("reps"));
  const hasTime = $derived(fields.includes("time"));
  const hasDistance = $derived(fields.includes("distance"));

  const showWeightReps = $derived(hasWeight && hasReps);
  const showTimeDistance = $derived(hasTime && hasDistance);
  const showRepsOnly = $derived(!hasWeight && hasReps && !hasTime && !hasDistance);
  const showTimeOnly = $derived(hasTime && !hasDistance && !hasWeight);
  const showWeightTime = $derived(hasWeight && hasTime && !hasReps && !hasDistance);

  // ─── Weight unit conversion ───
  const weightUnit = $derived($settings.weightUnit);
  const weightUnitLabel = $derived(weightUnit);

  /** Convert a kg value to the current display unit. */
  function displayWeight(kg: number | undefined): string {
    if (kg === undefined || kg === null) return "";
    const converted = convertWeight(kg, "kg", weightUnit);
    return Math.round(converted * 10) / 10 + "";
  }

  /** Convert a display-unit value back to kg for storage. */
  function inputWeightToKg(raw: string): number | undefined {
    const num = parseFloat(raw);
    if (isNaN(num)) return undefined;
    const converted = convertWeight(num, weightUnit, "kg");
    return Math.round(converted * 100) / 100;
  }

  function updateField<K extends keyof ExerciseSet>(key: K, value: ExerciseSet[K]) {
    onUpdate({ ...set, [key]: value });
  }
</script>

<div class="set-row">
  <span class="set-label">Set {index + 1}</span>

  <div class="set-inputs">
    {#if showWeightReps}
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={displayWeight(lastSessionSet?.weight)}
          value={displayWeight(set.weight)}
          oninput={(e) => updateField("weight", inputWeightToKg((e.target as HTMLInputElement).value))}
        />
        <span class="field-unit">{weightUnitLabel}</span>
      </div>
      <span class="field-sep">×</span>
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={lastSessionSet?.reps?.toString() ?? "reps"}
          value={set.reps ?? ""}
          oninput={(e) => updateField("reps", parseFloat((e.target as HTMLInputElement).value) || undefined)}
        />
      </div>
    {:else if showTimeDistance}
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={lastSessionSet?.duration ? `${Math.round(lastSessionSet.duration / 60)} min` : "min"}
          value={set.duration ? Math.round(set.duration / 60) : ""}
          oninput={(e) => updateField("duration", (parseFloat((e.target as HTMLInputElement).value) || 0) * 60)}
        />
        <span class="field-unit">min</span>
      </div>
      <span class="field-sep">·</span>
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={lastSessionSet?.distance?.toString() ?? "km"}
          value={set.distance ?? ""}
          oninput={(e) => updateField("distance", parseFloat((e.target as HTMLInputElement).value) || undefined)}
        />
        <span class="field-unit">km</span>
      </div>
    {:else if showRepsOnly}
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={lastSessionSet?.reps?.toString() ?? "reps"}
          value={set.reps ?? ""}
          oninput={(e) => updateField("reps", parseFloat((e.target as HTMLInputElement).value) || undefined)}
        />
      </div>
    {:else if showTimeOnly}
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={lastSessionSet?.duration ? `${Math.round(lastSessionSet.duration / 60)} min` : "sec"}
          value={set.duration ?? ""}
          oninput={(e) => updateField("duration", parseFloat((e.target as HTMLInputElement).value) || undefined)}
        />
        <span class="field-unit">s</span>
      </div>
    {:else if showWeightTime}
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={displayWeight(lastSessionSet?.weight)}
          value={displayWeight(set.weight)}
          oninput={(e) => updateField("weight", inputWeightToKg((e.target as HTMLInputElement).value))}
        />
        <span class="field-unit">{weightUnitLabel}</span>
      </div>
      <span class="field-sep">·</span>
      <div class="input-group">
        <input
          type="number"
          class="field-input"
          placeholder={lastSessionSet?.duration?.toString() ?? "sec"}
          value={set.duration ?? ""}
          oninput={(e) => updateField("duration", parseFloat((e.target as HTMLInputElement).value) || undefined)}
        />
        <span class="field-unit">s</span>
      </div>
    {/if}

    {#if showComplete}
      <button class="complete-set-btn" onclick={(e: MouseEvent) => onComplete(e)} aria-label="Complete set">
        <span class="material-symbols-outlined">check_circle</span>
      </button>
    {/if}
    <button class="delete-set-btn" onclick={(e: MouseEvent) => onDelete(e)} aria-label="Delete set">
      <span class="material-symbols-outlined">remove_circle</span>
    </button>
  </div>
</div>

<style>
  .set-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-md, 0.5rem);
    margin-bottom: 6px;
  }

  .set-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    min-width: 36px;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .set-inputs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 1;
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .field-input {
    width: 56px;
    padding: 6px 8px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-sm, 0.25rem);
    background: var(--surface, #fcf9f8);
    color: var(--on-surface, #1b1c1c);
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    outline: none;
    font-family: var(--font-body, Inter, sans-serif);
    transition: border-color 0.15s;
  }
  .field-input:focus {
    border-color: var(--primary, #334537);
  }
  .field-input::placeholder {
    color: var(--outline, #737872);
    opacity: 0.6;
    font-weight: 400;
  }

  .field-unit {
    font-size: 12px;
    color: var(--outline, #737872);
    font-weight: 500;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .field-sep {
    color: var(--outline, #737872);
    font-size: 14px;
    font-weight: 500;
  }

  .delete-set-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 4px;
    margin-left: auto;
    opacity: 0.5;
    transition: opacity 0.15s, color 0.15s;
  }
  .delete-set-btn:hover,
  .delete-set-btn:focus-visible {
    opacity: 1;
    color: var(--error, #ba1a1a);
  }

  .complete-set-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 4px;
    opacity: 0.6;
    transition: opacity 0.15s, color 0.15s;
  }
  .complete-set-btn:hover,
  .complete-set-btn:focus-visible {
    opacity: 1;
    color: var(--primary, #334537);
  }
</style>