export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Keto",
  "Paleo",
  "Low-Carb",
  "Nut-Free",
  "Halal",
  "Kosher",
] as const;

export const CUISINE_OPTIONS = [
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "Thai",
  "French",
  "Mediterranean",
  "American",
  "Korean",
  "Vietnamese",
  "Greek",
  "Middle Eastern",
  "Spanish",
  "Caribbean",
] as const;

export const COOK_TIME_OPTIONS = [
  { label: "< 15 min", maxMinutes: 15 },
  { label: "< 30 min", maxMinutes: 30 },
  { label: "< 60 min", maxMinutes: 60 },
  { label: "Any", maxMinutes: Infinity },
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];
export type CuisineOption = (typeof CUISINE_OPTIONS)[number];
