import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { api } from "../convex/_generated/api";

import { RecipeCard, RecipeCardData } from "../src/components/RecipeCard";
import { ServingsBottomSheet } from "../src/components/ServingsBottomSheet";
import { IconButton, Input } from "../src/components/ui";
import {
  COOK_TIME_OPTIONS,
  CUISINE_OPTIONS,
  DIETARY_OPTIONS,
} from "../src/constants/dietary";
import { useToast } from "../src/hooks/useToast";
import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

// Advanced filter state
type RecipeFilters = {
  cookTime: number | null;
  difficulty: string[];
  cuisine: string[];
  dietary: string[];
};

const DEFAULT_FILTERS: RecipeFilters = {
  cookTime: null,
  difficulty: [],
  cuisine: [],
  dietary: [],
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

export default function SelectRecipeScreen() {
  const params = useLocalSearchParams<{ date: string; mealType: string }>();
  const { date, mealType } = params;

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState(mealType || "all");
  const [targetMealType] = useState(mealType);
  const [targetDate] = useState(date);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeCardData | null>(null);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
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

  const addMealMutation = useMutation(api.mealPlans.addMeal);
  const { showError } = useToast();

  const filters = [
    { id: "all", label: "All" },
    { id: "my-recipes", label: "My Recipes" },
    { id: "global", label: "Global" },
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snack", label: "Snack" },
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
    (allRecipes as RecipeCardData[]).forEach((r) => {
      r.tags?.forEach((tag: string) => {
        const normalized = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
        if (CUISINE_OPTIONS.includes(normalized as any)) {
          recipeCuisines.add(normalized);
        }
      });
    });
    return recipeCuisines.size > 0
      ? Array.from(recipeCuisines).sort()
      : [...CUISINE_OPTIONS];
  }, [allRecipes]);

  // Apply advanced filters to a recipe list
  const applyAdvancedFilters = (recipes: RecipeCardData[]): RecipeCardData[] => {
    if (activeFilterCount === 0) return recipes;
    return recipes.filter((recipe) => {
      if (advancedFilters.cookTime !== null) {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        if (totalTime > advancedFilters.cookTime) return false;
      }
      if (advancedFilters.difficulty.length > 0) {
        if (!recipe.difficulty || !advancedFilters.difficulty.includes(recipe.difficulty)) return false;
      }
      if (advancedFilters.cuisine.length > 0) {
        const recipeTags = recipe.tags?.map((t: string) => t.toLowerCase()) || [];
        if (!advancedFilters.cuisine.some((c) => recipeTags.includes(c.toLowerCase()))) return false;
      }
      if (advancedFilters.dietary.length > 0) {
        const recipeTags = recipe.tags?.map((t: string) => t.toLowerCase()) || [];
        if (!advancedFilters.dietary.some((d) => recipeTags.includes(d.toLowerCase()))) return false;
      }
      return true;
    });
  };

  // Filter recipes based on active filter and search
  const baseRecipes = useMemo((): RecipeCardData[] => {
    if (searchQuery && searchResults) {
      return searchResults as unknown as RecipeCardData[];
    }
    if (!allRecipes) return [];
    if (activeFilter === "all") {
      return allRecipes as RecipeCardData[];
    }
    if (activeFilter === "my-recipes") {
      return (allRecipes as RecipeCardData[]).filter(r => !r.isGlobal);
    }
    if (activeFilter === "global") {
      return (allRecipes as RecipeCardData[]).filter(r => r.isGlobal);
    }
    if (activeFilter === "favorites") {
      return (favoriteRecipes || []) as RecipeCardData[];
    }
    if (activeFilter === "cooked") {
      return (allRecipes as RecipeCardData[]).filter(r => (r.cookCount || 0) > 0);
    }
    // Filter by meal type tag
    return (allRecipes as RecipeCardData[]).filter((r) =>
      r.tags?.some((t: string) => t.toLowerCase() === activeFilter)
    );
  }, [searchQuery, searchResults, allRecipes, activeFilter, favoriteRecipes]);

  const filteredRecipes = applyAdvancedFilters(baseRecipes);

  // Preview count for pending filters in the sheet
  const pendingFilteredCount = useMemo(() => {
    const pendingCount =
      (pendingFilters.cookTime !== null ? 1 : 0) +
      pendingFilters.difficulty.length +
      pendingFilters.cuisine.length +
      pendingFilters.dietary.length;
    if (pendingCount === 0) return baseRecipes.length;
    return baseRecipes.filter((recipe) => {
      if (pendingFilters.cookTime !== null) {
        const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
        if (totalTime > pendingFilters.cookTime) return false;
      }
      if (pendingFilters.difficulty.length > 0) {
        if (!recipe.difficulty || !pendingFilters.difficulty.includes(recipe.difficulty)) return false;
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
  }, [pendingFilters, baseRecipes]);

  const togglePendingMultiSelect = (key: "difficulty" | "cuisine" | "dietary", value: string) => {
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

  // Handle recipe selection — show servings picker
  const handleSelectRecipe = (recipe: RecipeCardData) => {
    setSelectedRecipe(recipe);
  };

  // Confirm add with chosen servings
  const handleConfirmAdd = async (servings: number) => {
    if (!targetDate || !targetMealType || !selectedRecipe) return;

    try {
      await addMealMutation({
        date: targetDate,
        mealType: targetMealType as "breakfast" | "lunch" | "dinner" | "snack",
        recipeId: selectedRecipe._id,
        servings,
      });
      router.back();
    } catch {
      showError("Failed to add meal. Please try again.");
    }
  };

  // Get meal type label for header
  const getMealTypeLabel = () => {
    switch (targetMealType) {
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
          <View style={styles.headerButtonSpacer} />
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
          {targetDate && (
            <Text style={styles.headerSubtitle}>
              {new Date(targetDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
          )}
        </View>
        <View style={styles.headerButtonSpacer} />
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
            accessibilityLabel="Filter options"
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
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? "s" : ""} available
        {activeFilterCount > 0 && " (filtered)"}
      </Text>

      {/* Recipe list */}
      <FlatList
        data={filteredRecipes}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <RecipeCard
            recipe={item}
            action={{ type: "add", onPress: handleSelectRecipe }}
            onCardPress={(recipe) => router.push(`/recipe/${recipe._id}` as any)}
            index={index}
          />
        )}
        contentContainerStyle={styles.recipeList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={60} color={colors.textMuted} />
            <Text style={styles.emptyStateText}>
              {activeFilterCount > 0 ? "No recipes match your filters" : "No recipes found"}
            </Text>
            {activeFilterCount > 0 ? (
              <Pressable
                style={styles.clearFiltersButton}
                onPress={() => setAdvancedFilters(DEFAULT_FILTERS)}
              >
                <Text style={styles.clearFiltersText}>CLEAR FILTERS</Text>
              </Pressable>
            ) : (
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or filters
              </Text>
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
                          cookTime: prev.cookTime === option.maxMinutes ? null : option.maxMinutes,
                        }))
                      }
                    />
                  ))}
                </View>
              </View>

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

      {/* Servings picker overlay */}
      <ServingsBottomSheet
        visible={!!selectedRecipe}
        currentServings={selectedRecipe?.servings ?? 1}
        recipeName={selectedRecipe?.title ?? ""}
        onSave={handleConfirmAdd}
        onClose={() => setSelectedRecipe(null)}
        confirmLabel="ADD MEAL"
        hint="Choose how many servings to add to your meal plan"
        alwaysEnabled
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
  headerButtonSpacer: {
    width: 44,
    height: 44,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
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
    paddingBottom: 100,
    gap: spacing.md,
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

const SCREEN_HEIGHT = Dimensions.get("window").height;
