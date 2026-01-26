import { mutation } from "./_generated/server";

// Seed data for recipes
const seedRecipes = [
  {
    id: "pancakes-001",
    title: "Fluffy Buttermilk Pancakes",
    description: "Classic American pancakes that are light and fluffy, perfect for a weekend breakfast",
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    difficulty: "easy" as const,
    cuisine: "American",
    mealType: ["breakfast"],
    sourceType: "seed" as const,
    ingredients: [
      { name: "all-purpose flour", amount: 2, unit: "cups", preparation: "sifted", isOptional: false, group: null },
      { name: "buttermilk", amount: 1.5, unit: "cups", preparation: null, isOptional: false, group: null },
      { name: "eggs", amount: 2, unit: "large", preparation: null, isOptional: false, group: null },
      { name: "butter", amount: 3, unit: "tbsp", preparation: "melted", isOptional: false, group: null },
      { name: "sugar", amount: 2, unit: "tbsp", preparation: null, isOptional: false, group: null },
      { name: "baking powder", amount: 2, unit: "tsp", preparation: null, isOptional: false, group: null },
      { name: "baking soda", amount: 0.5, unit: "tsp", preparation: null, isOptional: false, group: null },
      { name: "salt", amount: 0.5, unit: "tsp", preparation: null, isOptional: false, group: null },
    ],
    steps: [
      { instruction: "In a large bowl, whisk together the flour, sugar, baking powder, baking soda, and salt.", timerMinutes: null, tips: "Sifting the flour makes for lighter pancakes" },
      { instruction: "In a separate bowl, whisk the buttermilk, eggs, and melted butter together until well combined.", timerMinutes: null, tips: null },
      { instruction: "Pour the wet ingredients into the dry ingredients and stir until just combined. Don't overmix - some lumps are okay!", timerMinutes: null, tips: "Overmixing develops gluten and makes pancakes tough" },
      { instruction: "Heat a griddle or non-stick pan over medium heat. Lightly grease with butter.", timerMinutes: 2, timerLabel: "Preheat griddle", tips: "Test with a drop of water - it should sizzle" },
      { instruction: "Pour 1/4 cup of batter per pancake onto the griddle. Cook until bubbles form on the surface.", timerMinutes: 3, timerLabel: "Cook first side", tips: null },
      { instruction: "Flip and cook for another 1-2 minutes until golden brown on both sides.", timerMinutes: 2, timerLabel: "Cook second side", tips: null },
    ],
    tags: ["breakfast", "american", "vegetarian", "quick"],
    nutrition: { calories: 320, protein: 9, carbs: 45, fat: 12 },
  },
  {
    id: "avocado-toast-001",
    title: "Classic Avocado Toast",
    description: "Simple yet satisfying avocado toast with a perfect poached egg on top",
    prepTime: 5,
    cookTime: 5,
    servings: 2,
    difficulty: "easy" as const,
    cuisine: "American",
    mealType: ["breakfast", "lunch"],
    sourceType: "seed" as const,
    ingredients: [
      { name: "sourdough bread", amount: 2, unit: "slices", preparation: null, isOptional: false, group: null },
      { name: "ripe avocado", amount: 1, unit: "large", preparation: null, isOptional: false, group: null },
      { name: "eggs", amount: 2, unit: "large", preparation: null, isOptional: false, group: null },
      { name: "lemon juice", amount: 1, unit: "tsp", preparation: "fresh", isOptional: false, group: null },
      { name: "red pepper flakes", amount: 0.25, unit: "tsp", preparation: null, isOptional: true, group: "Toppings" },
      { name: "flaky sea salt", amount: 1, unit: "pinch", preparation: null, isOptional: false, group: "Toppings" },
    ],
    steps: [
      { instruction: "Toast the sourdough bread until golden brown and crispy.", timerMinutes: 3, timerLabel: "Toast bread", tips: null },
      { instruction: "Cut the avocado in half, remove the pit, and mash with lemon juice.", timerMinutes: null, tips: "Leave some chunks for texture" },
      { instruction: "Bring a pot of water to a gentle simmer. Poach eggs for 3-4 minutes.", timerMinutes: 4, timerLabel: "Poach eggs", tips: "Add a splash of vinegar to help eggs hold together" },
      { instruction: "Spread avocado on toast, top with poached egg, and season.", timerMinutes: null, tips: null },
    ],
    tags: ["breakfast", "lunch", "healthy", "vegetarian", "quick"],
    nutrition: { calories: 350, protein: 14, carbs: 28, fat: 22 },
  },
  {
    id: "chicken-caesar-001",
    title: "Classic Chicken Caesar Salad",
    description: "Crispy romaine lettuce with grilled chicken, parmesan, and homemade Caesar dressing",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: "easy" as const,
    cuisine: "American",
    mealType: ["lunch", "dinner"],
    sourceType: "seed" as const,
    ingredients: [
      { name: "romaine lettuce", amount: 2, unit: "heads", preparation: "chopped", isOptional: false, group: "Salad" },
      { name: "chicken breast", amount: 1, unit: "lb", preparation: "boneless, skinless", isOptional: false, group: "Salad" },
      { name: "parmesan cheese", amount: 0.5, unit: "cup", preparation: "shaved", isOptional: false, group: "Salad" },
      { name: "croutons", amount: 1, unit: "cup", preparation: null, isOptional: false, group: "Salad" },
      { name: "mayonnaise", amount: 0.5, unit: "cup", preparation: null, isOptional: false, group: "Dressing" },
      { name: "lemon juice", amount: 2, unit: "tbsp", preparation: "fresh", isOptional: false, group: "Dressing" },
      { name: "garlic", amount: 2, unit: "cloves", preparation: "minced", isOptional: false, group: "Dressing" },
      { name: "Dijon mustard", amount: 1, unit: "tsp", preparation: null, isOptional: false, group: "Dressing" },
    ],
    steps: [
      { instruction: "Season chicken with salt and pepper. Cook in olive oil for 5-6 minutes per side.", timerMinutes: 12, timerLabel: "Cook chicken", tips: "Don't move the chicken while cooking for a good sear" },
      { instruction: "Make dressing: whisk mayonnaise, lemon juice, garlic, and mustard.", timerMinutes: null, tips: "Add water if too thick" },
      { instruction: "Toss romaine with dressing until evenly coated.", timerMinutes: null, tips: null },
      { instruction: "Top with sliced chicken, parmesan, and croutons.", timerMinutes: null, tips: null },
    ],
    tags: ["lunch", "dinner", "salad", "high-protein"],
    nutrition: { calories: 420, protein: 35, carbs: 15, fat: 26 },
  },
  {
    id: "spaghetti-bolognese-001",
    title: "Classic Spaghetti Bolognese",
    description: "Rich and hearty Italian meat sauce served over perfectly cooked spaghetti",
    prepTime: 15,
    cookTime: 45,
    servings: 6,
    difficulty: "medium" as const,
    cuisine: "Italian",
    mealType: ["dinner"],
    sourceType: "seed" as const,
    ingredients: [
      { name: "spaghetti", amount: 1, unit: "lb", preparation: null, isOptional: false, group: "Pasta" },
      { name: "ground beef", amount: 1, unit: "lb", preparation: "80/20 blend", isOptional: false, group: "Sauce" },
      { name: "Italian sausage", amount: 0.5, unit: "lb", preparation: "casings removed", isOptional: false, group: "Sauce" },
      { name: "onion", amount: 1, unit: "large", preparation: "diced", isOptional: false, group: "Sauce" },
      { name: "carrots", amount: 2, unit: "medium", preparation: "finely diced", isOptional: false, group: "Sauce" },
      { name: "celery", amount: 2, unit: "stalks", preparation: "finely diced", isOptional: false, group: "Sauce" },
      { name: "garlic", amount: 4, unit: "cloves", preparation: "minced", isOptional: false, group: "Sauce" },
      { name: "crushed tomatoes", amount: 28, unit: "oz", preparation: null, isOptional: false, group: "Sauce" },
      { name: "tomato paste", amount: 2, unit: "tbsp", preparation: null, isOptional: false, group: "Sauce" },
      { name: "Italian seasoning", amount: 1, unit: "tbsp", preparation: null, isOptional: false, group: "Sauce" },
    ],
    steps: [
      { instruction: "Brown ground beef and sausage in a Dutch oven, breaking up with a wooden spoon.", timerMinutes: 8, timerLabel: "Brown meat", tips: "Let it develop a nice crust" },
      { instruction: "Add onion, carrots, and celery. Cook for 5-7 minutes until softened.", timerMinutes: 7, timerLabel: "Cook vegetables", tips: "This is the flavor base" },
      { instruction: "Add garlic and tomato paste, cook for 2 minutes.", timerMinutes: 2, timerLabel: "Cook paste", tips: null },
      { instruction: "Add crushed tomatoes and Italian seasoning. Simmer for 25-30 minutes.", timerMinutes: 30, timerLabel: "Simmer sauce", tips: "The longer it simmers, the better" },
      { instruction: "Cook spaghetti according to package directions. Reserve pasta water.", timerMinutes: 10, timerLabel: "Cook pasta", tips: "Cook until al dente" },
      { instruction: "Toss pasta with sauce, adding pasta water as needed.", timerMinutes: null, tips: null },
    ],
    tags: ["dinner", "italian", "pasta", "comfort-food", "family-friendly"],
    nutrition: { calories: 580, protein: 32, carbs: 52, fat: 26 },
  },
  {
    id: "stir-fry-001",
    title: "Quick Vegetable Stir-Fry",
    description: "Colorful crisp-tender vegetables in a savory garlic ginger sauce, ready in 20 minutes",
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    difficulty: "easy" as const,
    cuisine: "Asian",
    mealType: ["dinner", "lunch"],
    sourceType: "seed" as const,
    ingredients: [
      { name: "broccoli florets", amount: 2, unit: "cups", preparation: null, isOptional: false, group: "Vegetables" },
      { name: "bell peppers", amount: 2, unit: "medium", preparation: "sliced", isOptional: false, group: "Vegetables" },
      { name: "carrots", amount: 2, unit: "medium", preparation: "julienned", isOptional: false, group: "Vegetables" },
      { name: "snap peas", amount: 1, unit: "cup", preparation: null, isOptional: false, group: "Vegetables" },
      { name: "soy sauce", amount: 3, unit: "tbsp", preparation: null, isOptional: false, group: "Sauce" },
      { name: "sesame oil", amount: 1, unit: "tbsp", preparation: null, isOptional: false, group: "Sauce" },
      { name: "garlic", amount: 3, unit: "cloves", preparation: "minced", isOptional: false, group: "Aromatics" },
      { name: "fresh ginger", amount: 1, unit: "tbsp", preparation: "minced", isOptional: false, group: "Aromatics" },
    ],
    steps: [
      { instruction: "Mix sauce: soy sauce, sesame oil, rice vinegar, and honey.", timerMinutes: null, tips: null },
      { instruction: "Heat wok over high heat until shimmering.", timerMinutes: null, tips: "Wok should be very hot" },
      { instruction: "Add garlic and ginger, stir-fry for 30 seconds.", timerMinutes: null, tips: "Don't let it burn" },
      { instruction: "Add carrots and broccoli first, stir-fry for 2 minutes.", timerMinutes: 2, timerLabel: "Cook hard vegetables", tips: null },
      { instruction: "Add remaining vegetables, stir-fry for 2-3 minutes.", timerMinutes: 3, timerLabel: "Cook remaining", tips: "Keep everything moving" },
      { instruction: "Pour sauce over vegetables and toss to coat.", timerMinutes: 1, timerLabel: "Coat with sauce", tips: null },
    ],
    tags: ["dinner", "lunch", "vegetarian", "vegan", "asian", "healthy", "quick"],
    nutrition: { calories: 180, protein: 5, carbs: 22, fat: 9 },
  },
  {
    id: "chocolate-cookies-001",
    title: "Classic Chocolate Chip Cookies",
    description: "Soft and chewy chocolate chip cookies with crispy edges",
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    difficulty: "easy" as const,
    cuisine: "American",
    mealType: ["snack"],
    sourceType: "seed" as const,
    ingredients: [
      { name: "all-purpose flour", amount: 2.25, unit: "cups", preparation: null, isOptional: false, group: "Dry" },
      { name: "baking soda", amount: 1, unit: "tsp", preparation: null, isOptional: false, group: "Dry" },
      { name: "salt", amount: 1, unit: "tsp", preparation: null, isOptional: false, group: "Dry" },
      { name: "butter", amount: 1, unit: "cup", preparation: "softened", isOptional: false, group: "Wet" },
      { name: "granulated sugar", amount: 0.75, unit: "cup", preparation: null, isOptional: false, group: "Wet" },
      { name: "brown sugar", amount: 0.75, unit: "cup", preparation: "packed", isOptional: false, group: "Wet" },
      { name: "eggs", amount: 2, unit: "large", preparation: null, isOptional: false, group: "Wet" },
      { name: "vanilla extract", amount: 1, unit: "tsp", preparation: null, isOptional: false, group: "Wet" },
      { name: "chocolate chips", amount: 2, unit: "cups", preparation: null, isOptional: false, group: "Mix-ins" },
    ],
    steps: [
      { instruction: "Preheat oven to 375°F. Line baking sheets with parchment paper.", timerMinutes: null, tips: null },
      { instruction: "Whisk flour, baking soda, and salt together.", timerMinutes: null, tips: null },
      { instruction: "Beat butter and sugars until light and fluffy, about 3 minutes.", timerMinutes: 3, timerLabel: "Cream butter", tips: "Creates air pockets for soft cookies" },
      { instruction: "Beat in eggs and vanilla.", timerMinutes: null, tips: null },
      { instruction: "Gradually add flour mixture, then fold in chocolate chips.", timerMinutes: null, tips: "Don't overmix" },
      { instruction: "Drop rounded tablespoons onto baking sheets. Bake 10-12 minutes.", timerMinutes: 11, timerLabel: "Bake cookies", tips: "Centers should look slightly underdone" },
    ],
    tags: ["dessert", "baking", "cookies", "kid-friendly", "vegetarian"],
    nutrition: { calories: 180, protein: 2, carbs: 24, fat: 9 },
  },
];

