import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";

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
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

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
  },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

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

    // Aisle mapping based on ingredient type
    const getAisle = (name: string): string => {
      const lowerName = name.toLowerCase();
      if (
        lowerName.includes("milk") ||
        lowerName.includes("cheese") ||
        lowerName.includes("butter") ||
        lowerName.includes("yogurt") ||
        lowerName.includes("cream") ||
        lowerName.includes("egg")
      ) {
        return "Dairy";
      }
      if (
        lowerName.includes("chicken") ||
        lowerName.includes("beef") ||
        lowerName.includes("pork") ||
        lowerName.includes("meat") ||
        lowerName.includes("sausage")
      ) {
        return "Meat";
      }
      if (
        lowerName.includes("tomato") ||
        lowerName.includes("onion") ||
        lowerName.includes("lettuce") ||
        lowerName.includes("carrot") ||
        lowerName.includes("broccoli") ||
        lowerName.includes("pepper") ||
        lowerName.includes("garlic") ||
        lowerName.includes("ginger") ||
        lowerName.includes("lemon") ||
        lowerName.includes("avocado") ||
        lowerName.includes("spinach") ||
        lowerName.includes("celery")
      ) {
        return "Produce";
      }
      if (
        lowerName.includes("bread") ||
        lowerName.includes("roll") ||
        lowerName.includes("bun")
      ) {
        return "Bakery";
      }
      return "Pantry";
    };

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
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    await ctx.db.delete(args.itemId);
    await ctx.db.patch(item.listId, { updatedAt: Date.now() });

    return { success: true };
  },
});

// Clear checked items
export const clearChecked = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args) => {
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
