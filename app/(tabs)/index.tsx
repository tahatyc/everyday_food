import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Badge, Button } from "../../src/components/ui";
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
import { allRecipes, SeedRecipe } from "../../data/recipes";

// Quick action buttons for home screen
const quickActions = [
  { id: "add", icon: "add-circle-outline" as const, label: "Add Recipe", color: colors.primary },
  { id: "import", icon: "link-outline" as const, label: "Import URL", color: colors.secondary },
  { id: "plan", icon: "calendar-outline" as const, label: "Plan Meal", color: colors.accent },
  { id: "shop", icon: "cart-outline" as const, label: "Shopping", color: colors.success },
];

// Recipe card component
function RecipeCard({ recipe }: { recipe: SeedRecipe }) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <Card style={styles.recipeCard} onPress={() => {}}>
      {/* Recipe image placeholder */}
      <View
        style={[
          styles.recipeImagePlaceholder,
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
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {recipe.title}
        </Text>

        <View style={styles.recipeMeta}>
          <View style={styles.recipeMetaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.recipeMetaText}>{totalTime} min</Text>
          </View>
          <Badge
            variant="default"
            size="sm"
            color={getDifficultyColor(recipe.difficulty)}
          >
            {recipe.difficulty}
          </Badge>
        </View>
      </View>
    </Card>
  );
}

// Section header component
function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function HomeScreen() {
  // Get a few recipes for display
  const featuredRecipes = allRecipes.slice(0, 4);
  const quickRecipes = allRecipes.filter(
    (r) => r.prepTime + r.cookTime <= 30
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning!</Text>
            <Text style={styles.headerTitle}>What's cooking today?</Text>
          </View>
          <Pressable style={styles.avatarContainer}>
            <Text style={styles.avatarText}>👨‍🍳</Text>
          </Pressable>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              style={({ pressed }) => [
                styles.quickActionButton,
                { backgroundColor: action.color },
                pressed && styles.quickActionPressed,
              ]}
            >
              <Ionicons name={action.icon} size={24} color={colors.text} />
              <Text style={styles.quickActionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Today's Meals */}
        <SectionHeader title="Today's Meals" actionLabel="Plan Week" />
        <Card style={styles.todayMealsCard}>
          <View style={styles.mealSlot}>
            <View style={styles.mealSlotHeader}>
              <Text style={styles.mealSlotLabel}>Breakfast</Text>
              <Badge color={colors.breakfast} size="sm">
                8:00 AM
              </Badge>
            </View>
            <Text style={styles.mealSlotEmpty}>Tap to add a meal</Text>
          </View>
          <View style={styles.mealSlotDivider} />
          <View style={styles.mealSlot}>
            <View style={styles.mealSlotHeader}>
              <Text style={styles.mealSlotLabel}>Lunch</Text>
              <Badge color={colors.lunch} size="sm">
                12:30 PM
              </Badge>
            </View>
            <Text style={styles.mealSlotEmpty}>Tap to add a meal</Text>
          </View>
          <View style={styles.mealSlotDivider} />
          <View style={styles.mealSlot}>
            <View style={styles.mealSlotHeader}>
              <Text style={styles.mealSlotLabel}>Dinner</Text>
              <Badge color={colors.dinner} size="sm">
                7:00 PM
              </Badge>
            </View>
            <Text style={styles.mealSlotEmpty}>Tap to add a meal</Text>
          </View>
        </Card>

        {/* Featured Recipes */}
        <SectionHeader title="Featured Recipes" actionLabel="See All" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipeList}
        >
          {featuredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ScrollView>

        {/* Quick Recipes */}
        <SectionHeader title="Quick Recipes (Under 30 min)" actionLabel="See All" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recipeList}
        >
          {quickRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </ScrollView>

        {/* Shopping List Preview */}
        <SectionHeader title="Shopping List" actionLabel="View All" />
        <Card style={styles.shoppingCard}>
          <View style={styles.shoppingEmpty}>
            <Ionicons name="cart-outline" size={40} color={colors.textMuted} />
            <Text style={styles.shoppingEmptyText}>
              Your shopping list is empty
            </Text>
            <Button variant="secondary" size="sm" onPress={() => {}}>
              Add Items
            </Button>
          </View>
        </Card>

        {/* Bottom spacing */}
        <View style={{ height: spacing.xxl }} />
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
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  greeting: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    backgroundColor: colors.accent,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  avatarText: {
    fontSize: 24,
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginHorizontal: spacing.xs,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  quickActionPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    ...shadows.pressed,
  },
  quickActionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionAction: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  todayMealsCard: {
    padding: spacing.md,
  },
  mealSlot: {
    paddingVertical: spacing.sm,
  },
  mealSlotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  mealSlotLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  mealSlotEmpty: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  mealSlotDivider: {
    height: 2,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  recipeList: {
    gap: spacing.md,
  },
  recipeCard: {
    width: 180,
    padding: 0,
    overflow: "hidden",
  },
  recipeImagePlaceholder: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeEmoji: {
    fontSize: 40,
  },
  recipeContent: {
    padding: spacing.md,
  },
  recipeTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  shoppingCard: {
    padding: spacing.xl,
  },
  shoppingEmpty: {
    alignItems: "center",
    gap: spacing.md,
  },
  shoppingEmptyText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});