// Seed tags
const seedTags = [
  { name: "Breakfast", type: "meal_type" as const, color: "#FFE66D" },
  { name: "Lunch", type: "meal_type" as const, color: "#7BC950" },
  { name: "Dinner", type: "meal_type" as const, color: "#FF6B6B" },
  { name: "Snack", type: "meal_type" as const, color: "#4ECDC4" },
  { name: "Italian", type: "cuisine" as const, color: "#FF6B6B" },
  { name: "American", type: "cuisine" as const, color: "#4ECDC4" },
  { name: "Asian", type: "cuisine" as const, color: "#FFE66D" },
  { name: "Vegetarian", type: "diet" as const, color: "#7BC950" },
  { name: "Vegan", type: "diet" as const, color: "#7BC950" },
  { name: "Quick", type: "custom" as const, color: "#4ECDC4" },
  { name: "Comfort Food", type: "custom" as const, color: "#FF6B6B" },
  { name: "Healthy", type: "custom" as const, color: "#7BC950" },
];

// Seed cookbooks
const seedCookbooks = [
  { name: "Favorites", description: "My favorite recipes", color: "#FF6B6B", isDefault: true },
  { name: "Quick & Easy", description: "30 minutes or less", color: "#4ECDC4", isDefault: false },
  { name: "Italian Favorites", description: "Classic Italian dishes", color: "#E8D5E0", isDefault: false },
  { name: "Healthy Eating", description: "Nutritious and delicious", color: "#D4E8D5", isDefault: false },
  { name: "Meal Prep", description: "Great for weekly meal prep", color: "#7BC950", isDefault: false },
  { name: "Special Occasions", description: "For dinner parties and holidays", color: "#FFE66D", isDefault: false },
];

