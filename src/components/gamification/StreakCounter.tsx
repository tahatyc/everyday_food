import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  borders,
  borderRadius,
  spacing,
  typography,
  shadows,
} from "../../styles/neobrutalism";

interface StreakCounterProps {
  currentStreak: number;
  compact?: boolean;
}

export function StreakCounter({
  currentStreak,
  compact = false,
}: StreakCounterProps) {
  const isActive = currentStreak > 0;
  const flameColor = isActive ? colors.accent : colors.textMuted;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Ionicons name="flame" size={16} color={flameColor} />
        <Text style={[styles.compactCount, isActive && styles.activeText]}>
          {currentStreak}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.flameContainer, isActive && styles.flameActive]}>
        <Ionicons name="flame" size={28} color={flameColor} />
      </View>
      <View>
        <Text style={[styles.count, isActive && styles.activeText]}>
          {currentStreak}
        </Text>
        <Text style={styles.label}>
          {currentStreak === 1 ? "DAY" : "DAYS"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.xs,
  },
  flameContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  flameActive: {
    backgroundColor: "#FFF0E0",
  },
  count: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.textMuted,
  },
  activeText: {
    color: colors.accent,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wider,
  },
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  compactCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
});
