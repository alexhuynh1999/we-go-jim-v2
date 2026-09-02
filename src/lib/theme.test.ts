// ─── Tests for Serene Strength theme tokens ───
// Reads theme.css directly and validates all expected tokens are present.
// This avoids depending on CSS being loaded in jsdom's computed styles.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themeCss = fs.readFileSync(
  path.resolve(__dirname, "../theme.css"),
  "utf-8",
);

/** Extract the value of a `--token: value` from the CSS content */
function tokenValue(name: string): string | null {
  const re = new RegExp(`--${name}\\s*:\\s*([^;]+);`);
  const match = themeCss.match(re);
  return match ? (match[1] ?? "").trim() : null;
}

describe("Serene Strength theme tokens", () => {
  // ─── Colours ───
  describe("colour tokens", () => {
    const colourTokens = [
      "bg", "background",
      "surface", "surface-dim", "surface-bright",
      "surface-container-lowest", "surface-container-low", "surface-container",
      "surface-container-high", "surface-container-highest",
      "on-surface", "on-surface-variant",
      "inverse-surface", "inverse-on-surface",
      "outline", "outline-variant", "surface-tint",
      "primary", "on-primary", "primary-container", "on-primary-container",
      "inverse-primary", "primary-fixed", "primary-fixed-dim",
      "on-primary-fixed", "on-primary-fixed-variant",
      "secondary", "on-secondary", "secondary-container", "on-secondary-container",
      "secondary-fixed", "secondary-fixed-dim",
      "on-secondary-fixed", "on-secondary-fixed-variant",
      "tertiary", "on-tertiary", "tertiary-container", "on-tertiary-container",
      "tertiary-fixed", "tertiary-fixed-dim",
      "on-tertiary-fixed", "on-tertiary-fixed-variant",
      "error", "on-error", "error-container", "on-error-container",
    ];

    for (const token of colourTokens) {
      it(`--${token} is defined with a hex colour`, () => {
        const val = tokenValue(token);
        expect(val, `--${token} should be defined`).toBeTruthy();
        expect(val!).toMatch(/^#/);
      });
    }
  });

  // ─── Typography ───
  describe("typography tokens", () => {
    it("--font-display is defined", () => {
      const val = tokenValue("font-display");
      expect(val).toBeTruthy();
      expect(val).toContain("Source Serif 4");
    });

    it("--font-body is defined", () => {
      const val = tokenValue("font-body");
      expect(val).toBeTruthy();
      expect(val).toContain("Inter");
    });

    const textTokens = [
      "text-display-lg", "text-display-lg-lh", "text-display-lg-weight", "text-display-lg-ls",
      "text-headline-lg", "text-headline-lg-lh", "text-headline-lg-weight",
      "text-headline-lg-mobile", "text-headline-lg-mobile-lh", "text-headline-lg-mobile-weight",
      "text-headline-md", "text-headline-md-lh", "text-headline-md-weight",
      "text-body-lg", "text-body-lg-lh", "text-body-lg-weight",
      "text-body-md", "text-body-md-lh", "text-body-md-weight",
      "text-label-md", "text-label-md-lh", "text-label-md-weight", "text-label-md-ls",
      "text-label-sm", "text-label-sm-lh", "text-label-sm-weight",
    ];

    for (const token of textTokens) {
      it(`--${token} is defined`, () => {
        const val = tokenValue(token);
        expect(val, `--${token} should be defined`).toBeTruthy();
      });
    }
  });

  // ─── Spacing ───
  describe("spacing tokens", () => {
    const spacingTokens = [
      "space-unit", "space-container-padding", "space-gutter",
      "space-stack-sm", "space-stack-md", "space-section-gap",
    ];

    for (const token of spacingTokens) {
      it(`--${token} is defined`, () => {
        const val = tokenValue(token);
        expect(val, `--${token} should be defined`).toBeTruthy();
        expect(val!).toMatch(/px/);
      });
    }
  });

  // ─── Border Radius ───
  describe("radius tokens", () => {
    const radiusTokens = ["radius-sm", "radius-md", "radius-lg", "radius-xl", "radius-2xl", "radius-full"];

    for (const token of radiusTokens) {
      it(`--${token} is defined`, () => {
        const val = tokenValue(token);
        expect(val, `--${token} should be defined`).toBeTruthy();
      });
    }
  });

  // ─── Shadows ───
  describe("shadow tokens", () => {
    const shadowTokens = ["shadow-sm", "shadow-md", "shadow-lg"];

    for (const token of shadowTokens) {
      it(`--${token} is defined`, () => {
        const val = tokenValue(token);
        expect(val, `--${token} should be defined`).toBeTruthy();
        expect(val!).toContain("rgba");
      });
    }
  });

  // ─── Legacy / deprecated aliases ───
  describe("legacy alias tokens", () => {
    const legacyTokens = [
      "text-primary", "text-secondary", "surface-2", "border",
      "accent", "accent-hover", "success", "danger", "warning",
    ];

    for (const token of legacyTokens) {
      it(`--${token} is defined`, () => {
        const val = tokenValue(token);
        expect(val, `--${token} should be defined`).toBeTruthy();
      });
    }
  });
});