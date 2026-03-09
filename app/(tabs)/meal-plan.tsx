import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { ServingsBottomSheet } from "../../src/components/ServingsBottomSheet";
import { useToast } from "../../src/hooks/useToast";
import { getMealTypeEmoji } from "../../src/lib/meal-types";
import {
  borderRadius,
  borders,
  colors,
  getMealTypeColor,
  shadows,
  spacing,
  typography,
} from "../../src/styles/neobrutalism";

// Recipe type from Convex
type ConvexRecipe = {
  _id: Id<"recipes">;
  title: string;
  prepTime?: number;
  cookTime?: number;
  nutritionPerServing?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  tags: string[];
};

// A single entry within a meal slot
type MealEntry = {
  recipe: ConvexRecipe;
  mealPlanId: Id<"mealPlans">;
  servings: number;
};

// The full day plan — one array per slot
type DayMealPlan = {
  breakfast: MealEntry[];
  lunch: MealEntry[];
  dinner: MealEntry[];
};

// Generate week days with date strings, offset by weeks
const generateWeekDays = (weekOffset: number = 0) => {
  const days = [];
  const today = new Date();
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const todayStr = today.toISOString().split("T")[0];

  // Start from the beginning of the current week (Sunday), then apply offset
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    days.push({
      id: i.toString(),
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      dateStr,
      isToday: dateStr === todayStr,
    });
  }
  return days;
};

// Day Selector Item
function DayItem({
  day,
  isSelected,
  onSelect,
  index,
}: {
  day: ReturnType<typeof generateWeekDays>[0];
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(index * 50).duration(300)}>
      <Pressable
        style={[
          styles.dayItem,
          isSelected && styles.dayItemSelected,
          day.isToday && !isSelected && styles.dayItemToday,
        ]}
        onPress={onSelect}
      >
        <Text
          style={[
            styles.dayName,
            isSelected && styles.dayNameSelected,
          ]}
        >
          {day.dayName}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            isSelected && styles.dayNumberSelected,
          ]}
        >
          {day.dayNumber}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Daily Nutrition Summary ──────────────────────────────────────────
