# 006 — Settings

**Status**: Closed
**Type**: wayfinder:grilling
**Blocked by**: _(none)_
**Closes**: _(none)_

## Question

What belongs in the Settings tab? What are the defaults and constraints?

### Sub-questions

1. **Rest timer duration**: Default 2:30 (150 seconds). Configurable range? Min 30s, max 5:00? Step size (10s, 30s)?

2. **Weight units**: kg vs lbs. Default based on locale or configurable? Where is this stored — per-user preference?

3. **Dark mode**: Toggle. Should it track system preference (prefers-color-scheme) or be manual only?

4. **Export/Import actions**: Buttons for export and import live here (functionality described in Ticket 005).

5. **Data management**: Should there be a "Clear All Data" button (with confirmation)?

6. **Future settings**: What placeholders should the UI leave for stretch features?
   - Progressive overload formula toggle (reach goal)
   - Sound/vibration toggle for rest timer (deferred)
   - Any others?

### Resolution

1. **Rest timer duration**
   - **Default**: 150 seconds (2:30).
   - **Input**: free-typing number field, value stored and entered in **seconds**.
   - **Display**: rendered in `M:SS` format (e.g., `2:30`).
   - **Minimum**: 0 (no maximum).
   - **Behavior at 0**: the rest-timer UI is skipped entirely after completing a set.

2. **Weight units (kg vs lbs)**
   - **Default**: derived from `navigator.language` (US/Imperial locales → lbs; all others → kg).
   - **Override**: user can switch at any time in Settings.
   - **Storage**: app preference stored in localStorage.
   - **Data behavior**: previously logged entries **preserve their original unit** in storage; displayed values are converted on-the-fly using the current unit preference.

3. **Dark mode**
   - Three-state control: **Light / Dark / System**.
   - **Default**: `System`, tracking `prefers-color-scheme`.
   - A manual selection overrides the system preference.

4. **Clear All Data**
   - Included in the **Data Management** sub-page.
   - Triggered via a prominent, red-styled button with warning icon.
   - Confirmation: a styled modal with:
     - Big warning header + icon.
     - Summary of what will be lost (workout count, template count, etc.).
     - Typed confirmation: user must type "RESET" to proceed.

5. **Export/Import placement**
   - Settings links to a **Data Management** sub-page (not a main tab).
   - Export and Import buttons live on this sub-page alongside Clear All Data.
   - **Import behavior**: incoming JSON **replaces** all local data entirely.
   - Import also requires a typed confirmation before applying.

6. **Future settings placeholders**
   - Settings UI reserves two stub sections labeled **"Coming soon"**:
     - **Notifications & Feedback**: for sound/vibration toggle on rest timer.
     - **Advanced**: for progressive overload formula toggle.