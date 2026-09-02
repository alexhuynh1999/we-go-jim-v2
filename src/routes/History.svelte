<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
</script>

<div class="history-page">
  <header class="page-header">
    <h2>History</h2>
  </header>

  <EmptyState
    icon="calendar_month"
    title="No Workouts Yet"
    description="Your completed workouts will appear here, grouped by month. Start logging to build your history."
    action={{ label: "Start a Workout", onclick: () => navigateTo("home") }}
  />
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
</style>