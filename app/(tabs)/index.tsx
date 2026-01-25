import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
  getMealTypeColor,
} from "../../src/styles/neobrutalism";
import { allRecipes, SeedRecipe } from "../../data/recipes";

// Get current date info
const getCurrentDateInfo = () => {
  const now = new Date();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return {
    month: months[now.getMonth()],
    day: now.getDate(),
  };
};

// Mock meal data for today
const todaysMeals = [
  {
    id: "1",
    type: "breakfast",
    label: "BREAKFAST",
    time: "08:30 AM",
    recipe: allRecipes.find(r => r.mealType.includes("breakfast")),
  },
  {
    id: "2",
    type: "lunch",
    label: "LUNCH",
    time: "01:00 PM",
    recipe: allRecipes.find(r => r.mealType.includes("lunch")),
  },
  {
    id: "3",
    type: "dinner",
    label: "DINNER",
    time: "07:30 PM",
    recipe: allRecipes.find(r => r.mealType.includes("dinner")),
  },
];

// Meal Card Component
function MealCard({
  meal,
  index,
}: {
  meal: typeof todaysMeals[0];
  index: number;
}) {
  const bgColor = getMealTypeColor(meal.type);
  const recipe = meal.recipe;

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).duration(400)}
    >
      <Pressable
        style={({ pressed }) => [
          styles.mealCard,
          { backgroundColor: bgColor },
          pressed && styles.cardPressed,
        ]}
        onPress={() => recipe && router.push(`/recipe/${recipe.id}` as any)}
      >
        {/* Recipe Image */}
        <View style={styles.mealImageContainer}>
          {recipe ? (
            <View style={styles.mealImagePlaceholder}>
              <Text style={styles.mealEmoji}>
                {meal.type === "breakfast" ? "🍳" : meal.type === "lunch" ? "🥗" : "🍝"}
              </Text>
            </View>
          ) : (
            <View style={[styles.mealImagePlaceholder, styles.emptyMealImage]}>
              <Ionicons name="add" size={24} color={colors.textMuted} />
            </View>
          )}
        </View>

        {/* Meal Info */}
        <View style={styles.mealInfo}>
          <View style={styles.mealLabelRow}>
            <View style={styles.mealLabelBadge}>
              <Text style={styles.mealLabelText}>{meal.label}</Text>
            </View>
            <Text style={styles.mealTime}>{meal.time}</Text>
          </View>

          {recipe ? (
            <>
              <Text style={styles.mealTitle} numberOfLines={1}>
                {recipe.title}
              </Text>
              <Text style={styles.mealMeta}>
                {recipe.prepTime + recipe.cookTime} mins • {recipe.nutrition?.calories || 0} kcal
              </Text>
            </>
          ) : (
            <Text style={styles.mealPlaceholder}>Tap to add a meal</Text>
          )}
        </View>

        {/* Arrow */}
        <View style={styles.mealArrow}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Recipe Card Component (for horizontal scroll)
function RecipeCard({
  recipe,
  index,
}: {
  recipe: SeedRecipe;
  index: number;
}) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Animated.View
      entering={FadeInRight.delay(400 + index * 100).duration(400)}
    >
      <Pressable
        style={({ pressed }) => [
          styles.recipeCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/recipe/${recipe.id}` as any)}
      >
        {/* Recipe Image */}
        <View
          style={[
            styles.recipeImage,
            { backgroundColor: getMealTypeColor(recipe.mealType[0]) },
          ]}
        >
          <Text style={styles.recipeEmoji}>
            {recipe.mealType[0] === "breakfast"
              ? "🍳"
              : recipe.mealType[0] === "lunch"
              ? "🥗"
              : recipe.mealType[0] === "dinner"
              ? "🍝"
              : "🍪"}
          </Text>
        </View>

        {/* Recipe Info */}
        <View style={styles.recipeCardContent}>
          <Text style={styles.recipeCardTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={styles.recipeCardMeta}>
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={12} color={colors.text} />
              <Text style={styles.timeBadgeText}>{totalTime} MINS</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Section Header Component
function SectionHeader({
  title,
  rightElement,
  onPress,
}: {
  title: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {rightElement}
      {onPress && (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionLink}>VIEW ALL</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const dateInfo = getCurrentDateInfo();
  const recentRecipes = allRecipes.slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={styles.header}
          entering={FadeInDown.duration(400)}
        >
          <View style={styles.headerLeft}>
            <View style={styles.chefIcon}>
              <Ionicons name="restaurant" size={24} color={colors.text} />
            </View>
            <Text style={styles.headerTitle}>HELLO, CHEF!</Text>
          </View>
          <Pressable style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
        >
          <Pressable style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={colors.textMuted} />
            <Text style={styles.searchPlaceholder}>Search recipes or paste URL...</Text>
          </Pressable>
        </Animated.View>

        {/* Import Recipe Button */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.importButton,
              pressed && styles.importButtonPressed,
            ]}
            onPress={() => router.push("/import" as any)}
          >
            <Ionicons name="add-circle-outline" size={22} color={colors.text} />
            <Text style={styles.importButtonText}>IMPORT RECIPE</Text>
          </Pressable>
        </Animated.View>

        {/* Today's Meals Section */}
        <SectionHeader
          title="TODAY'S MEALS"
          rightElement={
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>
                {dateInfo.month} {dateInfo.day}
              </Text>
            </View>
          }
        />

        <View style={styles.mealsContainer}>
          {todaysMeals.map((meal, index) => (
            <MealCard key={meal.id} meal={meal} index={index} />
          ))}
        </View>

        {/* Recent Recipes Section */}
        <SectionHeader
          title="RECENT RECIPES"
          onPress={() => router.push("/(tabs)/recipes")}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipesScrollContent}
          style={styles.recipesScroll}
        >
          {recentRecipes.map((recipe, index) => (
            <RecipeCard key={recipe.id} recipe={recipe} index={index} />
          ))}
        </ScrollView>

        {/* Bottom spacing for tab bar */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  chefIcon: {
    width: 44,
    height: 44,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  notificationButton: {
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
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  searchPlaceholder: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    flex: 1,
  },
  importButton: {
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
  importButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  importButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    flex: 1,
  },
  sectionLink: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  dateBadge: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dateBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  mealsContainer: {
    gap: spacing.md,
  },
  mealCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  mealImageContainer: {
    marginRight: spacing.md,
  },
  mealImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMealImage: {
    backgroundColor: colors.surfaceAlt,
    borderStyle: "dashed",
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealInfo: {
    flex: 1,
  },
  mealLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  mealLabelBadge: {
    backgroundColor: colors.text,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  mealLabelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
  mealTime: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  mealTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  mealMeta: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  mealPlaceholder: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    fontStyle: "italic",
    marginTop: spacing.xs,
  },
  mealArrow: {
    width: 32,
    height: 32,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: spacing.sm,
  },
  recipesScroll: {
    marginHorizontal: -spacing.lg,
  },
  recipesScrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  recipeCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  recipeImage: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeEmoji: {
    fontSize: 40,
  },
  recipeCardContent: {
    padding: spacing.md,
  },
  recipeCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
  },
  recipeCardMeta: {
    flexDirection: "row",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  timeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  bottomSpacer: {
    height: 120,
  },
});
