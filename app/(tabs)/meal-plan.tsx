import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

// Generate week days with date strings
const generateWeekDays = () => {
  const days = [];
  const today = new Date();
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      id: i.toString(),
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      dateStr: date.toISOString().split("T")[0],
      isToday: i === 0,
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

// Meal Section Component
function MealSection({
  type,
  label,
  recipe,
  mealPlanId,
  index,
  onChangeMeal,
  onAddMeal,
  onRemoveMeal,
}: {
  type: "breakfast" | "lunch" | "dinner";
  label: string;
  recipe: ConvexRecipe | null;
  mealPlanId: Id<"mealPlans"> | null;
  index: number;
  onChangeMeal: () => void;
  onAddMeal: () => void;
  onRemoveMeal: () => void;
}) {
  const recipeMealType = recipe?.tags?.find((t: string) =>
    ["breakfast", "lunch", "dinner", "snack"].includes(t.toLowerCase())
  )?.toLowerCase() || type;
  const bgColor = getMealTypeColor(recipeMealType);

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(400)}
      style={styles.mealSection}
    >
      {/* Meal Label */}
      <View style={styles.mealLabelContainer}>
        <View style={[styles.mealLabel, { backgroundColor: bgColor }]}>
          <Text style={styles.mealLabelText}>{label}</Text>
        </View>
        <View style={styles.mealLabelLine} />
      </View>

      {/* Meal Card */}
      {recipe ? (
        <Pressable
          style={({ pressed }) => [
            styles.mealCard,
            pressed && styles.cardPressed,
          ]}
          onPress={() => router.push(`/recipe/${recipe._id}` as any)}
        >
          <View style={styles.mealImageContainer}>
            <View
              style={[
                styles.mealImage,
                { backgroundColor: bgColor },
              ]}
            >
              <Text style={styles.mealEmoji}>
                {recipeMealType === "breakfast" ? "🍳" : recipeMealType === "lunch" ? "🥗" : recipeMealType === "snack" ? "🍪" : "🍝"}
              </Text>
            </View>
          </View>

          <View style={styles.mealInfo}>
            <Text style={styles.mealTitle} numberOfLines={1}>
              {recipe.title.toUpperCase()}
            </Text>
            <View style={styles.mealBadge}>
              <Text style={styles.mealBadgeText}>
                {recipe.nutritionPerServing?.calories || 0} KCAL
              </Text>
            </View>
            <View style={styles.mealActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.changeButton,
                  pressed && styles.changeButtonPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onChangeMeal();
                }}
              >
                <Ionicons name="swap-horizontal" size={14} color={colors.textLight} />
                <Text style={styles.changeButtonText}>CHANGE</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && styles.removeButtonPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onRemoveMeal();
                }}
              >
                <Ionicons name="trash-outline" size={14} color={colors.surface} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      ) : (
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
    </Animated.View>
  );
}