// Main seed function - creates a demo user and populates data
export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    // Create a demo user
    const existingUsers = await ctx.db.query("users").collect();
    let userId;

    if (existingUsers.length > 0) {
      userId = existingUsers[0]._id;
      console.log("Using existing user:", userId);
    } else {
      userId = await ctx.db.insert("users", {
        tokenIdentifier: "demo-user",
        email: "demo@everyday.food",
        name: "Demo Chef",
        preferredUnits: "imperial",
        defaultServings: 4,
        createdAt: now,
        updatedAt: now,
      });
      console.log("Created demo user:", userId);
    }

    // Create tags
    const tagMap: Record<string, any> = {};
    for (const tag of seedTags) {
      const existingTag = await ctx.db
        .query("tags")
        .withIndex("by_user_and_name", (q) => q.eq("userId", userId).eq("name", tag.name))
        .first();

      if (!existingTag) {
        const tagId = await ctx.db.insert("tags", {
          userId,
          name: tag.name,
          type: tag.type,
          color: tag.color,
        });
        tagMap[tag.name.toLowerCase()] = tagId;
      } else {
        tagMap[tag.name.toLowerCase()] = existingTag._id;
      }
    }
    console.log("Created/found tags:", Object.keys(tagMap).length);

    // Create cookbooks
    const cookbookMap: Record<string, any> = {};
    for (let i = 0; i < seedCookbooks.length; i++) {
      const cookbook = seedCookbooks[i];
      const existingCookbook = await ctx.db
        .query("cookbooks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("name"), cookbook.name))
        .first();

      if (!existingCookbook) {
        const cookbookId = await ctx.db.insert("cookbooks", {
          userId,
          name: cookbook.name,
          description: cookbook.description,
          color: cookbook.color,
          isDefault: cookbook.isDefault,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        });
        cookbookMap[cookbook.name] = cookbookId;
      } else {
        cookbookMap[cookbook.name] = existingCookbook._id;
      }
    }
    console.log("Created/found cookbooks:", Object.keys(cookbookMap).length);

    // Create recipes
    let recipesCreated = 0;
    for (const recipe of seedRecipes) {
      // Check if recipe already exists
      const existingRecipe = await ctx.db
        .query("recipes")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("title"), recipe.title))
        .first();

      if (existingRecipe) {
        console.log("Recipe already exists:", recipe.title);
        continue;
      }

      // Create recipe
      const recipeId = await ctx.db.insert("recipes", {
        userId,
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        totalTime: recipe.prepTime + recipe.cookTime,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        sourceType: recipe.sourceType,
        nutritionPerServing: recipe.nutrition,
        isFavorite: Math.random() > 0.5, // Randomly favorite some
        cookCount: Math.floor(Math.random() * 10),
        createdAt: now - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in past 30 days
        updatedAt: now,
      });

      // Create ingredients
      for (let i = 0; i < recipe.ingredients.length; i++) {
        const ing = recipe.ingredients[i];
        await ctx.db.insert("ingredients", {
          recipeId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          preparation: ing.preparation || undefined,
          isOptional: ing.isOptional,
          group: ing.group || undefined,
          sortOrder: i,
        });
      }

      // Create steps
      for (let i = 0; i < recipe.steps.length; i++) {
        const step = recipe.steps[i];
        await ctx.db.insert("steps", {
          recipeId,
          stepNumber: i + 1,
          instruction: step.instruction,
          timerMinutes: step.timerMinutes || undefined,
          timerLabel: step.timerLabel || undefined,
          tips: step.tips || undefined,
        });
      }

      // Add tags to recipe - include mealType tags
      const allTags = [...(recipe.mealType || []), ...recipe.tags];
      for (const tagName of allTags) {
        const tagId = tagMap[tagName.toLowerCase()];
        if (tagId) {
          // Check if already linked
          const existingLink = await ctx.db
            .query("recipeTags")
            .withIndex("by_recipe_and_tag", (q) =>
              q.eq("recipeId", recipeId).eq("tagId", tagId)
            )
            .first();
          if (!existingLink) {
            await ctx.db.insert("recipeTags", {
              recipeId,
              tagId,
            });
          }
        }
      }

      // Add to cookbooks based on criteria
      const totalTime = recipe.prepTime + recipe.cookTime;

      // Quick & Easy: under 30 min
      if (totalTime <= 30 && cookbookMap["Quick & Easy"]) {
        await ctx.db.insert("cookbookRecipes", {
          cookbookId: cookbookMap["Quick & Easy"],
          recipeId,
          addedAt: now,
        });
      }

      // Italian Favorites
      if (recipe.cuisine === "Italian" && cookbookMap["Italian Favorites"]) {
        await ctx.db.insert("cookbookRecipes", {
          cookbookId: cookbookMap["Italian Favorites"],
          recipeId,
          addedAt: now,
        });
      }

      // Healthy Eating: vegetarian/vegan/healthy tags
      const healthyTags = ["vegetarian", "vegan", "healthy"];
      if (recipe.tags.some(t => healthyTags.includes(t.toLowerCase())) && cookbookMap["Healthy Eating"]) {
        await ctx.db.insert("cookbookRecipes", {
          cookbookId: cookbookMap["Healthy Eating"],
          recipeId,
          addedAt: now,
        });
      }

      recipesCreated++;
    }

    // Create a sample meal plan for this week
    const today = new Date();
    const mealTypes = ["breakfast", "lunch", "dinner"] as const;

    // Get all recipes for meal planning
    const allRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    if (allRecipes.length > 0) {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateStr = date.toISOString().split("T")[0];

        // Add 1-2 meals per day randomly
        const mealsToAdd = Math.floor(Math.random() * 2) + 1;
        const shuffledMealTypes = [...mealTypes].sort(() => Math.random() - 0.5);

        for (let j = 0; j < mealsToAdd && j < shuffledMealTypes.length; j++) {
          const mealType = shuffledMealTypes[j];
          const randomRecipe = allRecipes[Math.floor(Math.random() * allRecipes.length)];

          // Check if meal already exists
          const existingMeal = await ctx.db
            .query("mealPlans")
            .withIndex("by_user_date_meal", (q) =>
              q.eq("userId", userId).eq("date", dateStr).eq("mealType", mealType)
            )
            .first();

          if (!existingMeal) {
            await ctx.db.insert("mealPlans", {
              userId,
              date: dateStr,
              mealType,
              recipeId: randomRecipe._id,
              servings: randomRecipe.servings,
              createdAt: now,
            });
          }
        }
      }
    }

    // Create a sample shopping list
    const existingList = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_active", (q) => q.eq("userId", userId).eq("isActive", true))
      .first();

    if (!existingList) {
      const listId = await ctx.db.insert("shoppingLists", {
        userId,
        name: "This Week's Groceries",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });

      // Add some sample items
      const sampleItems = [
        { name: "Eggs", amount: 12, unit: "large", aisle: "Dairy" },
        { name: "Butter", amount: 1, unit: "lb", aisle: "Dairy" },
        { name: "Milk", amount: 1, unit: "gallon", aisle: "Dairy" },
        { name: "Bread", amount: 1, unit: "loaf", aisle: "Bakery" },
        { name: "Chicken breast", amount: 2, unit: "lbs", aisle: "Meat" },
        { name: "Broccoli", amount: 2, unit: "heads", aisle: "Produce" },
        { name: "Onions", amount: 3, unit: "medium", aisle: "Produce" },
        { name: "Garlic", amount: 1, unit: "head", aisle: "Produce" },
        { name: "Olive oil", amount: 1, unit: "bottle", aisle: "Pantry" },
        { name: "Pasta", amount: 1, unit: "lb", aisle: "Pantry" },
      ];

      for (let i = 0; i < sampleItems.length; i++) {
        const item = sampleItems[i];
        await ctx.db.insert("shoppingItems", {
          listId,
          name: item.name,
          amount: item.amount,
          unit: item.unit,
          aisle: item.aisle,
          isChecked: Math.random() > 0.7, // Some items already checked
          sortOrder: i,
        });
      }
    }

    // Add favorites to Favorites cookbook
    const favoriteRecipes = await ctx.db
      .query("recipes")
      .withIndex("by_user_and_favorite", (q) => q.eq("userId", userId).eq("isFavorite", true))
      .collect();

    for (const recipe of favoriteRecipes) {
      if (cookbookMap["Favorites"]) {
        const existing = await ctx.db
          .query("cookbookRecipes")
          .withIndex("by_cookbook_and_recipe", (q) =>
            q.eq("cookbookId", cookbookMap["Favorites"]).eq("recipeId", recipe._id)
          )
          .first();
        if (!existing) {
          await ctx.db.insert("cookbookRecipes", {
            cookbookId: cookbookMap["Favorites"],
            recipeId: recipe._id,
            addedAt: now,
          });
        }
      }
    }

    return {
      success: true,
      message: `Seeded database with ${recipesCreated} recipes, ${Object.keys(tagMap).length} tags, ${Object.keys(cookbookMap).length} cookbooks`,
      userId,
    };
  },
});

