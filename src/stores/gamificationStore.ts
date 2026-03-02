import { create } from "zustand";

interface GamificationStore {
  pendingXPToast: { amount: number; action: string } | null;
  pendingAchievements: string[];
  pendingLevelUp: { level: number; title: string } | null;
  showXPToast: (amount: number, action: string) => void;
  showAchievement: (key: string) => void;
  showLevelUp: (level: number, title: string) => void;
  dismiss: () => void;
}

export const useGamificationStore = create<GamificationStore>((set) => ({
  pendingXPToast: null,
  pendingAchievements: [],
  pendingLevelUp: null,

  showXPToast: (amount, action) =>
    set({ pendingXPToast: { amount, action } }),

  showAchievement: (key) =>
    set((state) => ({
      pendingAchievements: [...state.pendingAchievements, key],
    })),

  showLevelUp: (level, title) =>
    set({ pendingLevelUp: { level, title } }),

  dismiss: () =>
    set({
      pendingXPToast: null,
      pendingAchievements: [],
      pendingLevelUp: null,
    }),
}));
