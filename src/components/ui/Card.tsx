import React from "react";
import { View, StyleSheet, ViewStyle, Pressable } from "react-native";
import { colors, borders, shadows, spacing, borderRadius } from "../../styles/neobrutalism";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "flat";
  color?: string;
  padding?: "none" | "sm" | "md" | "lg";
  style?: ViewStyle;
}

const paddingStyles: Record<string, ViewStyle> = {
  none: { padding: 0 },
  sm: { padding: spacing.sm },
  md: { padding: spacing.md },
  lg: { padding: spacing.lg },
};

export function Card({
  children,
  onPress,
  variant = "default",
  color,
  padding = "md",
  style,
}: CardProps) {
  const cardStyle: ViewStyle[] = [
    styles.base,
    paddingStyles[padding],
    variant === "elevated" && styles.elevated,
    variant === "flat" && styles.flat,
    color ? { backgroundColor: color } : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
  elevated: {
    ...shadows.lg,
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
});

export default Card;
