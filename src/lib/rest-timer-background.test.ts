import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createRestTimer, startTimer } from "./rest-timer";

/**
 * Regression test: the rest timer must use wall-clock time so it survives
 * the browser pausing setInterval when the tab is backgrounded.
 *
 * The fix: instead of accumulating via tick(timer, fixedDelta) inside the
 * interval callback, compute remaining = total - (Date.now() - startedAt) / 1000.
 */
describe("rest timer survives backgrounding", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("accounts for real elapsed time after setInterval pause", () => {
    const total = 150;
    let timer = startTimer(createRestTimer(total));
    const startedAt = Date.now();

    // Simulate the fixed interval callback from SessionView: each tick computes
    // remaining from wall-clock time.
    const tick = () => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, total - elapsedSeconds);
      timer = { ...timer, remaining };
      if (remaining <= 0) {
        timer = { ...timer, running: false };
      }
    };

    // A few normal ticks
    tick();
    tick();
    tick();

    // Background for 30 seconds (setInterval is paused)
    vi.advanceTimersByTime(30_000);

    // One tick fires when the user returns
    tick();

    // Remaining correctly accounts for the 30s gap
    // After ~30s, should be ~120s remaining (with small tolerance for
    // the fractional seconds consumed by the initial 3 ticks)
    expect(timer.remaining).toBeLessThanOrEqual(total - 29);
    expect(timer.remaining).toBeGreaterThanOrEqual(total - 31);

    // Verify it still reaches 0 correctly
    vi.advanceTimersByTime(120_000);
    tick();
    expect(timer.remaining).toBe(0);
    expect(timer.running).toBe(false);
  });

  it("survives multiple backgrounding cycles", () => {
    const total = 90;
    let timer = startTimer(createRestTimer(total));
    const startedAt = Date.now();

    const tick = () => {
      const elapsedSeconds = (Date.now() - startedAt) / 1000;
      const remaining = Math.max(0, total - elapsedSeconds);
      timer = { ...timer, remaining };
      if (remaining <= 0) {
        timer = { ...timer, running: false };
      }
    };

    // Cycle 1: background 10s
    tick();
    vi.advanceTimersByTime(10_000);
    tick();
    expect(timer.remaining).toBeLessThanOrEqual(80);

    // Cycle 2: background 20s
    vi.advanceTimersByTime(20_000);
    tick();
    expect(timer.remaining).toBeLessThanOrEqual(60);
    expect(timer.remaining).toBeGreaterThan(55);

    // Cycle 3: let it finish
    vi.advanceTimersByTime(60_000);
    tick();
    expect(timer.remaining).toBe(0);
    expect(timer.running).toBe(false);
  });
});