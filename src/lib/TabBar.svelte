<script lang="ts">
  import type { Tab } from "../lib/nav.js";

  let { tab = "home" as Tab, icon = "", label = "", active = false, onclick = undefined as ((e: MouseEvent) => void) | undefined } = $props();
</script>

<button
  class="tab-button"
  class:active
  data-tab={tab}
  role="tab"
  aria-selected={active}
  aria-label={label}
  {onclick}
>
  <span class="tab-icon">{icon}</span>
  <span class="tab-label">{label}</span>
</button>

<style>
  .tab-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex: 1;
    padding: 8px 0;
    border: none;
    background: transparent;
    color: var(--text-secondary, #888);
    cursor: pointer;
    transition: color 0.2s;
    font-family: inherit;
    font-size: 11px;
    line-height: 1;
    -webkit-tap-highlight-color: transparent;
  }
  .tab-button:hover {
    color: var(--text-primary, #fff);
  }
  .tab-button.active {
    color: var(--accent, #4fc3f7);
  }
  .tab-icon {
    font-size: 22px;
    line-height: 1;
  }
  .tab-label {
    font-weight: 500;
  }
</style>