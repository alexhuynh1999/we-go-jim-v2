# 002 — Workout & template data model

**Status**: Closed ✅
**Type**: wayfinder:grilling
**Blocked by**: 001 — Exercise categories & catalog

## Question

What is the schema for workout sessions and templates? How does the "previous session" suggestion lookup work?

### Sub-questions

1. **Template schema**: What makes up a template?
   - Name
   - Ordered list of exercises (each referencing an exercise from the catalog)
   - Anything else? Default rest time per exercise? Warm-up sets flag?
   - Metadata: created date, last used date, total count

2. **Workout session schema**: What gets saved when "Finish Workout" is tapped?
   - Date/time started & ended
   - Which template was used (nullable — quick workouts have no template)
   - Exercises performed, each with:
     - Reference to the exercise (id + snapshot of its name/category at time of logging)
     - Ordered list of sets, each with category-specific fields:
       - For Weight×Reps: weight, reps, completed (boolean)
       - For Time×Distance: duration, distance, completed
       - For Reps only: reps, completed
       - For Time only: duration, completed
       - (Plus "completed" is universal, and maybe "notes" per set)

3. **History lookup for suggestions**: When you start a quick workout and pick "Bench Press", how does the app find your last bench press?
   - Query: find all workout sessions → find any set referencing exercise X → return the latest session's values for that exercise
   - Should it show the last session's values for that specific exercise (regardless of workout context), or only within the same template?
   - Answer from Round 2, Q4b: **per-exercise**, not per-template. Show the values from the most recent session where you did that exercise.

4. **Editing past workouts**: When you edit a logged set, do the changed values become the new "last session" reference? (Yes — the edit should overwrite the stored data.)

### Resolution

**Closed.** All sub-questions settled via design-tree grilling.

---

#### 1. Template schema

```typescript
type WorkoutTemplate = {
  id: string;                          // UUID
  name: string;
  exercises: TemplateExercise[];       // ordered
  createdAt: string;                   // ISO 8601
  lastUsedAt: string;                  // updated on workout start
  useCount: number;                    // incremented on workout finish
};

type TemplateExercise = {
  exerciseId: string;                  // reference to catalog exercise
  equipment: Equipment;                // chosen at template creation time
  setCount: number;                    // how many sets the skeleton prescribes
  // Optional targets — presence depends on the exercise's fields:
  targetReps?: number;
  targetWeight?: number;
  targetDuration?: number;
  targetDistance?: number;
  // Reserved for future automatic warm-up calculation (hidden in MVP UI):
  warmUpSets?: number;                 // default 0
};
```

- **Global rest timer** applies everywhere (150s default, configurable in Settings). No per-exercise override.
- **Equipment** is pinned at template-creation time. The user can swap equipment during a workout (session-only).
- **Set targets** live at the exercise level (not per-set). All sets in the exercise share the same target reps/duration/etc.
- **Reps from the template are suggested** once the user starts the workout, pre-filling set rows as hints.
- **Warm-up sets** are ad-hoc in MVP. The `warmUpSets` field and `isWarmup` (see §2) reserve infrastructure for later auto-calculation.
- **Swap feature**: the user can replace an exercise (or just its equipment) in any workout, templated or quick. Swaps are **session-only by default**; templates are stable. A future explicit "Save to template" action may persist changes.

---

#### 2. Workout session schema

```typescript
type WorkoutSession = {
  id: string;                          // UUID
  startedAt: string;                   // ISO 8601 — set when workout begins
  endedAt: string | null;              // null = in-progress
  templateId: string | null;           // null for quick workouts
  name: string;                        // auto-populated (template name or "Quick Workout — <date>")
  exercises: SessionExercise[];        // ordered
};

type SessionExercise = {
  // Snapshot from catalog at time of logging (survives exercise edits/deletions):
  exerciseId: string;
  exerciseName: string;
  fields: Field[];
  muscleGroups: MuscleGroup[];
  equipment: Equipment;

  sets: Set[];                         // ordered
};

type Set = {
  weight?: number;                     // kg or lb (per global setting)
  reps?: number;
  duration?: number;                   // seconds
  distance?: number;                   // km or mi (per global setting)
  notes?: string;
  isWarmup?: boolean;                  // default false; reserved for future auto-calc
};
```

- **No `completed` boolean** — every saved set is "performed." Deleting a set removes it from the record.
- **No RPE/RIR** in MVP.
- **In-progress sessions** are `WorkoutSession` with `endedAt: null`, stored in the same IndexedDB object store. The UI filters them out of history. This avoids data-loss risk on crash.
- **Duration** is derived from `startedAt` / `endedAt`, not stored separately.
- **Duplicate exercises** are allowed (two `SessionExercise` entries referencing the same exercise). History lookup uses the *latest* instance in the session.

---

#### 3. History lookup for suggestions

**Query:** find all sessions → find the chronologically latest session containing the target exercise → return its heaviest set.

**Behaviour by workout type:**
- **Templated**: the heaviest set is displayed as a suggestion in every set row of the current exercise.
- **Quick workout**: displayed in the first (only) set row.

**Algorithm for "heaviest set"** (in priority order):
1. `weight` present → set with max `weight`. Tie-breaker: higher `reps`.
2. No `weight`, `reps` present → max `reps`.
3. `distance` present → max `distance`.
4. `time` only → max `duration`.
5. `weight` + `time` → max `weight`.

**Exclusions:** Sets with `isWarmup === true` are filtered out of the max calculation.

**Timing:** Computed on-the-fly when the user enters / opens an exercise. Always fresh — accounts for history edits made between workouts.

---

#### 4. Editing past workouts

Full parity with active-workout editing:
- Change values on existing sets.
- Add new sets to an existing exercise.
- Delete sets from an existing exercise.
- Reorder sets within an exercise.
- Swap exercise/equipment (fix a mistaken selection).

All edits retroactively update the "previous session" data used for future suggestions.

---

#### 5. Storage backend

**IndexedDB**, not localStorage. Two object stores:
- `sessions`: keyed by `id`, indexed by `startedAt`.
- `templates`: keyed by `id`.

This handles years of workout history without the 5 MB localStorage ceiling.