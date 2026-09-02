<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
</script>

<div class="home-page">
  <!-- Last workout summary placeholder -->
  <section class="last-workout">
    <h3 class="section-label">Last Workout</h3>
    <p class="no-data">No workouts logged yet. Start your first session!</p>
  </section>

  <!-- Primary CTAs -->
  <section class="ctas">
    <button class="cta-primary" onclick={() => navigateTo("history")}>
      <span class="cta-icon">⚡</span>
      <span class="cta-text">Start Workout</span>
    </button>
    <button class="cta-secondary" onclick={() => navigateTo("templates")}>
      <span class="cta-icon">📋</span>
      <span class="cta-text">Start from Template</span>
    </button>
  </section>

  <!-- Activity hint -->
  <EmptyState
    icon="💪"
    title="Welcome to We Go Jim"
    description="Tap 'Start Workout' to begin logging sets right away, or create a template for your favourite routines."
  />
</div>

<style>
  .home-page {
    padding: 24px 16px;
    max-width: 480px;
    margin: 0 auto;
  }
  .section-label {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-secondary, #888);
    margin: 0 0 8px 0;
  }
  .last-workout {
    margin-bottom: 24px;
  }
  .no-data {
    color: var(--text-secondary, #888);
    font-size: 14px;
    margin: 0;
  }
  .ctas {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 32px;
  }
  .cta-primary,
  .cta-secondary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    font-family: inherit;
    text-align: left;
  }
  .cta-primary {
    background: var(--accent, #4fc3f7);
    color: #fff;
  }
  .cta-secondary {
    background: var(--surface-2, #2a2a4a);
    color: var(--text-primary, #fff);
  }
  .cta-primary:hover,
  .cta-secondary:hover {
    opacity: 0.9;
  }
  .cta-primary:active,
  .cta-secondary:active {
    transform: scale(0.98);
  }
  .cta-icon {
    font-size: 24px;
  }
</style>