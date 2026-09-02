<script lang="ts">
  import EmptyState from "../lib/EmptyState.svelte";
  import ActionSheet from "../lib/ActionSheet.svelte";
  import Toast from "../lib/Toast.svelte";
  import { navigateTo } from "../lib/nav.js";
  import { listTemplates, deleteTemplate, saveTemplate, loadTemplate } from "../lib/session-store.js";
  import type { WorkoutTemplate } from "../lib/types.js";

  let {
    onStartTemplate = (_template: WorkoutTemplate) => {},
    onCreateTemplate = () => {},
  } = $props();

  let templates = $state<WorkoutTemplate[]>([]);
  let loading = $state(true);
  let search = $state("");

  // Action sheet state
  let showActionSheet = $state(false);
  let selectedTemplate = $state<WorkoutTemplate | null>(null);

  // Toast state
  let toastVisible = $state(false);
  let toastMessage = $state("");
  let toastAction = $state<{ label: string; onclick: () => void } | undefined>(undefined);
  let deletedTemplateId = $state<string | null>(null);

  // Load templates on mount and on visibility change
  $effect(() => {
    loadTemplates();
  });

  async function loadTemplates() {
    loading = true;
    templates = await listTemplates();
    loading = false;
  }

  const filteredTemplates = $derived(
    search.trim() === ""
      ? templates
      : templates.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase()),
        ),
  );

  function handleTapTemplate(template: WorkoutTemplate) {
    onStartTemplate(template);
  }

  function handleLongPress(template: WorkoutTemplate) {
    selectedTemplate = template;
    showActionSheet = true;
  }

  function handleStartFromAction() {
    if (selectedTemplate) {
      onStartTemplate(selectedTemplate);
    }
  }

  async function handleEdit() {
    if (selectedTemplate) {
      onStartTemplate(selectedTemplate);
    }
  }

  async function handleDuplicate() {
    if (!selectedTemplate) return;
    const now = new Date().toISOString();
    const duplicate: WorkoutTemplate = {
      ...selectedTemplate,
      id: crypto.randomUUID(),
      name: `${selectedTemplate.name} (Copy)`,
      createdAt: now,
      lastUsedAt: now,
      useCount: 0,
    };
    await saveTemplate(duplicate);
    await loadTemplates();
  }

  async function handleDelete() {
    if (!selectedTemplate) return;
    const id = selectedTemplate.id;
    await deleteTemplate(id);
    deletedTemplateId = id;
    await loadTemplates();

    toastMessage = "Template deleted";
    toastAction = {
      label: "Undo",
      onclick: async () => {
        if (deletedTemplateId) {
          const restored = await loadTemplate(deletedTemplateId);
          if (restored) {
            await saveTemplate(restored);
          }
        }
        toastVisible = false;
        await loadTemplates();
      },
    };
    toastVisible = true;
  }

  function handleSwipeDelete(template: WorkoutTemplate) {
    selectedTemplate = template;
    handleDelete();
  }

  function dismissToast() {
    toastVisible = false;
  }

  function formatDate(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  let touchStartX = $state(0);
  let swipingIndex = $state<number | null>(null);
  let swipeOffset = $state(0);

  function handleTouchStart(e: TouchEvent, index: number) {
    touchStartX = e.touches[0]?.clientX ?? 0;
    swipingIndex = index;
  }

  function handleTouchMove(e: TouchEvent) {
    if (swipingIndex === null) return;
    const touch = e.touches[0];
    if (!touch) return;
    const currentX = touch.clientX;
    const diff = touchStartX - currentX;
    swipeOffset = Math.max(0, Math.min(200, diff));
  }

  function handleTouchEnd() {
    if (swipingIndex === null || swipeOffset > 100) {
      if (swipingIndex !== null && swipeOffset > 100) {
        const template = filteredTemplates[swipingIndex];
        if (template) {
          handleSwipeDelete(template);
        }
      }
    }
    swipingIndex = null;
    swipeOffset = 0;
  }
</script>

<div class="templates-page">
  <header class="page-header">
    <h2>Templates</h2>
    <button class="create-btn" onclick={(e: MouseEvent) => onCreateTemplate()}>
      <span class="material-symbols-outlined">add</span>
      <span>Create</span>
    </button>
  </header>

  <!-- Search bar -->
  <div class="search-wrap">
    <span class="material-symbols-outlined search-icon">search</span>
    <input
      type="text"
      class="search-input"
      placeholder="Search templates…"
      bind:value={search}
    />
    {#if search}
      <button class="search-clear-btn" onclick={() => (search = "")} aria-label="Clear search">
        <span class="material-symbols-outlined">close</span>
      </button>
    {/if}
  </div>

  {#if loading}
    <p class="loading-text">Loading...</p>
  {:else if filteredTemplates.length === 0}
    {#if search}
      <div class="no-results">
        <span class="material-symbols-outlined no-results-icon">search_off</span>
        <p>No templates found for "{search}"</p>
      </div>
    {:else}
      <EmptyState
        icon="fitness_center"
        title="You don't have any templates yet."
        description="Create a template to save your favourite workout structures. Templates make starting a session faster."
        action={{ label: "Create Your First Template", onclick: () => onCreateTemplate() }}
      />
      <div class="empty-secondary">
        <button class="secondary-cta" onclick={() => navigateTo("home")}>
          <span class="material-symbols-outlined">play_arrow</span>
          Start a Quick Workout
        </button>
      </div>
    {/if}
  {:else}
    <div class="template-list">
      {#each filteredTemplates as template, i}
        <div
          class="template-card-wrapper"
          ontouchstart={(e) => handleTouchStart(e, i)}
          ontouchmove={(e) => handleTouchMove(e)}
          ontouchend={handleTouchEnd}
        >
          <div
            class="template-card"
            style={swipingIndex === i ? `transform: translateX(-${swipeOffset}px)` : ""}
          >
            <button
              class="template-card-inner"
              onclick={() => handleTapTemplate(template)}
              oncontextmenu={(e) => {
                e.preventDefault();
                handleLongPress(template);
              }}
            >
              <div class="tc-info">
                <span class="tc-name">{template.name}</span>
                <span class="tc-meta">
                  {template.exercises.length} exercise{template.exercises.length !== 1 ? "s" : ""}
                  · {template.exercises.reduce((acc, te) => acc + te.setCount, 0)} sets
                  · Last used {formatDate(template.lastUsedAt)}
                </span>
              </div>
              <div class="tc-use-count">
                {#if template.useCount > 0}
                  <span class="material-symbols-outlined tc-use-icon">repeat</span>
                  <span class="tc-use-value">{template.useCount}</span>
                {/if}
              </div>
            </button>
            <div class="swipe-delete-label" class:visible={swipingIndex === i && swipeOffset > 30}>
              <span class="material-symbols-outlined">delete</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Action Sheet -->
<ActionSheet
  show={showActionSheet}
  title={selectedTemplate?.name ?? ""}
  actions={[
    { label: "Start Workout", icon: "play_arrow", onclick: handleStartFromAction },
    { label: "Edit", icon: "edit", onclick: handleEdit },
    { label: "Duplicate", icon: "content_copy", onclick: handleDuplicate },
    { label: "Delete", icon: "delete", danger: true, onclick: handleDelete },
  ]}
  onClose={() => (showActionSheet = false)}
/>

<!-- Undo Toast -->
<Toast
  message={toastMessage}
  visible={toastVisible}
  action={toastAction}
  ondismiss={dismissToast}
/>

<style>
  .templates-page {
    padding: var(--space-container-padding, 24px) var(--space-gutter, 16px);
    max-width: 480px;
    margin: 0 auto;
    padding-bottom: 80px;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .page-header h2 {
    font-family: var(--font-display, 'Source Serif 4', serif);
    font-size: var(--text-headline-lg-mobile, 28px);
    font-weight: 600;
    line-height: var(--text-headline-lg-mobile-lh, 36px);
    color: var(--on-surface, #1b1c1c);
    margin: 0;
  }

  .create-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius-md, 0.5rem);
    background: var(--primary, #334537);
    color: var(--on-primary, #fff);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .create-btn:hover {
    opacity: 0.9;
  }
  .create-btn .material-symbols-outlined {
    font-size: 18px;
  }

  .search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: var(--surface-container-low, #f6f3f2);
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-lg, 0.75rem);
    margin-bottom: 20px;
  }
  .search-wrap:focus-within {
    border-color: var(--primary, #334537);
  }

  .search-icon {
    font-size: 20px;
    color: var(--outline, #737872);
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 4px 0;
    font-size: 15px;
    color: var(--on-surface, #1b1c1c);
    outline: none;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .search-input::placeholder {
    color: var(--outline, #737872);
  }

  .search-clear-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--outline, #737872);
    padding: 2px;
  }
  .search-clear-btn .material-symbols-outlined {
    font-size: 18px;
  }

  .loading-text {
    font-family: var(--font-body, Inter, sans-serif);
    font-size: 14px;
    color: var(--on-surface-variant, #434843);
    text-align: center;
    padding: 32px 16px;
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 32px 16px;
    color: var(--on-surface-variant, #434843);
    font-size: 14px;
    font-family: var(--font-body, Inter, sans-serif);
  }
  .no-results-icon {
    font-size: 32px;
    color: var(--outline, #737872);
  }

  .empty-secondary {
    display: flex;
    justify-content: center;
    margin-top: 12px;
  }

  .secondary-cta {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-md, 0.5rem);
    background: transparent;
    color: var(--on-surface, #1b1c1c);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: var(--font-body, Inter, sans-serif);
    transition: background 0.15s;
  }
  .secondary-cta:hover {
    background: var(--surface-container-low, #f6f3f2);
  }
  .secondary-cta .material-symbols-outlined {
    font-size: 18px;
  }

  .template-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .template-card-wrapper {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-xl, 1rem);
  }

  .template-card {
    display: flex;
    align-items: center;
    transition: transform 0.15s ease-out;
    position: relative;
    z-index: 1;
  }

  .template-card-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 14px 16px;
    background: var(--surface-container-low, #f6f3f2);
    border: 1px solid var(--outline-variant, #c3c8c1);
    border-radius: var(--radius-xl, 1rem);
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;
    font-family: var(--font-body, Inter, sans-serif);
    -webkit-tap-highlight-color: transparent;
    touch-action: pan-y;
  }
  .template-card-inner:hover {
    background: var(--surface-container, #f0eded);
  }

  .tc-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    min-width: 0;
  }

  .tc-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--on-surface, #1b1c1c);
  }

  .tc-meta {
    font-size: 12px;
    color: var(--on-surface-variant, #434843);
  }

  .tc-use-count {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: 8px;
  }

  .tc-use-icon {
    font-size: 16px;
    color: var(--outline, #737872);
  }

  .tc-use-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--on-surface-variant, #434843);
    font-family: var(--font-body, Inter, sans-serif);
  }

  .swipe-delete-label {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--error, #ba1a1a);
    color: var(--on-error, #fff);
    border-radius: 0 var(--radius-xl, 1rem) var(--radius-xl, 1rem) 0;
    opacity: 0;
    transition: opacity 0.15s;
  }
  .swipe-delete-label.visible {
    opacity: 1;
  }
</style>