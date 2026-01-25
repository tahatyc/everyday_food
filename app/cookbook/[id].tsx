import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

// Mock cookbook data
const cookbooks: Record<string, { title: string; recipes: SeedRecipe[]; color: string }> = {
  "1": {
    title: "ITALIAN FAVORITES",
    recipes: allRecipes.filter((r) => r.cuisine?.toLowerCase() === "italian" || r.tags.includes("italian")).slice(0, 12),
    color: colors.magentaLight,
  },
  "2": {
    title: "QUICK VEGAN",
    recipes: allRecipes.filter((r) => r.diet?.includes("vegan") || r.diet?.includes("vegetarian")).slice(0, 8),
    color: colors.secondary,
  },
};

// Recipe Grid Card
function RecipeGridCard({
  recipe,
  index,
}: {
  recipe: SeedRecipe;
  index: number;
}) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 50).duration(400)}
      style={styles.gridCardContainer}
    >
      <Pressable
        style={({ pressed }) => [
          styles.gridCard,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/recipe/${recipe.id}` as any)}
      >
        {/* Recipe Image */}
        <View
          style={[
            styles.gridCardImage,
            { backgroundColor: getMealTypeColor(recipe.mealType[0]) },
          ]}
        >
          <Text style={styles.gridCardEmoji}>
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
        <View style={styles.gridCardContent}>
          <Text style={styles.gridCardTitle} numberOfLines={2}>
            {recipe.title.toUpperCase()}
          </Text>
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={12} color={colors.text} />
            <Text style={styles.timeBadgeText}>{totalTime} MINS</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Filter Chip
function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function CookbookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cookbook = cookbooks[id || "1"] || cookbooks["1"];
  const [activeFilter, setActiveFilter] = useState("all");

  // Use allRecipes if cookbook has no specific recipes
  const recipes = cookbook.recipes.length > 0 ? cookbook.recipes : allRecipes.slice(0, 12);

  const filters = [
    { id: "all", label: `${recipes.length} RECIPES` },
    { id: "curated", label: "CURATED BY YOU" },
    { id: "public", label: "PUBLIC" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View
        style={[styles.header, { backgroundColor: cookbook.color }]}
        entering={FadeInDown.duration(300)}
      >
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{cookbook.title}</Text>

        <Pressable style={styles.headerButton}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* Filters */}
      <Animated.View
        style={styles.filtersContainer}
        entering={FadeInDown.delay(100).duration(300)}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <FilterChip
              key={filter.id}
              label={filter.label}
              active={activeFilter === filter.id}
              onPress={() => setActiveFilter(filter.id)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      {/* Recipe Grid */}
      <FlatList
        data={recipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <RecipeGridCard recipe={item} index={index} />
        )}
        ListFooterComponent={<View style={styles.bottomSpacer} />}
      />

      {/* Floating Add Button */}
      <Animated.View
        style={styles.floatingButton}
        entering={FadeInUp.delay(400).duration(400)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
        >
          <Ionicons name="add" size={28} color={colors.textLight} />
        </Pressable>
      </Animated.View>
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
    paddingVertical: spacing.lg,
    borderBottomWidth: borders.regular,
    borderBottomColor: borders.color,
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
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    textAlign: "center",
    marginHorizontal: spacing.md,
  },
  filtersContainer: {
    borderBottomWidth: borders.thin,
    borderBottomColor: colors.borderLight,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    ...shadows.xs,
  },
  filterChipActive: {
    backgroundColor: colors.text,
  },
  filterChipText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  filterChipTextActive: {
    color: colors.textLight,
  },
  gridContent: {
    padding: spacing.lg,
  },
  gridRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gridCardContainer: {
    flex: 1,
  },
  gridCard: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  gridCardImage: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardEmoji: {
    fontSize: 48,
  },
  gridCardContent: {
    padding: spacing.md,
  },
  gridCardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    minHeight: 36,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
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
  floatingButton: {
    position: "absolute",
    bottom: spacing.xxl,
    right: spacing.lg,
  },
  addButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.cyan,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  addButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  bottomSpacer: {
    height: 100,
  },
});
