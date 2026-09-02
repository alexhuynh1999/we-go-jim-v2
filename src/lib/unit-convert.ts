import type { WeightUnit, DistanceUnit } from "./types";

const KG_TO_LB = 2.204_62;
const KM_TO_MI = 0.621_371;

/**
 * Converts kilograms to pounds.
 */
export function kgToLb(kg: number): number {
  return kg * KG_TO_LB;
}

/**
 * Converts pounds to kilograms.
 */
export function lbToKg(lb: number): number {
  return lb / KG_TO_LB;
}

/**
 * Converts kilometres to miles.
 */
export function kmToMi(km: number): number {
  return km * KM_TO_MI;
}

/**
 * Converts miles to kilometres.
 */
export function miToKm(mi: number): number {
  return mi / KM_TO_MI;
}

/**
 * Converts a weight value between kg and lb.
 */
export function convertWeight(
  value: number,
  from: WeightUnit,
  to: WeightUnit,
): number {
  if (from === to) return value;
  if (from === "kg" && to === "lb") return kgToLb(value);
  return lbToKg(value);
}

/**
 * Converts a distance value between km and mi.
 */
export function convertDistance(
  value: number,
  from: DistanceUnit,
  to: DistanceUnit,
): number {
  if (from === to) return value;
  if (from === "km" && to === "mi") return kmToMi(value);
  return miToKm(value);
}