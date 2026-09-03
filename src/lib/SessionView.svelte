<script lang="ts">
  import type { WorkoutSession, ExerciseSet, SessionExercise, Exercise, ExerciseSource } from "./types";
  import type { Field, Equipment, MuscleGroup } from "./types";
  import type { RestTimerState } from "./types";
  import ExerciseCard from "./ExerciseCard.svelte";
  import ExercisePicker from "./ExercisePicker.svelte";
  import { getHeaviestSetForExercise } from "./session-store";
  import { createRestTimer, startTimer, tick } from "./rest-timer";
  import { settings } from "./settings";

  let {
    session = null as WorkoutSession | null,
    onUpdateSession = (_s: WorkoutSession) => {},
    onFinish = (_e: MouseEvent) => {},
  } = $props();

  // ─── Rest timer state ───
  let restTimer = $state<RestTimerState>(createRestTimer(150));
  let activeTimerExerciseIdx = $state<number | null>(null);
  let timerInterval: ReturnType<typeof setInterval> | undefined;

  // Tick at ~30fps for smooth bar animation, fractional decrement per tick
  const TICK_INTERVAL_MS = 33;
  const DELTA_PER_TICK = TICK_INTERVAL_MS / 1000;

  // Set up interval when timer is running, tear down when stopped
  $effect(() => {
    if (restTimer.running) {
      timerInterval = setInterval(() => {
        restTimer = tick(restTimer, DELTA_PER_TICK);
      }, TICK_INTERVAL_MS);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = undefined;
      }
      // Clear the active index when timer reaches 0
      if (restTimer.remaining === 0) {
        activeTimerExerciseIdx = null;
      }
    }
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = undefined;
      }
    };
  });

  function handleCompleteSet(exIdx: number) {
    // Start or reset the rest timer
    const total = $settings.restTimerSeconds;
    restTimer = startTimer(createRestTimer(total));
    activeTimerExerciseIdx = exIdx;
  }

  let showPicker = $state(false);
  let lastSessionSets = $state(new Map<string, ExerciseSet | null>());

  // Fetch last-session heaviest sets for each exercise
  $effect(() => {
    if (!session) return;
    const ids = session.exercises.map((e) => e.exerciseId);
    Promise.all(
      ids.map(async (id) => [id, await getHeaviestSetForExercise(id)] as const),
    ).then((entries) => {
      lastSessionSets = new Map(entries);
    });
  });

  // Duration timer
  let elapsed = $state(0);
  let sessionTimerInterval: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    if (session && !session.endedAt) {
      const start = new Date(session.startedAt).getTime();
      sessionTimerInterval = setInterval(() => {
        elapsed = Math.floor((Date.now() - start) / 1000);
      }, 1000);
    }
    return () => {
      if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    };
  });

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function handleAddExercise(exercise: Exercise) {
    if (!session) return;
    const newExercise: SessionExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      fields: exercise.fields as Field[],
      muscleGroups: exercise.muscleGroups as MuscleGroup[],
      equipment: exercise.equipment[0] ?? ("bodyweight" as Equipment),
      sets: [],
    };
    onUpdateSession({
      ...session,
      exercises: [...session.exercises, newExercise],
    });
  }

  function handleUpdateSets(exIdx: number, sets: ExerciseSet[]) {
    if (!session) return;
    const exercises = session.exercises.map((ex, i) =>
      i === exIdx ? { ...ex, sets } : ex,
    );
    onUpdateSession({ ...session, exercises });
  }

  function handleAddSet(exIdx: number) {
    if (!session) return;
    const exercises = session.exercises.map((ex, i) =>
      i === exIdx ? { ...ex, sets: [...ex.sets, {} as ExerciseSet] } : ex,
    );
    onUpdateSession({ ...session, exercises });
  }

  function handleDeleteExercise(exIdx: number) {
    if (!session) return;
    const exercises = session.exercises.filter((_, i) => i !== exIdx);
    onUpdateSession({ ...session, exercises });
  }

  function handleMoveExercise(fromIdx: number, toIdx: number) {
    if (!session) return;
    const exercises = [...session.exercises];
    const [moved] = exercises.splice(fromIdx, 1);
    if (!moved) return;
    exercises.splice(toIdx, 0, moved);
    onUpdateSession({ ...session, exercises });
  }
