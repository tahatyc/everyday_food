import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull, canAccessShoppingList, canAccessShoppingItem } from "./lib/accessControl";

// Aisle mapping based on ingredient name keywords
const aisleMap: [string, string[]][] = [
  ["Dairy", [
    "milk", "cheese", "butter", "yogurt", "cream", "egg",
    "sour cream", "whipping", "mozzarella", "cheddar", "parmesan",
    "ricotta", "cottage", "ghee",
  ]],
  ["Meat & Seafood", [
    "chicken", "beef", "pork", "meat", "sausage", "turkey", "lamb",
    "bacon", "ham", "steak", "ground beef", "ground turkey",
    "fish", "salmon", "shrimp", "tuna", "seafood", "tilapia", "cod",
    "prawn", "crab", "lobster", "anchovy",
  ]],
  ["Produce", [
    "tomato", "onion", "lettuce", "carrot", "broccoli", "bell pepper",
    "garlic", "ginger", "lemon", "avocado", "spinach", "celery",
    "potato", "cucumber", "mushroom", "zucchini", "kale", "cabbage",
    "corn", "bean sprout", "cilantro", "parsley", "basil", "mint",
    "dill", "rosemary", "thyme", "chive", "scallion", "green onion",
    "jalapeño", "jalapeno", "squash", "eggplant", "asparagus",
    "cauliflower", "radish", "beet", "turnip", "sweet potato",
    "apple", "banana", "orange", "berry", "grape", "mango",
    "pear", "lime", "peach", "plum", "melon", "watermelon",
    "pineapple", "kiwi", "strawberry", "blueberry", "raspberry",
    "cherry", "fig", "pomegranate", "coconut", "fruit", "vegetable",
  ]],
  ["Bakery", [
    "bread", "roll", "bun", "tortilla", "pita", "bagel", "muffin",
    "croissant", "flatbread", "naan", "baguette", "ciabatta",
    "sourdough", "wrap",
  ]],
  ["Grains & Pasta", [
    "rice", "pasta", "noodle", "spaghetti", "penne", "macaroni",
    "flour", "oat", "oatmeal", "cereal", "quinoa", "couscous",
    "barley", "farro", "bulgur", "polenta", "cornmeal", "granola",
  ]],
  ["Canned & Jarred", [
    "canned", "jarred", "broth", "stock", "tomato sauce", "tomato paste",
    "salsa", "crushed tomato", "diced tomato", "coconut milk",
    "chickpea", "black bean", "kidney bean", "lentil",
  ]],
  ["Spices & Condiments", [
    "cumin", "paprika", "cinnamon", "oregano", "turmeric",
    "chili powder", "cayenne", "nutmeg", "clove", "coriander",
    "curry", "bay leaf", "saffron",
    "salt", "black pepper", "peppercorn",
    "mustard", "ketchup", "mayo", "mayonnaise", "soy sauce",
    "vinegar", "hot sauce", "sriracha", "worcestershire",
    "honey", "maple syrup", "vanilla", "olive oil", "vegetable oil",
    "sesame oil", "cooking spray",
  ]],
  ["Frozen", [
    "frozen", "ice cream", "sorbet", "popsicle",
  ]],
  ["Beverages", [
    "juice", "soda", "water", "coffee", "tea", "kombucha", "lemonade",
  ]],
  ["Snacks", [
    "chip", "cracker", "pretzel", "popcorn", "nut", "almond",
    "peanut", "walnut", "cashew", "pecan", "pistachio", "trail mix",
    "granola bar", "dried fruit",
  ]],
  ["Baking", [
    "baking soda", "baking powder", "yeast", "cocoa", "chocolate chip",
    "sugar", "brown sugar", "powdered sugar", "cornstarch",
    "gelatin", "food coloring", "sprinkles",
  ]],
];

function getAisle(name: string): string {
  const lowerName = name.toLowerCase();
  // Check longer phrases first by sorting keywords by length (descending)
  for (const [aisle, keywords] of aisleMap) {
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return aisle;
      }
    }
  }
  return "Pantry";
}

