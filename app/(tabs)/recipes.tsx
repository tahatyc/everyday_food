import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Badge, Input, IconButton } from "../../src/components/ui";
import {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  borderRadius,
  getMealTypeColor,
  getDifficultyColor,
} from "../../src/styles/neobrutalism";
import { allRecipes, SeedRecipe, searchRecipes } from "../../data/recipes";

// Recipe list item component
function RecipeListItem({ recipe }: { recipe: SeedRecipe }) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Card style={styles.recipeItem} onPress={() => {}}>
      {/* Recipe image placeholder */}
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
          <Badge
            variant="default"
            size="sm"
            color={getDifficultyColor(recipe.difficulty)}
          >
            {recipe.difficulty}
          </Badge>
        </View>

        <View style={styles.recipeTags}>
          {recipe.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </View>
      </View>

      <Pressable style={styles.favoriteButton}>
        <Ionicons name="heart-outline" size={22} color={colors.primary} />
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
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "favorites", label: "Favorites" },
  ];

  const filteredRecipes = searchQuery
    ? searchRecipes(searchQuery)
    : activeFilter === "all"
    ? allRecipes
    : allRecipes.filter((r) => r.mealType.includes(activeFilter as any));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipes</Text>
        <IconButton icon="add" variant="primary" onPress={() => {}} />
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
        <IconButton icon="options-outline" variant="default" onPress={() => {}} />
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
        keyExtractor={(item) => item.id}
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
    maxHeight: 50,
  },
  filterList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
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
});
