import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { borderRadius, borders, colors, shadows, spacing, typography } from "@/src/styles/neobrutalism";
import type { Ingredient } from "./types";

interface IngredientsStepProps {
  ingredients: Ingredient[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Ingredient, value: string) => void;
  onOpenUnitPicker: (ingredientId: string) => void;
}

export function IngredientsStep({
  ingredients,
  onAdd,
  onRemove,
  onUpdate,
  onOpenUnitPicker,
}: IngredientsStepProps) {
  return (
    <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
      <Text style={styles.stepTitle}>INGREDIENTS</Text>
      <Text style={styles.stepSubtitle}>Add what you'll need</Text>

      {ingredients.map((ingredient, index) => (
        <Animated.View
          key={ingredient.id}
          entering={FadeInDown.delay(index * 50).duration(200)}
          style={styles.ingredientRow}
        >
          <View style={styles.ingredientNumber}>
            <Text style={styles.ingredientNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.ingredientInputs}>
            <TextInput
              style={[styles.input, styles.ingredientName]}
              placeholder="Ingredient name"
              placeholderTextColor={colors.textMuted}
              value={ingredient.name}
              onChangeText={(v) => onUpdate(ingredient.id, "name", v)}
            />
            <View style={styles.ingredientAmountRow}>
              <TextInput
                style={[styles.input, styles.ingredientAmount]}
                placeholder="Qty"
                placeholderTextColor={colors.textMuted}
                value={ingredient.amount}
                onChangeText={(v) => onUpdate(ingredient.id, "amount", v)}
                keyboardType="decimal-pad"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.ingredientUnitButton,
                  pressed && styles.ingredientUnitButtonPressed,
                ]}
                onPress={() => onOpenUnitPicker(ingredient.id)}
                testID={`unit-button-${ingredient.id}`}
              >
                <Text style={styles.ingredientUnitText} testID={`unit-text-${ingredient.id}`}>
                  {ingredient.unit || "g"}
                </Text>
                <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
          <Pressable
            style={styles.removeButton}
            onPress={() => onRemove(ingredient.id)}
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
        <Text style={styles.addButtonText}>ADD INGREDIENT</Text>
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
  ingredientRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  ingredientNumber: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.secondary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: spacing.sm,
  },
  ingredientNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  ingredientInputs: {
    flex: 1,
  },
  ingredientName: {
    marginBottom: spacing.xs,
  },
  ingredientAmountRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  ingredientAmount: {
    flex: 1,
  },
  ingredientUnitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
  },
  ingredientUnitButtonPressed: {
    backgroundColor: colors.primaryLight,
  },
  ingredientUnitText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
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
