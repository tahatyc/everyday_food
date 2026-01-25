import breakfastRecipes from "./breakfast.json";
import lunchRecipes from "./lunch.json";
import dinnerRecipes from "./dinner.json";
import dessertRecipes from "./desserts.json";
import { SeedRecipe } from "./types";

// Type assertion for JSON imports
const breakfast = breakfastRecipes as SeedRecipe[];
const lunch = lunchRecipes as SeedRecipe[];
const dinner = dinnerRecipes as SeedRecipe[];
const desserts = dessertRecipes as SeedRecipe[];

// All recipes combined
export const allRecipes: SeedRecipe[] = [
  ...breakfast,
  ...lunch,
  ...dinner,
  ...desserts,
];

// Get a recipe by ID
export const getRecipeById = (id: string): SeedRecipe | undefined =>
  allRecipes.find((r) => r.id === id);

// Get recipes by tag
export const getRecipesByTag = (tag: string): SeedRecipe[] =>
  allRecipes.filter((r) => r.tags.includes(tag.toLowerCase()));

// Get recipes by meal type
export const getRecipesByMealType = (
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
): SeedRecipe[] =>
  allRecipes.filter((r) => r.mealType.includes(mealType));

// Get recipes by difficulty
export const getRecipesByDifficulty = (
  difficulty: "easy" | "medium" | "hard"
): SeedRecipe[] => allRecipes.filter((r) => r.difficulty === difficulty);

// Get recipes by cuisine
export const getRecipesByCuisine = (cuisine: string): SeedRecipe[] =>
  allRecipes.filter(
    (r) => r.cuisine.toLowerCase() === cuisine.toLowerCase()
  );

// Get recipes by diet type
export const getRecipesByDiet = (
  diet: "vegetarian" | "vegan" | "gluten-free" | "dairy-free" | "keto" | "low-carb"
): SeedRecipe[] => allRecipes.filter((r) => r.diet.includes(diet));

// Get quick recipes (under 30 minutes total)
export const getQuickRecipes = (): SeedRecipe[] =>
  allRecipes.filter((r) => r.prepTime + r.cookTime <= 30);

// Search recipes by title or description
export const searchRecipes = (query: string): SeedRecipe[] => {
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter(
    (r) =>
      r.title.toLowerCase().includes(lowerQuery) ||
      r.description.toLowerCase().includes(lowerQuery)
  );
};

// Export individual collections
export { breakfast, lunch, dinner, desserts };

// Export types
export * from "./types";
