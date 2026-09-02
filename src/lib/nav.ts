import { writable } from "svelte/store";

export type Tab = "home" | "history" | "templates" | "settings";

export const currentTab = writable<Tab>(
  (typeof window !== "undefined" &&
    (window.location.hash.replace("#", "") as Tab)) ||
    "home"
);

export function navigateTo(tab: Tab) {
  window.location.hash = tab;
  currentTab.set(tab);
}

// Listen for hash changes (back/forward navigation)
if (typeof window !== "undefined") {
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.replace("#", "") || "home";
    currentTab.set(hash as Tab);
  });
}