import { useGamificationStore } from "../gamificationStore";
import { act } from "@testing-library/react-native";

describe("gamificationStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    act(() => {
      useGamificationStore.getState().dismiss();
    });
  });

  describe("initial state", () => {
    it("has null pendingXPToast", () => {
      expect(useGamificationStore.getState().pendingXPToast).toBeNull();
    });

    it("has empty pendingAchievements", () => {
      expect(useGamificationStore.getState().pendingAchievements).toEqual([]);
    });

    it("has null pendingLevelUp", () => {
      expect(useGamificationStore.getState().pendingLevelUp).toBeNull();
    });
  });

  describe("showXPToast", () => {
    it("sets pendingXPToast with amount and action", () => {
      act(() => {
        useGamificationStore.getState().showXPToast(50, "cook_complete");
      });
      const state = useGamificationStore.getState();
      expect(state.pendingXPToast).toEqual({
        amount: 50,
        action: "cook_complete",
      });
    });

    it("overwrites previous toast", () => {
      act(() => {
        useGamificationStore.getState().showXPToast(50, "cook_complete");
        useGamificationStore.getState().showXPToast(30, "recipe_create");
      });
      expect(useGamificationStore.getState().pendingXPToast).toEqual({
        amount: 30,
        action: "recipe_create",
      });
    });
  });

  describe("showAchievement", () => {
    it("appends achievement to pendingAchievements", () => {
      act(() => {
        useGamificationStore.getState().showAchievement("first_flame");
      });
      expect(useGamificationStore.getState().pendingAchievements).toEqual([
        "first_flame",
      ]);
    });

    it("accumulates multiple achievements", () => {
      act(() => {
        useGamificationStore.getState().showAchievement("first_flame");
        useGamificationStore.getState().showAchievement("five_star_cook");
      });
      expect(useGamificationStore.getState().pendingAchievements).toEqual([
        "first_flame",
        "five_star_cook",
      ]);
    });
  });

  describe("showLevelUp", () => {
    it("sets pendingLevelUp with level and title", () => {
      act(() => {
        useGamificationStore.getState().showLevelUp(5, "Station Chef");
      });
      expect(useGamificationStore.getState().pendingLevelUp).toEqual({
        level: 5,
        title: "Station Chef",
      });
    });
  });

  describe("dismiss", () => {
    it("clears all pending state at once", () => {
      act(() => {
        useGamificationStore.getState().showXPToast(50, "cook_complete");
        useGamificationStore.getState().showAchievement("first_flame");
        useGamificationStore.getState().showLevelUp(2, "Kitchen Helper");
      });

      // Verify state is set
      const before = useGamificationStore.getState();
      expect(before.pendingXPToast).not.toBeNull();
      expect(before.pendingAchievements).toHaveLength(1);
      expect(before.pendingLevelUp).not.toBeNull();

      // Dismiss
      act(() => {
        useGamificationStore.getState().dismiss();
      });

      const after = useGamificationStore.getState();
      expect(after.pendingXPToast).toBeNull();
      expect(after.pendingAchievements).toEqual([]);
      expect(after.pendingLevelUp).toBeNull();
    });
  });
});