function DailyNutritionSummary({ mealPlan }: { mealPlan: DayMealPlan }) {
  const totals = useMemo(() => {
    const allEntries = [
      ...mealPlan.breakfast,
      ...mealPlan.lunch,
      ...mealPlan.dinner,
    ];
    return allEntries.reduce(
      (acc, entry) => {
        const n = entry.recipe.nutritionPerServing;
        const s = entry.servings;
        if (n) {
          acc.calories += (n.calories || 0) * s;
          acc.protein += (n.protein || 0) * s;
          acc.carbs += (n.carbs || 0) * s;
          acc.fat += (n.fat || 0) * s;
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealPlan]);

  const hasMeals =
    mealPlan.breakfast.length + mealPlan.lunch.length + mealPlan.dinner.length > 0;

  if (!hasMeals) return null;

  return (
    <Animated.View
      entering={FadeInDown.delay(150).duration(300)}
      style={styles.nutritionSummary}
    >
      <View style={styles.nutritionItem}>
        <Ionicons name="flame" size={14} color={colors.accent} />
        <Text style={styles.nutritionValue}>{Math.round(totals.calories)}</Text>
        <Text style={styles.nutritionLabel}>KCAL</Text>
      </View>
      <View style={styles.nutritionDivider} />
      <View style={styles.nutritionItem}>
        <View style={[styles.nutritionDot, { backgroundColor: colors.protein }]} />
        <Text style={styles.nutritionValue}>{Math.round(totals.protein)}g</Text>
        <Text style={styles.nutritionLabel}>PROTEIN</Text>
      </View>
      <View style={styles.nutritionDivider} />
      <View style={styles.nutritionItem}>
        <View style={[styles.nutritionDot, { backgroundColor: colors.carbs }]} />
        <Text style={styles.nutritionValue}>{Math.round(totals.carbs)}g</Text>
        <Text style={styles.nutritionLabel}>CARBS</Text>
      </View>
    </Animated.View>
  );
}

// ── Swipe Action Panels ─────────────────────────────────────────────
function renderLeftActions() {
  return (
    <View style={styles.swipeActionLeft}>
      <Ionicons name="swap-horizontal" size={22} color={colors.textLight} />
      <Text style={styles.swipeActionText}>CHANGE</Text>
    </View>
  );
}

function renderRightActions() {
  return (
    <View style={styles.swipeActionRight}>
      <Text style={styles.swipeActionText}>DELETE</Text>
      <Ionicons name="trash-outline" size={22} color={colors.textLight} />
    </View>
  );
}

// ── Individual meal card (simplified 2-row + swipe + long-press) ────
function MealCard({
  entry,
  mealType,
  onChangeMeal,
  onRemoveMeal,
  onUpdateServings,
}: {
  entry: MealEntry;
  mealType: "breakfast" | "lunch" | "dinner";
  onChangeMeal: () => void;
  onRemoveMeal: () => void;
  onUpdateServings: (servings: number) => void;
}) {
  const [showServingsSheet, setShowServingsSheet] = useState(false);
  const swipeableRef = useRef<Swipeable>(null);

  const recipeMealType =
    entry.recipe.tags?.find((t: string) =>
      ["breakfast", "lunch", "dinner", "snack"].includes(t.toLowerCase())
    )?.toLowerCase() || mealType;
  const bgColor = getMealTypeColor(recipeMealType);

  const handleSwipeLeft = useCallback(() => {
    swipeableRef.current?.close();
    onChangeMeal();
  }, [onChangeMeal]);

  const handleSwipeRight = useCallback(() => {
    swipeableRef.current?.close();
    onRemoveMeal();
  }, [onRemoveMeal]);

  const handleLongPress = useCallback(() => {
    const options = [
      { text: "View Recipe", onPress: () => router.push(`/recipe/${entry.recipe._id}?servings=${entry.servings}&fromMealPlan=1` as any) },
      { text: "Change Meal", onPress: onChangeMeal },
      { text: "Adjust Servings", onPress: () => setShowServingsSheet(true) },
      { text: "Remove", style: "destructive" as const, onPress: onRemoveMeal },
      { text: "Cancel", style: "cancel" as const },
    ];
    Alert.alert("Meal Options", entry.recipe.title, options);
  }, [entry, onChangeMeal, onRemoveMeal]);

  const calories = entry.recipe.nutritionPerServing?.calories || 0;

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableOpen={(direction) => {
          if (direction === "left") handleSwipeLeft();
          else handleSwipeRight();
        }}
        overshootLeft={false}
        overshootRight={false}
        containerStyle={styles.swipeableContainer}
      >
        <Pressable
          style={({ pressed }) => [styles.mealCard, pressed && styles.cardPressed]}
          onPress={() => router.push(`/recipe/${entry.recipe._id}?servings=${entry.servings}&fromMealPlan=1` as any)}
          onLongPress={handleLongPress}
          delayLongPress={400}
        >
          {/* Emoji thumbnail */}
          <View style={styles.mealImageContainer}>
            <View style={[styles.mealImage, { backgroundColor: bgColor }]}>
              <Text style={styles.mealEmoji}>
                {getMealTypeEmoji(recipeMealType)}
              </Text>
            </View>
          </View>

          {/* Two-row info: title+kcal / servings */}
          <View style={styles.mealInfo}>
            <View style={styles.mealTitleRow}>
              <Text style={styles.mealTitle} numberOfLines={1}>
                {entry.recipe.title.toUpperCase()}
              </Text>
              <View style={styles.mealCalsBadge}>
                <Text style={styles.mealCalsText}>{calories} KCAL</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.servingsBadge,
                pressed && styles.servingsBadgePressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                setShowServingsSheet(true);
              }}
            >
              <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.servingsBadgeText}>
                {entry.servings} {entry.servings === 1 ? "SERVING" : "SERVINGS"}
              </Text>
              <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
            </Pressable>
          </View>
        </Pressable>
      </Swipeable>

      <ServingsBottomSheet
        visible={showServingsSheet}
        currentServings={entry.servings}
        recipeName={entry.recipe.title}
        onSave={(servings) => onUpdateServings(servings)}
        onClose={() => setShowServingsSheet(false)}
      />
    </>
  );
}

