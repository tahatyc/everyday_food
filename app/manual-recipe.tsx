import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

import { useRecipeForm } from "@/src/components/manual-recipe/useRecipeForm";
import { BasicInfoStep } from "@/src/components/manual-recipe/BasicInfoStep";
import { IngredientsStep } from "@/src/components/manual-recipe/IngredientsStep";
import { StepsStep } from "@/src/components/manual-recipe/StepsStep";
import { ExtrasStep } from "@/src/components/manual-recipe/ExtrasStep";

export default function ManualRecipeScreen() {
  const { recipeId } = useLocalSearchParams<{ recipeId?: string }>();

  const {
    state,
    dispatch,
    isEditMode,
    filteredUnitGroups,
    handleNext,
    handleBack,
    handleSave,
    addIngredient,
    removeIngredient,
    updateIngredient,
    openUnitPicker,
    selectUnit,
    addStep,
    removeStep,
    updateStep,
  } = useRecipeForm(recipeId);

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepDotContainer}>
          <View
            style={[
              styles.stepDot,
              state.currentStep >= step && styles.stepDotActive,
              state.currentStep === step && styles.stepDotCurrent,
            ]}
          >
            {state.currentStep > step ? (
              <Ionicons name="checkmark" size={12} color={colors.text} />
            ) : (
              <Text style={styles.stepDotText}>{step}</Text>
            )}
          </View>
          {step < 4 && (
            <View
              style={[
                styles.stepLine,
                state.currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <BasicInfoStep
            basicInfo={state.basicInfo}
            onChangeField={(field, value) =>
              dispatch({ type: "SET_BASIC_INFO", field, value })
            }
          />
        );
      case 2:
        return (
          <IngredientsStep
            ingredients={state.ingredients}
            onAdd={addIngredient}
            onRemove={removeIngredient}
            onUpdate={updateIngredient}
            onOpenUnitPicker={openUnitPicker}
          />
        );
      case 3:
        return (
          <StepsStep
            steps={state.steps}
            onAdd={addStep}
            onRemove={removeStep}
            onUpdate={updateStep}
          />
        );
      case 4:
        return (
          <ExtrasStep
            extras={state.extras}
            nutrition={state.nutrition}
            onChangeExtras={(field, value) =>
              dispatch({ type: "SET_EXTRAS", field, value })
            }
            onChangeNutrition={(field, value) =>
              dispatch({ type: "SET_NUTRITION", field, value })
            }
          />
        );
      default:
        return null;
    }
  };

  const stepTitles = ["Basic Info", "Ingredients", "Steps", "Extras"];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{stepTitles[state.currentStep - 1]}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {renderStepIndicator()}

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {state.currentStep < 4 ? (
            <Pressable
              style={({ pressed }) => [
                styles.nextButton,
                pressed && styles.nextButtonPressed,
              ]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>NEXT</Text>
              <Ionicons name="arrow-forward" size={20} color={colors.text} />
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                pressed && styles.saveButtonPressed,
                state.isSaving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={state.isSaving}
            >
              <Text style={styles.saveButtonText}>
                {state.isSaving ? "SAVING..." : isEditMode ? "UPDATE RECIPE" : "SAVE RECIPE"}
              </Text>
              <Ionicons
                name={state.isSaving ? "hourglass" : "checkmark"}
                size={20}
                color={colors.text}
              />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Unit picker modal */}
      <Modal
        visible={state.unitPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => dispatch({ type: "CLOSE_UNIT_PICKER" })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECT UNIT</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => dispatch({ type: "CLOSE_UNIT_PICKER" })}
              >
                <Text style={styles.modalCloseText}>CLOSE</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              {filteredUnitGroups.map((group) => (
                <View key={group.label} style={styles.unitGroup}>
                  <Text style={styles.unitGroupLabel}>{group.label}</Text>
                  <View style={styles.unitChips}>
                    {group.units.map((unit) => (
                      <Pressable
                        key={unit}
                        style={({ pressed }) => [
                          styles.unitChip,
                          pressed && styles.unitChipPressed,
                        ]}
                        onPress={() => selectUnit(unit)}
                      >
                        <Text style={styles.unitChipText}>{unit}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerSpacer: {
    width: 44,
  },
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  stepDotContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    borderWidth: borders.regular,
    borderColor: borders.color,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepDotCurrent: {
    ...shadows.sm,
  },
  stepDotText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.xs,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: borders.thin,
    borderTopColor: borders.color,
    backgroundColor: colors.background,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  nextButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  nextButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  saveButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderWidth: borders.regular,
    borderColor: borders.color,
    maxHeight: "70%",
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: borders.thin,
    borderBottomColor: borders.color,
  },
  modalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
  },
  modalCloseButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
  },
  modalCloseText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  modalScroll: {
    padding: spacing.lg,
  },
  unitGroup: {
    marginBottom: spacing.lg,
  },
  unitGroupLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.sm,
  },
  unitChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  unitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    ...shadows.sm,
  },
  unitChipPressed: {
    backgroundColor: colors.primary,
    transform: [{ translateX: 1 }, { translateY: 1 }],
    ...shadows.pressed,
  },
  unitChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
});
