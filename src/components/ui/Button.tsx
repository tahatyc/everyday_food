import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import { colors, borders, shadows, spacing, typography, borderRadius } from "../../styles/neobrutalism";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: colors.primary,
    },
    text: {
      color: colors.text,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.secondary,
    },
    text: {
      color: colors.text,
    },
  },
  outline: {
    container: {
      backgroundColor: colors.surface,
    },
    text: {
      color: colors.text,
    },
  },
  ghost: {
    container: {
      backgroundColor: "transparent",
      borderWidth: 0,
      ...shadows.pressed, // No shadow for ghost
    },
    text: {
      color: colors.text,
    },
  },
  danger: {
    container: {
      backgroundColor: colors.error,
    },
    text: {
      color: "#FFFFFF",
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.sm,
    },
    text: {
      fontSize: typography.sizes.sm,
    },
  },
  md: {
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
    },
    text: {
      fontSize: typography.sizes.md,
    },
  },
  lg: {
    container: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.lg,
    },
    text: {
      fontSize: typography.sizes.lg,
    },
  },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyle.text.color}
          size={size === "sm" ? "small" : "small"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            variantStyle.text,
            sizeStyle.text,
            textStyle,
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: borders.regular,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...shadows.md,
  },
  text: {
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  fullWidth: {
    width: "100%",
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
