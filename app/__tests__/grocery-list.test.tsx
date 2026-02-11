import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { useQuery, useMutation } from "convex/react";
import { router } from "expo-router";
import GroceryListScreen from "../grocery-list";

// Override useLocalSearchParams to be a jest.fn so we can control it per-test
let mockSearchParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  ...jest.requireActual("expo-router"),
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => mockSearchParams,
  useSegments: () => [],
  usePathname: () => "/grocery-list",
  Link: "Link",
  Redirect: "Redirect",
}));

// Mutation mocks
const mockCreateForWeek = jest.fn();
const mockSyncWithMealPlan = jest.fn();
const mockToggleItem = jest.fn();
const mockAddItem = jest.fn();
const mockClearChecked = jest.fn();

// The component calls useMutation 5 times. On re-renders, those calls repeat.
// Use mockImplementation with a stable mapping so re-renders get the same fns.
const mutationFns = [
  mockCreateForWeek,
  mockSyncWithMealPlan,
  mockToggleItem,
  mockAddItem,
  mockClearChecked,
];

beforeEach(() => {
  jest.clearAllMocks();
  mockSearchParams = {};
  // Return the correct mock fn for each positional useMutation call,
  // cycling back for re-renders (position mod 5).
  let mutationCallIndex = 0;
  (useMutation as jest.Mock).mockImplementation(() => {
    const fn = mutationFns[mutationCallIndex % mutationFns.length];
    mutationCallIndex++;
    return fn;
  });
});

// ─── HELPERS ───────────────────────────────────────────────────────

function mockWeekParams(
  weekStartDate = "2026-02-09",
  weekEndDate = "2026-02-15"
) {
  mockSearchParams = { weekStartDate, weekEndDate };
}

const sampleItems = [
  {
    _id: "item1",
    name: "Chicken Breast",
    amount: 2,
    unit: "lbs",
    aisle: "Meat",
    recipeName: "Grilled Chicken",
    isChecked: false,
  },
  {
    _id: "item2",
    name: "Olive Oil",
    amount: 2,
    unit: "tbsp",
    aisle: "Pantry",
    recipeName: "Grilled Chicken",
    isChecked: false,
  },
  {
    _id: "item3",
    name: "Tomatoes",
    amount: 4,
    unit: null,
    aisle: "Produce",
    recipeName: "Pasta Sauce",
    isChecked: true,
  },
  {
    _id: "item4",
    name: "Butter",
    amount: 1,
    unit: "cup",
    aisle: "Dairy",
    recipeName: null,
    isChecked: false,
  },
];

const sampleList = {
  _id: "list1",
  userId: "user1",
  name: "Grocery List",
  weekStartDate: "2026-02-09",
  weekEndDate: "2026-02-15",
  createdAt: Date.now(),
  updatedAt: Date.now(),
  items: sampleItems,
  groupedItems: {},
};

/**
 * Mock useQuery calls.
 * Order for week-scoped:
 *   1. getByWeek (weekList)
 *   2. getActive — skipped (returns undefined)
 *   3. detectMealPlanChanges (changeDetection)
 *
 * Order for legacy (no params):
 *   1. getByWeek — skipped (returns undefined)
 *   2. getActive (activeList)
 *   3. detectMealPlanChanges — skipped (returns undefined)
 */
function mockQueriesWeekScoped(
  weekList: any = sampleList,
  changeDetection: any = { hasChanges: false, addedRecipes: [], removedRecipes: [] }
) {
  // Stable mock that survives re-renders (unlike mockReturnValueOnce).
  // Distinguishes queries by args shape:
  //   getByWeek → { weekStartDate } | "skip"
  //   getActive → {} | "skip"
  //   detectMealPlanChanges → { listId } | "skip"
  (useQuery as jest.Mock).mockImplementation((_queryFn: any, args: any) => {
    if (args === "skip") return undefined;
    if (args && typeof args === "object" && "weekStartDate" in args) return weekList;
    if (args && typeof args === "object" && "listId" in args) return changeDetection;
    return undefined;
  });
}

function mockQueriesLegacy(activeList: any = sampleList) {
  (useQuery as jest.Mock).mockImplementation((_queryFn: any, args: any) => {
    if (args === "skip") return undefined;
    if (args && typeof args === "object" && Object.keys(args).length === 0) return activeList;
    return undefined;
  });
}

// Simpler mock approach matching the meal-plan test pattern
function mockQueriesSequential(...values: any[]) {
  const mock = useQuery as jest.Mock;
  mock.mockReturnValue(undefined); // default
  values.forEach((val) => mock.mockReturnValueOnce(val));
}

// ─── TESTS ─────────────────────────────────────────────────────────

