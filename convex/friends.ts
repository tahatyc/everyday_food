import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserId, getCurrentUserIdOrNull } from "./lib/accessControl";

// Get accepted friends for current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "accepted")
      )
      .collect();

    // Get friend details
    const friends = await Promise.all(
      friendships.map(async (f) => {
        const friend = await ctx.db.get(f.friendId);
        if (!friend) return null;
        return {
          friendshipId: f._id,
          friendId: friend._id,
          name: friend.name || "Unknown",
          email: friend.email,
          imageUrl: friend.imageUrl,
          since: f.updatedAt,
        };
      })
    );

    return friends.filter((f): f is NonNullable<typeof f> => f !== null);
  },
});

// Get pending friend requests (incoming and outgoing)
export const getPending = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return { incoming: [], outgoing: [] };

    const pendingFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_status", (q) =>
        q.eq("userId", userId).eq("status", "pending")
      )
      .collect();

    // Separate incoming vs outgoing
    const incoming: Array<{
      friendshipId: typeof pendingFriendships[0]["_id"];
      userId: typeof pendingFriendships[0]["friendId"];
      name: string;
      email?: string;
      imageUrl?: string;
      requestedAt: number;
    }> = [];

    const outgoing: Array<{
      friendshipId: typeof pendingFriendships[0]["_id"];
      userId: typeof pendingFriendships[0]["friendId"];
      name: string;
      email?: string;
      imageUrl?: string;
      requestedAt: number;
    }> = [];

    for (const f of pendingFriendships) {
      const otherUser = await ctx.db.get(f.friendId);
      if (!otherUser) continue;

      const entry = {
        friendshipId: f._id,
        userId: otherUser._id,
        name: otherUser.name || "Unknown",
        email: otherUser.email,
        imageUrl: otherUser.imageUrl,
        requestedAt: f.createdAt,
      };

      // If current user sent the request, it's outgoing
      if (f.requestedBy === userId) {
        outgoing.push(entry);
      } else {
        incoming.push(entry);
      }
    }

    return { incoming, outgoing };
  },
});

// Search users by name or email (exclude self and existing friends)
export const searchUsers = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return [];

    if (args.query.length < 2) return [];

    // Get all users (in a real app, you'd use a search index)
    const allUsers = await ctx.db.query("users").collect();

    // Get existing friendships
    const existingFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const existingFriendIds = new Set(existingFriendships.map((f) => f.friendId));

    // Filter users
    const searchLower = args.query.toLowerCase();
    const results = allUsers
      .filter((user) => {
        // Exclude self
        if (user._id === userId) return false;
        // Exclude existing friends/pending
        if (existingFriendIds.has(user._id)) return false;
        // Match by name or email
        const nameMatch = user.name?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        return nameMatch || emailMatch;
      })
      .slice(0, 10) // Limit results
      .map((user) => ({
        userId: user._id,
        name: user.name || "Unknown",
        email: user.email,
        imageUrl: user.imageUrl,
      }));

    return results;
  },
});

// Get friend stats
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getCurrentUserIdOrNull(ctx);
    if (!userId) return { friends: 0, pendingIncoming: 0, pendingOutgoing: 0 };

    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const friends = friendships.filter((f) => f.status === "accepted").length;
    const pendingIncoming = friendships.filter(
      (f) => f.status === "pending" && f.requestedBy !== userId
    ).length;
    const pendingOutgoing = friendships.filter(
      (f) => f.status === "pending" && f.requestedBy === userId
    ).length;

    return { friends, pendingIncoming, pendingOutgoing };
  },
});

