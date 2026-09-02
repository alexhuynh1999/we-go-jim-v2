<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
</script>

<div class="templates-page">
  <header class="page-header">
    <h2>Templates</h2>
  </header>

  <EmptyState
    icon="description"
    title="No Templates Yet"
    description="Create a template to save your favourite workout structures. Templates make starting a session faster."
    action={{ label: "Create Your First Template", onclick: () => navigateTo("home") }}
  />
</div>

<style>
  .templates-page {
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