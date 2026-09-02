# 004 — Template builder

**Status**: Closed ✅
**Type**: wayfinder:grilling + wayfinder:prototype
**Blocked by**: 002 — Workout & template data model

## Question

How does the user create, edit, and manage templates?

### Sub-questions

1. **Template list view**: What's on the Templates tab?
   - List of saved templates with name, exercise count, last used date
   - Tap to start workout from this template
   - Swipe or long-press to edit/delete
   - "New Template" button

2. **Create / Edit template**: Flow
   - Tap "New Template" → name it
   - Search/add exercises from catalog (same exercise search UI as quick workout)
   - Reorder exercises via drag-and-drop
   - Remove an exercise from the template
   - Save

3. **Save workout as template**: At "Finish Workout" or after saving, does the user get prompted?
   - "Save as Template" button on the workout summary screen
   - This creates a new template with the exercises from that session (no weights/reps — just the exercise list)

4. **Template metadata**: Any fields beyond name and exercise list?
   - Optional description
   - Tags / day-of-week mapping (e.g., "Push Day", "Pull Day", "Leg Day")?
   - Numbered ordering (Week 1 Day 1, Week 1 Day 2...)?

### Resolution

**Closed.** All sub-questions settled via design-tree grilling.

---

#### 1. Template list view

- **Sort**: by `lastUsedAt` descending (most recently used first).
- **Tap**: single tap immediately starts a workout from the template.
- **Search bar**: filters on template name only; placed at the top of the list.
- **Reorder**: drag handles visible only in an "Edit" mode toggle.
- **Delete**: swipe-to-delete with an undo toast (standard pattern).
- **Quick Workout**: lives on the Home tab only, not duplicated here.

Template cards show: **name**, exercise count, and **last used date**.

#### 2. Creating / editing a template

**Entry points:**
- "New Template" button at the top/bottom of the template list.
- Long-press on an existing template → action sheet: *Edit / Duplicate / Delete*.
- "Save as Template" from a finished workout (see §3).

**Builder flow** (sheet-style modal, not a separate route):
1. Name input (top of the sheet, required).
2. "Add Exercise" → opens the same full-screen searchable exercise catalog used in quick workouts.
3. Tap an exercise → exercise config sheet slides up.
4. Builder shows ordered exercise list; drag handles visible; tap-to-remove or swipe-to-remove.
5. Save / Cancel.

**Exercise config sheet** (per-exercise, bottom sheet):
- **Equipment**: mandatory single-select from the exercise's `equipment` array. No "unselected" state — the template is a concrete plan.
- **Set count**: number stepper, range 1–20, default 3.
- **No target fields** (weight/reps/time/distance targets) exposed in MVP. They are reserved for a future algorithm-driven progressive-overload feature.

Editing a template does **not** affect past workouts (workouts store their own `name` snapshot). There is **no mid-workout template editing**; during a workout, the user uses session-level set add/remove.

#### 3. Save workout as template

Available from:
- The **workout summary screen** after tapping "Finish Workout".
- A **long-press action on a history item**.

**Pre-fill:**
- Name = the workout's `name` (or template name if the workout was templated). The name field is **editable** before saving.

**What carries over:**
- Exercise order.
- Equipment selection per exercise.
- Set count per exercise = actual sets performed in the workout.

**What does NOT carry over:**
- Weight, reps, duration, or distance values.
- Notes.

This strips a concrete session down to a reusable skeleton.

#### 4. Template metadata

- **Name**: required, editable.
- **Description**: optional free-text field on the template.
- **No tags, colors, icons, or day-of-week mapping** for MVP.
- **No week/day numbering or program-builder structure** — deferred to a far-future feature. Adding these later will not break existing templates.

#### 5. Deleting a template with history

Deleting a template **does not delete** past workouts that were started from it.

- Past workouts keep their snapshot `name` and display normally in history.
- The `templateId` stored in `WorkoutSession` is either nulled or treated as a dangling reference and ignored by the UI.
- The workout becomes visually equivalent to a renamed quick workout.

#### 6. Empty state

When the user has zero templates, the Templates tab shows:
- A friendly illustration/icon.
- Copy: "You don't have any templates yet."
- Primary CTA: "Create Your First Template".
- Secondary CTA: "Start a Quick Workout" (navigates to Home).