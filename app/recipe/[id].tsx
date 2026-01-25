import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
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
import { getRecipeById, SeedRecipe, SeedIngredient } from "../../data/recipes";

// Nutrition Card Component
function NutritionCard({
  label,
  value,
  unit,
  color,
  index,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInUp.delay(300 + index * 50).duration(400)}
      style={[styles.nutritionCard, { backgroundColor: color }]}
    >
      <Text style={styles.nutritionLabel}>{label}</Text>
      <Text style={styles.nutritionValue}>
        {value}
        <Text style={styles.nutritionUnit}>{unit}</Text>
      </Text>
    </Animated.View>
  );
}

// Ingredient Item Component
function IngredientItem({
  ingredient,
  checked,
  onToggle,
  index,
}: {
  ingredient: SeedIngredient;
  checked: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(500 + index * 30).duration(300)}
    >
      <Pressable
        style={[styles.ingredientItem, checked && styles.ingredientItemChecked]}
        onPress={onToggle}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && (
            <Ionicons name="checkmark" size={14} color={colors.textLight} />
          )}
        </View>
        <Text style={[styles.ingredientText, checked && styles.ingredientTextChecked]}>
          {ingredient.amount} {ingredient.unit} {ingredient.name}
          {ingredient.preparation ? `, ${ingredient.preparation}` : ""}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipe = getRecipeById(id || "");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [isFavorite, setIsFavorite] = useState(false);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
          <Pressable
            style={styles.backButtonLarge}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const toggleIngredient = (index: number) => {
    setCheckedIngredients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const nutritionData = [
    { label: "CALORIES", value: recipe.nutrition?.calories || 0, unit: "", color: colors.surface },
    { label: "CARBS", value: recipe.nutrition?.carbs || 0, unit: "g", color: colors.magenta },
    { label: "PROTEIN", value: recipe.nutrition?.protein || 0, unit: "g", color: colors.primary },
    { label: "FATS", value: recipe.nutrition?.fat || 0, unit: "g", color: colors.secondary },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeInDown.duration(300)}
      >
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>RECIPE</Text>

        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerButton, isFavorite && styles.headerButtonActive]}
            onPress={() => setIsFavorite(!isFavorite)}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? colors.error : colors.text}
            />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </Pressable>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Source Badge */}
        {recipe.sourceUrl && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(300)}
          >
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>INSTAGRAM IMPORT</Text>
            </View>
          </Animated.View>
        )}

        {/* Recipe Title */}
        <Animated.Text
          style={styles.recipeTitle}
          entering={FadeInDown.delay(150).duration(400)}
        >
          {recipe.title.toUpperCase()}
        </Animated.Text>

        {/* Recipe Image */}
        <Animated.View
          style={styles.imageContainer}
          entering={FadeInDown.delay(200).duration(400)}
        >
          <View
            style={[
              styles.imagePlaceholder,
              { backgroundColor: getMealTypeColor(recipe.mealType[0]) },
            ]}
          >
            <Text style={styles.imageEmoji}>
              {recipe.mealType[0] === "breakfast"
                ? "🍳"
                : recipe.mealType[0] === "lunch"
                ? "🥗"
                : recipe.mealType[0] === "dinner"
                ? "🍝"
                : "🍪"}
            </Text>
          </View>
        </Animated.View>

        {/* Nutrition Grid */}
        <View style={styles.nutritionGrid}>
          {nutritionData.map((item, index) => (
            <NutritionCard
              key={item.label}
              label={item.label}
              value={item.value}
              unit={item.unit}
              color={item.color}
              index={index}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <Animated.View
          style={styles.actionRow}
          entering={FadeInDown.delay(400).duration(400)}
        >
          <Pressable style={styles.addToListButton}>
            <Ionicons name="list-outline" size={20} color={colors.text} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.startCookingButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push(`/cook-mode/${recipe.id}` as any)}
          >
            <Text style={styles.startCookingText}>START COOKING</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Ingredients Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>INGREDIENTS</Text>
          <Text style={styles.ingredientCount}>
            {checkedIngredients.size}/{recipe.ingredients.length}
          </Text>
        </View>

        <View style={styles.ingredientsList}>
          {recipe.ingredients.map((ingredient, index) => (
            <IngredientItem
              key={index}
              ingredient={ingredient}
              checked={checkedIngredients.has(index)}
              onToggle={() => toggleIngredient(index)}
              index={index}
            />
          ))}
        </View>

        {/* Recipe Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Prep: {recipe.prepTime} min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flame-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>Cook: {recipe.cookTime} min</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.infoLabel}>{recipe.servings} servings</Text>
          </View>
        </View>

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
  headerButtonActive: {
    backgroundColor: colors.magentaLight,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  sourceBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  sourceBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  recipeTitle: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    lineHeight: typography.sizes.xxxl * typography.lineHeights.tight,
    marginBottom: spacing.lg,
  },
  imageContainer: {
    borderWidth: borders.thick,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  imagePlaceholder: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  imageEmoji: {
    fontSize: 80,
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  nutritionCard: {
    flex: 1,
    minWidth: "45%",
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.xs,
  },
  nutritionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.xs,
  },
  nutritionValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  nutritionUnit: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  addToListButton: {
    width: 56,
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  startCookingButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.magenta,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  startCookingText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
  },
  ingredientCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  ingredientsList: {
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.md,
    ...shadows.xs,
  },
  ingredientItemChecked: {
    backgroundColor: colors.surfaceAlt,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.cyan,
  },
  ingredientText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  ingredientTextChecked: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  infoItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  bottomSpacer: {
    height: spacing.xxxxl,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
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
