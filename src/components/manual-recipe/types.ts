export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

export interface Step {
  id: string;
  instruction: string;
  tip: string;
}

export type Difficulty = "easy" | "medium" | "hard" | null;

export interface BasicInfo {
  title: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  difficulty: Difficulty;
}

export interface Extras {
  description: string;
  cuisine: string;
}

export interface Nutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
}

export const UNIT_GROUPS = [
  {
    label: "COUNT",
    units: ["pcs", "pinch", "dash", "clove", "slice", "can", "pkg", "bunch", "to taste"],
  },
  {
    label: "METRIC",
    units: ["g", "kg", "ml", "l", "tsp", "tbsp", "cup"],
  },
  {
    label: "IMPERIAL",
    units: ["oz", "lb", "fl oz", "pt", "qt"],
  },
];
