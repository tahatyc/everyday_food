import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { borderRadius, borders, colors, shadows, spacing, typography } from "@/src/styles/neobrutalism";
import type { Extras, Nutrition } from "./types";

interface ExtrasStepProps {
  extras: Extras;
  nutrition: Nutrition;
  onChangeExtras: (field: keyof Extras, value: string) => void;
  onChangeNutrition: (field: keyof Nutrition, value: string) => void;
}

export function ExtrasStep({
  extras,
  nutrition,
  onChangeExtras,
  onChangeNutrition,
}: ExtrasStepProps) {
  return (
    <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
      <Text style={styles.stepTitle}>EXTRAS</Text>
      <Text style={styles.stepSubtitle}>Optional details (you can skip this)</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="A short description of your recipe..."
          placeholderTextColor={colors.textMuted}
          value={extras.description}
          onChangeText={(v) => onChangeExtras("description", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>CUISINE</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Italian, Mexican, Asian"
          placeholderTextColor={colors.textMuted}
          value={extras.cuisine}
          onChangeText={(v) => onChangeExtras("cuisine", v)}
        />
      </View>

      <Text style={styles.nutritionHeader}>NUTRITION PER SERVING (OPTIONAL)</Text>
      <Text style={styles.nutritionSubheader}>Fill in all 4 main fields or leave blank</Text>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>CALORIES (kcal)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 350"
            placeholderTextColor={colors.textMuted}
            value={nutrition.calories}
            onChangeText={(v) => onChangeNutrition("calories", v)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.rowSpacer} />
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>PROTEIN (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 25"
            placeholderTextColor={colors.textMuted}
            value={nutrition.protein}
            onChangeText={(v) => onChangeNutrition("protein", v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>CARBS (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 45"
            placeholderTextColor={colors.textMuted}
            value={nutrition.carbs}
            onChangeText={(v) => onChangeNutrition("carbs", v)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.rowSpacer} />
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>FAT (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10"
            placeholderTextColor={colors.textMuted}
            value={nutrition.fat}
            onChangeText={(v) => onChangeNutrition("fat", v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>FIBER (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5"
            placeholderTextColor={colors.textMuted}
            value={nutrition.fiber}
            onChangeText={(v) => onChangeNutrition("fiber", v)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.rowSpacer} />
        <View style={[styles.inputGroup, styles.flex1]}>
          <Text style={styles.inputLabel}>SUGAR (g)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 8"
            placeholderTextColor={colors.textMuted}
            value={nutrition.sugar}
            onChangeText={(v) => onChangeNutrition("sugar", v)}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>SODIUM (mg)</Text>
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="e.g., 400"
          placeholderTextColor={colors.textMuted}
          value={nutrition.sodium}
          onChangeText={(v) => onChangeNutrition("sodium", v)}
          keyboardType="decimal-pad"
        />
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
  textArea: {
    minHeight: 100,
    paddingTop: spacing.md,
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
  nutritionHeader: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  nutritionSubheader: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
});
