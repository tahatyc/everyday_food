import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borders, shadows, spacing, borderRadius } from "../../styles/neobrutalism";

type IconButtonVariant = "default" | "primary" | "secondary" | "ghost";
type IconButtonSize = "sm" | "md" | "lg";

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  color?: string;
  style?: ViewStyle;
}

const sizeMap = {
  sm: { container: 32, icon: 16 },
  md: { container: 44, icon: 22 },
  lg: { container: 56, icon: 28 },
};

const variantStyles: Record<IconButtonVariant, ViewStyle> = {
  default: {
    backgroundColor: colors.surface,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
};

export function IconButton({
  icon,
  onPress,
  variant = "default",
  size = "md",
  disabled = false,
  color,
  style,
}: IconButtonProps) {
  const sizeStyle = sizeMap[size];
  const iconColor = color || (variant === "ghost" ? colors.textSecondary : colors.text);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: sizeStyle.container,
          height: sizeStyle.container,
        },
        variantStyles[variant],
        pressed && variant !== "ghost" && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={sizeStyle.icon} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  pressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    ...shadows.pressed,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default IconButton;