describe("GroceryListScreen", () => {
  // ── 4.1 Route Params & Week Scoping ──────────────────────────────

  describe("Route Params & Week Scoping", () => {
    it("uses week-scoped query when weekStartDate and weekEndDate are provided", () => {
      mockWeekParams();
      // weekList query returns the list, detectChanges returns no changes
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      // Should render items from the week list
      expect(getByText("Chicken Breast")).toBeTruthy();
    });

    it("falls back to legacy getActive when no week params provided", () => {
      // No week params (default)
      // Order: getByWeek=skip, getActive=list, detect=skip
      mockQueriesSequential(undefined, sampleList, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Chicken Breast")).toBeTruthy();
    });
  });

  // ── 4.3 Auto-Create on First Visit ──────────────────────────────

  describe("Auto-Create on First Visit", () => {
    it("calls createForWeek when week list does not exist", async () => {
      mockWeekParams("2026-02-09", "2026-02-15");
      mockCreateForWeek.mockResolvedValue("newListId");
      // weekList returns null (not undefined — null means "checked and doesn't exist")
      mockQueriesSequential(null, undefined, undefined);

      render(<GroceryListScreen />);

      await waitFor(() => {
        expect(mockCreateForWeek).toHaveBeenCalledWith({
          weekStartDate: "2026-02-09",
          weekEndDate: "2026-02-15",
        });
      });
    });

    it("does not call createForWeek when week list already exists", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      render(<GroceryListScreen />);
      expect(mockCreateForWeek).not.toHaveBeenCalled();
    });

    it("shows 'Generating grocery list...' while creating", () => {
      mockWeekParams();
      // weekList = null triggers auto-create, isCreating shows loading
      mockCreateForWeek.mockReturnValue(new Promise(() => {})); // never resolves
      mockQueriesSequential(null, undefined, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Generating grocery list...")).toBeTruthy();
    });
  });

  // ── 4.2 Loading State ────────────────────────────────────────────

  describe("Loading State", () => {
    it("shows loading indicator when data is undefined", () => {
      mockWeekParams();
      mockQueriesSequential(undefined, undefined, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Loading grocery list...")).toBeTruthy();
    });
  });

  // ── 4.4 Meal Plan Change Detection Banner ────────────────────────

  describe("Change Detection Banner", () => {
    it("shows change banner when meal plan has changes", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: true,
        addedRecipes: ["recipe1"],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Your meal plan has changed.")).toBeTruthy();
      expect(getByText("UPDATE LIST")).toBeTruthy();
      expect(getByText("DISMISS")).toBeTruthy();
    });

    it("does not show change banner when no changes detected", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { queryByText } = render(<GroceryListScreen />);
      expect(queryByText("Your meal plan has changed.")).toBeNull();
    });

    it("calls syncWithMealPlan when UPDATE LIST is pressed", async () => {
      mockWeekParams();
      mockSyncWithMealPlan.mockResolvedValue({ success: true });
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: true,
        addedRecipes: ["recipe1"],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      fireEvent.press(getByText("UPDATE LIST"));

      await waitFor(() => {
        expect(mockSyncWithMealPlan).toHaveBeenCalledWith({
          listId: "list1",
        });
      });
    });

    it("hides change banner when DISMISS is pressed", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: true,
        addedRecipes: ["recipe1"],
        removedRecipes: [],
      });

      const { getByText, queryByText } = render(<GroceryListScreen />);
      expect(getByText("Your meal plan has changed.")).toBeTruthy();

      fireEvent.press(getByText("DISMISS"));
      expect(queryByText("Your meal plan has changed.")).toBeNull();
    });

    it("does not show change banner in legacy (non-week) mode", () => {
      // No week params
      mockQueriesSequential(undefined, sampleList, undefined);

      const { queryByText } = render(<GroceryListScreen />);
      expect(queryByText("Your meal plan has changed.")).toBeNull();
    });
  });

  // ── 4.5 Header with Week Range ──────────────────────────────────

  describe("Header with Week Range", () => {
    it("shows week date range in header for week-scoped lists", () => {
      mockWeekParams("2026-02-09", "2026-02-15");
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      // "GROCERY LIST — FEB 9-15"
      expect(getByText("GROCERY LIST — FEB 9-15")).toBeTruthy();
    });

    it("shows plain 'GROCERY LIST' header in legacy mode", () => {
      // No week params
      mockQueriesSequential(undefined, sampleList, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("GROCERY LIST")).toBeTruthy();
    });
  });

  // ── 4.6 View Toggle: AISLE / RECIPE ─────────────────────────────

  describe("View Toggle (Aisle / Recipe)", () => {
    it("renders AISLE and RECIPE toggle buttons", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("AISLE")).toBeTruthy();
      expect(getByText("RECIPE")).toBeTruthy();
    });

    it("defaults to AISLE view with aisle-based grouping", () => {
      mockWeekParams();
      mockQueriesWeekScoped(sampleList);

      const { getAllByText } = render(<GroceryListScreen />);
      // Category headers are uppercased — item aisle metadata may also match
      expect(getAllByText("MEAT").length).toBeGreaterThanOrEqual(1);
      expect(getAllByText("PANTRY").length).toBeGreaterThanOrEqual(1);
      expect(getAllByText("PRODUCE").length).toBeGreaterThanOrEqual(1);
      expect(getAllByText("DAIRY").length).toBeGreaterThanOrEqual(1);
    });

    it("switches to RECIPE view when RECIPE tab is pressed", () => {
      mockWeekParams();
      mockQueriesWeekScoped(sampleList);

      const { getByText } = render(<GroceryListScreen />);
      fireEvent.press(getByText("RECIPE"));

      // Should show recipe-based grouping
      expect(getByText("GRILLED CHICKEN")).toBeTruthy();
      expect(getByText("PASTA SAUCE")).toBeTruthy();
      expect(getByText("OTHER ITEMS")).toBeTruthy();
    });

    it("switches back to AISLE view when AISLE tab is pressed", () => {
      mockWeekParams();
      mockQueriesWeekScoped(sampleList);

      const { getByText, getAllByText } = render(<GroceryListScreen />);
      // Switch to recipe first
      fireEvent.press(getByText("RECIPE"));
      expect(getByText("GRILLED CHICKEN")).toBeTruthy();

      // Switch back to aisle
      fireEvent.press(getByText("AISLE"));
      expect(getAllByText("MEAT").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Item Display ─────────────────────────────────────────────────

  describe("Item Display", () => {
    it("renders grocery items with name, amount, and unit", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Chicken Breast")).toBeTruthy();
      expect(getByText("2 lbs")).toBeTruthy();
      expect(getByText("Olive Oil")).toBeTruthy();
      expect(getByText("2 tbsp")).toBeTruthy();
    });

    it("renders recipe badge for items linked to a recipe", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getAllByText } = render(<GroceryListScreen />);
      // "Grilled Chicken" appears as badge on 2 items (Chicken Breast + Olive Oil)
      expect(getAllByText("Grilled Chicken").length).toBe(2);
      expect(getAllByText("Pasta Sauce").length).toBe(1);
    });

    it("shows checked item count and unchecked count on checkout button", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      // 1 checked (Tomatoes), 3 unchecked
      expect(getByText("3 Items remaining")).toBeTruthy();
    });
  });

  // ── Toggle Item ──────────────────────────────────────────────────

  describe("Toggle Item", () => {
    it("calls toggleItem mutation when an item is pressed", async () => {
      mockWeekParams();
      mockToggleItem.mockResolvedValue({ isChecked: true });
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      fireEvent.press(getByText("Chicken Breast"));

      await waitFor(() => {
        expect(mockToggleItem).toHaveBeenCalledWith({ itemId: "item1" });
      });
    });
  });

  // ── 4.7 Add Manual Item ──────────────────────────────────────────

  describe("Add Manual Item", () => {
    it("renders the add item input", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByPlaceholderText } = render(<GroceryListScreen />);
      expect(getByPlaceholderText("Add an item...")).toBeTruthy();
    });

    it("calls addItem mutation with item name and listId on submit", async () => {
      mockWeekParams();
      mockAddItem.mockResolvedValue("newItemId");
      mockQueriesWeekScoped(sampleList);

      const { getByPlaceholderText, getByTestId } = render(
        <GroceryListScreen />
      );
      const input = getByPlaceholderText("Add an item...");

      fireEvent.changeText(input, "Bananas");
      fireEvent.press(getByTestId("icon-add-circle"));

      await waitFor(() => {
        expect(mockAddItem).toHaveBeenCalledWith({
          name: "Bananas",
          listId: "list1",
        });
      });
    });

    it("does not call addItem for empty input", () => {
      mockWeekParams();
      mockQueriesWeekScoped(sampleList);

      const { getByPlaceholderText, getByTestId } = render(
        <GroceryListScreen />
      );
      const input = getByPlaceholderText("Add an item...");

      fireEvent.changeText(input, "   ");
      fireEvent.press(getByTestId("icon-add-circle"));

      expect(mockAddItem).not.toHaveBeenCalled();
    });

    it("clears input after successful add", async () => {
      mockWeekParams();
      mockAddItem.mockResolvedValue("newItemId");
      mockQueriesWeekScoped(sampleList);

      const { getByPlaceholderText, getByTestId } = render(
        <GroceryListScreen />
      );
      const input = getByPlaceholderText("Add an item...");

      fireEvent.changeText(input, "Bananas");
      fireEvent.press(getByTestId("icon-add-circle"));

      await waitFor(() => {
        expect(input.props.value).toBe("");
      });
    });

    it("shows add item input even on empty list state", () => {
      mockWeekParams();
      const emptyList = { ...sampleList, items: [] };
      mockQueriesSequential(emptyList, undefined, undefined);

      const { getByPlaceholderText } = render(<GroceryListScreen />);
      expect(getByPlaceholderText("Add an item...")).toBeTruthy();
    });
  });

  // ── 4.8 Clear Checked ────────────────────────────────────────────

  describe("Clear Checked Items", () => {
    it("calls clearChecked mutation when trash icon is pressed", async () => {
      mockWeekParams();
      mockClearChecked.mockResolvedValue({ success: true, removed: 1 });
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByTestId } = render(<GroceryListScreen />);
      // The trash icon button in the header
      fireEvent.press(getByTestId("icon-trash-outline"));

      await waitFor(() => {
        expect(mockClearChecked).toHaveBeenCalledWith({ listId: "list1" });
      });
    });
  });

  // ── Empty State ──────────────────────────────────────────────────

  describe("Empty State", () => {
    it("shows empty state when list has no items", () => {
      mockWeekParams();
      const emptyList = { ...sampleList, items: [] };
      mockQueriesSequential(emptyList, undefined, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Your list is empty")).toBeTruthy();
    });

    it("shows week-scoped empty message when week params present", () => {
      mockWeekParams();
      const emptyList = { ...sampleList, items: [] };
      mockQueriesSequential(emptyList, undefined, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(
        getByText(
          "Add meals to your plan, then come back to generate your list"
        )
      ).toBeTruthy();
    });

    it("shows legacy empty message when no week params", () => {
      // No week params
      const emptyList = { ...sampleList, items: [] };
      mockQueriesSequential(undefined, emptyList, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(
        getByText("Add ingredients from recipes to get started")
      ).toBeTruthy();
    });

    it("shows empty state when list is null (no list created at all)", () => {
      // Legacy mode, no active list
      mockQueriesSequential(undefined, null, undefined);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Your list is empty")).toBeTruthy();
    });
  });

  // ── Navigation ───────────────────────────────────────────────────

  describe("Navigation", () => {
    it("navigates back when back button is pressed", () => {
      mockWeekParams();
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByTestId } = render(<GroceryListScreen />);
      fireEvent.press(getByTestId("icon-arrow-back"));
      expect(router.back).toHaveBeenCalled();
    });
  });

  // ── Edge Cases from Design Plan ──────────────────────────────────

  describe("Edge Cases", () => {
    it("handles list with only manual items (no recipeName)", () => {
      mockWeekParams();
      const manualOnlyList = {
        ...sampleList,
        items: [
          {
            _id: "m1",
            name: "Salt",
            amount: null,
            unit: null,
            aisle: "Pantry",
            recipeName: null,
            isChecked: false,
          },
          {
            _id: "m2",
            name: "Paper Towels",
            amount: null,
            unit: null,
            aisle: null,
            recipeName: null,
            isChecked: false,
          },
        ],
      };
      // Use stable mock so re-renders from view toggle still return data
      mockQueriesWeekScoped(manualOnlyList);

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("Salt")).toBeTruthy();
      expect(getByText("Paper Towels")).toBeTruthy();

      // In recipe view, manual items go to "Other Items"
      fireEvent.press(getByText("RECIPE"));
      expect(getByText("OTHER ITEMS")).toBeTruthy();
    });

    it("handles items without aisle — grouped under 'Other'", () => {
      mockWeekParams();
      const noAisleList = {
        ...sampleList,
        items: [
          {
            _id: "x1",
            name: "Mystery Ingredient",
            amount: 1,
            unit: "piece",
            aisle: null,
            recipeName: "Recipe A",
            isChecked: false,
          },
        ],
      };
      mockQueriesSequential(noAisleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      // Aisle grouping puts null aisle under "Other"
      expect(getByText("OTHER")).toBeTruthy();
      expect(getByText("Mystery Ingredient")).toBeTruthy();
    });

    it("shows checkout button with correct remaining count", () => {
      mockWeekParams();
      // 3 unchecked, 1 checked
      mockQueriesSequential(sampleList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("CHECKOUT / ORDER LIST")).toBeTruthy();
      expect(getByText("3 Items remaining")).toBeTruthy();
      expect(getByText("3")).toBeTruthy(); // Badge number
    });

    it("handles all items checked — shows 0 remaining", () => {
      mockWeekParams();
      const allCheckedList = {
        ...sampleList,
        items: sampleItems.map((item) => ({ ...item, isChecked: true })),
      };
      mockQueriesSequential(allCheckedList, undefined, {
        hasChanges: false,
        addedRecipes: [],
        removedRecipes: [],
      });

      const { getByText } = render(<GroceryListScreen />);
      expect(getByText("0 Items remaining")).toBeTruthy();
    });
  });
});
