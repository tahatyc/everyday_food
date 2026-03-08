import { renderHook, act } from "@testing-library/react-native";
import { useQuery } from "convex/react";
import { useRecipeScaling } from "../useRecipeScaling";

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

const mockIngredients = [
  { name: "flour", amount: 2, unit: "cups", sortOrder: 0 },
  { name: "sugar", amount: 1, unit: "cup", sortOrder: 1 },
  { name: "eggs", amount: 3, unit: "pieces", sortOrder: 2 },
  { name: "salt", sortOrder: 3 },
];

describe("useRecipeScaling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns initial values matching recipe servings", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    expect(result.current.targetServings).toBe(4);
    expect(result.current.multiplier).toBe(1);
    expect(result.current.isScaled).toBe(false);
    expect(result.current.preferredUnits).toBe("imperial");
  });

  it("defaults to imperial when user has no preference", () => {
    mockUseQuery.mockReturnValue(null);
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    expect(result.current.preferredUnits).toBe("imperial");
  });

  it("uses metric when user prefers metric", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "metric" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    expect(result.current.preferredUnits).toBe("metric");
    expect(result.current.scaledIngredients[0].unit).toBe("ml");
    expect(result.current.scaledIngredients[2].unit).toBe("pieces");
  });

  it("returns scaled ingredients for same servings with imperial (no conversion)", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    expect(result.current.scaledIngredients).toHaveLength(4);
    expect(result.current.scaledIngredients[0].amount).toBe(2);
    expect(result.current.scaledIngredients[0].unit).toBe("cups");
    expect(result.current.scaledIngredients[3].amount).toBeUndefined();
  });

  it("increments and decrements servings", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    act(() => result.current.increment());
    expect(result.current.targetServings).toBe(5);
    expect(result.current.isScaled).toBe(true);
    expect(result.current.multiplier).toBe(5 / 4);

    act(() => result.current.decrement());
    expect(result.current.targetServings).toBe(4);
    expect(result.current.isScaled).toBe(false);
  });

  it("does not decrement below 1", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 1, ingredients: mockIngredients }),
    );

    act(() => result.current.decrement());
    expect(result.current.targetServings).toBe(1);
  });

  it("does not increment above 100", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    act(() => result.current.setTargetServings(100));
    act(() => result.current.increment());
    expect(result.current.targetServings).toBe(100);
  });

  it("resets to original servings", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    act(() => result.current.increment());
    act(() => result.current.increment());
    expect(result.current.targetServings).toBe(6);

    act(() => result.current.reset());
    expect(result.current.targetServings).toBe(4);
    expect(result.current.isScaled).toBe(false);
  });

  it("scales ingredient amounts when servings change", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    act(() => result.current.setTargetServings(8));

    expect(result.current.scaledIngredients[0].amount).toBe(4); // 2 cups * 2
    expect(result.current.scaledIngredients[1].amount).toBe(2); // 1 cup * 2
    expect(result.current.scaledIngredients[2].amount).toBe(6); // 3 pieces * 2
  });

  it("provides formatAmount function", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    expect(result.current.formatAmount(0.5)).toBe("1/2");
    expect(result.current.formatAmount(2)).toBe("2");
    expect(result.current.formatAmount(undefined)).toBe("");
  });

  it("preserves original amounts in scaled ingredients", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "metric" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    expect(result.current.scaledIngredients[0].originalAmount).toBe(2);
    expect(result.current.scaledIngredients[0].originalUnit).toBe("cups");
  });

  it("syncs targetServings when recipeServings prop changes", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result, rerender } = renderHook(
      ({ recipeServings }) =>
        useRecipeScaling({ recipeServings, ingredients: mockIngredients }),
      { initialProps: { recipeServings: 4 } },
    );

    expect(result.current.targetServings).toBe(4);

    // Simulate recipe loading with actual servings value
    rerender({ recipeServings: 2 });
    expect(result.current.targetServings).toBe(2);
    expect(result.current.isScaled).toBe(false);
  });

  it("handles empty ingredients list", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: [] }),
    );

    expect(result.current.scaledIngredients).toEqual([]);
  });

  it("exposes targetServings for shopping list integration", () => {
    mockUseQuery.mockReturnValue({ preferredUnits: "imperial" });
    const { result } = renderHook(() =>
      useRecipeScaling({ recipeServings: 4, ingredients: mockIngredients }),
    );

    // Default: targetServings equals recipeServings
    expect(result.current.targetServings).toBe(4);

    // After scaling: targetServings reflects the user's choice
    act(() => result.current.setTargetServings(6));
    expect(result.current.targetServings).toBe(6);
    expect(result.current.isScaled).toBe(true);

    // This targetServings value should be passed to addRecipeIngredients
    // when adding to shopping list, so the backend can scale amounts
  });
});
