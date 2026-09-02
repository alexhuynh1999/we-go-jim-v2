import type { SessionMachineState, SessionAction, WorkoutSession } from "./types";

/**
 * Reducer for the workout session lifecycle.
 * States: idle → in-progress → finished
 *
 * - START_SESSION: idle → in-progress (sets endedAt to null)
 * - FINISH_SESSION: in-progress → finished (records endedAt timestamp)
 * - ABANDON_SESSION: any → idle (discards the session)
 * - RESUME_SESSION: any → in-progress (restores a previously saved session)
 */
export function sessionReducer(
  state: SessionMachineState,
  action: SessionAction,
): SessionMachineState {
  switch (action.type) {
    case "START_SESSION": {
      return {
        state: "in-progress",
        session: { ...action.session, endedAt: null },
      };
    }

    case "FINISH_SESSION": {
      if (state.state !== "in-progress" || !state.session) return state;
      return {
        state: "finished",
        session: {
          ...state.session,
          endedAt: new Date().toISOString(),
        },
      };
    }

    case "ABANDON_SESSION": {
      return { state: "idle", session: null };
    }

    case "RESUME_SESSION": {
      return {
        state: "in-progress",
        session: { ...action.session },
      };
    }

    default:
      return state;
  }
}