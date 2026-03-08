import { useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  scaleIngredients,
  formatAmount,
  type ScaledIngredient,
} from "@/src/lib/recipeScaling";

type UnitSystem = "metric" | "imperial";

interface UseRecipeScalingOptions {
  recipeServings: number;
  ingredients: Array<{
    name: string;
    amount?: number;
    unit?: string;
    preparation?: string;
    isOptional?: boolean;
    group?: string;
    sortOrder: number;
  }>;
}

interface UseRecipeScalingResult {
  targetServings: number;
  setTargetServings: (servings: number) => void;
  increment: () => void;
  decrement: () => void;
  scaledIngredients: ScaledIngredient[];
  multiplier: number;
  isScaled: boolean;
  preferredUnits: UnitSystem;
  formatAmount: (amount: number | undefined) => string;
  reset: () => void;
}

export function useRecipeScaling({
  recipeServings,
  ingredients,
}: UseRecipeScalingOptions): UseRecipeScalingResult {
  const user = useQuery(api.users.current);
  const preferredUnits: UnitSystem = user?.preferredUnits ?? "imperial";

  const [targetServings, setTargetServings] = useState(recipeServings);

  // Sync targetServings when recipeServings changes (e.g., after recipe loads)
  useEffect(() => {
    setTargetServings(recipeServings);
  }, [recipeServings]);

  const increment = useCallback(() => {
    setTargetServings((prev) => Math.min(prev + 1, 100));
  }, []);

  const decrement = useCallback(() => {
    setTargetServings((prev) => Math.max(prev - 1, 1));
  }, []);

  const reset = useCallback(() => {
    setTargetServings(recipeServings);
  }, [recipeServings]);

  const multiplier = recipeServings > 0 ? targetServings / recipeServings : 1;
  const isScaled = targetServings !== recipeServings;

  const scaledIngredients = useMemo(
    () =>
      scaleIngredients(
        ingredients,
        recipeServings,
        targetServings,
        preferredUnits,
      ),
    [ingredients, recipeServings, targetServings, preferredUnits],
  );

  return {
    targetServings,
    setTargetServings,
    increment,
    decrement,
    scaledIngredients,
    multiplier,
    isScaled,
    preferredUnits,
    formatAmount,
    reset,
  };
}
