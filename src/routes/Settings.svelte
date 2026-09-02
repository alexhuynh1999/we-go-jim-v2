<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
</script>

<div class="settings-page">
  <header class="page-header">
    <h2>Settings</h2>
  </header>

  <section class="settings-group">
    <h3 class="group-label">General</h3>
    <div class="setting-row">
      <span class="setting-label">Rest Timer</span>
      <span class="setting-value">2:30</span>
    </div>
    <div class="setting-row">
      <span class="setting-label">Weight Units</span>
      <span class="setting-value">kg</span>
    </div>
    <div class="setting-row">
      <span class="setting-label">Dark Mode</span>
      <span class="setting-value">System</span>
    </div>
  </section>

  <section class="settings-group">
    <h3 class="group-label">Data</h3>
    <div class="setting-row">
      <span class="setting-label">Export Data</span>
      <span class="setting-value">→</span>
    </div>
    <div class="setting-row">
      <span class="setting-label">Import Data</span>
      <span class="setting-value">→</span>
    </div>
  </section>

  <p class="version">We Go Jim v0.1.0</p>
</div>

<style>
  .settings-page {
    padding: 24px 16px;
    max-width: 480px;
    margin: 0 auto;
  }
  .page-header h2 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 24px 0;
    color: var(--text-primary, #fff);
  }
  .settings-group {
    margin-bottom: 24px;
  }
  .group-label {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary, #888);
    margin: 0 0 8px 0;
  }
  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid var(--border, #333);
  }
  .setting-label {
    font-size: 15px;
    color: var(--text-primary, #fff);
  }
  .setting-value {
    font-size: 14px;
    color: var(--text-secondary, #888);
  }
  .version {
    text-align: center;
    color: var(--text-secondary, #888);
    font-size: 12px;
    margin-top: 48px;
  }
</style>