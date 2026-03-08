type UnitSystem = "metric" | "imperial";

interface UnitConversion {
  to: string;
  factor: number;
}

// Imperial → Metric conversions
const IMPERIAL_TO_METRIC: Record<string, UnitConversion> = {
  oz: { to: "g", factor: 28.3495 },
  lb: { to: "kg", factor: 0.453592 },
  lbs: { to: "kg", factor: 0.453592 },
  cup: { to: "ml", factor: 236.588 },
  cups: { to: "ml", factor: 236.588 },
  tbsp: { to: "ml", factor: 14.787 },
  tsp: { to: "ml", factor: 4.929 },
  "fl oz": { to: "ml", factor: 29.5735 },
  quart: { to: "L", factor: 0.946353 },
  quarts: { to: "L", factor: 0.946353 },
  qt: { to: "L", factor: 0.946353 },
  gallon: { to: "L", factor: 3.78541 },
  gallons: { to: "L", factor: 3.78541 },
  gal: { to: "L", factor: 3.78541 },
  pint: { to: "ml", factor: 473.176 },
  pints: { to: "ml", factor: 473.176 },
  pt: { to: "ml", factor: 473.176 },
  inch: { to: "cm", factor: 2.54 },
  inches: { to: "cm", factor: 2.54 },
  "°F": { to: "°C", factor: 0 }, // special handling
};

// Metric → Imperial conversions
const METRIC_TO_IMPERIAL: Record<string, UnitConversion> = {
  g: { to: "oz", factor: 0.035274 },
  kg: { to: "lb", factor: 2.20462 },
  ml: { to: "fl oz", factor: 0.033814 },
  L: { to: "quart", factor: 1.05669 },
  l: { to: "quart", factor: 1.05669 },
  cm: { to: "inch", factor: 0.393701 },
  "°C": { to: "°F", factor: 0 }, // special handling
};

// Units that are unitless or shouldn't be converted
const NON_CONVERTIBLE_UNITS = new Set([
  "piece",
  "pieces",
  "whole",
  "clove",
  "cloves",
  "slice",
  "slices",
  "pinch",
  "dash",
  "to taste",
  "bunch",
  "sprig",
  "sprigs",
  "leaf",
  "leaves",
  "can",
  "cans",
  "package",
  "pkg",
  "stick",
  "sticks",
  "head",
  "heads",
  "ear",
  "ears",
  "",
]);

function isMetricUnit(unit: string): boolean {
  const lower = unit.toLowerCase();
  return lower in METRIC_TO_IMPERIAL || lower === "l";
}

function isImperialUnit(unit: string): boolean {
  const lower = unit.toLowerCase();
  return lower in IMPERIAL_TO_METRIC;
}

function fahrenheitToCelsius(f: number): number {
  return (f - 32) * (5 / 9);
}

function celsiusToFahrenheit(c: number): number {
  return c * (9 / 5) + 32;
}

export function roundAmount(value: number): number {
  if (value === 0) return 0;
  if (value < 0.125) return Math.round(value * 100) / 100;
  if (value < 1) {
    // Round to nearest common fraction: 1/8, 1/4, 1/3, 1/2, 2/3, 3/4
    const fractions = [0.125, 0.25, 0.333, 0.5, 0.667, 0.75];
    let closest = fractions[0];
    let minDiff = Math.abs(value - fractions[0]);
    for (const f of fractions) {
      const diff = Math.abs(value - f);
      if (diff < minDiff) {
        minDiff = diff;
        closest = f;
      }
    }
    return closest;
  }
  if (value < 10) return Math.round(value * 4) / 4; // nearest 0.25
  return Math.round(value);
}

export function scaleAmount(
  amount: number | undefined,
  recipeServings: number,
  targetServings: number,
): number | undefined {
  if (amount === undefined || amount === 0) return amount;
  if (recipeServings <= 0 || targetServings <= 0) return amount;
  const multiplier = targetServings / recipeServings;
  return roundAmount(amount * multiplier);
}

export function convertUnit(
  amount: number,
  unit: string,
  targetSystem: UnitSystem,
): { amount: number; unit: string } {
  const lowerUnit = unit.toLowerCase();

  if (NON_CONVERTIBLE_UNITS.has(lowerUnit) || !unit) {
    return { amount, unit };
  }

  // Temperature special cases
  if (unit === "°F" && targetSystem === "metric") {
    return { amount: roundAmount(fahrenheitToCelsius(amount)), unit: "°C" };
  }
  if (unit === "°C" && targetSystem === "imperial") {
    return { amount: roundAmount(celsiusToFahrenheit(amount)), unit: "°F" };
  }

  if (targetSystem === "metric" && isImperialUnit(lowerUnit)) {
    const conversion = IMPERIAL_TO_METRIC[lowerUnit];
    if (conversion) {
      const converted = amount * conversion.factor;
      return { amount: roundAmount(converted), unit: conversion.to };
    }
  }

  if (targetSystem === "imperial" && isMetricUnit(lowerUnit)) {
    const key = lowerUnit === "l" ? "l" : lowerUnit;
    const conversion = METRIC_TO_IMPERIAL[key];
    if (conversion) {
      const converted = amount * conversion.factor;
      return { amount: roundAmount(converted), unit: conversion.to };
    }
  }

  return { amount, unit };
}

export interface ScaledIngredient {
  name: string;
  amount?: number;
  unit?: string;
  preparation?: string;
  isOptional?: boolean;
  group?: string;
  sortOrder: number;
  originalAmount?: number;
  originalUnit?: string;
}

export function scaleIngredient(
  ingredient: {
    name: string;
    amount?: number;
    unit?: string;
    preparation?: string;
    isOptional?: boolean;
    group?: string;
    sortOrder: number;
  },
  recipeServings: number,
  targetServings: number,
  targetSystem?: UnitSystem,
): ScaledIngredient {
  const scaledAmount = scaleAmount(ingredient.amount, recipeServings, targetServings);

  let finalAmount = scaledAmount;
  let finalUnit = ingredient.unit || "";

  if (targetSystem && scaledAmount !== undefined && finalUnit) {
    const converted = convertUnit(scaledAmount, finalUnit, targetSystem);
    finalAmount = converted.amount;
    finalUnit = converted.unit;
  }

  return {
    ...ingredient,
    amount: finalAmount,
    unit: finalUnit,
    originalAmount: ingredient.amount,
    originalUnit: ingredient.unit,
  };
}

export function scaleIngredients(
  ingredients: Array<{
    name: string;
    amount?: number;
    unit?: string;
    preparation?: string;
    isOptional?: boolean;
    group?: string;
    sortOrder: number;
  }>,
  recipeServings: number,
  targetServings: number,
  targetSystem?: UnitSystem,
): ScaledIngredient[] {
  return ingredients.map((ing) =>
    scaleIngredient(ing, recipeServings, targetServings, targetSystem),
  );
}

export function formatAmount(amount: number | undefined): string {
  if (amount === undefined) return "";

  // Common fractions for display
  const fractionMap: Record<number, string> = {
    0.125: "1/8",
    0.25: "1/4",
    0.333: "1/3",
    0.5: "1/2",
    0.667: "2/3",
    0.75: "3/4",
  };

  const whole = Math.floor(amount);
  const frac = roundAmount(amount - whole);

  if (frac === 0) return whole.toString();

  const fracStr = fractionMap[frac];
  if (fracStr) {
    return whole > 0 ? `${whole} ${fracStr}` : fracStr;
  }

  // Fallback to decimal
  if (amount < 10) return amount.toFixed(2).replace(/\.?0+$/, "");
  return Math.round(amount).toString();
}
