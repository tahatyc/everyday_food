import React from "react";
import { render } from "@testing-library/react-native";
import { XPToast } from "../XPToast";

// Mock the store module to control what the component sees
const mockDismiss = jest.fn();
let mockPendingXPToast: { amount: number; action: string } | null = null;

jest.mock("../../../stores/gamificationStore", () => ({
  useGamificationStore: () => ({
    pendingXPToast: mockPendingXPToast,
    dismiss: mockDismiss,
  }),
}));

describe("XPToast", () => {
  beforeEach(() => {
    mockPendingXPToast = null;
    mockDismiss.mockClear();
  });

  it("renders null when no pending toast", () => {
    const { toJSON } = render(<XPToast />);
    expect(toJSON()).toBeNull();
  });

  it("renders non-null when toast is pending", () => {
    mockPendingXPToast = { amount: 50, action: "cook_complete" };
    const { toJSON } = render(<XPToast />);
    expect(toJSON()).not.toBeNull();
  });

  it("includes XP amount in rendered output", () => {
    mockPendingXPToast = { amount: 50, action: "cook_complete" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    // Text is rendered as separate children: ["+", "50", " XP"]
    expect(tree).toContain("50");
    expect(tree).toContain("XP");
  });

  it("renders action label for cook_complete", () => {
    mockPendingXPToast = { amount: 50, action: "cook_complete" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Recipe Cooked!");
  });

  it("renders action label for meal_plan_add", () => {
    mockPendingXPToast = { amount: 10, action: "meal_plan_add" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("10");
    expect(tree).toContain("Meal Planned!");
  });

  it("renders action label for recipe_create", () => {
    mockPendingXPToast = { amount: 30, action: "recipe_create" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Recipe Created!");
  });

  it("renders action label for recipe_share", () => {
    mockPendingXPToast = { amount: 15, action: "recipe_share" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Recipe Shared!");
  });

  it("renders action label for friend_added", () => {
    mockPendingXPToast = { amount: 10, action: "friend_added" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("New Friend!");
  });

  it("renders action label for shopping_list_complete", () => {
    mockPendingXPToast = { amount: 20, action: "shopping_list_complete" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Shopping Done!");
  });

  it("renders fallback label for unknown action", () => {
    mockPendingXPToast = { amount: 10, action: "unknown_action" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Action Complete!");
  });

  it("renders action label for daily_login", () => {
    mockPendingXPToast = { amount: 5, action: "daily_login" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Welcome Back!");
  });

  it("renders action label for recipe_favorite", () => {
    mockPendingXPToast = { amount: 5, action: "recipe_favorite" };
    const { toJSON } = render(<XPToast />);
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain("Favorited!");
  });
});