// Clear all data for a user (useful for testing)
export const clearUserData = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      return { success: false, message: "No users found" };
    }

    const userId = users[0]._id;

    // Delete in order to respect foreign keys
    const recipes = await ctx.db.query("recipes").withIndex("by_user", (q) => q.eq("userId", userId)).collect();

    for (const recipe of recipes) {
      // Delete recipe tags
      const recipeTags = await ctx.db.query("recipeTags").withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id)).collect();
      for (const rt of recipeTags) await ctx.db.delete(rt._id);

      // Delete ingredients
      const ingredients = await ctx.db.query("ingredients").withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id)).collect();
      for (const ing of ingredients) await ctx.db.delete(ing._id);

      // Delete steps
      const steps = await ctx.db.query("steps").withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id)).collect();
      for (const step of steps) await ctx.db.delete(step._id);

      // Delete cookbook recipes
      const cbRecipes = await ctx.db.query("cookbookRecipes").withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id)).collect();
      for (const cbr of cbRecipes) await ctx.db.delete(cbr._id);

      // Delete meal plans
      const mealPlans = await ctx.db.query("mealPlans").withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id)).collect();
      for (const mp of mealPlans) await ctx.db.delete(mp._id);

      await ctx.db.delete(recipe._id);
    }

    // Delete tags
    const tags = await ctx.db.query("tags").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const tag of tags) await ctx.db.delete(tag._id);

    // Delete cookbooks
    const cookbooks = await ctx.db.query("cookbooks").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const cb of cookbooks) await ctx.db.delete(cb._id);

    // Delete shopping lists and items
    const lists = await ctx.db.query("shoppingLists").withIndex("by_user", (q) => q.eq("userId", userId)).collect();
    for (const list of lists) {
      const items = await ctx.db.query("shoppingItems").withIndex("by_list", (q) => q.eq("listId", list._id)).collect();
      for (const item of items) await ctx.db.delete(item._id);
      await ctx.db.delete(list._id);
    }

    return { success: true, message: "Cleared all user data" };
  },
});