// ── Meal Section Component ──────────────────────────────────────────
function MealSection({
  type,
  label,
  meals,
  index,
  onChangeMeal,
  onAddMeal,
  onRemoveMeal,
  onUpdateServings,
}: {
  type: "breakfast" | "lunch" | "dinner";
  label: string;
  meals: MealEntry[];
  index: number;
  onChangeMeal: (mealPlanId: Id<"mealPlans">) => void;
  onAddMeal: () => void;
  onRemoveMeal: (mealPlanId: Id<"mealPlans">) => void;
  onUpdateServings: (mealPlanId: Id<"mealPlans">, servings: number) => void;
}) {
  const bgColor = getMealTypeColor(type);
  const canAdd = meals.length < 3;

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(400)}
      style={styles.mealSection}
    >
      {/* Section header with inline + button */}
      <View style={styles.mealLabelContainer}>
        <View style={[styles.mealLabel, { backgroundColor: bgColor }]}>
          <Text style={styles.mealLabelText}>{label}</Text>
        </View>
        <View style={styles.mealLabelLine} />
        {canAdd && (
          <Pressable
            style={({ pressed }) => [
              styles.sectionAddButton,
              { backgroundColor: bgColor },
              pressed && styles.sectionAddButtonPressed,
            ]}
            onPress={onAddMeal}
            hitSlop={8}
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </Pressable>
        )}
      </View>

      {/* Empty state */}
      {meals.length === 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.mealCard,
            styles.emptyMealCard,
            pressed && styles.cardPressed,
          ]}
          onPress={onAddMeal}
        >
          <View style={styles.emptyMealContent}>
            <Ionicons name="add" size={24} color={colors.textMuted} />
            <Text style={styles.emptyMealText}>Add a meal</Text>
          </View>
        </Pressable>
      )}

      {/* Meal cards list */}
      {meals.map((entry) => (
        <MealCard
          key={entry.mealPlanId}
          entry={entry}
          mealType={type}
          onChangeMeal={() => onChangeMeal(entry.mealPlanId)}
          onRemoveMeal={() => onRemoveMeal(entry.mealPlanId)}
          onUpdateServings={(servings) => onUpdateServings(entry.mealPlanId, servings)}
        />
      ))}
    </Animated.View>
  );
}

