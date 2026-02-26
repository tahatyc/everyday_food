import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeOut,
  SlideInUp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../../styles/neobrutalism";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onDismiss: (id: string) => void;
  duration?: number; // default 3500ms
}

// ---------------------------------------------------------------------------
// Type → visual mapping
// ---------------------------------------------------------------------------

interface ToastVisuals {
  background: string;
  textColor: string;
  iconName: React.ComponentProps<typeof Ionicons>["name"];
}

const TOAST_VISUALS: Record<ToastType, ToastVisuals> = {
  error: {
    background: colors.error,
    textColor: colors.textLight,
    iconName: "alert-circle",
  },
  success: {
    background: colors.success,
    textColor: colors.text,
    iconName: "checkmark-circle",
  },
  warning: {
    background: colors.warning,
    textColor: colors.text,
    iconName: "warning",
  },
  info: {
    background: colors.info,
    textColor: colors.text,
    iconName: "information-circle",
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Toast({ id, type, message, onDismiss, duration = 3500 }: ToastProps) {
  const visuals = TOAST_VISUALS[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <Animated.View
      entering={SlideInUp.duration(300).springify().damping(15)}
      exiting={FadeOut.duration(200)}
      style={[styles.container, { backgroundColor: visuals.background }]}
    >
      {/* Icon */}
      <Ionicons
        name={visuals.iconName}
        size={22}
        color={visuals.textColor}
        style={styles.icon}
      />

      {/* Message */}
      <Text
        style={[styles.message, { color: visuals.textColor }]}
        numberOfLines={4}
      >
        {message}
      </Text>

      {/* Dismiss button */}
      <Pressable
        onPress={() => onDismiss(id)}
        hitSlop={8}
        style={styles.closeButton}
        accessibilityLabel="Dismiss notification"
        accessibilityRole="button"
      >
        <Ionicons name="close" size={18} color={visuals.textColor} />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    ...shadows.md,
    gap: spacing.sm,
  },
  icon: {
    marginTop: 1, // optical alignment with first line of text
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.sm * 1.4,
  },
  closeButton: {
    flexShrink: 0,
    marginTop: 2,
  },
});

export default Toast;