// Send a friend request
export const sendRequest = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Can't friend yourself
    if (userId === args.friendId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friend exists
    const friend = await ctx.db.get(args.friendId);
    if (!friend) {
      throw new Error("User not found");
    }

    // Check if friendship already exists
    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("Already friends");
      } else if (existing.status === "pending") {
        throw new Error("Friend request already pending");
      } else if (existing.status === "blocked") {
        throw new Error("Cannot send request to this user");
      }
    }

    const now = Date.now();

    // Create friendship record for current user
    await ctx.db.insert("friendships", {
      userId: userId,
      friendId: args.friendId,
      status: "pending",
      requestedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Create reciprocal record for friend
    await ctx.db.insert("friendships", {
      userId: args.friendId,
      friendId: userId,
      status: "pending",
      requestedBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

// Accept a friend request
export const acceptRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    // Verify this is our friendship record
    if (friendship.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Verify it's pending and we didn't send it
    if (friendship.status !== "pending") {
      throw new Error("Request is not pending");
    }
    if (friendship.requestedBy === userId) {
      throw new Error("Cannot accept your own request");
    }

    const now = Date.now();

    // Update our record
    await ctx.db.patch(args.friendshipId, {
      status: "accepted",
      updatedAt: now,
    });

    // Update reciprocal record
    const reciprocal = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", friendship.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocal) {
      await ctx.db.patch(reciprocal._id, {
        status: "accepted",
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Reject a friend request
export const rejectRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    // Verify this is our friendship record
    if (friendship.userId !== userId) {
      throw new Error("Not authorized");
    }

    // Delete both records
    await ctx.db.delete(args.friendshipId);

    const reciprocal = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", friendship.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocal) {
      await ctx.db.delete(reciprocal._id);
    }

    return { success: true };
  },
});

// Cancel an outgoing friend request
export const cancelRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    // Verify this is our friendship record and we sent it
    if (friendship.userId !== userId || friendship.requestedBy !== userId) {
      throw new Error("Not authorized");
    }

    // Delete both records
    await ctx.db.delete(args.friendshipId);

    const reciprocal = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", friendship.friendId).eq("friendId", userId)
      )
      .first();

    if (reciprocal) {
      await ctx.db.delete(reciprocal._id);
    }

    return { success: true };
  },
});

// Remove a friend
export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getCurrentUserId(ctx);

    // Delete our record
    const ourRecord = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", userId).eq("friendId", args.friendId)
      )
      .first();

    if (ourRecord) {
      await ctx.db.delete(ourRecord._id);
    }

    // Delete their record
    const theirRecord = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", args.friendId).eq("friendId", userId)
      )
      .first();

    if (theirRecord) {
      await ctx.db.delete(theirRecord._id);
    }

    // Also remove any recipe shares between us
    const ourShares = await ctx.db
      .query("recipeShares")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .collect();

    for (const share of ourShares) {
      if (share.sharedWithId === args.friendId) {
        await ctx.db.delete(share._id);
      }
    }

    const theirShares = await ctx.db
      .query("recipeShares")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.friendId))
      .collect();

    for (const share of theirShares) {
      if (share.sharedWithId === userId) {
        await ctx.db.delete(share._id);
      }
    }

    return { success: true };
  },
});

// Block a user
export const blockUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUserId = await getCurrentUserId(ctx);

    // Can't block yourself
    if (currentUserId === args.userId) {
      throw new Error("Cannot block yourself");
    }

    const now = Date.now();

    // Check if friendship exists
    const existing = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", currentUserId).eq("friendId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: "blocked",
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("friendships", {
        userId: currentUserId,
        friendId: args.userId,
        status: "blocked",
        requestedBy: currentUserId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Remove their record if exists
    const theirRecord = await ctx.db
      .query("friendships")
      .withIndex("by_user_and_friend", (q) =>
        q.eq("userId", args.userId).eq("friendId", currentUserId)
      )
      .first();

    if (theirRecord) {
      await ctx.db.delete(theirRecord._id);
    }

    // Remove any shares between us
    const allShares = await ctx.db.query("recipeShares").collect();
    for (const share of allShares) {
      if (
        (share.ownerId === currentUserId && share.sharedWithId === args.userId) ||
        (share.ownerId === args.userId && share.sharedWithId === currentUserId)
      ) {
        await ctx.db.delete(share._id);
      }
    }

    return { success: true };
  },
});
