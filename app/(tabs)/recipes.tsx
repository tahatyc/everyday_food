import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import { Badge, Card, IconButton, Input } from "../../src/components/ui";
import {
  COOK_TIME_OPTIONS,
  CUISINE_OPTIONS,
  DIETARY_OPTIONS,
} from "../../src/constants/dietary";
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
  cookCount?: number;
  tags: string[];
  ingredients: any[];
  steps: any[];
};

// Advanced filter state
type RecipeFilters = {
  cookTime: number | null; // max minutes, null = any
  difficulty: string[]; // multi-select
  cuisine: string[]; // multi-select
  dietary: string[]; // multi-select
};

const DEFAULT_FILTERS: RecipeFilters = {
  cookTime: null,
  difficulty: [],
  cuisine: [],
  dietary: [],
};

// Recipe list item component
function RecipeListItem({ recipe }: { recipe: ConvexRecipe }) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const toggleFavorite = useMutation(api.recipes.toggleFavorite);
  const toggleGlobalFavorite = useMutation(api.recipes.toggleGlobalRecipeFavorite);

  const handleToggleFavorite = () => {
    if (recipe.isGlobal) {
      toggleGlobalFavorite({ recipeId: recipe._id });
    } else {
      toggleFavorite({ recipeId: recipe._id });
    }
  };

  const getMealType = () => {
    const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
    return recipe.tags?.find((t: string) => mealTypes.includes(t.toLowerCase()))?.toLowerCase() || "dinner";
  };
  const mealType = getMealType();

  return (
    <Card style={styles.recipeItem} onPress={() => router.push(`/recipe/${recipe._id}` as any)}>
      {recipe.isGlobal && (
        <View style={styles.globalBadge}>
          <Ionicons name="globe-outline" size={12} color={colors.primary} />
          <Text style={styles.globalBadgeText}>GLOBAL</Text>
        </View>
      )}

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

      <Pressable
        style={({ pressed }) => [
          styles.favoriteButton,
          pressed && styles.favoriteButtonPressed,
        ]}
        onPress={handleToggleFavorite}
        hitSlop={8}
      >
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

// Multi-select chip for filter sheet
function SheetChip({
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
      style={[styles.sheetChip, active && styles.sheetChipActive]}
    >
      <Text style={[styles.sheetChipText, active && styles.sheetChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function RecipesScreen() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(filter || "all");

  useEffect(() => {
    if (filter) {
      setActiveFilter(filter);
    }
  }, [filter]);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
  // Pending filters while the sheet is open (applied on "Apply")
  const [pendingFilters, setPendingFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);

  // Fetch recipes from Convex
  const MEAL_TYPE_FILTERS = ["breakfast", "lunch", "dinner", "snack"];
  const allRecipes = useQuery(api.recipes.list, {
    includeGlobal:
      activeFilter === "all" ||
      activeFilter === "global" ||
      activeFilter === "cooked" ||
      MEAL_TYPE_FILTERS.includes(activeFilter),
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
    { id: "cooked", label: "Cooked" },
  ];

  // Count active advanced filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.cookTime !== null) count++;
    count += advancedFilters.difficulty.length;
    count += advancedFilters.cuisine.length;
    count += advancedFilters.dietary.length;
    return count;
  }, [advancedFilters]);

  // Extract unique cuisines from loaded recipes
  const availableCuisines = useMemo(() => {
    if (!allRecipes) return [...CUISINE_OPTIONS];
    const recipeCuisines = new Set<string>();
    (allRecipes as ConvexRecipe[]).forEach((r) => {
      r.tags?.forEach((tag: string) => {
        const normalized = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
        if (CUISINE_OPTIONS.includes(normalized as any)) {
          recipeCuisines.add(normalized);
        }
      });
    });
    // If recipes have cuisines, show those first; otherwise fallback to all options
    return recipeCuisines.size > 0
      ? Array.from(recipeCuisines).sort()
      : [...CUISINE_OPTIONS];
  }, [allRecipes]);

  // Apply advanced filters to a recipe list
  const applyAdvancedFilters = (recipes: ConvexRecipe[]): ConvexRecipe[] => {
    if (activeFilterCount === 0) return recipes;

    return recipes.filter((recipe) => {
      // Cook time filter
      if (advancedFilters.cookTime !== null) {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        if (totalTime > advancedFilters.cookTime) return false;
      }

      // Difficulty filter
      if (advancedFilters.difficulty.length > 0) {
        if (!recipe.difficulty || !advancedFilters.difficulty.includes(recipe.difficulty)) {
          return false;
        }
      }

      // Cuisine filter
      if (advancedFilters.cuisine.length > 0) {
        const recipeTags = recipe.tags?.map((t: string) => t.toLowerCase()) || [];
        const hasCuisine = advancedFilters.cuisine.some((c) =>
          recipeTags.includes(c.toLowerCase())
        );
        if (!hasCuisine) return false;
      }

      // Dietary filter
      if (advancedFilters.dietary.length > 0) {
        const recipeTags = recipe.tags?.map((t: string) => t.toLowerCase()) || [];
        const hasDietary = advancedFilters.dietary.some((d) =>
          recipeTags.includes(d.toLowerCase())
        );
        if (!hasDietary) return false;
      }

      return true;
    });
  };

  // Filter recipes based on active tab filter
  const getBaseFilteredRecipes = (): ConvexRecipe[] => {
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

    if (activeFilter === "cooked") {
      return (allRecipes as ConvexRecipe[]).filter(r => (r.cookCount || 0) > 0);
    }

    // Filter by meal type tag
    return (allRecipes as ConvexRecipe[]).filter((r) =>
      r.tags?.some((t: string) => t.toLowerCase() === activeFilter)
    );
  };

  const baseRecipes = getBaseFilteredRecipes();
  const filteredRecipes = applyAdvancedFilters(baseRecipes);

  // Preview count for pending filters in the sheet
  const pendingFilteredCount = useMemo(() => {
    const base = getBaseFilteredRecipes();
    const pendingCount =
      (pendingFilters.cookTime !== null ? 1 : 0) +
      pendingFilters.difficulty.length +
      pendingFilters.cuisine.length +
      pendingFilters.dietary.length;

    if (pendingCount === 0) return base.length;

    return base.filter((recipe) => {
      if (pendingFilters.cookTime !== null) {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        if (totalTime > pendingFilters.cookTime) return false;
      }
      if (pendingFilters.difficulty.length > 0) {
        if (!recipe.difficulty || !pendingFilters.difficulty.includes(recipe.difficulty)) {
          return false;
        }
      }
      if (pendingFilters.cuisine.length > 0) {
        const recipeTags = recipe.tags?.map((t: string) => t.toLowerCase()) || [];
        if (!pendingFilters.cuisine.some((c) => recipeTags.includes(c.toLowerCase()))) return false;
      }
      if (pendingFilters.dietary.length > 0) {
        const recipeTags = recipe.tags?.map((t: string) => t.toLowerCase()) || [];
        if (!pendingFilters.dietary.some((d) => recipeTags.includes(d.toLowerCase()))) return false;
      }
      return true;
    }).length;
  }, [pendingFilters, allRecipes, searchResults, favoriteRecipes, activeFilter, searchQuery]);

  // Toggle a value in a multi-select array
  const togglePendingMultiSelect = (
    key: "difficulty" | "cuisine" | "dietary",
    value: string
  ) => {
    setPendingFilters((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const handleOpenFilterSheet = () => {
    setPendingFilters(advancedFilters);
    setShowFilterSheet(true);
  };

  const handleApplyFilters = () => {
    setAdvancedFilters(pendingFilters);
    setShowFilterSheet(false);
  };

  const handleResetFilters = () => {
    setPendingFilters(DEFAULT_FILTERS);
  };

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
        <View>
          <IconButton
            icon="options-outline"
            variant="default"
            onPress={handleOpenFilterSheet}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </View>
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
        {activeFilterCount > 0 && " (filtered)"}
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
            <Text style={styles.emptyStateText}>
              {activeFilterCount > 0 ? "No recipes match your filters" : "No recipes found"}
            </Text>
            {activeFilterCount > 0 && (
              <Pressable
                style={styles.clearFiltersButton}
                onPress={() => setAdvancedFilters(DEFAULT_FILTERS)}
              >
                <Text style={styles.clearFiltersText}>CLEAR FILTERS</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterSheet}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <Pressable
            style={styles.sheetBackdrop}
            onPress={() => setShowFilterSheet(false)}
          />
          <Animated.View
            style={styles.sheetContainer}
            entering={FadeIn.duration(200)}
          >
            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>FILTER RECIPES</Text>
              <Pressable style={styles.resetButton} onPress={handleResetFilters}>
                <Ionicons name="refresh" size={16} color={colors.accent} />
                <Text style={styles.resetButtonText}>RESET</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.sheetContent}
              contentContainerStyle={styles.sheetContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Cook Time Section */}
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>COOK TIME</Text>
                <View style={styles.sheetChipRow}>
                  {COOK_TIME_OPTIONS.map((option) => (
                    <SheetChip
                      key={option.label}
                      label={option.label}
                      active={pendingFilters.cookTime === option.maxMinutes}
                      onPress={() =>
                        setPendingFilters((prev) => ({
                          ...prev,
                          cookTime:
                            prev.cookTime === option.maxMinutes ? null : option.maxMinutes,
                        }))
                      }
                    />
                  ))}
                </View>
              </View>

              {/* Difficulty Section */}
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>DIFFICULTY</Text>
                <View style={styles.sheetChipRow}>
                  {["easy", "medium", "hard"].map((level) => (
                    <SheetChip
                      key={level}
                      label={level.charAt(0).toUpperCase() + level.slice(1)}
                      active={pendingFilters.difficulty.includes(level)}
                      onPress={() => togglePendingMultiSelect("difficulty", level)}
                    />
                  ))}
                </View>
              </View>

              {/* Cuisine Section */}
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>CUISINE</Text>
                <View style={styles.sheetChipRow}>
                  {availableCuisines.map((cuisine) => (
                    <SheetChip
                      key={cuisine}
                      label={cuisine}
                      active={pendingFilters.cuisine.includes(cuisine)}
                      onPress={() => togglePendingMultiSelect("cuisine", cuisine)}
                    />
                  ))}
                </View>
              </View>

              {/* Dietary Section */}
              <View style={styles.sheetSection}>
                <Text style={styles.sheetSectionTitle}>DIETARY</Text>
                <View style={styles.sheetChipRow}>
                  {DIETARY_OPTIONS.map((option) => (
                    <SheetChip
                      key={option}
                      label={option}
                      active={pendingFilters.dietary.includes(option)}
                      onPress={() => togglePendingMultiSelect("dietary", option)}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <View style={styles.sheetFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.applyButtonPressed,
                ]}
                onPress={handleApplyFilters}
              >
                <Text style={styles.applyButtonText}>
                  APPLY FILTERS ({pendingFilteredCount})
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

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
    minHeight: 60,
    maxHeight: 65,
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
    ...shadows.sm,
  },
  filterChipActive: {
    backgroundColor: colors.accent,    
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
  favoriteButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.85 }],
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

  // Filter badge on icon
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.accent,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },

  // Clear filters button in empty state
  clearFiltersButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.accent,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  clearFiltersText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },

  // Bottom sheet modal
  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheetContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    borderWidth: borders.thick,
    borderBottomWidth: 0,
    borderColor: borders.color,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: colors.accent,
    borderRadius: borderRadius.lg,
  },
  resetButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wide,
  },
  sheetContent: {
    flexShrink: 1,
  },
  sheetContentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sheetSection: {
    marginBottom: spacing.xl,
  },
  sheetSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.md,
  },
  sheetChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  sheetChip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
  },
  sheetChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.xs,
  },
  sheetChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  sheetChipTextActive: {
    color: colors.textLight,
    fontWeight: typography.weights.bold,
  },
  sheetFooter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: borders.thin,
    borderTopColor: borders.color,
  },
  applyButton: {
    backgroundColor: colors.text,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  applyButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  applyButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
});
