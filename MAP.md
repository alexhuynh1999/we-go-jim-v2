# Wayfinder Map: Gym Tracking PWA

Labels: `wayfinder:map`

---

## Destination

A spec for a free, PWA-based gym tracking app for a single user. The user opens the app, picks a quick workout or loads a template, logs sets with exercise-category-specific fields (weight × reps, time × distance, etc.), gets a rest-timer suggestion after each set, and sees greyed-out suggestions from their last session. Data lives in localStorage, backed up via JSON export/import. Zero backend, zero paid accounts, zero app-store fees.

**Master spec**: [#1 — We Go Jim — Gym Tracking PWA (Full Spec)](https://github.com/alexhuynh1999/we-go-jim-v2/issues/1) (ready-for-agent)

## Notes

- **Domain**: fitness / personal workout tracking
- **Skills**: grilling, domain-modeling, prototype (for UI decisions)
- **Stack**: Svelte PWA, localStorage, IndexedDB, no backend
- **Tone**: spec-first. This map produces decisions, not shipped code.
- **Free-terms**: free tiers of cloud services if any; no Apple Developer fee; open-source stack; local-first

## Decisions so far

<!-- the index: one line per closed ticket, enough to judge relevance, then zoom the link for the detail the ticket holds -->

- **[001 — Exercise categories & catalog](./docs/decisions/001-exercise-categories-catalog.md)** — Fixed, composable fields (`weight`, `reps`, `time`, `distance`, `notes`), single schema for built-in/custom, ~60–80 seed exercises in JSON, hardcoded UUIDs, minimal custom creation with advanced toggle, hard-delete custom / hide built-in. ✅
- **[002 — Workout & template data model](./docs/decisions/002-workout-template-data-model.md)** — Template schema (name, exercises with equipment + set targets + metadata), workout session schema (timestamps, template reference, snapshot exercises with sets), set record (weight/reps/duration/distance/notes/isWarmup), history lookup (per-exercise, on-the-fly, single heaviest set with weight→reps→distance→duration priority), full editing parity, IndexedDB storage. ✅
- **[003 — Home screen & workout flow](./docs/decisions/003-home-workout-flow.md)** — Home dashboard with last workout + two CTAs, Quick Workout bottom-sheet picker, Template start via picker → preview, set-row UI with category-specific inputs and last-session placeholders, swipe-to-delete sets, reverse green progress bar per set (only most recent active), drag-to-reorder exercises, trash-to-remove, Finish → Summary modal → History, Save as Template for Quick Workouts, auto-persisted sessions with Resume banner. ✅
- **[005 — History & data management](./docs/decisions/005-history-data-management.md)** — Month-grouped chronological list (date+day, template/quick, exercise+sets, duration), inline editing per set (✓/✗ save), drag handles on all set rows for reorder, add-set via append-and-drag, delete last set removes exercise, delete workout via bottom-sheet (no typed), export JSON (`we-go-jim-backup-YYYY-MM-DD.json` with `{version, exportedAt, workouts, templates, customExercises, settings}`), import replaces all with preview + typed confirmation, same-major version compat. ✅
- **[006 — Settings](./docs/decisions/006-settings.md)** — rest-timer default (150s, 0–∞, type-in-seconds / display M:SS), weight units (locale-default, on-the-fly conversion), dark mode (Light/Dark/System), Data Management sub-page with Clear All Data (typed confirmation + summary) and export/import (replace-on-import), future placeholders for notifications and advanced settings.

## Not yet specified

_(All core decisions are resolved and synthesized in the master spec.)_

- **Progressive overload suggestion formula**: a reach goal. The logic for computing the "greyed-out suggestion" value is deferred. For now, the spec only says "show the last session's values as greyed-out hints."
- **Sound/vibration for rest timer**: whether the timer plays a sound or vibrates (or both) when it hits zero. Spec enough to leave room for it, decide in implementation.
- **PWA manifest specifics**: icons, splash screen, service-worker caching strategy. Deferred to implementation phase.
- **Analytics / crash reporting**: free tier of Sentry or similar? Deferred.
- **Offline fallback detail**: since data is local, this is mostly about caching the app shell — standard PWA fare, not a decision.

## Out of scope

<!-- work consciously ruled out. Nothing here yet. -->

- **[001 — Exercise categories & catalog](./docs/decisions/001-exercise-categories-catalog.md)** — Fixed, composable fields (`weight`, `reps`, `time`, `distance`, `notes`), single schema for built-in/custom, ~60–80 seed exercises in JSON, hardcoded UUIDs, minimal custom creation with advanced toggle, hard-delete custom / hide built-in. ✅

---

## Child tickets

All closed. Master spec at [#1](https://github.com/alexhuynh1999/we-go-jim-v2/issues/1).

- **[002 — Workout & template data model](./docs/decisions/002-workout-template-data-model.md)** (wayfinder:grilling) — **closed** ✅
- **[003 — Home screen & workout flow](./docs/decisions/003-home-workout-flow.md)** (wayfinder:grilling + wayfinder:prototype) — **closed** ✅
- **[004 — Template builder](./docs/decisions/004-template-builder.md)** — **closed** ✅
- **[005 — History & data management](./docs/decisions/005-history-data-management.md)** (wayfinder:grilling + wayfinder:prototype) — **closed** ✅
- **[006 — Settings](./docs/decisions/006-settings.md)** (wayfinder:grilling) — **closed** ✅