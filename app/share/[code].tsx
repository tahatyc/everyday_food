import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  borderRadius,
  borders,
  colors,
  getMealTypeColor,
  shadows,
  spacing,
  typography,
} from "../../src/styles/neobrutalism";

export default function SharedRecipeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();

  const result = useQuery(
    api.public.getRecipeByShareCode,
    code ? { code } : "skip"
  );
  const recordAccess = useMutation(api.public.recordShareLinkAccess);

  // Record access when page loads
  useEffect(() => {
    if (code && result && !result.error) {
      recordAccess({ code });
    }
  }, [code, result?.error]);

  // Loading state
  if (result === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading shared recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (result.error || !result.recipe) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Ionicons name="link-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={styles.errorTitle}>
            {result.error === "Share link not found"
              ? "Link Not Found"
              : result.error === "This share link has been revoked"
              ? "Link Revoked"
              : result.error === "This share link has expired"
              ? "Link Expired"
              : "Unable to Load"}
          </Text>
          <Text style={styles.errorSubtitle}>
            {result.error === "Share link not found"
              ? "This share link doesn't exist or may have been deleted."
              : result.error === "This share link has been revoked"
              ? "The owner has revoked access to this recipe."
              : result.error === "This share link has expired"
              ? "This share link is no longer valid."
              : "Something went wrong. Please try again."}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.backButtonText}>GO HOME</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const recipe = result.recipe;

  // Get meal type for color
  const getMealType = (): string => {
    if (recipe.tags) {
      const mealTypes = ["breakfast", "lunch", "dinner", "snack"];
      return (
        recipe.tags
          .find((t) => mealTypes.includes(t.toLowerCase()))
          ?.toLowerCase() || "dinner"
      );
    }
    return "dinner";
  };

  const mealType = getMealType();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.duration(300)}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)")}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>SHARED RECIPE</Text>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shared By Banner */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(300)}
          style={styles.sharedByBanner}
        >
          <Ionicons name="link" size={18} color={colors.cyan} />
          <Text style={styles.sharedByText}>
            Shared by {recipe.ownerName}
          </Text>
        </Animated.View>

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
              { backgroundColor: getMealTypeColor(mealType) },
            ]}
          >
            <Text style={styles.imageEmoji}>
              {mealType === "breakfast"
                ? "🍳"
                : mealType === "lunch"
                ? "🥗"
                : mealType === "dinner"
                ? "🍝"
                : "🍪"}
            </Text>
          </View>
        </Animated.View>

        {/* Recipe Info */}
        <Animated.View
          style={styles.infoSection}
          entering={FadeInUp.delay(250).duration(400)}
        >
          <View style={styles.infoItem}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoLabel}>
              Prep: {recipe.prepTime || "—"} min
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="flame-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoLabel}>
              Cook: {recipe.cookTime || "—"} min
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons
              name="people-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text style={styles.infoLabel}>{recipe.servings} servings</Text>
          </View>
        </Animated.View>

        {/* Description */}
        {recipe.description && (
          <Animated.View
            style={styles.descriptionContainer}
            entering={FadeInDown.delay(300).duration(400)}
          >
            <Text style={styles.descriptionText}>{recipe.description}</Text>
          </Animated.View>
        )}

        {/* Ingredients Section */}
        <Animated.View entering={FadeInDown.delay(350).duration(400)}>
          <Text style={styles.sectionTitle}>INGREDIENTS</Text>
          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientBullet} />
                <Text style={styles.ingredientText}>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                  {ingredient.preparation ? `, ${ingredient.preparation}` : ""}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Steps Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>INSTRUCTIONS</Text>
          <View style={styles.stepsList}>
            {recipe.steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step.instruction}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Sign Up CTA */}
        <Animated.View
          style={styles.ctaContainer}
          entering={FadeInDown.delay(500).duration(400)}
        >
          <Text style={styles.ctaTitle}>LIKE THIS RECIPE?</Text>
          <Text style={styles.ctaSubtitle}>
            Sign up to save recipes and create your own collection
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/(auth)/register" as any)}
          >
            <Text style={styles.ctaButtonText}>SIGN UP FREE</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.text} />
          </Pressable>
        </Animated.View>

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
    gap: spacing.md,
  },
  errorIcon: {
    width: 100,
    height: 100,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  backButton: {
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  backButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
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
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  sharedByBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.cyanLight,
    borderWidth: borders.thin,
    borderColor: colors.cyan,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: "flex-start",
  },
  sharedByText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.cyan,
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
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  descriptionContainer: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  descriptionText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    marginBottom: spacing.md,
  },
  ingredientsList: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  ingredientBullet: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    marginTop: 6,
    marginRight: spacing.md,
  },
  ingredientText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  stepsList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    borderWidth: borders.thin,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  stepText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  ctaContainer: {
    backgroundColor: colors.primaryLight,
    borderWidth: borders.regular,
    borderColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
    ...shadows.md,
  },
  ctaTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  ctaSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.md,
  },
  ctaButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  bottomSpacer: {
    height: spacing.xxxxl,
  },
});
