import { describe, it, expect } from "vitest";
import { currentTab, navigateTo } from "./nav";

describe("nav store", () => {
  it("has a default value of 'home'", () => {
    let val = "unknown";
    currentTab.subscribe((v) => {
      val = v;
    })();
    expect(val).toBe("home");
  });

  it("navigateTo updates the store", () => {
    let val = "unknown";
    const unsub = currentTab.subscribe((v) => {
      val = v;
    });

    navigateTo("history");
    expect(val).toBe("history");

    navigateTo("templates");
    expect(val).toBe("templates");

    navigateTo("settings");
    expect(val).toBe("settings");

    navigateTo("home");
    expect(val).toBe("home");

    unsub();
  });
});