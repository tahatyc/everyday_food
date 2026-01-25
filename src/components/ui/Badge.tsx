import React from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { colors, borders, shadows, spacing, typography, borderRadius } from "../../styles/neobrutalism";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "error";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.surfaceAlt, text: colors.text },
  primary: { bg: colors.primary, text: colors.text },
  secondary: { bg: colors.secondary, text: colors.text },
  success: { bg: colors.success, text: colors.text },
  warning: { bg: colors.warning, text: colors.text },
  error: { bg: colors.error, text: "#FFFFFF" },
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  color,
  style,
  textStyle,
}: BadgeProps) {
  const variantStyle = variantColors[variant];

  return (
    <View
      style={[
        styles.base,
        size === "sm" && styles.sm,
        { backgroundColor: color || variantStyle.bg },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          size === "sm" && styles.textSm,
          { color: variantStyle.text },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignSelf: "flex-start",
    ...shadows.sm,
  },
  sm: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  textSm: {
    fontSize: typography.sizes.xs,
  },
});

export default Badge;