export default function MealPlanScreen() {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = useMemo(() => generateWeekDays(weekOffset), [weekOffset]);

  // Initialize selectedDayIndex to today's position in the week
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const days = generateWeekDays(0);
    const idx = days.findIndex((d) => d.isToday);
    return idx >= 0 ? idx : 0;
  });

  // Week label: "FEB 9 - FEB 15"
  const weekLabel = useMemo(() => {
    if (weekDays.length === 0) return "";
    const firstDay = new Date(weekDays[0].dateStr + "T00:00:00");
    const lastDay = new Date(weekDays[weekDays.length - 1].dateStr + "T00:00:00");
    return `${format(firstDay, "MMM d").toUpperCase()} - ${format(lastDay, "MMM d").toUpperCase()}`;
  }, [weekDays]);

  // Reset selected day when navigating weeks (skip initial mount)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (weekOffset === 0) {
      const todayIndex = weekDays.findIndex((d) => d.isToday);
      setSelectedDayIndex(todayIndex >= 0 ? todayIndex : 0);
    } else {
      setSelectedDayIndex(0);
    }
  }, [weekOffset]);

  // Get the selected day's date string
  const selectedDate = weekDays[selectedDayIndex]?.dateStr || "";

  // Get the week's date range for grocery list
  const weekStartDate = weekDays[0]?.dateStr || "";
  const weekEndDate = weekDays[weekDays.length - 1]?.dateStr || "";

  // Fetch meal plans for the selected date from Convex
  const mealPlansData = useQuery(
    api.mealPlans.getByDate,
    selectedDate ? { date: selectedDate } : "skip"
  );

  // Check if a grocery list exists for the current week
  const weekListInfo = useQuery(
    api.shoppingLists.weekListExists,
    weekStartDate ? { weekStartDate } : "skip"
  );

  // Defer loading all recipes until primary meal plan data is available
  const allRecipes = useQuery(
    api.recipes.list,
    mealPlansData !== undefined ? { includeGlobal: true } : "skip"
  );
  const addMealMutation = useMutation(api.mealPlans.addMeal);
  const removeMealMutation = useMutation(api.mealPlans.removeMeal);
  const changeMealMutation = useMutation(api.mealPlans.changeMeal);
  const updateServingsMutation = useMutation(api.mealPlans.updateServings);

  // Build meal plan object from Convex data (memoized)
  const mealPlan = useMemo((): DayMealPlan => {
    const plan: DayMealPlan = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    if (!mealPlansData) return plan;

    for (const meal of mealPlansData) {
      if (!meal.recipe) continue;
      const recipe = meal.recipe as ConvexRecipe;
      const entry: MealEntry = {
        recipe,
        mealPlanId: meal._id,
        servings: meal.servings ?? (recipe as any).servings ?? 1,
      };
      if (meal.mealType === "breakfast") plan.breakfast.push(entry);
      else if (meal.mealType === "lunch") plan.lunch.push(entry);
      else if (meal.mealType === "dinner") plan.dinner.push(entry);
    }

    return plan;
  }, [mealPlansData]);

  const { showSuccess, showError } = useToast();

  // Handler for removing a meal from the plan
  const handleRemoveMeal = async (mealPlanId: Id<"mealPlans"> | null) => {
    if (!mealPlanId) return;
    try {
      await removeMealMutation({ mealPlanId });
    } catch (error) {
      showError("Failed to remove meal. Please try again.");
    }
  };

  // Handler for adding a meal - navigates to recipe picker
  const handleAddMeal = (mealType: "breakfast" | "lunch" | "dinner") => {
    router.push({
      pathname: "/select-recipe",
      params: { date: selectedDate, mealType },
    } as any);
  };

  // Handler for changing a specific meal entry to a random recipe of the same type
  const handleChangeMeal = async (
    mealType: "breakfast" | "lunch" | "dinner",
    mealPlanId: Id<"mealPlans">
  ) => {
    if (!allRecipes || allRecipes.length === 0) return;

    // Exclude all recipes already in this slot to maximise variety
    const currentIds = new Set(mealPlan[mealType].map((e) => e.recipe._id));

    const matchingRecipes = allRecipes.filter(
      (r: any) =>
        r.tags?.some((t: string) => t.toLowerCase() === mealType) &&
        !currentIds.has(r._id)
    );

    if (matchingRecipes.length === 0) {
      showError(`No other ${mealType} recipes available to swap.`);
      return;
    }

    const randomRecipe =
      matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];

    try {
      await changeMealMutation({
        mealPlanId,
        recipeId: randomRecipe._id,
      });
    } catch (error) {
      showError("Failed to update meal.");
    }
  };

  // Handler for updating servings on a meal plan entry
  const handleUpdateServings = async (
    mealPlanId: Id<"mealPlans">,
    servings: number
  ) => {
    try {
      await updateServingsMutation({ mealPlanId, servings });
    } catch {
      showError("Failed to update servings.");
    }
  };

  // Handler for generating random plan
  const handleGenerateRandomPlan = async () => {
    if (!allRecipes || allRecipes.length === 0) return;

    // Filter recipes by meal type tags
    const getRecipesByMealType = (mealType: string) => {
      return allRecipes.filter((r: any) =>
        r.tags?.some((t: string) => t.toLowerCase() === mealType)
      );
    };

    const breakfastRecipes = getRecipesByMealType("breakfast");
    const lunchRecipes = getRecipesByMealType("lunch");
    const dinnerRecipes = getRecipesByMealType("dinner");

    // Get random recipe from array
    const getRandomRecipe = (recipes: any[]) => {
      if (recipes.length === 0) return null;
      return recipes[Math.floor(Math.random() * recipes.length)];
    };

    const randomBreakfast = getRandomRecipe(breakfastRecipes);
    const randomLunch = getRandomRecipe(lunchRecipes);
    const randomDinner = getRandomRecipe(dinnerRecipes);

    let added = false;

    if (randomBreakfast) {
      try {
        await addMealMutation({ date: selectedDate, mealType: "breakfast", recipeId: randomBreakfast._id });
        added = true;
      } catch { /* cap reached for breakfast — skip silently */ }
    }
    if (randomLunch) {
      try {
        await addMealMutation({ date: selectedDate, mealType: "lunch", recipeId: randomLunch._id });
        added = true;
      } catch { /* cap reached for lunch — skip silently */ }
    }
    if (randomDinner) {
      try {
        await addMealMutation({ date: selectedDate, mealType: "dinner", recipeId: randomDinner._id });
        added = true;
      } catch { /* cap reached for dinner — skip silently */ }
    }

    if (added) showSuccess("Meal plan generated!");
  };

  // Handler for grocery list - navigate with week params
  const handleOpenGroceryList = () => {
    router.push({
      pathname: "/grocery-list",
      params: { weekStartDate, weekEndDate },
    } as any);
  };

  // Dynamic subtitle for grocery button
  const groceryButtonSubtitle = useMemo(() => {
    if (!weekListInfo) return "Loading...";
    if (weekListInfo.exists) {
      return `View list for ${weekLabel} (${weekListInfo.itemCount} items)`;
    }
    return `Generate list for ${weekLabel}`;
  }, [weekListInfo, weekLabel]);

  // Loading state
  if (mealPlansData === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={() => setWeekOffset((prev) => prev - 1)}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.weekLabelContainer}
            onPress={() => setWeekOffset(0)}
          >
            <Text style={styles.headerTitle}>{weekLabel}</Text>
            {weekOffset !== 0 && (
              <Text style={styles.tapForTodayText}>TAP FOR TODAY</Text>
            )}
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={() => setWeekOffset((prev) => prev + 1)}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading meal plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header with Week Navigation */}
      <Animated.View
        style={styles.header}
        entering={FadeInDown.duration(300)}
      >
        <Pressable
          style={styles.headerButton}
          onPress={() => setWeekOffset((prev) => prev - 1)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Pressable
          style={styles.weekLabelContainer}
          onPress={() => setWeekOffset(0)}
        >
          <Text style={styles.headerTitle}>{weekLabel}</Text>
          {weekOffset !== 0 && (
            <Text style={styles.tapForTodayText}>TAP FOR TODAY</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.headerButton}
          onPress={() => setWeekOffset((prev) => prev + 1)}
        >
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* Day Selector */}
      <View style={styles.daySelectorContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {weekDays.map((day, index) => (
            <DayItem
              key={day.id}
              day={day}
              isSelected={selectedDayIndex === index}
              onSelect={() => setSelectedDayIndex(index)}
              index={index}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Daily Nutrition Summary */}
        <DailyNutritionSummary mealPlan={mealPlan} />

        {/* Meal Sections */}
        <MealSection
          type="breakfast"
          label="BREAKFAST"
          meals={mealPlan.breakfast}
          index={0}
          onChangeMeal={(id) => handleChangeMeal("breakfast", id)}
          onAddMeal={() => handleAddMeal("breakfast")}
          onRemoveMeal={(id) => handleRemoveMeal(id)}
          onUpdateServings={handleUpdateServings}
        />
        <MealSection
          type="lunch"
          label="LUNCH"
          meals={mealPlan.lunch}
          index={1}
          onChangeMeal={(id) => handleChangeMeal("lunch", id)}
          onAddMeal={() => handleAddMeal("lunch")}
          onRemoveMeal={(id) => handleRemoveMeal(id)}
          onUpdateServings={handleUpdateServings}
        />
        <MealSection
          type="dinner"
          label="DINNER"
          meals={mealPlan.dinner}
          index={2}
          onChangeMeal={(id) => handleChangeMeal("dinner", id)}
          onAddMeal={() => handleAddMeal("dinner")}
          onRemoveMeal={(id) => handleRemoveMeal(id)}
          onUpdateServings={handleUpdateServings}
        />

        {/* Generate Random Plan Button */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.generateButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleGenerateRandomPlan}
          >
            <Ionicons name="dice-outline" size={20} color={colors.text} />
            <Text style={styles.generateButtonText}>GENERATE RANDOM PLAN</Text>
          </Pressable>
        </Animated.View>

        {/* Grocery List Link */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.groceryButton,
              pressed && styles.cardPressed,
            ]}
            onPress={handleOpenGroceryList}
          >
            <View style={styles.groceryButtonContent}>
              <View style={styles.cartIconContainer}>
                <Ionicons name="cart-outline" size={24} color={colors.text} />
                {weekListInfo?.exists && <View style={styles.cartBadgeDot} />}
              </View>
              <View style={styles.groceryButtonText}>
                <Text style={styles.groceryButtonTitle}>GROCERY LIST</Text>
                <Text style={styles.groceryButtonSubtitle}>
                  {groceryButtonSubtitle}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  weekLabelContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tapForTodayText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: 2,
    letterSpacing: typography.letterSpacing.wide,
  },
  daySelectorContainer: {
    paddingVertical: spacing.md,
  },
  daySelector: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  dayItem: {
    width: 56,
    height: 72,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.xs,
  },
  dayItemSelected: {
    backgroundColor: colors.primary,
  },
  dayItemToday: {
    borderColor: colors.primary,
    borderWidth: borders.thick,
  },
  dayName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  dayNameSelected: {
    color: colors.text,
  },
  dayNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  dayNumberSelected: {
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  mealSection: {
    marginBottom: spacing.lg,
  },
  mealLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  mealLabel: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
  },
  mealLabelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  mealLabelLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.md,
  },
  // ── Daily Nutrition Summary ──────────────────────────────────────
  nutritionSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.xs,
  },
  nutritionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  nutritionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nutritionValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  nutritionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
    marginLeft: 1,
  },
  nutritionDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  // ── Section Add Button ─────────────────────────────────────────
  sectionAddButton: {
    width: 28,
    height: 28,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  sectionAddButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  // ── Swipe Actions ──────────────────────────────────────────────
  swipeableContainer: {
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  swipeActionLeft: {
    backgroundColor: colors.cyan,
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    borderRadius: borderRadius.lg,
    marginRight: -borderRadius.lg,
    paddingRight: borderRadius.lg,
    gap: 4,
  },
  swipeActionRight: {
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    borderRadius: borderRadius.lg,
    marginLeft: -borderRadius.lg,
    paddingLeft: borderRadius.lg,
    gap: 4,
  },
  swipeActionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
  // ── Meal Card (simplified 2-row) ───────────────────────────────
  mealCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  emptyMealCard: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xxl,
    borderStyle: "dashed",
    marginBottom: spacing.sm,
  },
  emptyMealContent: {
    alignItems: "center",
    gap: spacing.sm,
  },
  emptyMealText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  mealImageContainer: {
    marginRight: spacing.md,
  },
  mealImage: {
    width: 56,
    height: 56,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: {
    fontSize: 26,
  },
  mealInfo: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.xs,
  },
  mealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  mealTitle: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  mealCalsBadge: {
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  mealCalsText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  servingsBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: colors.borderLight,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  servingsBadgePressed: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  servingsBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  generateButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  groceryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.cyanLight,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  cartIconContainer: {
    position: "relative",
  },
  cartBadgeDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: borders.color,
  },
  groceryButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  groceryButtonText: {
    gap: spacing.xs,
  },
  groceryButtonTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  groceryButtonSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 170,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});
