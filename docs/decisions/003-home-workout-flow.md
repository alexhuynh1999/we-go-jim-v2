# 003 — Home screen & workout flow

**Status**: Closed
**Type**: wayfinder:grilling + wayfinder:prototype
**Blocked by**: 002 — Workout & template data model

## Question

What does the home screen look like, and how does the workout flow work end-to-end?

## Resolution

### Home Screen

The primary view is a **dashboard** containing:
- **Last workout summary**: date, exercises performed, short stats
- **"Start Workout"** primary CTA for Quick Workout
- **"Start from Template"** secondary CTA
- Bottom tab bar: **Home | History | Templates | Settings**

No gamification (streaks, weekly volume) for v1.

### Quick Workout Flow

1. Tap **"Start Workout"** on Home.
2. Bottom-sheet **exercise picker** opens:
   - Search/filter the exercise catalog (from Ticket 001)
   - Tap an exercise to add it to the session immediately
   - Sheet stays open; tap **"Done"** to close
3. Session view opens underneath:
   - Exercises appear as **cards**
   - Each card header: exercise name, drag handle (≡), trash icon to remove the exercise
   - Sets listed below; **"Add Set"** button per exercise
4. User logs sets inline, marks them complete
5. Tap **"Finish Workout"** → saves session → **Summary** modal → route to History

### Workout from Template Flow

1. Tap **"Start from Template"** on Home.
2. Bottom-sheet **template picker** opens (name + exercise count).
3. Tap a template → **preview screen** with ordered exercise list.
4. Tap **"Start Workout"** → creates a live session snapshot.
5. Session is **fully editable** (add/remove/reorder exercises and sets) before finishing.

### Set Row UI

One compact row per set. Inputs are **category-specific**:
- **Weight × Reps**: weight and reps numeric inputs
- **Time × Distance**: duration, distance, and a unit dropdown (km / mi)

**Greyed-out suggestions** from the last session are shown as HTML `placeholder` text in each input.

**Actions**:
- **Add Set**: "+ Add Set" button below each exercise's set list
- **Delete Set**: **swipe-to-delete** on the set row
- **Complete**: checkbox → triggers the reverse progress bar

### Rest Timer (Reverse Progress Bar)

When a set is checked complete:
- A **green reverse progress bar** appears **below the set row**
- The bar shrinks from **right to left**, counting down from the configured default (150s)
- Only the **most recently checked set** displays an active bar; previous bars disappear immediately
- Unchecking a set removes its bar; re-checking restarts the timer
- No manual skip — bars run to zero or until superseded
- At zero, the bar simply disappears

### Finish Workout

- Fixed **"Finish Workout"** button at the bottom of the session view
- Saves session with an end-timestamp to IndexedDB
- Opens a **Summary modal**:
  - Editable name (default: "Quick Workout – <date>")
  - Total duration
  - Exercise and set counts
  - Total volume (if calculable)
- **"Done"** → routes to **History** tab
- **"Save as Template"** appears only for Quick Workouts
  - Name + exercise list; set targets are **empty** (templates capture selection and order, not historical weights/reps)

### Mid-Session Management

**Add exercises**:
- "+" header button in the session view opens the same exercise picker

**Remove exercises**:
- Small trash icon in the top-right of each exercise card header
- Tap once, no confirmation

**Reorder exercises**:
- Drag handles (≡) on the right side of each card
- Standard drag-and-drop, allowed at any time

**Navigation**:
- Tab bar stays visible during a workout
- A floating **"● Workout in progress"** pill appears on all tabs
- Tapping it returns to the session
- Settings are accessible mid-workout (useful for timer/config changes)

### Session Persistence

- In-progress sessions are **auto-saved** to IndexedDB after every mutation
- On next app open, a **"Resume Workout"** banner appears on Home if a session exists
- Starting a new workout while one is in progress shows a confirmation: *"You have a workout in progress. Abandon it?"*
