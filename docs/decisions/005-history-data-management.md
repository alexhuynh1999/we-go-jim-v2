# 005 — History & data management

**Status**: Closed ✅
**Type**: wayfinder:grilling + wayfinder:prototype
**Blocked by**: 001 — Exercise categories & catalog

## Question

What does the history tab look like? How does editing and deleting past workouts work? How does export/import work?

### Sub-questions

1. **History list view**: What shows?
   - Chronological list (most recent first) of past workouts
   - Each entry shows: date, time, template name (if any), exercise count, maybe total volume or duration
   - Tap to view details

2. **Workout detail view**: What shows when you tap a past workout?
   - Full session: exercises performed, sets logged with all fields
   - Each set shows the values that were entered (completed checkbox state too)
   - Ability to edit a set (change weight/reps/etc.)
   - Ability to delete a set
   - Ability to add a new set to an existing exercise
   - Ability to delete the entire workout session
   - "Copy to today" button? (Create new session from this template)

3. **Edit set behavior**: What happens when a past set is edited?
   - The stored value updates in localStorage
   - This changes the "last session" reference for future suggestions
   - Is there an undo? (Could be nice but maybe MVP-deferred)

4. **Delete workout**: Confirmation dialog?

5. **Export/Import JSON**: How?
   - Settings screen has "Export Data" button → downloads a JSON file with all workouts, templates, and custom exercises
   - "Import Data" button → file picker → loads JSON → merges or replaces existing data?
   - Should import replace or merge? (Replace is simpler. User can manually merge if needed.)
   - Should there be a confirmation showing a diff/summary before applying?

### Resolution

All sub-questions settled via design-tree grilling.

#### 1. History list view

- **Layout**: chronological list, most recent first, grouped by **calendar month** sections.
- **Card metadata per entry**: date + day name (e.g., "Mon 15 Sep"), template name (or "Quick Workout"), exercise count + total sets, estimated duration (derived from start/end timestamps).
- **No search/filter for MVP** — local single-user data, scrolling is sufficient.
- **Empty state**: centered friendly message ("No workouts yet. Finish your first workout to see it here!") with a CTA button to the Start Workout flow.
- **Tap entry → navigates to Workout Detail View.**

#### 2. Workout detail view (editing UX)

- **Read-only by default**: shows the full session — exercises in performed order, each with its sets. Each set shows its logged fields and completion state.
- **Inline editing**: tap a pencil icon on a set row → row becomes editable with ✓ (save) / ✗ (discard) buttons.
- **Actions available**:
  - **Edit set** values (inline).
  - **Delete set** — per-row trash icon. If the last set of an exercise is deleted, **remove the entire exercise** from the session.
  - **Add set** — each exercise section has a trailing "+ Add set" button. New sets are appended to the bottom; the user can then **drag the new set to the desired position** using a handle.
  - **Reorder existing sets** — drag handles shown on all set rows during editing, so the user can reorder existing sets as well.
  - **Delete entire workout** — via a ••• menu in the top-right corner.
  - **"Save as Template"** — creates a new template from this session's exercise list (no weights/reps/equipment selections).
- **No "Copy to Today" for MVP** (adds state-management complexity with the active workout flow).

#### 3. Edit set behavior

- **Per-set immediate save**: changes write to localStorage when the user taps ✓ on the inline edit.
- **Side effects**: edited values *do* become the new "last session" reference for future greyed-out suggestions. No warning shown — the user's edit is the intended correction.
- **No undo for MVP** — the user can re-edit if needed.

#### 4. Delete workout confirmation

- **Bottom-sheet modal** showing: workout date, template name (if any), exercise count + set count.
- Two buttons: **Cancel**, **Delete** (red, destructive).
- **No typed confirmation** — reserved for catastrophic operations (Clear All Data per [006](./006-settings.md)).

#### 5. Export/Import JSON

**Export** trigger → browser download of a JSON file named `we-go-jim-backup-YYYY-MM-DD.json`.

Schema:

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "workouts": [],
  "templates": [],
  "customExercises": [],
  "settings": {}
}
```

- **Built-in exercises omitted** — they ship with the app.
- **Settings included** so unit preferences, dark mode, and rest-timer default survive transfer.
- **`version` string** enables future migration logic.

**Import** flow:
1. File picker → parse JSON.
2. **Schema validation**: check required top-level keys and structural shape. If invalid, show error and abort.
3. **Version check**: reject files whose major version differs from the app's. Accept any same-major version (minor differences tolerated, unrecognized fields skipped).
4. **Preview modal**: show a summary (workout count, template count, exercise count, date range) and the file's version. User must type **"REPLACE"** to confirm.
5. On confirm: wipe all local data (`workouts`, `templates`, `customExercises`, `settings`) and replace with file contents.

| Previous uncertainty | Resolution |
|---|---|
| Merge vs replace | **Replace** (simpler; user can manually merge) |
| Confirmation summary | **Yes** — preview before apply |
| Typed confirmation | **Yes** — type "REPLACE" |
| Version policy | **Same major version** |
| Filename | `we-go-jim-backup-YYYY-MM-DD.json` |

---

**Cross-references**: Settings sub-page ([006](./006-settings.md)), workout session schema ([002](./002-workout-template-data-model.md)).