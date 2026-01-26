# Convex Function Skill

Create Convex backend functions following project patterns.

## File Location

Place in `convex/` directory (e.g., `convex/featureName.ts`).

## Query Template

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

// List items for current user
export const list = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get current user (demo mode: get first user)
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    // Query with index for performance
    const items = await ctx.db
      .query("tableName")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();

    // Apply optional limit
    return args.limit ? items.slice(0, args.limit) : items;
  },
});

// Get single item by ID
export const getById = query({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return null;

    // Fetch related data
    const relatedItems = await ctx.db
      .query("relatedTable")
      .withIndex("by_parent", (q) => q.eq("parentId", item._id))
      .collect();

    return {
      ...item,
      relatedItems: relatedItems.sort((a, b) => a.sortOrder - b.sortOrder),
    };
  },
});
```

## Mutation Template

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create new item
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("User not found");

    const id = await ctx.db.insert("tableName", {
      userId: user._id,
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return id;
  },
});

// Update item
export const update = mutation({
  args: {
    id: v.id("tableName"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");

    await ctx.db.patch(args.id, {
      ...(args.name !== undefined && { name: args.name }),
      ...(args.description !== undefined && { description: args.description }),
      updatedAt: Date.now(),
    });
  },
});

// Delete item
export const remove = mutation({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Toggle boolean field
export const toggleField = mutation({
  args: { id: v.id("tableName") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Item not found");

    await ctx.db.patch(args.id, {
      isActive: !item.isActive,
      updatedAt: Date.now(),
    });

    return { isActive: !item.isActive };
  },
});
```

## Many-to-Many Pattern

```typescript
// Get items with related data through junction table
export const listWithRelations = query({
  args: {},
  handler: async (ctx) => {
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    const items = await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch related data in parallel
    const itemsWithRelations = await Promise.all(
      items.map(async (item) => {
        // Get junction records
        const junctionRecords = await ctx.db
          .query("itemTags")
          .withIndex("by_item", (q) => q.eq("itemId", item._id))
          .collect();

        // Resolve related items
        const tags = await Promise.all(
          junctionRecords.map(async (jr) => {
            const tag = await ctx.db.get(jr.tagId);
            return tag?.name || "";
          })
        );

        return {
          ...item,
          tags: tags.filter(Boolean),
        };
      })
    );

    return itemsWithRelations;
  },
});
```

## Search Index Query

```typescript
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first();
    if (!user) return [];

    const results = await ctx.db
      .query("recipes")
      .withSearchIndex("search_recipes", (q) =>
        q.search("title", args.query).eq("userId", user._id)
      )
      .collect();

    return results;
  },
});
```

## Schema Pattern

When adding a new table, update `convex/schema.ts`:

```typescript
tableName: defineTable({
  userId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  isActive: v.optional(v.boolean()),
  sortOrder: v.optional(v.number()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_and_active", ["userId", "isActive"]),
```

## Usage in Components

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function Component() {
  const items = useQuery(api.featureName.list);
  const createItem = useMutation(api.featureName.create);

  const handleCreate = async () => {
    await createItem({ name: "New Item" });
  };

  if (!items) return <Loading />;
  return <ItemList items={items} />;
}
```
