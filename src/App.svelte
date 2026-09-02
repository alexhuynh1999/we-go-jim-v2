<script lang="ts">
  import TabBar from "./lib/TabBar.svelte";
  import { currentTab, navigateTo } from "./lib/nav.js";
  import { settings, effectiveDarkMode } from "./lib/settings.js";
  import Home from "./routes/Home.svelte";
  import History from "./routes/History.svelte";
  import Templates from "./routes/Templates.svelte";
  import Settings from "./routes/Settings.svelte";
  import DataManagement from "./routes/DataManagement.svelte";
  import Exercises from "./routes/Exercises.svelte";
  import SessionView from "./lib/SessionView.svelte";
  import SummaryModal from "./lib/SummaryModal.svelte";
  import ExercisePickerInline from "./lib/ExercisePickerInline.svelte";
  import { sessionReducer } from "./lib/session-machine.js";
  import type { WorkoutSession, SessionExercise, Exercise, SessionMachineState } from "./lib/types.js";
  import type { Field, Equipment, MuscleGroup } from "./lib/types.js";

  const tabs = [
    { id: "home" as const, icon: "home", label: "Home" },
    { id: "history" as const, icon: "show_chart", label: "History" },
    { id: "templates" as const, icon: "fitness_center", label: "Templates" },
    { id: "settings" as const, icon: "person", label: "Settings" },
  ];

  // Workout flow phases: "idle" | "picker" | "session" | "summary"
  let workoutPhase = $state<"idle" | "picker" | "session" | "summary">("idle");

  // Pending exercises selected from picker before session starts
  let pendingExercises = $state<SessionExercise[]>([]);

  // Session machine state
  let machine = $state<SessionMachineState>({ state: "idle", session: null });

  // Last completed workout for home dashboard
  let lastWorkout = $state<WorkoutSession | null>(null);

  // Derived: is there an active workout?
  let workoutActive = $derived(workoutPhase === "session" || workoutPhase === "picker");

  // Track whether we're on a sub-page
  let subPage = $state<string | null>(null);

  // Apply dark mode class
  $effect(() => {
    const html = document.documentElement;
    if ($effectiveDarkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  });

  // Listen for system dark mode changes
  $effect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // Force reactivity by touching the settings store
      settings.patch({});
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  });

  function showSubPage(page: string) {
    subPage = page;
  }

  function goBack() {
    subPage = null;
  }

  // ─── Workout flow functions ───

  function startWorkout() {
    pendingExercises = [];
    workoutPhase = "picker";
  }

  function handleAddExercise(exercise: Exercise) {
    const exists = pendingExercises.some((e) => e.exerciseId === exercise.id);
    if (exists) return; // don't add duplicates
    pendingExercises = [
      ...pendingExercises,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        fields: exercise.fields as Field[],
        muscleGroups: exercise.muscleGroups as MuscleGroup[],
        equipment: exercise.equipment[0] ?? ("bodyweight" as Equipment),
        sets: [],
      },
    ];
  }

  function startSession() {
    const now = new Date().toISOString();
    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      startedAt: now,
      endedAt: null,
      templateId: null,
      name: "Quick Workout",
      exercises: pendingExercises,
    };
    machine = sessionReducer(machine, { type: "START_SESSION", session: newSession });
    workoutPhase = "session";
  }

  function handleFinishWorkout() {
    machine = sessionReducer(machine, { type: "FINISH_SESSION" });
    workoutPhase = "summary";
  }

  function handleSaveAsTemplate() {
    // For now, just a no-op placeholder
  }

  function handleDoneSummary() {
    if (machine.session) {
      lastWorkout = machine.session;
    }
    machine = sessionReducer(machine, { type: "ABANDON_SESSION" });
    workoutPhase = "idle";
    navigateTo("history");
  }

  function updateSession(session: WorkoutSession) {
    machine = { ...machine, session };
  }
</script>

<div class="app-shell">
  <!-- Workout in progress pill -->
  {#if workoutActive && workoutPhase !== "summary"}
    <div class="workout-pill" onclick={() => { if (workoutPhase !== "session") workoutPhase = "session"; }}>
      <span class="pill-dot">●</span>
      <span>Workout in progress</span>
    </div>
  {/if}

  <!-- Main content area -->
  <main class="main-content">
    {#if workoutPhase === "session" || workoutPhase === "summary"}
      {#if machine.session}
        <SessionView
          session={machine.session}
          onUpdateSession={updateSession}
          onFinish={handleFinishWorkout}
        />
      {/if}
    {:else if subPage === "exercises"}
      <Exercises onBack={goBack} />
    {:else if subPage === "data-management"}}
      <DataManagement onback={goBack} />
    {:else if $currentTab === "home"}
      <Home {lastWorkout} onStartWorkout={startWorkout} {workoutActive} />
    {:else if $currentTab === "history"}
      <History />
    {:else if $currentTab === "templates"}
      <Templates />
    {:else if $currentTab === "settings"}
      <Settings onshow={showSubPage} />
    {/if}
  </main>

  <!-- Exercise Picker (overlay, shown during picker phase) -->
  {#if workoutPhase === "picker"}
    <div class="picker-overlay" onclick={startSession} role="dialog" aria-label="Exercise picker">
      <div class="picker-sheet" onclick={(e) => e.stopPropagation()} role="document">
        <div class="picker-header">
          <h2 class="picker-title">Add Exercises</h2>
          <div class="picker-header-actions">
            <span class="picker-count">{pendingExercises.length} selected</span>
            <button class="picker-done-btn" onclick={startSession}>Start</button>
          </div>
        </div>

        <ExercisePickerInline
          onAdd={handleAddExercise}
          addedIds={new Set(pendingExercises.map((e) => e.exerciseId))}
        />
      </div>
    </div>
  {/if}

  <!-- Summary Modal -->
  {#if workoutPhase === "summary" && machine.session}
    <SummaryModal
      session={machine.session}
      showSaveAsTemplate={machine.session.templateId === null}
      onSaveAsTemplate={handleSaveAsTemplate}
      onDone={handleDoneSummary}
    />
  {/if}

  <!-- Bottom tab bar -->
  {#if !subPage && workoutPhase !== "session" && workoutPhase !== "summary"}
    <div class="tab-bar" role="tablist">
      {#each tabs as tab}
        <TabBar
          tab={tab.id}
          icon={tab.icon}
          label={tab.label}
          active={$currentTab === tab.id}
          onclick={() => navigateTo(tab.id)}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- Exercise picker sub-component (inline to keep picker logic in App) -->

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: var(--font-body, Inter, sans-serif);
    background: var(--bg, #fcf9f8);
    color: var(--on-surface, #1b1c1c);
    min-height: 100dvh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(#app) {
    min-height: 100dvh;
  }

  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    position: relative;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 64px);
  }

  .tab-bar {
    display: flex;
    background: var(--surface, #fcf9f8);
    border-top: 1px solid var(--outline-variant, #c3c8c1);
    padding: 4px env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 4px) env(safe-area-inset-left, 0);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .workout-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    padding: 6px 14px;
    border-radius: var(--radius-full, 9999px);
    font-size: 13px;
    font-weight: 600;
    z-index: 200;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08));
    cursor: pointer;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .pill-dot {
    font-size: 10px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ─── Picker overlay styles ─── */
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

  .picker-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .picker-count {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .picker-done-btn {
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
  .picker-done-btn:hover {
    opacity: 0.9;
  }
</style>