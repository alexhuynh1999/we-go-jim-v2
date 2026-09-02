<script lang="ts">
  import TabBar from "./lib/TabBar.svelte";
  import { currentTab, navigateTo } from "./lib/nav.js";
  import Home from "./routes/Home.svelte";
  import History from "./routes/History.svelte";
  import Templates from "./routes/Templates.svelte";
  import Settings from "./routes/Settings.svelte";

  const tabs = [
    { id: "home" as const, icon: "🏠", label: "Home" },
    { id: "history" as const, icon: "📅", label: "History" },
    { id: "templates" as const, icon: "📋", label: "Templates" },
    { id: "settings" as const, icon: "⚙️", label: "Settings" },
  ];

  // Workout-in-progress pill (inactive in scaffold, wire up later)
  let workoutActive = $state(false);
</script>

<div class="app-shell">
  <!-- Workout in progress pill -->
  {#if workoutActive}
    <div class="workout-pill">
      <span class="pill-dot">●</span>
      <span>Workout in progress</span>
    </div>
  {/if}

  <!-- Main content area -->
  <main class="main-content">
    {#if $currentTab === "home"}
      <Home />
    {:else if $currentTab === "history"}
      <History />
    {:else if $currentTab === "templates"}
      <Templates />
    {:else if $currentTab === "settings"}
      <Settings />
    {/if}
  </main>

  <!-- Bottom tab bar -->
  <div class="tab-bar" role="tablist">
    {#each tabs as tab}
      <TabBar
        tab={tab.id}
        icon={tab.icon}
        label={tab.label}
        active={$currentTab === tab.id}
        onclick={() => navigateTo(tab.id)}
      />
    {/each}
  </div>
</div>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, sans-serif;
    background: var(--bg, #0f0f23);
    color: var(--text-primary, #e0e0e0);
    min-height: 100dvh;
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :global(#app) {
    min-height: 100dvh;
  }

  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    position: relative;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: env(safe-area-inset-bottom, 64px);
  }

  .tab-bar {
    display: flex;
    background: var(--surface, #1a1a2e);
    border-top: 1px solid var(--border, #2a2a4a);
    padding: 4px env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 4px) env(safe-area-inset-left, 0);
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }

  .workout-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent, #4fc3f7);
    color: #fff;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    z-index: 200;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }
  .pill-dot {
    font-size: 10px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>