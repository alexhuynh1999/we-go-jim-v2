import { describe, it, expect } from "vitest";
import {
  createRestTimer,
  tick,
  startTimer,
  stopTimer,
  resetTimer,
} from "./rest-timer";

describe("rest-timer", () => {
  it("creates a timer with the given total and remaining = total", () => {
    const timer = createRestTimer(150);
    expect(timer.total).toBe(150);
    expect(timer.remaining).toBe(150);
    expect(timer.running).toBe(false);
  });

  it("startTimer sets running to true", () => {
    const timer = createRestTimer(90);
    const next = startTimer(timer);
    expect(next.running).toBe(true);
    expect(next.remaining).toBe(90);
  });

  it("stopTimer sets running to false", () => {
    const timer = { ...createRestTimer(60), running: true };
    const next = stopTimer(timer);
    expect(next.running).toBe(false);
    expect(next.remaining).toBe(60);
  });

  it("resetTimer returns a fresh timer with same total", () => {
    const timer = { remaining: 10, total: 150, running: true };
    const next = resetTimer(timer);
    expect(next.remaining).toBe(150);
    expect(next.total).toBe(150);
    expect(next.running).toBe(false);
  });

  it("tick decrements remaining by 1 when running", () => {
    const timer = { remaining: 10, total: 150, running: true };
    const next = tick(timer);
    expect(next.remaining).toBe(9);
    expect(next.running).toBe(true);
  });

  it("tick does not go below 0", () => {
    const timer = { remaining: 0, total: 150, running: true };
    const next = tick(timer);
    expect(next.remaining).toBe(0);
    expect(next.running).toBe(false);
  });

  it("tick stops the timer when it reaches 0", () => {
    const timer = { remaining: 1, total: 150, running: true };
    const next = tick(timer);
    expect(next.remaining).toBe(0);
    expect(next.running).toBe(false);
  });

  it("tick does nothing when not running", () => {
    const timer = { remaining: 10, total: 150, running: false };
    const next = tick(timer);
    expect(next).toEqual(timer);
  });

  it("startTimer does not change remaining", () => {
    const timer = { remaining: 45, total: 150, running: false };
    const next = startTimer(timer);
    expect(next.remaining).toBe(45);
  });

  it("chain of operations works correctly", () => {
    let timer = createRestTimer(150);
    expect(timer.running).toBe(false);

    timer = startTimer(timer);
    expect(timer.running).toBe(true);

    timer = tick(timer);
    expect(timer.remaining).toBe(149);

    timer = stopTimer(timer);
    expect(timer.running).toBe(false);

    timer = resetTimer(timer);
    expect(timer.remaining).toBe(150);
    expect(timer.running).toBe(false);
  });
});