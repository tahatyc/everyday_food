import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { borderRadius, borders, colors, shadows, spacing, typography } from "@/src/styles/neobrutalism";
import type { BasicInfo, Difficulty } from "./types";

interface BasicInfoStepProps {
  basicInfo: BasicInfo;
  onChangeField: (field: keyof BasicInfo, value: string | Difficulty) => void;
}

export function BasicInfoStep({ basicInfo, onChangeField }: BasicInfoStepProps) {
  return (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
      <Text style={styles.stepTitle}>BASIC INFO</Text>
      <Text style={styles.stepSubtitle}>Tell us about your recipe</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>RECIPE TITLE *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Grandma's Apple Pie"
          placeholderTextColor={colors.textMuted}
          value={basicInfo.title}
          onChangeText={(v) => onChangeField("title", v)}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>SERVINGS *</Text>
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="4"
          placeholderTextColor={colors.textMuted}
          value={basicInfo.servings}
          onChangeText={(v) => onChangeField("servings", v)}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>PREP TIME (MIN)</Text>
          <TextInput
            style={styles.input}
            placeholder="15"
            placeholderTextColor={colors.textMuted}
            value={basicInfo.prepTime}
            onChangeText={(v) => onChangeField("prepTime", v)}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.rowSpacer} />
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>COOK TIME (MIN)</Text>
          <TextInput
            style={styles.input}
            placeholder="30"
            placeholderTextColor={colors.textMuted}
            value={basicInfo.cookTime}
            onChangeText={(v) => onChangeField("cookTime", v)}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>DIFFICULTY</Text>
        <View style={styles.difficultyRow}>
          {(["easy", "medium", "hard"] as const).map((level) => (
            <Pressable
              key={level}
              style={[
                styles.difficultyOption,
                basicInfo.difficulty === level && styles.difficultyOptionSelected,
              ]}
              onPress={() => onChangeField("difficulty", level)}
            >
              <Text
                style={[
                  styles.difficultyText,
                  basicInfo.difficulty === level && styles.difficultyTextSelected,
                ]}
              >
                {level.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.sm,
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
  smallInput: {
    width: 100,
  },
  row: {
    flexDirection: "row",
  },
  rowSpacer: {
    width: spacing.md,
  },
  flex1: {
    flex: 1,
  },
  difficultyRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    ...shadows.sm,
  },
  difficultyOptionSelected: {
    backgroundColor: colors.primary,
  },
  difficultyText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
  },
  difficultyTextSelected: {
    color: colors.text,
  },
});
