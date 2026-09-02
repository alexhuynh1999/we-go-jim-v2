<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
</script>

<div class="settings-page">
  <header class="page-header">
    <h2>Settings</h2>
  </header>

  <section class="settings-group">
    <h3 class="group-label">General</h3>
    <button class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">timer</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Rest Timer</span>
        <span class="setting-desc">Default rest duration</span>
      </div>
      <span class="setting-value">2:30</span>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
    <button class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">weight</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Weight Units</span>
        <span class="setting-desc">kg or lb</span>
      </div>
      <span class="setting-value">kg</span>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
    <button class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">dark_mode</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Dark Mode</span>
        <span class="setting-desc">Light, Dark, or System</span>
      </div>
      <span class="setting-value">System</span>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
  </section>

  <section class="settings-group">
    <h3 class="group-label">Data</h3>
    <button class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">file_download</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Export Data</span>
        <span class="setting-desc">Backup your workouts</span>
      </div>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
    <button class="setting-row">
      <div class="setting-icon-wrap">
        <span class="material-symbols-outlined setting-icon">file_upload</span>
      </div>
      <div class="setting-info">
        <span class="setting-label">Import Data</span>
        <span class="setting-desc">Restore from backup</span>
      </div>
      <span class="material-symbols-outlined setting-chevron">chevron_right</span>
    </button>
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
  .setting-value {
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    font-weight: 500;
  }
  .setting-chevron {
    font-size: 20px;
    color: var(--outline, #737872);
  }

  .version {
    text-align: center;
    color: var(--outline, #737872);
    font-size: 12px;
    margin-top: var(--space-section-gap, 48px);
    font-family: var(--font-body, Inter, sans-serif);
  }
</style>