</script>

<div class="session-view">
  <!-- Header -->
  <div class="session-header">
    <div class="session-header-top">
      <h2 class="session-title">
        {session?.name ?? "Quick Workout"}
      </h2>
      <span class="session-duration">{formatDuration(elapsed)}</span>
    </div>

  </div>

  <!-- Exercise cards -->
  <div class="exercises-list">
    {#if session && session.exercises.length === 0}
      <div class="empty-exercises">
        <span class="material-symbols-outlined empty-icon">fitness_center</span>
        <p>Tap "+ Exercise" to start adding exercises</p>
      </div>
    {/if}

    {#each session?.exercises ?? [] as exercise, exIdx}
      <ExerciseCard
        exercise={exercise}
        lastSessionSet={lastSessionSets.get(exercise.exerciseId) ?? null}
        totalExercises={session?.exercises.length ?? 0}
        index={exIdx}
        showTimer={activeTimerExerciseIdx === exIdx && restTimer.running}
        timerRemaining={restTimer.remaining}
        timerTotal={restTimer.total}
        onUpdateSets={(sets: ExerciseSet[]) => handleUpdateSets(exIdx, sets)}
        onAddSet={(e: MouseEvent) => handleAddSet(exIdx)}
        onDeleteExercise={(e: MouseEvent) => handleDeleteExercise(exIdx)}
        onMoveUp={() => handleMoveExercise(exIdx, exIdx - 1)}
        onMoveDown={() => handleMoveExercise(exIdx, exIdx + 1)}
        onCompleteSet={(_setIdx: number) => handleCompleteSet(exIdx)}
      />
    {/each}

    <!-- Add exercise button at bottom of list -->
    <button class="add-exercise-btn" onclick={() => (showPicker = true)}>
      <span class="material-symbols-outlined">add</span>
      <span>Exercise</span>
    </button>
  </div>

  <!-- Finish button -->
  <div class="finish-bar">
    <button class="finish-btn" onclick={(e: MouseEvent) => onFinish(e)}>
      <span class="material-symbols-outlined">check_circle</span>
      <span>Finish Workout</span>
    </button>
  </div>
</div>

{#if showPicker}
  <ExercisePicker
    onAdd={handleAddExercise}
    onDone={() => (showPicker = false)}
  />
{/if}

<style>
  .session-view {
    display: flex;
    flex-direction: column;
    min-height: calc(100dvh - 64px);
    padding: 0 0 16px;
    max-width: 480px;
    margin: 0 auto;
  }

  .session-header {
    padding: 16px var(--space-gutter, 16px);
    background: var(--surface, #fcf9f8);
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .session-header-top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .session-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }

  .session-duration {
    font-size: 14px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
    font-variant-numeric: tabular-nums;
  }

  .add-exercise-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    padding: 14px;
    border: 2px dashed var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-lg, 0.75rem);
    background: transparent;
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
    margin-top: 12px;
  }
  .add-exercise-btn:hover {
    background: var(--surface-container-low, #f6f3f2);
    border-color: var(--outline, #737872);
  }
  .add-exercise-btn .material-symbols-outlined {
    font-size: 20px;
  }

  .exercises-list {
    flex: 1;
    padding: 12px var(--space-gutter, 16px);
  }

  .empty-exercises {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 48px 24px;
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    text-align: center;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .empty-icon {
    font-size: 40px;
    color: var(--outline, #737872);
  }

  .finish-bar {
    padding: 12px var(--space-gutter, 16px);
    border-top: 1px solid var(--outline-variant, #c3c8c1);
    background: var(--surface, #fcf9f8);
    position: sticky;
    bottom: 0;
  }

  .finish-btn {
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
  .finish-btn:hover {
    opacity: 0.9;
  }
</style>