// Get the active shopping list with items
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return null;

    const list = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", userId).eq("isActive", true)
      )
      .first();

    if (!list) return null;

    // Get all items
    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();

    // Get recipe names for items that have recipeId
    const itemsWithRecipes = await Promise.all(
      items.map(async (item) => {
        let recipeName = null;
        if (item.recipeId) {
          const recipe = await ctx.db.get(item.recipeId);
          recipeName = recipe?.title || null;
        }
        return {
          ...item,
          recipeName,
        };
      })
    );

    // Group by aisle/category
    const groupedItems = itemsWithRecipes.reduce((acc, item) => {
      const category = item.aisle || item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof itemsWithRecipes>);

    return {
      ...list,
      items: itemsWithRecipes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      groupedItems,
    };
  },
});

// Get all shopping lists
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const lists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Get item counts for each list
    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        const items = await ctx.db
          .query("shoppingItems")
          .withIndex("by_list", (q) => q.eq("listId", list._id))
          .collect();

        const checkedCount = items.filter((i) => i.isChecked).length;

        return {
          ...list,
          totalItems: items.length,
          checkedItems: checkedCount,
        };
      })
    );

    return listsWithCounts;
  },
});

// Toggle item checked status
export const toggleItem = mutation({
  args: { itemId: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Verify ownership via the shopping list
    const hasAccess = await canAccessShoppingList(ctx, item.listId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to modify this item");
    }

    const now = Date.now();

    await ctx.db.patch(args.itemId, {
      isChecked: !item.isChecked,
      checkedAt: !item.isChecked ? now : undefined,
    });

    // Update list timestamp
    await ctx.db.patch(item.listId, { updatedAt: now });

    return { isChecked: !item.isChecked };
  },
});

// Add item to shopping list
export const addItem = mutation({
  args: {
    name: v.string(),
    amount: v.optional(v.number()),
    unit: v.optional(v.string()),
    aisle: v.optional(v.string()),
    recipeId: v.optional(v.id("recipes")),
    listId: v.optional(v.id("shoppingLists")),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);
    const now = Date.now();

    let list = null;

    if (args.listId) {
      // Use specified list directly
      const hasAccess = await canAccessShoppingList(ctx, args.listId, userId);
      if (!hasAccess) throw new Error("Not authorized to modify this list");
      list = await ctx.db.get(args.listId);
    } else {
      // Get or create active list
      list = await ctx.db
        .query("shoppingLists")
        .withIndex("by_user_and_active", (q) =>
          q.eq("userId", userId).eq("isActive", true)
        )
        .first();

      if (!list) {
        const listId = await ctx.db.insert("shoppingLists", {
          userId: userId,
          name: "Shopping List",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        list = await ctx.db.get(listId);
      }
    }

    if (!list) throw new Error("Failed to create list");

    // Check if item already exists (same name and recipe)
    const existingItems = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();

    const existing = existingItems.find(
      (i) =>
        i.name.toLowerCase() === args.name.toLowerCase() &&
        (!args.recipeId || i.recipeId === args.recipeId)
    );

    if (existing && args.amount) {
      // Update quantity
      await ctx.db.patch(existing._id, {
        amount: (existing.amount || 0) + args.amount,
      });
      return existing._id;
    }

    // Get max sort order
    const maxSort = Math.max(...existingItems.map((i) => i.sortOrder || 0), 0);

    // Add new item
    const itemId = await ctx.db.insert("shoppingItems", {
      listId: list._id,
      name: args.name,
      amount: args.amount,
      unit: args.unit,
      aisle: args.aisle,
      recipeId: args.recipeId,
      isChecked: false,
      sortOrder: maxSort + 1,
    });

    await ctx.db.patch(list._id, { updatedAt: now });

    return itemId;
  },
});

// Add all ingredients from a recipe to shopping list
export const addRecipeIngredients = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const recipe = await ctx.db.get(args.recipeId);
    if (!recipe) throw new Error("Recipe not found");

    // Get ingredients
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    // Get or create active list
    let list = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", userId).eq("isActive", true)
      )
      .first();

    const now = Date.now();

    if (!list) {
      const listId = await ctx.db.insert("shoppingLists", {
        userId: userId,
        name: "Shopping List",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      list = await ctx.db.get(listId);
    }

    if (!list) throw new Error("Failed to create list");

    // Get existing items
    const existingItems = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();

    let maxSort = Math.max(...existingItems.map((i) => i.sortOrder || 0), 0);

    // Add each ingredient
    for (const ing of ingredients) {
      if (ing.isOptional) continue; // Skip optional ingredients

      // Check if already exists
      const existing = existingItems.find(
        (i) => i.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (existing) {
        // Update amount if exists
        await ctx.db.patch(existing._id, {
          amount: (existing.amount || 0) + (ing.amount || 0),
        });
      } else {
        // Add new item
        maxSort += 1;
        await ctx.db.insert("shoppingItems", {
          listId: list._id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          aisle: getAisle(ing.name),
          recipeId: args.recipeId,
          isChecked: false,
          sortOrder: maxSort,
        });
      }
    }

    // Track that recipe was added to list
    const existingRecipeLink = await ctx.db
      .query("shoppingListRecipes")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .filter((q) => q.eq(q.field("recipeId"), args.recipeId))
      .first();

    if (!existingRecipeLink) {
      await ctx.db.insert("shoppingListRecipes", {
        listId: list._id,
        recipeId: args.recipeId,
        servings: recipe.servings,
        addedAt: now,
      });
    }

    await ctx.db.patch(list._id, { updatedAt: now });

    return { success: true, itemsAdded: ingredients.length };
  },
});

