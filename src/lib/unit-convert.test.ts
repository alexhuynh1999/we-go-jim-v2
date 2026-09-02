import { describe, it, expect } from "vitest";
import {
  kgToLb,
  lbToKg,
  kmToMi,
  miToKm,
  convertWeight,
  convertDistance,
} from "./unit-convert";

describe("unit-convert", () => {
  describe("kgToLb", () => {
    it("converts 0 kg to 0 lb", () => {
      expect(kgToLb(0)).toBe(0);
    });
    it("converts 1 kg to ~2.205 lb", () => {
      expect(kgToLb(1)).toBeCloseTo(2.205, 2);
    });
    it("converts 100 kg to ~220.5 lb", () => {
      expect(kgToLb(100)).toBeCloseTo(220.5, 1);
    });
  });

  describe("lbToKg", () => {
    it("converts 0 lb to 0 kg", () => {
      expect(lbToKg(0)).toBe(0);
    });
    it("converts 2.205 lb to ~1 kg", () => {
      expect(lbToKg(2.205)).toBeCloseTo(1, 1);
    });
    it("converts 220 lb to ~99.8 kg", () => {
      expect(lbToKg(220)).toBeCloseTo(99.8, 0);
    });
  });

  describe("kmToMi", () => {
    it("converts 0 km to 0 mi", () => {
      expect(kmToMi(0)).toBe(0);
    });
    it("converts 1 km to ~0.621 mi", () => {
      expect(kmToMi(1)).toBeCloseTo(0.621, 2);
    });
    it("converts 10 km to ~6.21 mi", () => {
      expect(kmToMi(10)).toBeCloseTo(6.21, 1);
    });
  });

  describe("miToKm", () => {
    it("converts 0 mi to 0 km", () => {
      expect(miToKm(0)).toBe(0);
    });
    it("converts 1 mi to ~1.609 km", () => {
      expect(miToKm(1)).toBeCloseTo(1.609, 2);
    });
    it("converts 6.21 mi to ~10 km", () => {
      expect(miToKm(6.21)).toBeCloseTo(10, 0);
    });
  });

  describe("convertWeight", () => {
    it("returns the value unchanged when no conversion needed", () => {
      expect(convertWeight(100, "kg", "kg")).toBe(100);
      expect(convertWeight(100, "lb", "lb")).toBe(100);
    });
    it("converts kg to lb", () => {
      const result = convertWeight(100, "kg", "lb");
      expect(result).toBeCloseTo(220.5, 1);
    });
    it("converts lb to kg", () => {
      const result = convertWeight(220, "lb", "kg");
      expect(result).toBeCloseTo(99.8, 0);
    });
  });

  describe("convertDistance", () => {
    it("returns the value unchanged when no conversion needed", () => {
      expect(convertDistance(5, "km", "km")).toBe(5);
      expect(convertDistance(5, "mi", "mi")).toBe(5);
    });
    it("converts km to mi", () => {
      const result = convertDistance(10, "km", "mi");
      expect(result).toBeCloseTo(6.21, 1);
    });
    it("converts mi to km", () => {
      const result = convertDistance(6.21, "mi", "km");
      expect(result).toBeCloseTo(10, 0);
    });
  });
});