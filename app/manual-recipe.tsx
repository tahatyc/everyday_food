import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { router, Stack } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  id: string;
  instruction: string;
}

type Difficulty = "easy" | "medium" | "hard" | null;


export default function ManualRecipeScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1: Basic Info
  const [title, setTitle] = useState("");
  const [servings, setServings] = useState("4");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>(null);

  // Step 2: Ingredients
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: "1", name: "", amount: "", unit: "g" },
  ]);

  // Step 3: Steps
  const [steps, setSteps] = useState<Step[]>([{ id: "1", instruction: "" }]);

  // Step 4: Extras
  const [description, setDescription] = useState("");
  const [cuisine, setCuisine] = useState("");

  const createRecipe = useMutation(api.recipes.createManual);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!title.trim()) {
          Alert.alert("Required", "Please enter a recipe title");
          return false;
        }
        if (!servings || parseInt(servings) <= 0) {
          Alert.alert("Required", "Please enter valid servings");
          return false;
        }
        return true;
      case 2:
        const validIngredients = ingredients.filter((i) => i.name.trim());
        if (validIngredients.length === 0) {
          Alert.alert("Required", "Please add at least one ingredient");
          return false;
        }
        return true;
      case 3:
        const validSteps = steps.filter((s) => s.instruction.trim());
        if (validSteps.length === 0) {
          Alert.alert("Required", "Please add at least one step");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!validateStep(currentStep)) return;

    setIsSaving(true);
    try {
      const validIngredients = ingredients
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          amount: i.amount ? parseFloat(i.amount) : undefined,
          unit: i.unit || undefined,
        }));

      const validSteps = steps
        .filter((s) => s.instruction.trim())
        .map((s) => ({
          instruction: s.instruction.trim(),
        }));

      const result = await createRecipe({
        title: title.trim(),
        servings: parseInt(servings),
        prepTime: prepTime ? parseInt(prepTime) : undefined,
        cookTime: cookTime ? parseInt(cookTime) : undefined,
        difficulty: difficulty || undefined,
        description: description.trim() || undefined,
        cuisine: cuisine.trim() || undefined,
        isPublic: false,
        ingredients: validIngredients,
        steps: validSteps,
      });

      router.replace(`/recipe/${result.recipeId}`);
    } catch (error) {
      console.error("Failed to create recipe:", error);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const addIngredient = () => {
    setIngredients([
      ...ingredients,
      { id: Date.now().toString(), name: "", amount: "", unit: "g" },
    ]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((i) => i.id !== id));
    }
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string) => {
    setIngredients(
      ingredients.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now().toString(), instruction: "" }]);
  };

  const removeStep = (id: string) => {
    if (steps.length > 1) {
      setSteps(steps.filter((s) => s.id !== id));
    }
  };

  const updateStep = (id: string, instruction: string) => {
    setSteps(steps.map((s) => (s.id === id ? { ...s, instruction } : s)));
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.stepDotContainer}>
          <View
            style={[
              styles.stepDot,
              currentStep >= step && styles.stepDotActive,
              currentStep === step && styles.stepDotCurrent,
            ]}
          >
            {currentStep > step ? (
              <Ionicons name="checkmark" size={12} color={colors.text} />
            ) : (
              <Text style={styles.stepDotText}>{step}</Text>
            )}
          </View>
          {step < 4 && (
            <View
              style={[
                styles.stepLine,
                currentStep > step && styles.stepLineActive,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderBasicInfo = () => (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
      <Text style={styles.stepTitle}>BASIC INFO</Text>
      <Text style={styles.stepSubtitle}>Tell us about your recipe</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>RECIPE TITLE *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Grandma's Apple Pie"
          placeholderTextColor={colors.textMuted}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>SERVINGS *</Text>
        <TextInput
          style={[styles.input, styles.smallInput]}
          placeholder="4"
          placeholderTextColor={colors.textMuted}
          value={servings}
          onChangeText={setServings}
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
            value={prepTime}
            onChangeText={setPrepTime}
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
            value={cookTime}
            onChangeText={setCookTime}
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
                difficulty === level && styles.difficultyOptionSelected,
              ]}
              onPress={() => setDifficulty(level)}
            >
              <Text
                style={[
                  styles.difficultyText,
                  difficulty === level && styles.difficultyTextSelected,
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

  const renderIngredients = () => (
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
              onChangeText={(v) => updateIngredient(ingredient.id, "name", v)}
            />
            <View style={styles.ingredientAmountRow}>
              <TextInput
                style={[styles.input, styles.ingredientAmount]}
                placeholder="Qty"
                placeholderTextColor={colors.textMuted}
                value={ingredient.amount}
                onChangeText={(v) => updateIngredient(ingredient.id, "amount", v)}
                keyboardType="decimal-pad"
              />
              <View style={styles.ingredientUnitLabel}>
                <Text style={styles.ingredientUnitText}>g</Text>
              </View>
            </View>
          </View>
          <Pressable
            style={styles.removeButton}
            onPress={() => removeIngredient(ingredient.id)}
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
        onPress={addIngredient}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.addButtonText}>ADD INGREDIENT</Text>
      </Pressable>
    </Animated.View>
  );

  const renderSteps = () => (
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
          <TextInput
            style={[styles.input, styles.stepInstruction]}
            placeholder="Describe this step..."
            placeholderTextColor={colors.textMuted}
            value={step.instruction}
            onChangeText={(v) => updateStep(step.id, v)}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <Pressable
            style={styles.removeButton}
            onPress={() => removeStep(step.id)}
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
        onPress={addStep}
      >
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles.addButtonText}>ADD STEP</Text>
      </Pressable>
    </Animated.View>
  );

  const renderExtras = () => (
    <Animated.View entering={FadeInRight.duration(300)} style={styles.stepContent}>
      <Text style={styles.stepTitle}>EXTRAS</Text>
      <Text style={styles.stepSubtitle}>Optional details (you can skip this)</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>DESCRIPTION</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="A short description of your recipe..."
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
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
          value={cuisine}
          onChangeText={setCuisine}
        />
      </View>

    </Animated.View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderIngredients();
      case 3:
        return renderSteps();
      case 4:
        return renderExtras();
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
          <Text style={styles.headerTitle}>{stepTitles[currentStep - 1]}</Text>
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
          {currentStep < 4 ? (
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
                isSaving && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? "SAVING..." : "SAVE RECIPE"}
              </Text>
              <Ionicons
                name={isSaving ? "hourglass" : "checkmark"}
                size={20}
                color={colors.text}
              />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
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
  ingredientUnitLabel: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
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
  stepInstruction: {
    flex: 1,
    minHeight: 80,
    paddingTop: spacing.md,
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
});
