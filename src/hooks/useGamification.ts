import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Convenience hook for accessing gamification data.
 * Wraps gamification queries with loading states.
 */
export function useGamification() {
  const profile = useQuery(api.gamification.getProfile);
  const stats = useQuery(api.gamification.getStats);

  return {
    profile,
    stats,
    isLoading: profile === undefined,
  };
}

/**
 * Hook for achievements data.
 */
export function useAchievements(category?: string) {
  const achievements = useQuery(api.gamification.getAchievements, {
    category,
  });

  return {
    achievements: achievements || [],
    isLoading: achievements === undefined,
  };
}

/**
 * Hook for leaderboard data.
 */
export function useLeaderboard(type: "friends" | "global", limit?: number) {
  const leaderboard = useQuery(api.gamification.getLeaderboard, {
    type,
    limit,
  });

  return {
    leaderboard: leaderboard || [],
    isLoading: leaderboard === undefined,
  };
}

/**
 * Hook for activity feed.
 */
export function useActivityFeed(limit?: number) {
  const activities = useQuery(api.gamification.getActivityFeed, { limit });

  return {
    activities: activities || [],
    isLoading: activities === undefined,
  };
}
