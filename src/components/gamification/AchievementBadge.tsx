import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  borders,
  borderRadius,
  spacing,
  typography,
  shadows,
} from "../../styles/neobrutalism";

const TIER_COLORS = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const TIER_BG = {
  bronze: "#FFF0E0",
  silver: "#F5F5F5",
  gold: "#FFFBE0",
  platinum: "#F0F0FF",
};

interface AchievementBadgeProps {
  name: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  isUnlocked: boolean;
  progress: number;
  total: number;
  onPress?: () => void;
}

export function AchievementBadge({
  name,
  icon,
  tier,
  isUnlocked,
  progress,
  total,
  onPress,
}: AchievementBadgeProps) {
  const tierColor = TIER_COLORS[tier];
  const bgColor = isUnlocked ? TIER_BG[tier] : colors.surfaceAlt;
  const progressPercent = total > 0 ? Math.min(progress / total, 1) : 0;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: bgColor },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isUnlocked ? tierColor : colors.borderLight,
            opacity: isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        <Ionicons
          name={(icon as keyof typeof Ionicons.glyphMap) || "trophy"}
          size={24}
          color={isUnlocked ? colors.textLight : colors.textMuted}
        />
      </View>
      <Text
        style={[styles.name, !isUnlocked && styles.lockedText]}
        numberOfLines={2}
      >
        {name}
      </Text>
      {!isUnlocked && (
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${progressPercent * 100}%` }]}
          />
        </View>
      )}
      {isUnlocked && (
        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: spacing.md,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    width: 100,
    gap: spacing.xs,
    ...shadows.xs,
  },
  pressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    ...shadows.pressed,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: borders.thin,
    borderColor: borders.color,
  },
  name: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: "center",
    letterSpacing: typography.letterSpacing.wide,
  },
  lockedText: {
    color: colors.textMuted,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: borderRadius.xs,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xs,
  },
});
