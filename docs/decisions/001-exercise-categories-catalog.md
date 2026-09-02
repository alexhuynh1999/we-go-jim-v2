# 001 — Exercise categories & catalog

**Status**: Open
**Type**: wayfinder:grilling + wayfinder:research
**Blocked by**: _(none)_

## Question

What are the exercise categories (free weight, machine, bodyweight, cardio, etc.) and their associated set-input fields? What is the base catalog of exercises shipped with the app? What fields does an exercise record have?

### Sub-questions

1. **Category taxonomy**: What categories exist? Some candidates:
   - **Weight × Reps** (free weight, machine, dumbbell): the classic set — weight field + reps field
   - **Time × Distance** (cardio: treadmill, rowing, cycling): duration + distance
   - **Reps only** (bodyweight: pushups, pullups, situps): reps, no weight field
   - **Time only** (plank, wall sit): duration, no reps or weight
   - **Weight × Time** (loaded carries, timed holds): weight + duration
   - Are there more? Should categories be extensible (user can define a new category)?

2. **Exercise record fields**: What does each exercise carry?
   - Name (string)
   - Category (from the taxonomy — determines what inputs a set shows)
   - Muscle group (chest, back, legs, shoulders, arms, core, full body)
   - Equipment needed (barbell, dumbbell, machine, bodyweight, cable)
   - Notes / description (optional)

3. **Base catalog**: What exercises ship with the app? A snapshot of 50-100 common lifts, organized by muscle group. Research: look at common free exercise APIs (wger, ExerciseDB) and established training programs for a representative starter list.

4. **Custom exercises**: What additional fields do custom exercises need? Are they the same schema, just user-created and stored separately?

### Resolution

**Closed.** All sub-questions settled via design-tree grilling.

#### 1. Category taxonomy
Categories are **not** pre-defined coupled types. Instead, each exercise declares which **individual input fields** it uses. This makes the system data-driven and allows future sub-categories by mixing fields freely.

#### 2. Exercise record schema (single schema for built-in and custom)

```typescript
type Exercise = {
  id: string;                    // hardcoded v4 UUID (built-ins) or runtime UUID (custom)
  name: string;                  // display name
  fields: Field[];               // active input fields for this exercise
  muscleGroups: MuscleGroup[];   // multi-select
  equipment: Equipment[];        // multi-select (user picks one at workout time)
  notes?: string;                // optional description / form cues
  source: 'builtin' | 'user';
  isHidden?: boolean;            // user can hide built-ins; custom exercises are hard-deletable
};

type Field      = 'weight' | 'reps' | 'time' | 'distance' | 'notes';
type Equipment  = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'kettlebell' | 'smith-machine' | 'plate-loaded' | 'other';
type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'full-body';
```

- **Fields**: composable. The set UI renders only the fields declared by the exercise, in a **fixed global order**: `weight` → `reps` → `time` → `distance` → `notes`.
- **Units**: global metric/imperial toggle in settings. `weight` uses kg/lb; `distance` uses km/mi (smaller units like meters/yards may be added later).
- **Time**: stored as seconds, displayed `mm:ss`.
- **`muscleGroups`**: array because many exercises are compound.
- **`equipment`**: array because generic exercises (e.g. "Bench Press") can be performed with multiple implements. The user selects which one at workout/template time.
- **`source`**: `builtin` for seed data, `user` for custom exercises.
- **`isHidden`**: applies to built-ins only. Custom exercises are **hard-deletable** without affecting historical workouts (history stores its own exercise snapshot — to be specified in 002).

#### 3. Base catalog
- **Scope**: ~60–80 exercises, medium coverage.
- **Source**: curated from `wger.de`, standard programs (Starting Strength, 5/3/1, PPL), and domain knowledge.
- **Format**: `src/data/exercises.json` (JSON array, build-time validated).
- **Maintenance**: data-driven — easy to view, add, or remove entries.

#### 4. Custom exercises
- **Creation flow**: minimal by default (name + fields + equipment → save).
- **Advanced toggle** reveals: muscle groups, notes.
- Saved immediately; hard-deletable.

#### Deferred / out of scope
- User-defined field types (beyond the five fixed ones).
- Per-exercise default rest timer.
- `tags` (compound/isolation/unilateral) — may revisit post-MVP.
- RPE / RIR fields (belongs to set-level data, not exercise definition).