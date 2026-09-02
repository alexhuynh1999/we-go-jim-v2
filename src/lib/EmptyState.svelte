<script lang="ts">
  let {
    icon = "📭",
    title = "",
    description = "",
    action = undefined as { label: string; href?: string; onclick?: () => void } | undefined,
  } = $props();
</script>

<div class="empty-state">
  <div class="empty-icon">{icon}</div>
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
  }
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.8;
  }
  .empty-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 8px 0;
    color: var(--text-primary, #fff);
  }
  .empty-description {
    font-size: 14px;
    color: var(--text-secondary, #888);
    margin: 0 0 24px 0;
    max-width: 280px;
    line-height: 1.5;
  }
  .empty-action {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    background: var(--accent, #4fc3f7);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s;
    font-family: inherit;
  }
  .empty-action:hover {
    opacity: 0.9;
  }
</style>