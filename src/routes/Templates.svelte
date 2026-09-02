<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
</script>

<div class="templates-page">
  <header class="page-header">
    <h2>Templates</h2>
  </header>

  <EmptyState
    icon="📋"
    title="No Templates Yet"
    description="Create a template to save your favourite workout structures. Templates make starting a session faster."
    action={{ label: "Create Your First Template", onclick: () => navigateTo("home") }}
  />
</div>

<style>
  .templates-page {
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