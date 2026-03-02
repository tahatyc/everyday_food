import { useQuery } from "convex/react";
import {
  useGamification,
  useAchievements,
  useLeaderboard,
  useActivityFeed,
} from "../useGamification";

// Mock convex/react (already mocked in jest.setup.js)
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

// Helper to call hooks outside React (since these are just wrappers around useQuery)
// We test the return shapes by calling the hooks directly — useQuery is already mocked.

describe("useGamification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns isLoading true when profile is undefined", () => {
    mockUseQuery.mockReturnValue(undefined);
    const result = useGamification();
    expect(result.isLoading).toBe(true);
    expect(result.profile).toBeUndefined();
  });

  it("returns isLoading false when profile is loaded", () => {
    mockUseQuery
      .mockReturnValueOnce({ xp: 100, level: 2 }) // profile
      .mockReturnValueOnce({ totalCooks: 5 }); // stats
    const result = useGamification();
    expect(result.isLoading).toBe(false);
    expect(result.profile).toEqual({ xp: 100, level: 2 });
    expect(result.stats).toEqual({ totalCooks: 5 });
  });

  it("calls useQuery twice (profile and stats)", () => {
    mockUseQuery.mockReturnValue(undefined);
    useGamification();
    expect(mockUseQuery).toHaveBeenCalledTimes(2);
  });
});

describe("useAchievements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    const result = useAchievements();
    expect(result.achievements).toEqual([]);
    expect(result.isLoading).toBe(true);
  });

  it("returns achievements when loaded", () => {
    const mockAchievements = [{ key: "first_flame", name: "First Flame" }];
    mockUseQuery.mockReturnValue(mockAchievements);
    const result = useAchievements();
    expect(result.achievements).toEqual(mockAchievements);
    expect(result.isLoading).toBe(false);
  });

  it("passes category parameter to useQuery", () => {
    mockUseQuery.mockReturnValue([]);
    useAchievements("cooking");
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      { category: "cooking" }
    );
  });
});

describe("useLeaderboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    const result = useLeaderboard("friends");
    expect(result.leaderboard).toEqual([]);
    expect(result.isLoading).toBe(true);
  });

  it("returns leaderboard when loaded", () => {
    const mockLeaderboard = [{ userId: "1", name: "Test", xp: 100 }];
    mockUseQuery.mockReturnValue(mockLeaderboard);
    const result = useLeaderboard("global", 10);
    expect(result.leaderboard).toEqual(mockLeaderboard);
    expect(result.isLoading).toBe(false);
  });

  it("passes type and limit to useQuery", () => {
    mockUseQuery.mockReturnValue([]);
    useLeaderboard("friends", 20);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      { type: "friends", limit: 20 }
    );
  });
});

describe("useActivityFeed", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns empty array when loading", () => {
    mockUseQuery.mockReturnValue(undefined);
    const result = useActivityFeed();
    expect(result.activities).toEqual([]);
    expect(result.isLoading).toBe(true);
  });

  it("returns activities when loaded", () => {
    const mockActivities = [{ action: "cook_complete", xpEarned: 50 }];
    mockUseQuery.mockReturnValue(mockActivities);
    const result = useActivityFeed(5);
    expect(result.activities).toEqual(mockActivities);
    expect(result.isLoading).toBe(false);
  });

  it("passes limit to useQuery", () => {
    mockUseQuery.mockReturnValue([]);
    useActivityFeed(15);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      { limit: 15 }
    );
  });
});
