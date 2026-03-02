import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  colors,
  borders,
  borderRadius,
  spacing,
  typography,
} from "../../styles/neobrutalism";

interface XPProgressBarProps {
  xpProgress: number;
  xpForNext: number;
  level: number;
  compact?: boolean;
}

export function XPProgressBar({
  xpProgress,
  xpForNext,
  level,
  compact = false,
}: XPProgressBarProps) {
  const progress = xpForNext > 0 ? Math.min(xpProgress / xpForNext, 1) : 1;

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactBarBackground}>
          <View
            style={[styles.compactBarFill, { width: `${progress * 100}%` }]}
          />
        </View>
        <Text style={styles.compactLabel}>
          {xpProgress}/{xpForNext} XP
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.levelText}>LEVEL {level}</Text>
        <Text style={styles.xpText}>
          {xpProgress} / {xpForNext} XP
        </Text>
      </View>
      <View style={styles.barBackground}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  levelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  xpText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  barBackground: {
    height: 14,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
  },
  compactContainer: {
    width: "100%",
  },
  compactBarBackground: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: borders.color,
    borderRadius: borderRadius.xs,
    overflow: "hidden",
  },
  compactBarFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
  },
  compactLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
});
