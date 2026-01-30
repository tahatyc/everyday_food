import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

import { Badge, Input } from "../src/components/ui";
import {
  borderRadius,
  borders,
  colors,
  getDifficultyColor,
  getMealTypeColor,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

// Recipe type from Convex
type ConvexRecipe = {
  _id: Id<"recipes">;
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: "easy" | "medium" | "hard";
  isFavorite?: boolean;
  tags: string[];
};

// Filter chip component
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
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Recipe list item component
function RecipeSelectItem({
  recipe,
  onSelect,
  index,
}: {
  recipe: ConvexRecipe;
  onSelect: () => void;
  index: number;
}) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Get meal type from tags
  const getMealType = () => {
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    return (
      recipe.tags?.find((t: string) => mealTypes.includes(t.toLowerCase()))?.toLowerCase() ||
      "dinner"
    );
  };
  const mealType = getMealType();

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable
        style={({ pressed }) => [
          styles.recipeItem,
          pressed && styles.recipeItemPressed,
        ]}
        onPress={onSelect}
      >
        {/* Recipe image placeholder */}
        <View
          style={[
            styles.recipeImage,
            { backgroundColor: getMealTypeColor(mealType) },
          ]}
        >
          <Text style={styles.recipeEmoji}>
            {mealType === "breakfast"
              ? "🍳"
              : mealType === "lunch"
              ? "🥗"
              : mealType === "dinner"
              ? "🍝"
              : "🍪"}
          </Text>
        </View>

        <View style={styles.recipeContent}>
          <Text style={styles.recipeTitle} numberOfLines={1}>
            {recipe.title}
          </Text>
          {recipe.description && (
            <Text style={styles.recipeDescription} numberOfLines={2}>
              {recipe.description}
            </Text>
          )}

          <View style={styles.recipeMeta}>
            <View style={styles.recipeMetaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.recipeMetaText}>{totalTime} min</Text>
            </View>
            <View style={styles.recipeMetaItem}>
              <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.recipeMetaText}>{recipe.servings} servings</Text>
            </View>
            {recipe.difficulty && (
              <Badge
                variant="default"
                size="sm"
                color={getDifficultyColor(recipe.difficulty)}
              >
                {recipe.difficulty}
              </Badge>
            )}
          </View>

          <View style={styles.recipeTags}>
            {recipe.tags?.slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="default" size="sm">
                {tag}
              </Badge>
            ))}
          </View>
        </View>

        <View style={styles.selectIconContainer}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function SelectRecipeScreen() {
  const params = useLocalSearchParams<{ date: string; mealType: string }>();
  const { date, mealType } = params;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(mealType || "all");

  // Fetch recipes from Convex
  const allRecipes = useQuery(api.recipes.list);
  const searchResults = useQuery(
    api.recipes.search,
    searchQuery ? { query: searchQuery } : "skip"
  );

  const addMealMutation = useMutation(api.mealPlans.addMeal);

  const filters = [
    { id: "all", label: "All" },
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snack", label: "Snack" },
  ];

  // Filter recipes based on active filter and search
  const getFilteredRecipes = (): ConvexRecipe[] => {
    if (searchQuery && searchResults) {
      return searchResults as ConvexRecipe[];
    }

    if (!allRecipes) return [];

    if (activeFilter === "all") {
      return allRecipes as ConvexRecipe[];
    }

    // Filter by meal type tag
    return (allRecipes as ConvexRecipe[]).filter((r) =>
      r.tags?.some((t: string) => t.toLowerCase() === activeFilter)
    );
  };

  const filteredRecipes = getFilteredRecipes();

  // Handle recipe selection
  const handleSelectRecipe = async (recipeId: Id<"recipes">) => {
    if (!date || !mealType) return;

    try {
      await addMealMutation({
        date,
        mealType: mealType as "breakfast" | "lunch" | "dinner" | "snack",
        recipeId,
      });
      router.back();
    } catch (error) {
      console.error("Failed to add meal:", error);
    }
  };

  // Get meal type label for header
  const getMealTypeLabel = () => {
    switch (mealType) {
      case "breakfast":
        return "BREAKFAST";
      case "lunch":
        return "LUNCH";
      case "dinner":
        return "DINNER";
      case "snack":
        return "SNACK";
      default:
        return "MEAL";
    }
  };

  // Loading state
  if (allRecipes === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.header}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>SELECT RECIPE</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>SELECT {getMealTypeLabel()}</Text>
          {date && (
            <Text style={styles.headerSubtitle}>
              {new Date(date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          )}
        </View>
        <View style={styles.headerButton} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search recipes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon="search-outline"
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Filters */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FilterChip
            label={item.label}
            active={activeFilter === item.id}
            onPress={() => setActiveFilter(item.id)}
          />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterList}
        style={styles.filterContainer}
      />

      {/* Recipe count */}
      <Text style={styles.recipeCount}>
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""} available
      </Text>

      {/* Recipe list */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <RecipeSelectItem
            recipe={item}
            onSelect={() => handleSelectRecipe(item._id)}
            index={index}
          />
        )}
        contentContainerStyle={styles.recipeList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={60} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No recipes found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search or filters
            </Text>
          </View>
        }
      />
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterContainer: {
    minHeight: 56,
    maxHeight: 60,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    alignItems: "center" as const,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    minWidth: 60,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    ...shadows.sm,
  },
  filterChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  recipeCount: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  recipeList: {
    padding: spacing.lg,
    paddingBottom: 100,
    gap: spacing.md,
  },
  recipeItem: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  recipeItemPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  recipeImage: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeEmoji: {
    fontSize: 32,
  },
  recipeContent: {
    flex: 1,
    padding: spacing.md,
  },
  recipeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  recipeMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  recipeTags: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  selectIconContainer: {
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxxl,
    gap: spacing.md,
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
  },
  emptyStateSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
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