// Remove item from shopping list
export const removeItem = mutation({
  args: { itemId: v.id("shoppingItems") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Verify ownership via the shopping list
    const hasAccess = await canAccessShoppingList(ctx, item.listId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to delete this item");
    }

    await ctx.db.delete(args.itemId);
    await ctx.db.patch(item.listId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Clear checked items
export const clearChecked = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Verify ownership of the shopping list
    const hasAccess = await canAccessShoppingList(ctx, args.listId, userId);
    if (!hasAccess) {
      throw new Error("Not authorized to modify this list");
    }

    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list_and_checked", (q) =>
        q.eq("listId", args.listId).eq("isChecked", true)
      )
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.patch(args.listId, { updatedAt: Date.now() });

    return { success: true, removed: items.length };
  },
});

// Create a new shopping list
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const now = Date.now();

    // Deactivate current active list
    const currentActive = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_active", (q) =>
        q.eq("userId", userId).eq("isActive", true)
      )
      .first();

    if (currentActive) {
      await ctx.db.patch(currentActive._id, { isActive: false });
    }

    const listId = await ctx.db.insert("shoppingLists", {
      userId: userId,
      name: args.name,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    return listId;
  },
});

// ==================== WEEK-SCOPED QUERIES & MUTATIONS ====================

// Get shopping list for a specific week
export const getByWeek = query({
  args: { weekStartDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return null;

    const list = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", userId).eq("weekStartDate", args.weekStartDate)
      )
      .first();

    if (!list) return null;

    // Get all items
    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();

    // Get recipe names for items that have recipeId
    const itemsWithRecipes = await Promise.all(
      items.map(async (item) => {
        let recipeName = null;
        if (item.recipeId) {
          const recipe = await ctx.db.get(item.recipeId);
          recipeName = recipe?.title || null;
        }
        return { ...item, recipeName };
      })
    );

    // Group by aisle/category
    const groupedItems = itemsWithRecipes.reduce((acc, item) => {
      const category = item.aisle || item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof itemsWithRecipes>);

    return {
      ...list,
      items: itemsWithRecipes.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      groupedItems,
    };
  },
});

// Lightweight check: does a week list exist? (for badge on meal plan screen)
export const weekListExists = query({
  args: { weekStartDate: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return { exists: false, itemCount: 0 };

    const list = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", userId).eq("weekStartDate", args.weekStartDate)
      )
      .first();

    if (!list) return { exists: false, itemCount: 0 };

    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", list._id))
      .collect();

    return { exists: true, itemCount: items.length };
  },
});

