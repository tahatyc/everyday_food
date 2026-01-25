import React from "react";
import { Pressable, View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, borders, shadows, spacing, typography, borderRadius } from "../../styles/neobrutalism";

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  style?: ViewStyle;
}

const sizeMap = {
  sm: { box: 18, icon: 12, text: typography.sizes.sm },
  md: { box: 24, icon: 16, text: typography.sizes.md },
  lg: { box: 32, icon: 22, text: typography.sizes.lg },
};

export function Checkbox({
  checked,
  onToggle,
  label,
  disabled = false,
  size = "md",
  style,
}: CheckboxProps) {
  const sizeStyle = sizeMap[size];

  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <View
        style={[
          styles.checkbox,
          {
            width: sizeStyle.box,
            height: sizeStyle.box,
          },
          checked && styles.checked,
        ]}
      >
        {checked && (
          <Ionicons
            name="checkmark-sharp"
            size={sizeStyle.icon}
            color={colors.text}
          />
        )}
      </View>

      {label && (
        <Text
          style={[
            styles.label,
            { fontSize: sizeStyle.text },
            checked && styles.labelChecked,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkbox: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  checked: {
    backgroundColor: colors.success,
  },
  label: {
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  labelChecked: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Checkbox;
