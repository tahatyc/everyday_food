import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import Animated, {
  FadeInDown,
  FadeInUp,
} from "react-native-reanimated";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
  getMealTypeColor,
} from "../../src/styles/neobrutalism";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2;

// Recipe type from Convex
type ConvexRecipe = {
  _id: Id<"recipes">;
  title: string;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  tags?: string[];
};

// Get meal type from tags
function getMealTypeFromTags(tags?: string[]): string {
  if (!tags) return "dinner";
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
  return tags.find(t => mealTypes.includes(t.toLowerCase()))?.toLowerCase() || "dinner";
}

// Recipe Grid Card
function RecipeGridCard({
  recipe,
  index,
}: {
  recipe: ConvexRecipe;
  index: number;
}) {
  const totalTime = recipe.totalTime || (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const mealType = getMealTypeFromTags(recipe.tags);

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
        onPress={() => router.push(`/recipe/${recipe._id}` as any)}
      >
        {/* Recipe Image */}
        <View
          style={[
            styles.gridCardImage,
            { backgroundColor: getMealTypeColor(mealType) },
          ]}
        >
          <Text style={styles.gridCardEmoji}>
            {mealType === "breakfast"
              ? "🍳"
              : mealType === "lunch"
              ? "🥗"
              : mealType === "dinner"
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
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch cookbook from Convex
  const cookbook = useQuery(
    api.cookbooks.getById,
    id ? { id: id as Id<"cookbooks"> } : "skip"
  );

  // Loading state
  if (cookbook === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading cookbook...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Not found state
  if (!cookbook) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>📚</Text>
          <Text style={styles.errorTitle}>Cookbook not found</Text>
          <Pressable style={styles.backButtonLarge} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const recipes = cookbook.recipes || [];

  const filters = [
    { id: "all", label: `${recipes.length} RECIPES` },
    { id: "curated", label: "CURATED BY YOU" },
    { id: "public", label: "PUBLIC" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View
        style={[styles.header, { backgroundColor: cookbook.color || colors.magentaLight }]}
        entering={FadeInDown.duration(300)}
      >
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>{cookbook.name?.toUpperCase() || "COOKBOOK"}</Text>

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
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  backButtonLarge: {
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    ...shadows.md,
  },
  backButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