// Create a week-scoped shopping list from the week's meal plan
export const createForWeek = mutation({
  args: {
    weekStartDate: v.string(),
    weekEndDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Guard against duplicates
    const existing = await ctx.db
      .query("shoppingLists")
      .withIndex("by_user_and_week", (q) =>
        q.eq("userId", userId).eq("weekStartDate", args.weekStartDate)
      )
      .first();

    if (existing) return existing._id;

    // Fetch meal plans for the date range
    const allMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const weekMealPlans = allMealPlans.filter(
      (plan) => plan.date >= args.weekStartDate && plan.date <= args.weekEndDate
    );

    // Collect unique recipe IDs
    const recipeIdSet = new Set(
      weekMealPlans
        .filter((plan) => plan.recipeId)
        .map((plan) => plan.recipeId!)
    );
    const recipeIds = Array.from(recipeIdSet);

    const now = Date.now();

    // Create the week-scoped list
    const listId = await ctx.db.insert("shoppingLists", {
      userId,
      name: `Grocery List`,
      weekStartDate: args.weekStartDate,
      weekEndDate: args.weekEndDate,
      createdAt: now,
      updatedAt: now,
    });

    // Combine ingredients across all recipes
    const combinedItems = new Map<string, {
      name: string;
      amount: number;
      unit: string;
      aisle: string;
      recipeId: typeof recipeIds[number];
      originalItems: { recipeId: typeof recipeIds[number]; amount: number; unit: string }[];
    }>();

    let sortOrder = 0;

    for (const recipeId of recipeIds) {
      const recipeDoc = await ctx.db.get(recipeId);
      if (!recipeDoc || !("servings" in recipeDoc)) continue;
      const recipe = recipeDoc as { servings: number };

      const ingredients = await ctx.db
        .query("ingredients")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
        .collect();

      for (const ing of ingredients) {
        if (ing.isOptional) continue;

        const key = ing.name.toLowerCase();
        const existingCombined = combinedItems.get(key);

        if (existingCombined && existingCombined.unit === (ing.unit || "")) {
          // Same name and unit — combine amounts
          existingCombined.amount += ing.amount || 0;
          existingCombined.originalItems.push({
            recipeId,
            amount: ing.amount || 0,
            unit: ing.unit || "",
          });
        } else if (!existingCombined) {
          // New item
          combinedItems.set(key, {
            name: ing.name,
            amount: ing.amount || 0,
            unit: ing.unit || "",
            aisle: getAisle(ing.name),
            recipeId,
            originalItems: [{
              recipeId,
              amount: ing.amount || 0,
              unit: ing.unit || "",
            }],
          });
        } else {
          // Same name but different unit — keep as separate entry
          const separateKey = `${key}__${ing.unit || ""}`;
          combinedItems.set(separateKey, {
            name: ing.name,
            amount: ing.amount || 0,
            unit: ing.unit || "",
            aisle: getAisle(ing.name),
            recipeId,
            originalItems: [{
              recipeId,
              amount: ing.amount || 0,
              unit: ing.unit || "",
            }],
          });
        }
      }

      // Track recipe in shoppingListRecipes
      await ctx.db.insert("shoppingListRecipes", {
        listId,
        recipeId,
        servings: recipe.servings,
        addedAt: now,
      });
    }

    // Insert all combined items
    for (const item of Array.from(combinedItems.values())) {
      sortOrder += 1;
      await ctx.db.insert("shoppingItems", {
        listId,
        name: item.name,
        amount: item.amount || undefined,
        unit: item.unit || undefined,
        aisle: item.aisle,
        recipeId: item.recipeId,
        isChecked: false,
        sortOrder,
        originalItems: item.originalItems.length > 1 ? item.originalItems : undefined,
      });
    }

    return listId;
  },
});

