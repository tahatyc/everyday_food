import { useEffect, useReducer, useCallback } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useToast } from "@/src/hooks/useToast";
import { parseMutationError } from "@/src/lib/errors";
import { router } from "expo-router";
import type { BasicInfo, Extras, Nutrition, Ingredient, Step, Difficulty, } from "./types";

interface FormState {
  currentStep: number;
  isSaving: boolean;
  basicInfo: BasicInfo;
  ingredients: Ingredient[];
  steps: Step[];
  extras: Extras;
  nutrition: Nutrition;
  unitPickerVisible: boolean;
  activeUnitIngredientId: string | null;
}

type FormAction =
  | { type: "SET_CURRENT_STEP"; step: number }
  | { type: "SET_SAVING"; isSaving: boolean }
  | { type: "SET_BASIC_INFO"; field: keyof BasicInfo; value: string | Difficulty }
  | { type: "SET_INGREDIENTS"; ingredients: Ingredient[] }
  | { type: "SET_STEPS"; steps: Step[] }
  | { type: "SET_EXTRAS"; field: keyof Extras; value: string }
  | { type: "SET_NUTRITION"; field: keyof Nutrition; value: string }
  | { type: "OPEN_UNIT_PICKER"; ingredientId: string }
  | { type: "CLOSE_UNIT_PICKER" }
  | { type: "PREFILL"; state: Partial<FormState> };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: action.step };
    case "SET_SAVING":
      return { ...state, isSaving: action.isSaving };
    case "SET_BASIC_INFO":
      return { ...state, basicInfo: { ...state.basicInfo, [action.field]: action.value } };
    case "SET_INGREDIENTS":
      return { ...state, ingredients: action.ingredients };
    case "SET_STEPS":
      return { ...state, steps: action.steps };
    case "SET_EXTRAS":
      return { ...state, extras: { ...state.extras, [action.field]: action.value } };
    case "SET_NUTRITION":
      return { ...state, nutrition: { ...state.nutrition, [action.field]: action.value } };
    case "OPEN_UNIT_PICKER":
      return { ...state, unitPickerVisible: true, activeUnitIngredientId: action.ingredientId };
    case "CLOSE_UNIT_PICKER":
      return { ...state, unitPickerVisible: false, activeUnitIngredientId: null };
    case "PREFILL":
      return { ...state, ...action.state };
    default:
      return state;
  }
}

