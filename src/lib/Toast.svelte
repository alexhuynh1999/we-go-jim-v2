<script lang="ts">
  let {
    message = "",
    visible = false,
    action = undefined as { label: string; onclick: () => void } | undefined,
    ondismiss = () => {},
  } = $props();
</script>

{#if visible}
  <div class="toast-container" role="alert">
    <div class="toast">
      <span class="toast-message">{message}</span>
      {#if action}
        <button class="toast-action" onclick={action.onclick}>{action.label}</button>
      {/if}
      <button class="toast-close" onclick={(e: MouseEvent) => ondismiss()} aria-label="Dismiss">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    bottom: 80px;
    left: 16px;
    right: 16px;
    display: flex;
    justify-content: center;
    z-index: 600;
    animation: toast-in 0.3s ease-out;
  }

  @keyframes toast-in {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--on-surface, #1b1c1c);
    color: var(--surface, #fcf9f8);
    padding: 12px 16px;
    border-radius: var(--radius-md, 0.5rem);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
    max-width: 400px;
    width: 100%;
  }

  .toast-message {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body, Inter, sans-serif);
  }

  .toast-action {
    background: none;
    border: none;
    color: var(--primary-fixed, #d3e8d5);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    font-family: var(--font-body, Inter, sans-serif);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .toast-action:hover {
    opacity: 0.9;
  }

  .toast-close {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: var(--surface-container-high, #eae7e7);
    cursor: pointer;
    padding: 2px;
    opacity: 0.7;
    transition: opacity 0.15s;
  }
  .toast-close:hover {
    opacity: 1;
  }
  .toast-close .material-symbols-outlined {
    font-size: 18px;
  }
</style>