// Detect if the meal plan has changed since the shopping list was created
export const detectMealPlanChanges = query({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return { hasChanges: false, addedRecipes: [], removedRecipes: [] };

    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId || !list.weekStartDate || !list.weekEndDate) {
      return { hasChanges: false, addedRecipes: [], removedRecipes: [] };
    }

    // Current meal plan recipe IDs
    const allMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const currentRecipeIds = new Set(
      allMealPlans
        .filter((plan) => plan.date >= list.weekStartDate! && plan.date <= list.weekEndDate! && plan.recipeId)
        .map((plan) => plan.recipeId!.toString())
    );

    // Tracked recipe IDs in the shopping list
    const listRecipes = await ctx.db
      .query("shoppingListRecipes")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const trackedRecipeIds = new Set(listRecipes.map((r) => r.recipeId.toString()));

    // Diff
    const currentArr = Array.from(currentRecipeIds);
    const trackedArr = Array.from(trackedRecipeIds);

    const addedRecipes = currentArr.filter((id) => !trackedRecipeIds.has(id));
    const removedRecipes = trackedArr.filter((id) => !currentRecipeIds.has(id));

    return {
      hasChanges: addedRecipes.length > 0 || removedRecipes.length > 0,
      addedRecipes,
      removedRecipes,
    };
  },
});

// Sync a week shopping list with the current meal plan
export const syncWithMealPlan = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const list = await ctx.db.get(args.listId);
    if (!list || list.userId !== userId) throw new Error("Not authorized");
    if (!list.weekStartDate || !list.weekEndDate) throw new Error("Not a week-scoped list");

    // Current meal plan recipe IDs
    const allMealPlans = await ctx.db
      .query("mealPlans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const currentRecipeIds = new Set(
      allMealPlans
        .filter((plan) => plan.date >= list.weekStartDate! && plan.date <= list.weekEndDate! && plan.recipeId)
        .map((plan) => plan.recipeId!)
    );

    // Tracked recipe IDs
    const listRecipes = await ctx.db
      .query("shoppingListRecipes")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    const trackedRecipeIds = new Set(listRecipes.map((r) => r.recipeId));

    const now = Date.now();

    // Remove items for recipes no longer in meal plan
    for (const tracked of listRecipes) {
      if (!currentRecipeIds.has(tracked.recipeId)) {
        // Delete shopping items for this recipe
        const items = await ctx.db
          .query("shoppingItems")
          .withIndex("by_list", (q) => q.eq("listId", args.listId))
          .collect();

        for (const item of items) {
          if (item.recipeId && item.recipeId === tracked.recipeId) {
            await ctx.db.delete(item._id);
          }
        }

        // Remove recipe tracking
        await ctx.db.delete(tracked._id);
      }
    }

    // Get max sort order for new items
    const remainingItems = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list", (q) => q.eq("listId", args.listId))
      .collect();

    let sortOrder = Math.max(...remainingItems.map((i) => i.sortOrder || 0), 0);

    // Add items for new recipes
    for (const recipeId of Array.from(currentRecipeIds)) {
      if (trackedRecipeIds.has(recipeId)) continue;

      const recipeDoc = await ctx.db.get(recipeId);
      if (!recipeDoc || !("servings" in recipeDoc)) continue;
      const recipe = recipeDoc as { servings: number };

      const ingredients = await ctx.db
        .query("ingredients")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
        .collect();

      for (const ing of ingredients) {
        if (ing.isOptional) continue;

        // Check if same ingredient already exists in list (from another recipe)
        const existingItem = remainingItems.find(
          (i) => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === (ing.unit || undefined)
        );

        if (existingItem) {
          await ctx.db.patch(existingItem._id, {
            amount: (existingItem.amount || 0) + (ing.amount || 0),
          });
        } else {
          sortOrder += 1;
          await ctx.db.insert("shoppingItems", {
            listId: args.listId,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            aisle: getAisle(ing.name),
            recipeId,
            isChecked: false,
            sortOrder,
          });
        }
      }

      // Track the new recipe
      await ctx.db.insert("shoppingListRecipes", {
        listId: args.listId,
        recipeId,
        servings: recipe.servings,
        addedAt: now,
      });
    }

    await ctx.db.patch(args.listId, { updatedAt: now });

    return { success: true };
  },
});
