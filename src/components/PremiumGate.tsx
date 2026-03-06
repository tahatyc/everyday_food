import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubscription } from "../hooks/useSubscription";
import {
  borders,
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from "../styles/neobrutalism";

interface PremiumGateProps {
  feature: string;
  current: number;
  limit: number;
  children: React.ReactNode;
}

export function PremiumGate({
  feature,
  current,
  limit,
  children,
}: PremiumGateProps) {
  const { isPro, openPaywall } = useSubscription();

  if (isPro || current < limit) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        <Ionicons name="lock-closed" size={20} color={colors.accent} />
        <Text style={styles.title}>LIMIT REACHED</Text>
      </View>
      <Text style={styles.description}>
        You've used {current}/{limit} {feature}. Upgrade to Pro for unlimited
        access.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.upgradeButton,
          pressed && styles.upgradeButtonPressed,
        ]}
        onPress={openPaywall}
      >
        <Ionicons name="star" size={16} color={colors.textLight} />
        <Text style={styles.upgradeText}>UPGRADE TO PRO</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.accent,
    letterSpacing: typography.letterSpacing.wider,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.5,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    marginTop: spacing.xs,
    ...shadows.sm,
  },
  upgradeButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  upgradeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
});
