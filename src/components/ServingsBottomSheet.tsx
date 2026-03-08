import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../styles/neobrutalism";

type ServingsBottomSheetProps = {
  visible: boolean;
  currentServings: number;
  recipeName: string;
  onSave: (servings: number) => void;
  onClose: () => void;
  /** Label for the confirm button. Defaults to "SAVE". */
  confirmLabel?: string;
  /** Hint text shown below the recipe name. */
  hint?: string;
  /** When true, the confirm button is always enabled. Defaults to false (disabled when unchanged). */
  alwaysEnabled?: boolean;
};

export function ServingsBottomSheet({
  visible,
  currentServings,
  recipeName,
  onSave,
  onClose,
  confirmLabel = "SAVE",
  hint = "This will update your grocery list quantities",
  alwaysEnabled = false,
}: ServingsBottomSheetProps) {
  const [tempServings, setTempServings] = useState(currentServings);

  // Reset temp servings when opening with a new value
  useEffect(() => {
    if (visible) setTempServings(currentServings);
  }, [visible, currentServings]);

  const canConfirm = alwaysEnabled || tempServings !== currentServings;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Pressable
          style={styles.sheetContent}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View entering={FadeInUp.duration(250)}>
            <Text style={styles.sheetTitle}>ADJUST SERVINGS</Text>
            <Text style={styles.sheetRecipeName} numberOfLines={1}>
              {recipeName.toUpperCase()}
            </Text>
            {hint ? (
              <Text style={styles.sheetHint}>{hint}</Text>
            ) : null}

            <View style={styles.sheetControls}>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetButton,
                  tempServings <= 1 && styles.sheetButtonDisabled,
                  pressed && tempServings > 1 && styles.buttonPressed,
                ]}
                onPress={() => {
                  if (tempServings > 1) setTempServings(tempServings - 1);
                }}
                disabled={tempServings <= 1}
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={tempServings <= 1 ? colors.textMuted : colors.text}
                />
              </Pressable>
              <View style={styles.sheetValue}>
                <Text style={styles.sheetValueText}>{tempServings}</Text>
                <Text style={styles.sheetValueLabel}>SERVINGS</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetButton,
                  tempServings >= 100 && styles.sheetButtonDisabled,
                  pressed && tempServings < 100 && styles.buttonPressed,
                ]}
                onPress={() => {
                  if (tempServings < 100) setTempServings(tempServings + 1);
                }}
                disabled={tempServings >= 100}
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={tempServings >= 100 ? colors.textMuted : colors.text}
                />
              </Pressable>
            </View>

            <View style={styles.sheetActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetCancelButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={onClose}
              >
                <Text style={styles.sheetCancelText}>CANCEL</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.sheetSaveButton,
                  !canConfirm && styles.sheetSaveButtonDisabled,
                  pressed && canConfirm && styles.buttonPressed,
                ]}
                onPress={() => {
                  if (canConfirm) {
                    onSave(tempServings);
                    onClose();
                  }
                }}
                disabled={!canConfirm}
              >
                <Text
                  style={[
                    styles.sheetSaveText,
                    !canConfirm && styles.sheetSaveTextDisabled,
                  ]}
                >
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  sheetContent: {
    backgroundColor: colors.surface,
    borderWidth: borders.thick,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 340,
    ...shadows.md,
  },
  sheetTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  sheetRecipeName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  sheetHint: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  sheetControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  sheetButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  sheetButtonDisabled: {
    opacity: 0.4,
  },
  sheetValue: {
    alignItems: "center",
    minWidth: 60,
  },
  sheetValueText: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  sheetValueLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
  },
  sheetActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  sheetCancelButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
  },
  sheetCancelText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  sheetSaveButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  sheetSaveButtonDisabled: {
    opacity: 0.5,
  },
  sheetSaveText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  sheetSaveTextDisabled: {
    color: colors.textMuted,
  },
  buttonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
});
