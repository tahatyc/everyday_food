import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "@/src/styles/neobrutalism";

export default function EditProfileScreen() {
  const user = useQuery(api.users.current);
  const updateProfile = useMutation(api.users.updateProfile);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [defaultServings, setDefaultServings] = useState(4);
  const [preferredUnits, setPreferredUnits] = useState<"metric" | "imperial">(
    "imperial"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Pre-fill form when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio((user as any).bio || "");
      setSelectedDietary(user.dietaryPreferences || []);
      setDefaultServings(user.defaultServings || 4);
      setPreferredUnits(user.preferredUnits || "imperial");
    }
  }, [user]);

  const toggleDietary = (option: string) => {
    setSelectedDietary((prev) =>
      prev.includes(option)
        ? prev.filter((d) => d !== option)
        : [...prev, option]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        dietaryPreferences: selectedDietary,
        defaultServings,
        preferredUnits,
      });
      router.back();
    } catch {
      // Stay on screen if save fails
    } finally {
      setIsSaving(false);
    }
  };

  if (user === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
          testID="cancel-button"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>EDIT PROFILE</Text>
        <Pressable
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={isSaving}
          testID="save-button"
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.textLight} />
          ) : (
            <Text style={styles.saveButtonText}>SAVE</Text>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Field */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.label}>NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
            testID="name-input"
          />
        </Animated.View>

        {/* Bio Field */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.label}>BIO</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            testID="bio-input"
          />
        </Animated.View>

        {/* Default Servings */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.label}>DEFAULT SERVINGS</Text>
          <View style={styles.stepperContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.stepperButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                setDefaultServings((prev) => Math.max(1, prev - 1))
              }
              testID="servings-decrease"
            >
              <Ionicons name="remove" size={20} color={colors.text} />
            </Pressable>
            <Text style={styles.stepperValue} testID="servings-value">
              {defaultServings}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.stepperButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                setDefaultServings((prev) => Math.min(12, prev + 1))
              }
              testID="servings-increase"
            >
              <Ionicons name="add" size={20} color={colors.text} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Preferred Units */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.label}>PREFERRED UNITS</Text>
          <View style={styles.segmentedControl}>
            <Pressable
              style={[
                styles.segmentButton,
                preferredUnits === "imperial" && styles.segmentButtonActive,
              ]}
              onPress={() => setPreferredUnits("imperial")}
              testID="units-imperial"
            >
              <Text
                style={[
                  styles.segmentText,
                  preferredUnits === "imperial" && styles.segmentTextActive,
                ]}
              >
                IMPERIAL
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentButton,
                preferredUnits === "metric" && styles.segmentButtonActive,
              ]}
              onPress={() => setPreferredUnits("metric")}
              testID="units-metric"
            >
              <Text
                style={[
                  styles.segmentText,
                  preferredUnits === "metric" && styles.segmentTextActive,
                ]}
              >
                METRIC
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Dietary Preferences */}
        <Animated.View entering={FadeInDown.delay(500).duration(400)}>
          <Text style={styles.label}>DIETARY PREFERENCES</Text>
          <View style={styles.chipsContainer}>
            {[
              "Vegetarian",
              "Vegan",
              "Gluten-Free",
              "Keto",
              "Dairy-Free",
              "Paleo",
            ].map((option) => (
              <Pressable
                key={option}
                style={[
                  styles.chip,
                  selectedDietary.includes(option) && styles.chipActive,
                ]}
                onPress={() => toggleDietary(option)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDietary.includes(option) && styles.chipTextActive,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    height: 40,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
    ...shadows.xs,
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: "flex-start",
    ...shadows.xs,
  },
  stepperButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  stepperValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginHorizontal: spacing.xxl,
    minWidth: 30,
    textAlign: "center",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.xs,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
  },
  segmentTextActive: {
    color: colors.textLight,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: borders.color,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textLight,
  },
  bottomSpacer: {
    height: 100,
  },
});
