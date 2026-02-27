import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, borders, colors, shadows, spacing, typography } from "@/src/styles/neobrutalism";
import type { Step } from "./types";

interface StepsStepProps {
  steps: Step[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "instruction" | "tip", value: string) => void;
}

export function StepsStep({ steps, onAdd, onRemove, onUpdate }: StepsStepProps) {
  return (
    <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
      <Text style={styles.stepTitle}>COOKING STEPS</Text>
      <Text style={styles.stepSubtitle}>How do you make it?</Text>

      {steps.map((step, index) => (
        <Animated.View
          key={step.id}
          entering={FadeInDown.delay(index * 50).duration(200)}
          style={styles.stepRow}
        >
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.stepInputs}>
            <TextInput
              style={[styles.input, styles.stepInstruction]}
              placeholder="Describe this step..."
              placeholderTextColor={colors.textMuted}
              value={step.instruction}
              onChangeText={(v) => onUpdate(step.id, "instruction", v)}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TextInput
              style={[styles.input, styles.stepTip]}
              placeholder="Add a tip (optional)..."
              placeholderTextColor={colors.textMuted}
              value={step.tip}
              onChangeText={(v) => onUpdate(step.id, "tip", v)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
          </View>
          <Pressable
            style={styles.removeButton}
            onPress={() => onRemove(step.id)}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      ))}

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          pressed && styles.addButtonPressed,
        ]}
        onPress={onAdd}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.addButtonText}>ADD STEP</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    paddingTop: spacing.md,
  },
  stepTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  stepSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    ...shadows.sm,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    borderWidth: borders.regular,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: spacing.sm,
  },
  stepNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  stepInputs: {
    flex: 1,
  },
  stepInstruction: {
    minHeight: 80,
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },
  stepTip: {
    minHeight: 60,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  removeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    borderStyle: "dashed",
    backgroundColor: colors.surface,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  addButtonPressed: {
    backgroundColor: colors.primaryLight,
  },
  addButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
});
