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
  import { saveSession, listSessions, deleteSession, saveTemplate } from "./lib/session-store.js";
  import type { WorkoutSession, SessionExercise, Exercise, SessionMachineState, WorkoutTemplate, TemplateExercise } from "./lib/types.js";
  import type { Field, Equipment, MuscleGroup } from "./lib/types.js";
  import TemplateBuilder from "./lib/TemplateBuilder.svelte";
  import TemplatePreview from "./lib/TemplatePreview.svelte";
  import { getExercise } from "./lib/exercise-store.js";

  const tabs = [
    { id: "home" as const, icon: "home", label: "Home" },
    { id: "history" as const, icon: "show_chart", label: "History" },
    { id: "templates" as const, icon: "fitness_center", label: "Templates" },
    { id: "settings" as const, icon: "person", label: "Settings" },
  ];

  // Workout flow phases: "idle" | "picker" | "session" | "summary"
  let workoutPhase = $state<"idle" | "picker" | "session" | "summary">("idle");

  // Template flow phases
  let showTemplateBuilder = $state(false);
  let showTemplatePreview = $state(false);
  let previewTemplate = $state<WorkoutTemplate | null>(null);

  // For "Save as Template" from summary: pre-fill builder with session data
  let saveAsTemplateData = $state<{ name: string; exercises: TemplateExercise[] } | null>(null);

  // For "Save as Template" from history
  let historyTemplateData = $state<{ name: string; exercises: TemplateExercise[] } | null>(null);

  // Pending exercises selected from picker before session starts
  let pendingExercises = $state<SessionExercise[]>([]);

  // Session machine state
  let machine = $state<SessionMachineState>({ state: "idle", session: null });

  // Last completed workout for home dashboard
  let lastWorkout = $state<WorkoutSession | null>(null);

  // Home screen stats
  let workoutCount = $state(0);
  let activeMinutes = $state(0);

  // Resumable session from IndexedDB (for resume banner and abandon protection)
  let resumableSession = $state<WorkoutSession | null>(null);

  // Abandon confirmation dialog
  let showAbandonConfirm = $state(false);

  // Derived: is there an active workout (including resumable)?
  let workoutActive = $derived(
    workoutPhase === "session" ||
    workoutPhase === "picker" ||
    (workoutPhase === "idle" && resumableSession !== null)
  );

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

  // Check for resumable session and load dashboard data from IndexedDB on mount
  $effect(() => {
    loadDashboardData();
  });

  async function loadDashboardData() {
    const sessions = await listSessions();

    // Find any in-progress session (for resume banner)
    const inProgress = sessions.find((s) => s.endedAt === null);
    if (inProgress) {
      resumableSession = inProgress;
    }

    // Compute stats from completed sessions
    const completed = sessions.filter((s) => s.endedAt !== null);
    workoutCount = completed.length;
    activeMinutes = completed.reduce((total, s) => {
      const durationMs =
        new Date(s.endedAt!).getTime() - new Date(s.startedAt).getTime();
      return total + Math.round(durationMs / 60000);
    }, 0);

    // Load most recent completed session as lastWorkout
    lastWorkout = completed.length > 0 ? completed[0] : null;
  }

  // Auto-save: persist the session to IndexedDB on every mutation.
  // All writes are serialised through a promise chain so the final save in
  // handleFinishWorkout is guaranteed to execute last, preventing a stale
  // in-progress write from overwriting endedAt.
  let saveChain = Promise.resolve();

  function enqueueSave(session: WorkoutSession) {
    // Serialise through JSON to strip Svelte $state proxies — IndexedDB's
    // structured clone algorithm cannot serialize reactive Proxy objects.
    saveChain = saveChain.then(() => saveSession(JSON.parse(JSON.stringify(session))));
  }

  $effect(() => {
    if (machine.state === "in-progress" && machine.session) {
      enqueueSave(machine.session);
    }
  });

  function showSubPage(page: string) {
    subPage = page;
  }

  function goBack() {
    subPage = null;
  }

  // ─── Workout flow functions ───

  function startWorkout() {
    if (resumableSession) {
      showAbandonConfirm = true;
      return;
    }
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

  async function handleFinishWorkout() {
    machine = sessionReducer(machine, { type: "FINISH_SESSION" });
    // Enqueue the finished-session write (will be last in chain) and wait
    // for every queued write — including any in-flight auto-saves — to
    // complete before revealing the summary.
    if (machine.session) {
      enqueueSave(machine.session);
    }
    try {
      await saveChain;
    } catch (e) {
      console.error("Failed to save session:", e);
    }
    workoutPhase = "summary";
  }

  // ─── Template flow ───

  function handleCreateTemplate() {
    saveAsTemplateData = null;
    showTemplateBuilder = true;
  }

  function handleStartTemplate(template: WorkoutTemplate) {
    if (resumableSession) {
      // If there's a session in progress, we need to handle it first
      showAbandonConfirm = true;
      // Store the selected template for after abandon resolves
      previewTemplate = template;
      return;
    }
    previewTemplate = template;
    showTemplatePreview = true;
  }

  async function startSessionFromTemplate() {
    if (!previewTemplate) return;
    const now = new Date().toISOString();

    // Create SessionExercise items from template exercises,
    // looking up each exercise from the catalog for its name, fields, and muscleGroups
    const exercises: SessionExercise[] = [];
    for (const te of previewTemplate.exercises) {
      const catalogEntry = await getExercise(te.exerciseId);
      exercises.push({
        exerciseId: te.exerciseId,
        exerciseName: catalogEntry?.name ?? "Unknown Exercise",
        fields: (catalogEntry?.fields ?? []) as Field[],
        muscleGroups: (catalogEntry?.muscleGroups ?? []) as MuscleGroup[],
        equipment: te.equipment,
        sets: Array.from({ length: te.setCount }, () => ({})),
      });
    }

    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      startedAt: now,
      endedAt: null,
      templateId: previewTemplate.id,
      name: previewTemplate.name,
      exercises,
    };

    // Update template usage stats
    const updatedTemplate: WorkoutTemplate = {
      ...previewTemplate,
      lastUsedAt: now,
      useCount: previewTemplate.useCount + 1,
    };
    saveTemplate(updatedTemplate);

    machine = sessionReducer(machine, { type: "START_SESSION", session: newSession });
    workoutPhase = "session";
    showTemplatePreview = false;
    previewTemplate = null;
  }

  function handleSaveAsTemplateFromSummary() {
    if (!machine.session) return;

    // Extract template data from session: exercise order, equipment, set count
    // Strip weights/reps/duration/distance/notes (all set data)
    const templateExercises: TemplateExercise[] = machine.session.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      equipment: ex.equipment,
      setCount: ex.sets.length || 3,
    }));

    saveAsTemplateData = {
      name: machine.session.name,
      exercises: templateExercises,
    };
    showTemplateBuilder = true;
  }

  function handleSaveAsTemplateFromHistory(session: WorkoutSession) {
    const templateExercises: TemplateExercise[] = session.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      equipment: ex.equipment,
      setCount: ex.sets.length || 3,
    }));

    historyTemplateData = {
      name: session.name,
      exercises: templateExercises,
    };
    showTemplateBuilder = true;
  }

  async function handleSaveTemplate(name: string, exercises: TemplateExercise[]) {
    const now = new Date().toISOString();
    const template: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name,
      exercises,
      createdAt: now,
      lastUsedAt: now,
      useCount: 0,
    };
    await saveTemplate(template);
    showTemplateBuilder = false;
    saveAsTemplateData = null;
    historyTemplateData = null;
    templateRefreshVersion++;
  }

  function handleCloseTemplateBuilder() {
    showTemplateBuilder = false;
    saveAsTemplateData = null;
    historyTemplateData = null;
  }

  function handleDoneSummary() {
    // Refresh dashboard data from IndexedDB so stats and lastWorkout update
    loadDashboardData();
    machine = sessionReducer(machine, { type: "ABANDON_SESSION" });
    workoutPhase = "idle";
    resumableSession = null;
    navigateTo("history");
  }

  function updateSession(session: WorkoutSession) {
    machine = { ...machine, session };
  }

  function handleAbandonAbandon() {
    if (resumableSession) {
      deleteSession(resumableSession.id);
    }
    resumableSession = null;
    showAbandonConfirm = false;
    pendingExercises = [];
    // If we were about to start a template, continue to preview
    if (previewTemplate) {
      showTemplatePreview = true;
    } else {
      workoutPhase = "picker";
    }
  }

  function handleAbandonContinue() {
    if (resumableSession) {
      machine = sessionReducer(machine, { type: "RESUME_SESSION", session: resumableSession });
      resumableSession = null;
      workoutPhase = "session";
    }
    showAbandonConfirm = false;
    previewTemplate = null;
  }

  function handlePillClick() {
    if (workoutPhase === "session" || workoutPhase === "summary") return;
    if (resumableSession) {
      machine = sessionReducer(machine, { type: "RESUME_SESSION", session: resumableSession });
      resumableSession = null;
      workoutPhase = "session";
    } else if (workoutPhase === "picker") {
      startSession();
    }
  }
