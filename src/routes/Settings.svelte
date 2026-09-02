<script lang="ts">
  import { settings } from "../lib/settings.js";
  import type { DarkModeSetting, WeightUnit } from "../lib/types.js";

  let {
    onshow = undefined as ((page: string) => void) | undefined,
  } = $props();

  // Local state for heavy input (deferred update on blur/Enter)
  let restTimerInput = $state($settings.restTimerSeconds.toString());

  // Synchronise local input when settings change externally
  $effect(() => {
    restTimerInput = ($settings.restTimerSeconds).toString();
  });

  function updateRestTimer(value: string) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      settings.patch({ restTimerSeconds: parsed });
    }
  }

  function updateWeightUnit(unit: WeightUnit) {
    settings.patch({ weightUnit: unit });
  }

  function updateDarkMode(mode: DarkModeSetting) {
    settings.patch({ darkMode: mode });
  }

  function formatMSS(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
</script>

<div class="settings-page">
  <header class="page-header">
    <h2>Settings</h2>
  </header>

  <!-- General -->
  <section class="settings-group">
    <h3 class="group-label">General</h3>

    <!-- Rest Timer -->
    <div class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">timer</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Rest Timer</span>
        <span class="setting-desc">
          {formatMSS($settings.restTimerSeconds)} — default rest between sets
        </span>
      </div>
      <div class="setting-control">
        <input
          type="number"
          class="number-input"
          min="0"
          max="99999"
          bind:value={restTimerInput}
          onblur={() => updateRestTimer(restTimerInput)}
          onkeydown={(e: KeyboardEvent) => {
            if (e.key === "Enter") updateRestTimer(restTimerInput);
          }}
          aria-label="Rest timer seconds"
        />
        <span class="input-suffix">sec</span>
      </div>
    </div>

    <!-- Weight Units -->
    <div class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">weight</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Weight Units</span>
        <span class="setting-desc">Display weights in {$settings.weightUnit === 'kg' ? 'kilograms' : 'pounds'}</span>
      </div>
      <div class="toggle-group">
        <button
          class="toggle-btn"
          class:active={$settings.weightUnit === "kg"}
          onclick={() => updateWeightUnit("kg")}
        >
          kg
        </button>
        <button
          class="toggle-btn"
          class:active={$settings.weightUnit === "lb"}
          onclick={() => updateWeightUnit("lb")}
        >
          lb
        </button>
      </div>
    </div>

    <!-- Dark Mode -->
    <div class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">dark_mode</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Dark Mode</span>
        <span class="setting-desc">Choose your preferred appearance</span>
      </div>
      <div class="tri-toggle">
        {#each ["light", "dark", "system"] as mode}
          <button
            class="tri-toggle-btn"
            class:active={$settings.darkMode === mode}
            onclick={() => updateDarkMode(mode as DarkModeSetting)}
          >
            {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
          </button>
        {/each}
      </div>
    </div>
  </section>

  <!-- Exercises -->
  <section class="settings-group">
    <h3 class="group-label">Exercises</h3>
    <button class="setting-row" onclick={() => onshow?.("exercises")}>
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">fitness_center</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Exercise Management</span>
        <span class="setting-desc">Create, hide, or delete exercises</span>
      </div>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
  </section>

  <!-- Data -->
  <section class="settings-group">
    <h3 class="group-label">Data</h3>
    <button class="setting-row" onclick={() => onshow?.("data-management")}>
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">folder</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Data Management</span>
        <span class="setting-desc">Export, import, or clear workout data</span>
      </div>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
  </section>

  <!-- Coming soon -->
  <section class="settings-group">
    <h3 class="group-label">Coming soon</h3>
    <div class="setting-row setting-disabled">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">notifications</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Notifications &amp; Feedback</span>
        <span class="setting-desc">Sound and vibration for rest timer</span>
      </div>
      <span class="coming-soon-badge">Soon</span>
    </div>
    <div class="setting-row setting-disabled">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">tune</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Advanced</span>
        <span class="setting-desc">Progressive overload formula preferences</span>
      </div>
      <span class="coming-soon-badge">Soon</span>
    </div>
  </section>

  <p class="version">We Go Jim v0.1.0</p>
</div>

<style>
  .settings-page {
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
    margin: 0 0 24px 0;
  }

  .settings-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-stack-sm, 12px);
    margin-bottom: var(--space-stack-md, 24px);
  }

  .group-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-md, 14px);
    font-weight: 600;
    line-height: var(--text-label-md-lh, 20px);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--outline, #737872);
    margin: 0;
    padding: 0 8px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: var(--radius-xl, 1rem);
    background: var(--surface-container-low, #f6f3f2);
    cursor: pointer;
    transition: transform 0.15s;
    text-align: left;
    font-family: inherit;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }
  .setting-row:active {
    transform: scale(0.98);
  }
  .setting-disabled {
    opacity: 0.5;
    cursor: default;
  }
  .setting-disabled:active {
    transform: none;
  }

  .setting-icon-wrap {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface, #fcf9f8);
    border-radius: var(--radius-full, 9999px);
    flex-shrink: 0;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  }
  .setting-icon {
    font-size: 22px;
    color: var(--primary, #334537);
    font-variation-settings: 'FILL' 1;
  }

  .setting-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .setting-label {
    font-size: 15px;
    font-weight: 500;
    color: var(--on-surface, #1b1c1c);
  }
  .setting-desc {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    font-weight: 400;
  }

  /* ─── Number input with suffix ─── */
  .setting-control {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .number-input {
    width: 64px;
    padding: 6px 8px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--surface, #fcf9f8);
    color: var(--on-surface, #1b1c1c);
    font-size: 15px;
    font-weight: 500;
    font-family: var(--font-body, Inter, sans-serif);
    text-align: center;
    outline: none;
    transition: border-color 0.2s;
  }
  .number-input:focus {
    border-color: var(--primary, #334537);
  }
  .input-suffix {
    font-size: 13px;
    color: var(--on-surface-variant, #434843);
    font-weight: 500;
  }

  /* ─── Toggle group (binary) ─── */
  .toggle-group {
    display: flex;
    background: var(--surface-container, #f0eded);
    border-radius: var(--radius-md, 0.5rem);
    overflow: hidden;
    flex-shrink: 0;
  }
  .toggle-btn {
    padding: 6px 14px;
    border: none;
    background: transparent;
    font-size: 14px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    cursor: pointer;
    font-family: var(--font-body, Inter, sans-serif);
    transition: background 0.2s, color 0.2s;
  }
  .toggle-btn.active {
    background: var(--primary, #334537);
    color: var(--on-primary, #ffffff);
  }

  /* ─── Tri-toggle (Light/Dark/System) ─── */
  .tri-toggle {
    display: flex;
    background: var(--surface-container, #f0eded);
    border-radius: var(--radius-md, 0.5rem);
    overflow: hidden;
    flex-shrink: 0;
  }
  .tri-toggle-btn {
    padding: 6px 10px;
    border: none;
    background: transparent;
    font-size: 12px;
    font-weight: 500;
    color: var(--on-surface-variant, #434843);
    cursor: pointer;
    font-family: var(--font-body, Inter, sans-serif);
    transition: background 0.2s, color 0.2s;
    white-space: nowrap;
  }
  .tri-toggle-btn.active {
    background: var(--primary, #334537);
    color: var(--on-primary, #ffffff);
  }

  .setting-chevron {
    font-size: 20px;
    color: var(--outline, #737872);
  }

  .coming-soon-badge {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: var(--radius-full, 9999px);
    background: var(--surface-container-high, #eae7e7);
    color: var(--on-surface-variant, #434843);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .version {
    text-align: center;
    color: var(--outline, #737872);
    font-size: 12px;
    margin-top: var(--space-section-gap, 48px);
    font-family: var(--font-body, Inter, sans-serif);
  }
</style>