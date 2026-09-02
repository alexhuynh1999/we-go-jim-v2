<script lang="ts">
  let {
    icon = "📭",
    title = "",
    description = "",
    action = undefined as { label: string; href?: string; onclick?: () => void } | undefined,
  } = $props();
</script>

<div class="empty-state">
  <div class="empty-icon"><span class="empty-icon-symbol material-symbols-outlined">{icon}</span></div>
  <h2 class="empty-title">{title}</h2>
  {#if description}
    <p class="empty-description">{description}</p>
  {/if}
  {#if action}
    <button
      class="empty-action"
      onclick={action.onclick}
    >
      {action.label}
    </button>
  {/if}
</div>

<style>
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    min-height: 60vh;
    background: var(--surface-container-low, #f6f3f2);
    border: 1px dashed var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-xl, 1rem);
    margin: 16px 0;
  }
  .empty-icon {
    width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface-container, #f0eded);
    border-radius: var(--radius-full, 9999px);
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
    margin-bottom: 16px;
  }
  .empty-icon-symbol {
    font-size: 26px;
    color: var(--tertiary, #444138);
    font-variation-settings: 'FILL' 1;
  }
  .empty-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-display, 'Source Serif 4', serif);
  }
  .empty-description {
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 24px 0;
    max-width: 280px;
    line-height: 1.5;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .empty-action {
    padding: 12px 24px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .empty-action:hover {
    opacity: 0.9;
  }
</style>