export default function MealPlanScreen() {
  const weekDays = generateWeekDays();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Get the selected day's date string
  const selectedDate = weekDays[selectedDayIndex]?.dateStr || "";

  // Fetch meal plans for the selected date from Convex
  const mealPlansData = useQuery(
    api.mealPlans.getByDate,
    selectedDate ? { date: selectedDate } : "skip"
  );

  // Fetch all recipes for random generation
  const allRecipes = useQuery(api.recipes.list, { includeGlobal: true });
  const addMealMutation = useMutation(api.mealPlans.addMeal);
  const removeMealMutation = useMutation(api.mealPlans.removeMeal);

  // Build meal plan object from Convex data
  const getMealPlan = () => {
    const plan: {
      breakfast: { recipe: ConvexRecipe | null; mealPlanId: Id<"mealPlans"> | null };
      lunch: { recipe: ConvexRecipe | null; mealPlanId: Id<"mealPlans"> | null };
      dinner: { recipe: ConvexRecipe | null; mealPlanId: Id<"mealPlans"> | null };
    } = {
      breakfast: { recipe: null, mealPlanId: null },
      lunch: { recipe: null, mealPlanId: null },
      dinner: { recipe: null, mealPlanId: null },
    };

    if (mealPlansData) {
      for (const meal of mealPlansData) {
        if (meal.mealType === "breakfast" && meal.recipe) {
          plan.breakfast = { recipe: meal.recipe as ConvexRecipe, mealPlanId: meal._id };
        } else if (meal.mealType === "lunch" && meal.recipe) {
          plan.lunch = { recipe: meal.recipe as ConvexRecipe, mealPlanId: meal._id };
        } else if (meal.mealType === "dinner" && meal.recipe) {
          plan.dinner = { recipe: meal.recipe as ConvexRecipe, mealPlanId: meal._id };
        }
      }
    }

    return plan;
  };

  const mealPlan = getMealPlan();

  // Handler for removing a meal from the plan
  const handleRemoveMeal = async (mealPlanId: Id<"mealPlans"> | null) => {
    if (!mealPlanId) return;
    try {
      await removeMealMutation({ mealPlanId });
    } catch (error) {
      console.error("Failed to remove meal:", error);
    }
  };

  // Handler for adding a meal - navigates to recipe picker
  const handleAddMeal = (mealType: "breakfast" | "lunch" | "dinner") => {
    router.push({
      pathname: "/select-recipe",
      params: { date: selectedDate, mealType },
    } as any);
  };

  // Handler for changing a specific meal to a random recipe of the same type
  const handleChangeMeal = async (mealType: "breakfast" | "lunch" | "dinner") => {
    if (!allRecipes || allRecipes.length === 0) return;

    // Get current recipe ID to avoid selecting the same one
    const currentRecipeId = mealPlan[mealType]?.recipe?._id;

    // Filter recipes by meal type tags
    const matchingRecipes = allRecipes.filter(
      (r: any) =>
        r.tags?.some((t: string) => t.toLowerCase() === mealType) &&
        r._id !== currentRecipeId
    );

    if (matchingRecipes.length === 0) return;

    // Get random recipe
    const randomRecipe =
      matchingRecipes[Math.floor(Math.random() * matchingRecipes.length)];

    try {
      await addMealMutation({
        date: selectedDate,
        mealType,
        recipeId: randomRecipe._id,
      });
    } catch (error) {
      console.error(`Failed to change ${mealType}:`, error);
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

    // Add meals to Convex
    try {
      if (randomBreakfast) {
        await addMealMutation({
          date: selectedDate,
          mealType: "breakfast",
          recipeId: randomBreakfast._id,
        });
      }
      if (randomLunch) {
        await addMealMutation({
          date: selectedDate,
          mealType: "lunch",
          recipeId: randomLunch._id,
        });
      }
      if (randomDinner) {
        await addMealMutation({
          date: selectedDate,
          mealType: "dinner",
          recipeId: randomDinner._id,
        });
      }
    } catch (error) {
      console.error("Failed to generate random plan:", error);
    }
  };

  // Loading state
  if (mealPlansData === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>WEEKLY PLANNER</Text>
          <Pressable style={styles.headerButton}>
            <Ionicons name="calendar-outline" size={24} color={colors.text} />
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
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeInDown.duration(300)}
      >
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>WEEKLY PLANNER</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="calendar-outline" size={24} color={colors.text} />
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
        {/* Meal Sections */}
        <MealSection
          type="breakfast"
          label="BREAKFAST"
          recipe={mealPlan.breakfast.recipe}
          mealPlanId={mealPlan.breakfast.mealPlanId}
          index={0}
          onChangeMeal={() => handleChangeMeal("breakfast")}
          onAddMeal={() => handleAddMeal("breakfast")}
          onRemoveMeal={() => handleRemoveMeal(mealPlan.breakfast.mealPlanId)}
        />
        <MealSection
          type="lunch"
          label="LUNCH"
          recipe={mealPlan.lunch.recipe}
          mealPlanId={mealPlan.lunch.mealPlanId}
          index={1}
          onChangeMeal={() => handleChangeMeal("lunch")}
          onAddMeal={() => handleAddMeal("lunch")}
          onRemoveMeal={() => handleRemoveMeal(mealPlan.lunch.mealPlanId)}
        />
        <MealSection
          type="dinner"
          label="DINNER"
          recipe={mealPlan.dinner.recipe}
          mealPlanId={mealPlan.dinner.mealPlanId}
          index={2}
          onChangeMeal={() => handleChangeMeal("dinner")}
          onAddMeal={() => handleAddMeal("dinner")}
          onRemoveMeal={() => handleRemoveMeal(mealPlan.dinner.mealPlanId)}
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
            onPress={() => router.push("/grocery-list" as any)}
          >
            <View style={styles.groceryButtonContent}>
              <Ionicons name="cart-outline" size={24} color={colors.text} />
              <View style={styles.groceryButtonText}>
                <Text style={styles.groceryButtonTitle}>GROCERY LIST</Text>
                <Text style={styles.groceryButtonSubtitle}>
                  View items for this week
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
  daySelectorContainer: {
    paddingVertical: spacing.md,
  },
  daySelector: {
    paddingHorizontal: spacing.lg,
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
    width: 70,
    height: 70,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  mealEmoji: {
    fontSize: 32,
  },
  mealInfo: {
    flex: 1,
    justifyContent: "center",
  },
  mealTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mealBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  mealBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  mealActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cyan,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  changeButtonText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },
  changeButtonPressed: {
    opacity: 0.7,
  },
  removeButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  removeButtonPressed: {
    opacity: 0.7,
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
