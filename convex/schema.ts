import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  // ==================== USER & AUTH ====================
  users: defineTable({
    // Convex Auth fields
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    // Profile settings
    defaultServings: v.optional(v.number()),
    preferredUnits: v.optional(
      v.union(v.literal("metric"), v.literal("imperial"))
    ),
    dietaryPreferences: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .searchIndex("search_users", {
      searchField: "name",
      filterFields: [],
    }),

  // ==================== RECIPES ====================
  recipes: defineTable({
    userId: v.optional(v.id("users")), // Optional for global recipes
    isGlobal: v.optional(v.boolean()), // True for global recipes
    title: v.string(),
    description: v.optional(v.string()),
    // Timing
    prepTime: v.optional(v.number()), // minutes
    cookTime: v.optional(v.number()), // minutes
    totalTime: v.optional(v.number()), // computed or manual
    servings: v.number(),
    // Source
    sourceUrl: v.optional(v.string()),
    sourceType: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("imported"),
        v.literal("ai_extracted"),
        v.literal("seed")
      )
    ),
    // Media
    coverImage: v.optional(v.id("_storage")),
    photos: v.optional(v.array(v.id("_storage"))),
    // Metadata
    difficulty: v.optional(
      v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"))
    ),
    cuisine: v.optional(v.string()),
    // Nutrition (cached from calculation)
    nutritionPerServing: v.optional(
      v.object({
        calories: v.number(),
        protein: v.number(),
        carbs: v.number(),
        fat: v.number(),
        fiber: v.optional(v.number()),
        sugar: v.optional(v.number()),
        sodium: v.optional(v.number()),
      })
    ),
    nutritionLastCalculated: v.optional(v.number()),
    // Status
    isPublic: v.optional(v.boolean()),
    isFavorite: v.optional(v.boolean()),
    rating: v.optional(v.number()), // 1-5
    notes: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastCookedAt: v.optional(v.number()),
    cookCount: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"])
    .index("by_user_and_favorite", ["userId", "isFavorite"])
    .index("by_user_and_last_cooked", ["userId", "lastCookedAt"])
    .index("by_global", ["isGlobal"])
    .index("by_source_type", ["sourceType"])
    .searchIndex("search_recipes", {
      searchField: "title",
      filterFields: ["userId", "isGlobal"],
    }),

  // ==================== INGREDIENTS ====================
  ingredients: defineTable({
    recipeId: v.id("recipes"),
    name: v.string(),
    amount: v.optional(v.number()),
    unit: v.optional(v.string()), // cups, tbsp, oz, g, etc.
    preparation: v.optional(v.string()), // diced, minced, etc.
    isOptional: v.optional(v.boolean()),
    group: v.optional(v.string()), // for grouping (e.g., "For the sauce")
    sortOrder: v.number(),
    // Nutrition lookup reference
    nutritionixId: v.optional(v.string()),
    usdaFdcId: v.optional(v.string()),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_recipe_and_order", ["recipeId", "sortOrder"]),

  // ==================== STEPS ====================
  steps: defineTable({
    recipeId: v.id("recipes"),
    stepNumber: v.number(),
    instruction: v.string(),
    photo: v.optional(v.id("_storage")),
    timerMinutes: v.optional(v.number()), // for timer integration
    timerLabel: v.optional(v.string()),
    tips: v.optional(v.string()),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_recipe_and_step", ["recipeId", "stepNumber"]),

  // ==================== TAGS ====================
  tags: defineTable({
    userId: v.optional(v.id("users")), // Optional for global tags
    name: v.string(),
    type: v.union(
      v.literal("meal_type"), // breakfast, lunch, dinner, snack
      v.literal("cuisine"), // italian, mexican, asian
      v.literal("diet"), // vegetarian, vegan, keto, gluten-free
      v.literal("course"), // appetizer, main, dessert
      v.literal("custom") // user-defined
    ),
    color: v.optional(v.string()),
    icon: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_name", ["userId", "name"])
    .index("by_name", ["name"]),

  // Junction table for recipe tags (many-to-many)
  recipeTags: defineTable({
    recipeId: v.id("recipes"),
    tagId: v.id("tags"),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_tag", ["tagId"])
    .index("by_recipe_and_tag", ["recipeId", "tagId"]),

  // ==================== MEAL PLANNING ====================
  mealPlans: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO date string (YYYY-MM-DD)
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
    recipeId: v.optional(v.id("recipes")),
    customMealName: v.optional(v.string()), // for non-recipe meals
    servings: v.optional(v.number()),
    notes: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_date", ["userId", "date"])
    .index("by_user_date_meal", ["userId", "date", "mealType"])
    .index("by_recipe", ["recipeId"]),

  // ==================== SHOPPING LISTS ====================
  shoppingLists: defineTable({
    userId: v.id("users"),
    name: v.string(),
    isActive: v.optional(v.boolean()), // current active list
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_active", ["userId", "isActive"]),

  shoppingItems: defineTable({
    listId: v.id("shoppingLists"),
    name: v.string(),
    amount: v.optional(v.number()),
    unit: v.optional(v.string()),
    // Source tracking
    recipeId: v.optional(v.id("recipes")),
    isManual: v.optional(v.boolean()),
    // Organization
    aisle: v.optional(v.string()), // produce, dairy, meat, etc.
    category: v.optional(v.string()),
    // Status
    isChecked: v.boolean(),
    checkedAt: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
    // For combining duplicates
    originalItems: v.optional(
      v.array(
        v.object({
          recipeId: v.id("recipes"),
          amount: v.number(),
          unit: v.string(),
        })
      )
    ),
  })
    .index("by_list", ["listId"])
    .index("by_list_and_checked", ["listId", "isChecked"])
    .index("by_list_and_aisle", ["listId", "aisle"]),

  // Track which recipes are in a shopping list
  shoppingListRecipes: defineTable({
    listId: v.id("shoppingLists"),
    recipeId: v.id("recipes"),
    servings: v.number(),
    addedAt: v.number(),
  })
    .index("by_list", ["listId"])
    .index("by_recipe", ["recipeId"]),

  // ==================== COOKING SESSIONS ====================
  cookingSessions: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    currentStep: v.number(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    servingsMultiplier: v.optional(v.number()),
    // Timer state
    activeTimers: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          endsAt: v.number(),
          label: v.optional(v.string()),
        })
      )
    ),
  })
    .index("by_user", ["userId"])
    .index("by_user_active", ["userId", "completedAt"])
    .index("by_recipe", ["recipeId"]),

  // ==================== IMPORT JOBS ====================
  importJobs: defineTable({
    userId: v.id("users"),
    sourceUrl: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    resultRecipeId: v.optional(v.id("recipes")),
    errorMessage: v.optional(v.string()),
    rawExtractedData: v.optional(v.string()), // JSON string
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  // ==================== NUTRITION CACHE ====================
  nutritionCache: defineTable({
    ingredientName: v.string(), // normalized ingredient name
    nutritionData: v.object({
      calories: v.number(),
      protein: v.number(),
      carbs: v.number(),
      fat: v.number(),
      fiber: v.optional(v.number()),
      sugar: v.optional(v.number()),
      sodium: v.optional(v.number()),
      servingSize: v.number(),
      servingUnit: v.string(),
    }),
    source: v.union(
      v.literal("nutritionix"),
      v.literal("usda"),
      v.literal("manual")
    ),
    sourceId: v.optional(v.string()),
    fetchedAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_name", ["ingredientName"])
    .index("by_expiry", ["expiresAt"]),

  // ==================== FRIENDSHIPS ====================
  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(
      v.literal("pending"), // Request sent
      v.literal("accepted"), // Friends
      v.literal("blocked") // Blocked
    ),
    requestedBy: v.id("users"), // Who sent the request
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_friend", ["friendId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_friend", ["userId", "friendId"]),

  // ==================== RECIPE SHARES ====================
  recipeShares: defineTable({
    recipeId: v.id("recipes"),
    ownerId: v.id("users"),
    sharedWithId: v.id("users"),
    permission: v.literal("view"), // Future: "edit"
    sharedAt: v.number(),
    expiresAt: v.optional(v.number()),
    message: v.optional(v.string()),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_shared_with", ["sharedWithId"])
    .index("by_recipe_and_user", ["recipeId", "sharedWithId"])
    .index("by_owner", ["ownerId"]),

  // ==================== SHARE LINKS ====================
  shareLinks: defineTable({
    recipeId: v.id("recipes"),
    ownerId: v.id("users"),
    shareCode: v.string(), // Unique 9-char code
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
    accessCount: v.number(),
    lastAccessedAt: v.optional(v.number()),
    isActive: v.boolean(),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_code", ["shareCode"])
    .index("by_owner", ["ownerId"]),

  // ==================== SHARE LINK ACCESSES ====================
  shareLinkAccesses: defineTable({
    shareLinkId: v.id("shareLinks"),
    userId: v.optional(v.id("users")),
    accessedAt: v.number(),
  })
    .index("by_link", ["shareLinkId"]),

  // ==================== USER RECIPE INTERACTIONS ====================
  userRecipeInteractions: defineTable({
    userId: v.id("users"),
    recipeId: v.id("recipes"),
    isFavorite: v.optional(v.boolean()),
    rating: v.optional(v.number()),
    notes: v.optional(v.string()),
    lastCookedAt: v.optional(v.number()),
    lastViewedAt: v.optional(v.number()),
    cookCount: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_recipe", ["recipeId"])
    .index("by_user_and_recipe", ["userId", "recipeId"])
    .index("by_user_and_favorite", ["userId", "isFavorite"])
    .index("by_user_and_last_viewed", ["userId", "lastViewedAt"]),
});
