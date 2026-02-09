import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { Badge, Card, IconButton, Input } from "../../src/components/ui";
import {
  borderRadius,
  borders,
  colors,
  getDifficultyColor,
  getMealTypeColor,
  shadows,
  spacing,
  typography,
} from "../../src/styles/neobrutalism";

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
  isGlobal?: boolean;
  tags: string[];
  ingredients: any[];
  steps: any[];
};

// Recipe list item component
function RecipeListItem({ recipe }: { recipe: ConvexRecipe }) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  // Get meal type from tags
  const getMealType = () => {
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    return recipe.tags?.find((t: string) => mealTypes.includes(t.toLowerCase()))?.toLowerCase() || "dinner";
  };
  const mealType = getMealType();

  return (
    <Card style={styles.recipeItem} onPress={() => router.push(`/recipe/${recipe._id}` as any)}>
      {/* Add badge for global recipes */}
      {recipe.isGlobal && (
        <View style={styles.globalBadge}>
          <Ionicons name="globe-outline" size={12} color={colors.primary} />
          <Text style={styles.globalBadgeText}>GLOBAL</Text>
        </View>
      )}

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
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {recipe.description}
        </Text>

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

      <Pressable style={styles.favoriteButton}>
        <Ionicons
          name={recipe.isFavorite ? "heart" : "heart-outline"}
          size={22}
          color={recipe.isFavorite ? colors.error : colors.primary}
        />
      </Pressable>
    </Card>
  );
}

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

export default function RecipesScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filter || "all");

  // Fetch recipes from Convex
  const allRecipes = useQuery(api.recipes.list, {
    includeGlobal: activeFilter === "all" || activeFilter === "global",
    globalOnly: activeFilter === "global",
  });
  const searchResults = useQuery(
    api.recipes.search,
    searchQuery ? { query: searchQuery, includeGlobal: true } : "skip"
  );
  const favoriteRecipes = useQuery(api.recipes.getFavorites);

  const filters = [
    { id: "all", label: "All" },
    { id: "my-recipes", label: "My Recipes" },
    { id: "global", label: "Global" },
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "favorites", label: "Favorites" },
  ];

  // Filter recipes based on active filter
  const getFilteredRecipes = (): ConvexRecipe[] => {
    if (searchQuery && searchResults) {
      return searchResults as ConvexRecipe[];
    }

    if (!allRecipes) return [];

    if (activeFilter === "all") {
      return allRecipes as ConvexRecipe[];
    }

    if (activeFilter === "my-recipes") {
      return (allRecipes as ConvexRecipe[]).filter(r => !r.isGlobal);
    }

    if (activeFilter === "global") {
      return (allRecipes as ConvexRecipe[]).filter(r => r.isGlobal);
    }

    if (activeFilter === "favorites") {
      return (favoriteRecipes || []) as ConvexRecipe[];
    }

    // Filter by meal type tag
    return (allRecipes as ConvexRecipe[]).filter((r) =>
      r.tags?.some((t: string) => t.toLowerCase() === activeFilter)
    );
  };

  const filteredRecipes = getFilteredRecipes();

  // Loading state
  if (allRecipes === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Recipes</Text>
          <IconButton icon="add" variant="primary" onPress={() => router.push("/import")} />
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <IconButton icon="add" variant="primary" onPress={() => router.push("/import")} />
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
        <IconButton icon="options-outline" variant="default" onPress={() => {
          Alert.alert(
            "Filter Recipes",
            "Use the category chips below to filter recipes by meal type, or search by name.",
            [{ text: "OK" }]
          );
        }} />
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
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""}
      </Text>

      {/* Recipe list */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <RecipeListItem recipe={item} />}
        contentContainerStyle={styles.recipeList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={60} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>No recipes found</Text>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
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
    paddingBottom: 150,
    gap: spacing.md,
  },
  recipeItem: {
    flexDirection: "row",
    padding: 0,
    overflow: "hidden",
  },
  recipeImage: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeEmoji: {
    fontSize: 36,
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
  favoriteButton: {
    padding: spacing.md,
    alignSelf: "flex-start",
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
  globalBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: borders.thin,
    borderColor: borders.color,
    ...shadows.sm,
    zIndex: 1,
  },
  globalBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: "uppercase",
  },
});
