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

interface LevelBadgeProps {
  level: number;
  title: string;
  compact?: boolean;
}

export function LevelBadge({ level, title, compact = false }: LevelBadgeProps) {
  const badgeColor =
    level >= 9
      ? colors.secondary
      : level >= 7
        ? colors.primary
        : level >= 4
          ? colors.info
          : colors.surfaceAlt;

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: badgeColor }]}>
        <Text style={styles.compactLevel}>{level}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: badgeColor }]}>
      <View style={styles.levelCircle}>
        <Text style={styles.levelNumber}>{level}</Text>
      </View>
      <View>
        <Text style={styles.title}>{title.toUpperCase()}</Text>
        <Text style={styles.subtitle}>LEVEL {level}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.xs,
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
  },
  levelNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
  },
  compactContainer: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    borderWidth: borders.thin,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
  },
  compactLevel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
});