const initialState: FormState = {
  currentStep: 1,
  isSaving: false,
  basicInfo: { title: "", servings: "4", prepTime: "", cookTime: "", difficulty: null },
  ingredients: [{ id: "1", name: "", amount: "", unit: "g" }],
  steps: [{ id: "1", instruction: "", tip: "" }],
  extras: { description: "", cuisine: "" },
  nutrition: { calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", sodium: "" },
  unitPickerVisible: false,
  activeUnitIngredientId: null,
};

export function useRecipeForm(recipeId?: string) {
  const isEditMode = !!recipeId;
  const [state, dispatch] = useReducer(formReducer, initialState);

  const currentUser = useQuery(api.users.current);
  const preferredUnits = currentUser?.preferredUnits ?? null;
  const defaultUnit = preferredUnits === "imperial" ? "oz" : "g";

  const createRecipe = useMutation(api.recipes.createManual);
  const updateRecipe = useMutation(api.recipes.updateManual);
  const { showSuccess, showError } = useToast();

  const existingRecipe = useQuery(
    api.recipes.getById,
    recipeId ? { id: recipeId as Id<"recipes"> } : "skip"
  );

  // Sync unit of untouched ingredient rows when user preference loads
  useEffect(() => {
    if (isEditMode || !preferredUnits) return;
    const unit = preferredUnits === "imperial" ? "oz" : "g";
    dispatch({
      type: "SET_INGREDIENTS",
      ingredients: state.ingredients.map((ing) =>
        ing.name === "" ? { ...ing, unit } : ing
      ),
    });
  }, [preferredUnits, isEditMode]);

  // Pre-fill form when editing an existing recipe
  useEffect(() => {
    if (!existingRecipe || !isEditMode) return;

    const n = (existingRecipe as any).nutritionPerServing;
    dispatch({
      type: "PREFILL",
      state: {
        basicInfo: {
          title: existingRecipe.title,
          servings: String(existingRecipe.servings),
          prepTime: existingRecipe.prepTime ? String(existingRecipe.prepTime) : "",
          cookTime: existingRecipe.cookTime ? String(existingRecipe.cookTime) : "",
          difficulty: (existingRecipe.difficulty as Difficulty) || null,
        },
        extras: {
          description: existingRecipe.description || "",
          cuisine: existingRecipe.cuisine || "",
        },
        nutrition: n
          ? {
              calories: String(n.calories),
              protein: String(n.protein),
              carbs: String(n.carbs),
              fat: String(n.fat),
              fiber: n.fiber != null ? String(n.fiber) : "",
              sugar: n.sugar != null ? String(n.sugar) : "",
              sodium: n.sodium != null ? String(n.sodium) : "",
            }
          : initialState.nutrition,
        ingredients:
          existingRecipe.ingredients.length > 0
            ? existingRecipe.ingredients.map((ing, i) => ({
                id: String(i),
                name: ing.name,
                amount: ing.amount ? String(ing.amount) : "",
                unit: ing.unit || "g",
              }))
            : initialState.ingredients,
        steps:
          existingRecipe.steps.length > 0
            ? existingRecipe.steps.map((step, i) => ({
                id: String(i),
                instruction: step.instruction,
                tip: (step as any).tips || "",
              }))
            : initialState.steps,
      },
    });
  }, [existingRecipe]);

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          if (!state.basicInfo.title.trim()) {
            Alert.alert("Required", "Please enter a recipe title");
            return false;
          }
          if (!state.basicInfo.servings || parseInt(state.basicInfo.servings) <= 0) {
            Alert.alert("Required", "Please enter valid servings");
            return false;
          }
          return true;
        case 2: {
          const validIngredients = state.ingredients.filter((i) => i.name.trim());
          if (validIngredients.length === 0) {
            Alert.alert("Required", "Please add at least one ingredient");
            return false;
          }
          return true;
        }
        case 3: {
          const validSteps = state.steps.filter((s) => s.instruction.trim());
          if (validSteps.length === 0) {
            Alert.alert("Required", "Please add at least one step");
            return false;
          }
          return true;
        }
        default:
          return true;
      }
    },
    [state.basicInfo, state.ingredients, state.steps]
  );

  const handleNext = useCallback(() => {
    if (validateStep(state.currentStep)) {
      dispatch({ type: "SET_CURRENT_STEP", step: state.currentStep + 1 });
    }
  }, [state.currentStep, validateStep]);

  const handleBack = useCallback(() => {
    if (state.currentStep > 1) {
      dispatch({ type: "SET_CURRENT_STEP", step: state.currentStep - 1 });
    } else {
      router.back();
    }
  }, [state.currentStep]);

  const handleSave = useCallback(async () => {
    if (!validateStep(state.currentStep)) return;

    dispatch({ type: "SET_SAVING", isSaving: true });
    try {
      const { basicInfo, extras, nutrition } = state;
      const validIngredients = state.ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: i.amount ? parseFloat(i.amount) : undefined,
          unit: i.unit || undefined,
        }));

      const validSteps = state.steps
        .filter((s) => s.instruction.trim())
        .map((s) => ({
          instruction: s.instruction.trim(),
          tips: s.tip.trim() || undefined,
        }));

      const nutritionPerServing =
        nutrition.calories && nutrition.protein && nutrition.carbs && nutrition.fat
          ? {
              calories: parseFloat(nutrition.calories),
              protein: parseFloat(nutrition.protein),
              carbs: parseFloat(nutrition.carbs),
              fat: parseFloat(nutrition.fat),
              fiber: nutrition.fiber ? parseFloat(nutrition.fiber) : undefined,
              sugar: nutrition.sugar ? parseFloat(nutrition.sugar) : undefined,
              sodium: nutrition.sodium ? parseFloat(nutrition.sodium) : undefined,
            }
          : undefined;

      const recipeData = {
        title: basicInfo.title.trim(),
        servings: parseInt(basicInfo.servings),
        prepTime: basicInfo.prepTime ? parseInt(basicInfo.prepTime) : undefined,
        cookTime: basicInfo.cookTime ? parseInt(basicInfo.cookTime) : undefined,
        difficulty: basicInfo.difficulty || undefined,
        description: extras.description.trim() || undefined,
        cuisine: extras.cuisine.trim() || undefined,
        nutritionPerServing,
        ingredients: validIngredients,
        steps: validSteps,
      };

      if (isEditMode && recipeId) {
        await updateRecipe({ recipeId: recipeId as Id<"recipes">, ...recipeData });
        showSuccess("Recipe updated!");
        router.back();
      } else {
        const result = await createRecipe({ ...recipeData, isPublic: false });
        showSuccess("Recipe created!");
        router.replace(`/recipe/${result.recipeId}`);
      }
    } catch (error) {
      showError(parseMutationError(error, "Failed to save recipe. Please try again."));
    } finally {
      dispatch({ type: "SET_SAVING", isSaving: false });
    }
  }, [state, isEditMode, recipeId, validateStep, createRecipe, updateRecipe, showSuccess, showError]);

  // Ingredient actions
  const addIngredient = useCallback(() => {
    dispatch({
      type: "SET_INGREDIENTS",
      ingredients: [
        ...state.ingredients,
        { id: Date.now().toString(), name: "", amount: "", unit: defaultUnit },
      ],
    });
  }, [state.ingredients, defaultUnit]);

  const removeIngredient = useCallback(
    (id: string) => {
      if (state.ingredients.length > 1) {
        dispatch({
          type: "SET_INGREDIENTS",
          ingredients: state.ingredients.filter((i) => i.id !== id),
        });
      }
    },
    [state.ingredients]
  );

  const updateIngredient = useCallback(
    (id: string, field: keyof Ingredient, value: string) => {
      dispatch({
        type: "SET_INGREDIENTS",
        ingredients: state.ingredients.map((i) =>
          i.id === id ? { ...i, [field]: value } : i
        ),
      });
    },
    [state.ingredients]
  );

  const openUnitPicker = useCallback((ingredientId: string) => {
    dispatch({ type: "OPEN_UNIT_PICKER", ingredientId });
  }, []);

  const selectUnit = useCallback(
    (unit: string) => {
      if (state.activeUnitIngredientId) {
        dispatch({
          type: "SET_INGREDIENTS",
          ingredients: state.ingredients.map((i) =>
            i.id === state.activeUnitIngredientId ? { ...i, unit } : i
          ),
        });
      }
      dispatch({ type: "CLOSE_UNIT_PICKER" });
    },
    [state.activeUnitIngredientId, state.ingredients]
  );

  // Step actions
  const addStep = useCallback(() => {
    dispatch({
      type: "SET_STEPS",
      steps: [...state.steps, { id: Date.now().toString(), instruction: "", tip: "" }],
    });
  }, [state.steps]);

  const removeStep = useCallback(
    (id: string) => {
      if (state.steps.length > 1) {
        dispatch({
          type: "SET_STEPS",
          steps: state.steps.filter((s) => s.id !== id),
        });
      }
    },
    [state.steps]
  );

  const updateStep = useCallback(
    (id: string, field: "instruction" | "tip", value: string) => {
      dispatch({
        type: "SET_STEPS",
        steps: state.steps.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
      });
    },
    [state.steps]
  );

  const filteredUnitGroups = preferredUnits
    ? UNIT_GROUPS.filter((group) => {
        if (group.label === "COUNT") return true;
        if (group.label === "METRIC") return preferredUnits !== "imperial";
        if (group.label === "IMPERIAL") return preferredUnits !== "metric";
        return true;
      })
    : UNIT_GROUPS;

  return {
    state,
    dispatch,
    isEditMode,
    filteredUnitGroups,
    handleNext,
    handleBack,
    handleSave,
    addIngredient,
    removeIngredient,
    updateIngredient,
    openUnitPicker,
    selectUnit,
    addStep,
    removeStep,
    updateStep,
  };
}

// Re-export for the hook file
import { UNIT_GROUPS } from "./types";
