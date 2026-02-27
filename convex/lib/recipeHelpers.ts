import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Get tag names for a single recipe.
 */
export async function getTagsForRecipe(
  ctx: QueryCtx | MutationCtx,
  recipeId: Id<"recipes">
): Promise<string[]> {
  const recipeTags = await ctx.db
    .query("recipeTags")
    .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
    .collect();

  const tags = await Promise.all(
    recipeTags.map(async (rt) => {
      const tag = await ctx.db.get(rt.tagId);
      return tag?.name || "";
    })
  );

  return tags.filter(Boolean);
}

/**
 * Enrich an array of recipes with their tag names.
 */
export async function enrichRecipesWithTags<T extends { _id: Id<"recipes"> }>(
  ctx: QueryCtx | MutationCtx,
  recipes: T[]
): Promise<Array<T & { tags: string[] }>> {
  return Promise.all(
    recipes.map(async (recipe) => ({
      ...recipe,
      tags: await getTagsForRecipe(ctx, recipe._id),
    }))
  );
}
