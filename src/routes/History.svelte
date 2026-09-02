<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
</script>

<div class="history-page">
  <header class="page-header">
    <h2>History</h2>
  </header>

  <EmptyState
    icon="📅"
    title="No Workouts Yet"
    description="Your completed workouts will appear here, grouped by month. Start logging to build your history."
    action={{ label: "Start a Workout", onclick: () => navigateTo("home") }}
  />
</div>

<style>
  .history-page {
    padding: 24px 16px;
    max-width: 480px;
    margin: 0 auto;
  }
  .page-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 16px 0;
    color: var(--text-primary, #fff);
  }
</style>