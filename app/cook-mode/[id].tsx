import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

import {
  borderRadius,
  borders,
  colors,
  getMealTypeColor,
  shadows,
  spacing,
  typography,
} from "../../src/styles/neobrutalism";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CookModeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentStep, setCurrentStep] = useState(0);
  const [screenAlwaysOn, setScreenAlwaysOn] = useState(true);

  const recordCookCompletion = useMutation(api.recipes.recordCookCompletion);

  // Fetch recipe from Convex
  const recipe = useQuery(
    api.recipes.getById,
    id ? { id: id as Id<"recipes"> } : "skip",
  );

  // Loading state
  if (recipe === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

  const totalSteps = recipe.steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const step = recipe.steps[currentStep];

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finished cooking — record completion then navigate back
      await recordCookCompletion({ recipeId: id as Id<"recipes"> });
      router.back();
    }
  };

  // Determine step category based on keywords
  const getStepCategory = (instruction: string) => {
    const lower = instruction.toLowerCase();
    if (
      lower.includes("prep") ||
      lower.includes("chop") ||
      lower.includes("cut") ||
      lower.includes("dice")
    ) {
      return "PREPARATION";
    }
    if (
      lower.includes("cook") ||
      lower.includes("heat") ||
      lower.includes("fry") ||
      lower.includes("boil") ||
      lower.includes("bake")
    ) {
      return "COOKING";
    }
    if (
      lower.includes("mix") ||
      lower.includes("stir") ||
      lower.includes("combine") ||
      lower.includes("whisk")
    ) {
      return "MIXING";
    }
    if (
      lower.includes("serve") ||
      lower.includes("plate") ||
      lower.includes("garnish")
    ) {
      return "PLATING";
    }
    return "STEP";
  };

  const stepCategory = getStepCategory(step.instruction);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.duration(300)}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.recipeTitle} numberOfLines={1}>
          {recipe.title}
        </Text>

        <Pressable style={styles.voiceButton}>
          <Ionicons name="mic-outline" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* Step Indicator & Progress */}
      <Animated.View
        style={styles.progressSection}
        entering={FadeInDown.delay(100).duration(300)}
      >
        <View style={styles.stepIndicatorRow}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Step {currentStep + 1} of {totalSteps}
            </Text>
          </View>

          <Pressable
            style={styles.screenToggle}
            onPress={() => setScreenAlwaysOn(!screenAlwaysOn)}
          >
            <View
              style={[
                styles.toggleDot,
                screenAlwaysOn && styles.toggleDotActive,
              ]}
            />
            <Text style={styles.screenToggleText}>SCREEN ALWAYS ON</Text>
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Image */}
        <Animated.View
          key={`image-${currentStep}`}
          style={styles.stepImageContainer}
          entering={FadeIn.duration(400)}
        >
          <View
            style={[
              styles.stepImage,
              {
                backgroundColor: getMealTypeColor(
                  recipe.tags
                    ?.find((t) =>
                      ["breakfast", "lunch", "dinner", "snack"].includes(
                        t.toLowerCase(),
                      ),
                    )
                    ?.toLowerCase() || "dinner",
                ),
              },
            ]}
          >
            <Text style={styles.stepImageEmoji}>
              {stepCategory === "PREPARATION"
                ? "🔪"
                : stepCategory === "COOKING"
                ? "🍳"
                : stepCategory === "MIXING"
                ? "🥄"
                : stepCategory === "PLATING"
                ? "🍽️"
                : "👨‍🍳"}
            </Text>
          </View>
        </Animated.View>

        {/* Step Card */}
        <Animated.View
          key={`card-${currentStep}`}
          style={styles.stepCard}
          entering={FadeInDown.delay(200).duration(400)}
        >
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{stepCategory}</Text>
          </View>

          {/* Instruction */}
          <Text style={styles.stepInstruction}>{step.instruction}</Text>

          {/* Timer if available */}
          {step.timerMinutes && (
            <View style={styles.timerRow}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.timerText}>
                Est. {step.timerMinutes} mins
              </Text>
            </View>
          )}

          {/* Tips if available */}
          {step.tips && (
            <View style={styles.tipsContainer}>
              <View style={styles.tipsBadge}>
                <Ionicons name="bulb-outline" size={14} color={colors.text} />
                <Text style={styles.tipsBadgeText}>TIP</Text>
              </View>
              <Text style={styles.tipsText}>{step.tips}</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Navigation Buttons */}
      <Animated.View
        style={styles.navigationButtons}
        entering={FadeInDown.delay(300).duration(400)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            styles.prevButton,
            currentStep === 0 && styles.navButtonDisabled,
            pressed && currentStep > 0 && styles.buttonPressed,
          ]}
          onPress={goToPrevStep}
          disabled={currentStep === 0}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={currentStep === 0 ? colors.textMuted : colors.text}
          />
          <Text
            style={[
              styles.navButtonText,
              currentStep === 0 && styles.navButtonTextDisabled,
            ]}
          >
            Previous
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.navButton,
            styles.nextButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={goToNextStep}
        >
          <Text style={styles.navButtonText}>
            {currentStep === totalSteps - 1 ? "Finish" : "Next Step"}
          </Text>
          <Ionicons name="arrow-forward" size={20} color={colors.text} />
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
    paddingVertical: spacing.md,
  },
  closeButton: {
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
  recipeTitle: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: "center",
    marginHorizontal: spacing.md,
  },
  voiceButton: {
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
  progressSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  stepBadge: {
    backgroundColor: colors.magenta,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  stepBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
  },
  screenToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggleDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: borders.color,
  },
  toggleDotActive: {
    backgroundColor: colors.primary,
  },
  screenToggleText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.magenta,
    borderRadius: borderRadius.full,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  stepImageContainer: {
    marginBottom: spacing.lg,
  },
  stepImage: {
    height: 180,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  stepImageEmoji: {
    fontSize: 64,
  },
  stepCard: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    ...shadows.md,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.magentaLight,
    borderWidth: borders.thin,
    borderColor: colors.magenta,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  categoryBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.magenta,
    letterSpacing: typography.letterSpacing.wider,
  },
  stepInstruction: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    lineHeight: typography.sizes.xl * typography.lineHeights.normal,
    marginBottom: spacing.lg,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  timerText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  tipsContainer: {
    marginTop: spacing.lg,
    backgroundColor: colors.secondary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  tipsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  tipsBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  tipsText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  navigationButtons: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  prevButton: {
    backgroundColor: colors.surface,
  },
  nextButton: {
    backgroundColor: colors.magenta,
    flex: 1.5,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  navButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  bottomTools: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.xxl,
    paddingVertical: spacing.lg,
    borderTopWidth: borders.thin,
    borderTopColor: colors.borderLight,
  },
  toolButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
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
