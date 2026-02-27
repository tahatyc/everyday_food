import { RateLimiter, HOUR, DAY } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // Auth — strict fixed windows
  registration: { kind: "fixed window", rate: 5, period: HOUR },

  // Content creation — token bucket for burst-friendliness
  createRecipe: { kind: "token bucket", rate: 30, period: DAY, capacity: 5 },
  importRecipe: { kind: "fixed window", rate: 10, period: HOUR },

  // Social — prevent spam
  sendFriendRequest: {
    kind: "token bucket",
    rate: 20,
    period: DAY,
    capacity: 3,
  },
  shareRecipe: { kind: "token bucket", rate: 30, period: HOUR },
});
