import React, { useEffect } from "react";
import { Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import {
  colors,
  borders,
  borderRadius,
  spacing,
  typography,
  shadows,
} from "../../styles/neobrutalism";
import { useGamificationStore } from "../../stores/gamificationStore";

export function XPToast() {
  const { pendingXPToast, dismiss } = useGamificationStore();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (pendingXPToast) {
      // Animate in
      translateY.value = withSequence(
        withTiming(0, { duration: 300 }),
        withDelay(
          2000,
          withTiming(-100, { duration: 300 })
        )
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(
          2000,
          withTiming(0, { duration: 300 }, () => {
            runOnJS(dismiss)();
          })
        )
      );
    }
  }, [pendingXPToast]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!pendingXPToast) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Text style={styles.xpText}>+{pendingXPToast.amount} XP</Text>
      <Text style={styles.actionText}>{formatAction(pendingXPToast.action)}</Text>
    </Animated.View>
  );
}

function formatAction(action: string): string {
  const labels: Record<string, string> = {
    cook_complete: "Recipe Cooked!",
    meal_plan_add: "Meal Planned!",
    shopping_list_complete: "Shopping Done!",
    recipe_create: "Recipe Created!",
    recipe_share: "Recipe Shared!",
    friend_added: "New Friend!",
    daily_login: "Welcome Back!",
    recipe_favorite: "Favorited!",
  };
  return labels[action] || "Action Complete!";
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    zIndex: 9999,
    ...shadows.md,
  },
  xpText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  actionText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
