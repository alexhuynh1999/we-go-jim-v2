<script lang="ts">
  let {
    remaining = 0,
    total = 150,
  } = $props();

  const progress = $derived(total > 0 ? remaining / total : 0);
  const displayTime = $derived(formatTime(remaining));

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }
</script>

<div class="rest-timer-bar" role="progressbar" aria-label="Rest timer" aria-valuenow={remaining} aria-valuemax={total}>
  <div class="timer-track">
    <div class="timer-fill" style="width: {progress * 100}%"></div>
  </div>
  <span class="timer-text">Rest {displayTime}</span>
</div>

<style>
  .rest-timer-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: color-mix(in srgb, var(--primary, #334537) 12%, transparent);
    border-radius: var(--radius-md, 0.5rem);
    margin: 0 0 8px;
  }

  .timer-track {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--primary, #334537) 20%, transparent);
    overflow: hidden;
    direction: rtl; /* reverse progress: shrinks from right to left */
  }

  .timer-fill {
    height: 100%;
    background: var(--primary, #334537);
    border-radius: 3px;
    transition: width 1s linear;
  }

  .timer-text {
    font-size: 12px;
    font-weight: 600;
    color: var(--primary, #334537);
    font-family: var(--font-body, Inter, sans-serif);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    min-width: 50px;
    text-align: right;
  }
</style>