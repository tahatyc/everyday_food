import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from "react-native-reanimated";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
  componentStyles,
} from "../src/styles/neobrutalism";

export default function ImportScreen() {
  const [url, setUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  // Animation for syncing icon
  const rotation = useSharedValue(0);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const handleImport = () => {
    if (!url.trim()) return;

    setIsSyncing(true);
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1,
      false
    );

    // Simulate import progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setSyncProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsSyncing(false);
        rotation.value = 0;
        // Navigate back or to recipe detail
        router.back();
      }
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Import & Sync</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Title */}
          <Text style={styles.heroTitle}>
            PASTE A LINK{"\n"}TO COOK.
          </Text>
          <Text style={styles.heroSubtitle}>
            Add any recipe from social media or blogs instantly.
          </Text>

          {/* URL Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>RECIPE URL</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="TikTok, YouTube, or Blog URL..."
                placeholderTextColor={colors.textMuted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Pressable style={styles.inputIcon}>
                <Ionicons name="clipboard-outline" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Import Button */}
          <Pressable
            style={({ pressed }) => [
              styles.importButton,
              pressed && styles.importButtonPressed,
              !url.trim() && styles.importButtonDisabled,
            ]}
            onPress={handleImport}
            disabled={!url.trim() || isSyncing}
          >
            <Text style={styles.importButtonText}>IMPORT RECIPE</Text>
            <Ionicons name="flash" size={20} color={colors.text} />
          </Pressable>

          {/* Syncing Animation Area */}
          <View style={styles.syncArea}>
            {/* Background pattern */}
            <View style={styles.syncBackground}>
              <View style={styles.syncPatternRow}>
                {["🍴", "🥄", "🍳", "🥗"].map((emoji, i) => (
                  <Text key={i} style={styles.syncPatternEmoji}>{emoji}</Text>
                ))}
              </View>
              <View style={styles.syncPatternRow}>
                {["🥘", "🍲", "🥡", "🍱"].map((emoji, i) => (
                  <Text key={i} style={styles.syncPatternEmoji}>{emoji}</Text>
                ))}
              </View>
            </View>

            {/* Sync icon */}
            <Animated.View style={[styles.syncIconContainer, animatedIconStyle]}>
              <Ionicons
                name={isSyncing ? "sync" : "restaurant"}
                size={40}
                color={colors.text}
              />
            </Animated.View>

            {isSyncing && (
              <Text style={styles.syncingText}>SYNCING...</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Alternative Options */}
          <View style={styles.alternativeOptions}>
            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="folder-outline" size={28} color={colors.text} />
              </View>
              <Text style={styles.optionLabel}>FROM FILES</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.optionCard,
                pressed && styles.optionCardPressed,
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="scan-outline" size={28} color={colors.text} />
              </View>
              <Text style={styles.optionLabel}>SCAN RECIPE</Text>
            </Pressable>
          </View>

          {/* Sync Progress Bar */}
          {isSyncing && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={styles.progressLabelContainer}>
                  <Text style={styles.progressLabel}>SYNCING YOUR KITCHEN</Text>
                  <Text style={styles.progressPercent}>{syncProgress}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${syncProgress}%` }]}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxxl,
  },
  heroTitle: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    lineHeight: typography.sizes.display * typography.lineHeights.tight,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  heroSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputIcon: {
    paddingRight: spacing.lg,
  },
  importButton: {
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
  importButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  importButtonDisabled: {
    opacity: 0.5,
  },
  importButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  syncArea: {
    height: 180,
    marginTop: spacing.xxl,
    backgroundColor: colors.primaryLight,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  syncBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
    justifyContent: "center",
    gap: spacing.lg,
  },
  syncPatternRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  syncPatternEmoji: {
    fontSize: 32,
  },
  syncIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  syncingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
  },
  dividerText: {
    paddingHorizontal: spacing.lg,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  alternativeOptions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  optionCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    ...shadows.sm,
  },
  optionCardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  progressContainer: {
    marginTop: spacing.xxl,
  },
  progressBar: {
    backgroundColor: colors.cyanLight,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  progressLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  progressPercent: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.cyan,
  },
});
