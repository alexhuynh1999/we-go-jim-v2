import type { RestTimerState } from "./types";

/**
 * Creates a fresh rest timer in the stopped state.
 */
export function createRestTimer(total: number): RestTimerState {
  return { remaining: total, total, running: false };
}

/**
 * Starts or resumes the timer.
 */
export function startTimer(timer: RestTimerState): RestTimerState {
  return { ...timer, running: true };
}

/**
 * Stops the timer without resetting remaining.
 */
export function stopTimer(timer: RestTimerState): RestTimerState {
  return { ...timer, running: false };
}

/**
 * Resets the timer to its full duration and stops it.
 */
export function resetTimer(timer: RestTimerState): RestTimerState {
  return { remaining: timer.total, total: timer.total, running: false };
}

/**
 * Advances the timer by the given delta (in seconds) if running.
 * Defaults to 1 second for backward compatibility.
 * Stops the timer when it reaches 0.
 */
export function tick(timer: RestTimerState, deltaSeconds: number = 1): RestTimerState {
  if (!timer.running) return timer;
  const next = timer.remaining - deltaSeconds;
  if (next <= 0) {
    return { remaining: 0, total: timer.total, running: false };
  }
  return { ...timer, remaining: next };
}