<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
  import { listSessions } from "../lib/session-store.js";
  import type { WorkoutSession } from "../lib/types.js";

  let sessions = $state<WorkoutSession[]>([]);
  let loading = $state(true);

  $effect(() => {
    listSessions().then((all) => {
      // Only show finished sessions (endedAt !== null)
      sessions = all.filter((s) => s.endedAt !== null);
      loading = false;
    });
  });

  // Group sessions by month
  let groupedSessions = $derived.by(() => {
    const groups: { month: string; sessions: WorkoutSession[] }[] = [];
    for (const session of sessions) {
      const d = new Date(session.startedAt);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
      let group = groups.find((g) => g.month === monthKey);
      if (!group) {
        group = { month: monthKey, sessions: [] };
        groups.push(group);
      }
      group.sessions.push(session);
    }
    return groups;
  });

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  function getDuration(session: WorkoutSession): string | null {
    if (!session.startedAt || !session.endedAt) return null;
    const secs = Math.floor(
      (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000,
    );
    return formatDuration(secs);
  }

  function getDayLabel(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
  }

  function getSetCount(session: WorkoutSession): number {
    return session.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }
</script>

<div class="history-page">
  <header class="page-header">
    <h2>History</h2>
  </header>

  {#if loading}
    <p class="loading-text">Loading...</p>
  {:else if sessions.length === 0}
    <EmptyState
      icon="calendar_month"
      title="No Workouts Yet"
      description="Your completed workouts will appear here, grouped by month. Start logging to build your history."
      action={{ label: "Start a Workout", onclick: () => navigateTo("home") }}
    />
  {:else}
    {#each groupedSessions as group}
      <div class="month-group">
        <h3 class="month-label">{group.sessions[0]?.startedAt ? new Date(group.sessions[0].startedAt).toLocaleDateString(undefined, { year: "numeric", month: "long" }) : ""}</h3>
        {#each group.sessions as session}
          <div class="history-card">
            <div class="hc-header">
              <span class="hc-day">{getDayLabel(session.startedAt)}</span>
              <span class="hc-name">{session.name}</span>
            </div>
            <div class="hc-stats">
              <span class="hc-stat">
                <span class="hc-stat-value">{session.exercises.length}</span>
                <span class="hc-stat-label">exercises</span>
              </span>
              <span class="hc-stat-divider">·</span>
              <span class="hc-stat">
                <span class="hc-stat-value">{getSetCount(session)}</span>
                <span class="hc-stat-label">sets</span>
              </span>
              {#if getDuration(session)}
                <span class="hc-stat-divider">·</span>
                <span class="hc-stat">
                  <span class="hc-stat-value">{getDuration(session)}</span>
                  <span class="hc-stat-label"></span>
                </span>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/each}
  {/if}
</div>

<style>
  .history-page {
    padding: var(--space-container-padding, 24px) var(--space-gutter, 16px);
    max-width: 480px;
    margin: 0 auto;
  }
  .page-header h2 {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-lg-mobile, 28px);
    font-weight: 600;
    line-height: var(--text-headline-lg-mobile-lh, 36px);
    color: var(--on-surface, #1b1c1c);
    margin: 0 0 16px 0;
  }

  .loading-text {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    text-align: center;
    padding: 32px 16px;
  }

  .month-group {
    margin-bottom: 24px;
  }

  .month-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-md, 14px);
    font-weight: 600;
    line-height: var(--text-label-md-lh, 20px);
    letter-spacing: var(--text-label-md-ls, 0.05em);
    text-transform: uppercase;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 8px 0;
  }

  .history-card {
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-xl, 1rem);
    padding: 14px 16px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    margin-bottom: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .history-card:hover {
    background: var(--surface-container, #f0eded);
  }

  .hc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .hc-day {
    font-size: 13px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-stats {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .hc-stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hc-stat-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-stat-label {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .hc-stat-divider {
    color: var(--outline, #737872);
    font-size: 14px;
  }
</style>