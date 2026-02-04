import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

const CustomPassword = Password({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
    };
  },
});

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [CustomPassword],
  callbacks: {
    async createOrUpdateUser(ctx, args) {
      if (args.existingUserId) {
        // Update existing user
        await ctx.db.patch(args.existingUserId, {
          updatedAt: Date.now(),
        });
        return args.existingUserId;
      }
      // Create new user with required fields
      const now = Date.now();
      return await ctx.db.insert("users", {
        email: args.profile.email,
        name: args.profile.name,
        imageUrl: args.profile.image,
        tokenIdentifier: `${args.provider.id}|${args.profile.email}`,
        createdAt: now,
        updatedAt: now,
        preferredUnits: "imperial",
        defaultServings: 4,
      });
    },
  },
});