</script>

<div class="app-shell">
  <!-- Workout in progress pill -->
  {#if workoutActive && workoutPhase !== "summary"}
    <div class="workout-pill" onclick={handlePillClick} role="button" tabindex="0" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePillClick()}>
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
    {:else if showTemplatePreview && previewTemplate}
      <TemplatePreview
        template={previewTemplate}
        onStart={startSessionFromTemplate}
        onBack={() => {
          showTemplatePreview = false;
          previewTemplate = null;
        }}
      />
    {:else if subPage === "exercises"}
      <Exercises onBack={goBack} />
    {:else if subPage === "data-management"}}
      <DataManagement onback={goBack} />
    {:else if $currentTab === "home"}
      <Home {lastWorkout} {workoutCount} {activeMinutes} onStartWorkout={startWorkout} {workoutActive} resumableSession={resumableSession} />
    {:else if $currentTab === "history"}
      <History onSaveAsTemplate={handleSaveAsTemplateFromHistory} />
    {:else if $currentTab === "templates"}
      <Templates
        onStartTemplate={handleStartTemplate}
        onCreateTemplate={handleCreateTemplate}
      />
    {:else if $currentTab === "settings"}
      <Settings onshow={showSubPage} />
    {/if}
  </main>

  <!-- Exercise Picker (overlay, shown during picker phase) -->
  {#if workoutPhase === "picker"}
    <div class="picker-overlay" onclick={(e) => e.target === e.currentTarget && startSession()} role="dialog" aria-label="Exercise picker" tabindex="-1" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && startSession()}>
      <div class="picker-sheet">
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
      onSaveAsTemplate={handleSaveAsTemplateFromSummary}
      onDone={handleDoneSummary}
    />
  {/if}

  <!-- Template Builder -->
  {#if showTemplateBuilder}
    <TemplateBuilder
      initialName={saveAsTemplateData?.name ?? historyTemplateData?.name ?? ""}
      initialExercises={saveAsTemplateData?.exercises ?? historyTemplateData?.exercises ?? []}
      onSave={handleSaveTemplate}
      onCancel={handleCloseTemplateBuilder}
    />
  {/if}

  <!-- Abandon confirmation dialog -->
  {#if showAbandonConfirm}
    <div class="abandon-overlay" onclick={(e) => e.target === e.currentTarget && handleAbandonContinue()} role="dialog" aria-label="Abandon workout confirmation" tabindex="-1" onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleAbandonContinue()}>
      <div class="abandon-sheet">
        <div class="abandon-icon-wrap">
          <span class="material-symbols-outlined abandon-icon">warning</span>
        </div>
        <h3 class="abandon-title">Workout in Progress</h3>
        <p class="abandon-desc">You have a workout in progress. What would you like to do?</p>
        <div class="abandon-actions">
          <button class="abandon-btn abandon-btn--secondary" onclick={handleAbandonContinue}>
            Continue Workout
          </button>
          <button class="abandon-btn abandon-btn--danger" onclick={handleAbandonAbandon}>
            Abandon Workout
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Bottom tab bar -->
  {#if !subPage && workoutPhase !== "session" && workoutPhase !== "summary" && !showTemplatePreview}
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

  /* ─── Abandon confirmation dialog styles ─── */
  .abandon-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
  }

  .abandon-sheet {
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-2xl, 1.5rem);
    width: 100%;
    max-width: 360px;
    padding: 32px 24px 20px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
    text-align: center;
  }

  .abandon-icon-wrap {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .abandon-icon {
    font-size: 40px;
    color: var(--error, #ba1a1a);
  }

  .abandon-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    margin: 0 0 8px 0;
  }

  .abandon-desc {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 14px;
    line-height: 1.5;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 24px 0;
  }

  .abandon-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .abandon-btn {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .abandon-btn--secondary {
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
  }

  .abandon-btn--danger {
    background: var(--error-container, #ffdad6);
    color: var(--on-error-container, #410002);
  }

  .abandon-btn:hover {
    opacity: 0.9;
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