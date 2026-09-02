<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import { navigateTo } from "../lib/nav.js";
</script>

<div class="home-page">
  <!-- Greeting -->
  <section class="greeting">
    <h1 class="greeting-title">Good Morning.</h1>
    <p class="greeting-subtitle">Embrace the quiet strength of today.</p>
  </section>

  <!-- Stat cards -->
  <section class="stats">
    <div class="stat-card">
      <div class="stat-blur"></div>
      <span class="stat-icon material-symbols-outlined">check_circle</span>
      <div class="stat-content">
        <p class="stat-value">0</p>
        <p class="stat-label">Workouts</p>
      </div>
    </div>
    <div class="stat-card">
      <div class="stat-blur stat-blur--secondary"></div>
      <span class="stat-icon stat-icon--secondary material-symbols-outlined">local_fire_department</span>
      <div class="stat-content">
        <p class="stat-value">0</p>
        <p class="stat-label">Active Min</p>
      </div>
    </div>
  </section>

  <!-- Last workout summary placeholder -->
  <section class="last-workout">
    <h3 class="section-label">Last Workout</h3>
    <p class="no-data">No workouts logged yet. Start your first session!</p>
  </section>

  <!-- Primary CTAs -->
  <section class="ctas">
    <button class="cta-primary" onclick={() => navigateTo("history")}>
      <span class="material-symbols-outlined cta-icon">play_arrow</span>
      <span class="cta-text">Start Workout</span>
    </button>
    <button class="cta-secondary" onclick={() => navigateTo("templates")}>
      <span class="material-symbols-outlined cta-icon">fitness_center</span>
      <span class="cta-text">Start from Template</span>
    </button>
  </section>

  <!-- Activity hint -->
  <EmptyState
    icon="fitness_center"
    title="Welcome to We Go Jim"
    description="Tap 'Start Workout' to begin logging sets right away, or create a template for your favourite routines."
  />
</div>

<style>
  .home-page {
    padding: var(--space-container-padding, 24px) var(--space-gutter, 16px);
    max-width: 480px;
    margin: 0 auto;
  }

  /* ─── Greeting ─── */
  .greeting {
    margin-bottom: var(--space-stack-md, 24px);
  }
  .greeting-title {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-lg-mobile, 28px);
    font-weight: 600;
    line-height: var(--text-headline-lg-mobile-lh, 36px);
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }
  .greeting-subtitle {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-body-md, 16px);
    line-height: var(--text-body-md-lh, 24px);
    color: var(--on-surface-variant, #434843);
    margin: 4px 0 0 0;
  }

  /* ─── Stat cards ─── */
  .stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-gutter, 16px);
    margin-bottom: var(--space-stack-md, 24px);
  }
  .stat-card {
    position: relative;
    overflow: hidden;
    background: var(--surface-container-low, #f6f3f2);
    border-radius: var(--radius-xl, 1rem);
    padding: 16px;
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
    transition: transform 0.3s, box-shadow 0.3s;
  }
  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md, 0 4px 16px rgba(0,0,0,0.04));
  }
  .stat-blur {
    position: absolute;
    right: -16px;
    top: -16px;
    width: 64px;
    height: 64px;
    background: var(--primary-fixed, #d3e8d5);
    opacity: 0.3;
    border-radius: var(--radius-full, 9999px);
    filter: blur(24px);
  }
  .stat-blur--secondary {
    background: var(--secondary-fixed, #ffdbc8);
  }
  .stat-icon {
    font-size: 24px;
    color: var(--primary, #334537);
    margin-bottom: 8px;
    display: block;
    font-variation-settings: 'FILL' 1;
  }
  .stat-icon--secondary {
    color: var(--secondary, #845333);
  }
  .stat-content {
    position: relative;
    z-index: 1;
  }
  .stat-value {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-md, 24px);
    font-weight: 500;
    line-height: var(--text-headline-md-lh, 32px);
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }
  .stat-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-sm, 12px);
    font-weight: 500;
    line-height: var(--text-label-sm-lh, 16px);
    color: var(--on-surface-variant, #434843);
    margin: 2px 0 0 0;
  }

  /* ─── Section labels ─── */
  .section-label {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: var(--text-label-md, 14px);
    font-weight: 600;
    line-height: var(--text-label-md-lh, 20px);
    letter-spacing: var(--text-label-md-ls, 0.05em);
    text-transform: uppercase;
    color: var(--on-surface-variant, #434843);
    margin: 0 0 8px 0;
  }

  .last-workout {
    margin-bottom: var(--space-stack-md, 24px);
  }
  .no-data {
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    margin: 0;
    font-family: var(--font-body, Inter, sans-serif);
  }

  /* ─── CTAs ─── */
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
    border-radius: var(--radius-lg, 0.75rem);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s;
    font-family: var(--font-body, Inter, sans-serif);
    text-align: left;
  }
  .cta-primary {
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04));
  }
  .cta-secondary {
    background: var(--surface-container-high, #eae7e7);
    color: var(--on-surface, #1b1c1c);
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