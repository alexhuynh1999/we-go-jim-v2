<script lang="ts">
  let {
    show = false,
    title = "",
    actions = [] as { label: string; icon?: string; danger?: boolean; onclick: () => void }[],
    onClose = () => {},
  } = $props();

  function handleAction(action: { onclick: () => void }) {
    action.onclick();
    onClose();
  }

  function handleOverlayClick(e: MouseEvent) {
    onClose();
  }

  function handleSheetClick(e: MouseEvent) {
    e.stopPropagation();
  }
</script>

{#if show}
  <div class="action-sheet-overlay" onclick={handleOverlayClick} role="dialog" aria-label={title || "Actions"}>
    <div class="action-sheet" onclick={handleSheetClick} role="document">
      {#if title}
        <div class="action-sheet-title">{title}</div>
      {/if}
      <div class="action-list">
        {#each actions as action}
          <button
            class="action-item"
            class:danger={action.danger}
            onclick={() => handleAction(action)}
          >
            {#if action.icon}
              <span class="material-symbols-outlined action-icon">{action.icon}</span>
            {/if}
            <span class="action-label">{action.label}</span>
          </button>
        {/each}
      </div>
      <button class="cancel-button" onclick={handleOverlayClick}>Cancel</button>
    </div>
  </div>
{/if}

<style>
  .action-sheet-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 500;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 16px;
  }

  .action-sheet {
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-2xl, 1.5rem);
    width: 100%;
    max-width: 480px;
    overflow: hidden;
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.08);
  }

  .action-sheet-title {
    padding: 20px 20px 12px;
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-sm, 20px);
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    text-align: center;
    border-bottom: 1px solid var(--outline-variant, #c3c8c1);
  }

  .action-list {
    padding: 8px 0;
  }

  .action-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 20px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    font-size: 15px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
    font-family: var(--font-body, Inter, sans-serif);
    transition: background 0.1s;
  }
  .action-item:hover {
    background: var(--surface-container-low, #f6f3f2);
  }

  .action-item.danger {
    color: var(--error, #ba1a1a);
  }

  .action-icon {
    font-size: 20px;
    color: var(--on-surface-variant, #434843);
  }

  .action-item.danger .action-icon {
    color: var(--error, #ba1a1a);
  }

  .cancel-button {
    width: 100%;
    padding: 14px;
    border: none;
    border-top: 1px solid var(--outline-variant, #c3c8c1);
    background: var(--surface, #fcf9f8);
    color: var(--primary, #334537);
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--font-body, Inter, sans-serif);
    transition: background 0.1s;
  }
  .cancel-button:hover {
    background: var(--surface-container-low, #f6f3f2);
  }
</style>