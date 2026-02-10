import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { DIETARY_OPTIONS } from "@/src/constants/dietary";
import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "@/src/styles/neobrutalism";

// Inline settings row component
function SettingsRow({
  icon,
  label,
  value,
  onPress,
  danger,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && onPress && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
    >
      <View style={styles.rowLeft}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? colors.error : colors.text}
        />
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>
          {label}
        </Text>
      </View>
      <View style={styles.rowRight}>
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        )}
      </View>
    </Pressable>
  );
}

export default function SettingsScreen() {
  const user = useQuery(api.users.current);
  const updateProfile = useMutation(api.users.updateProfile);

  const handleWeekStartChange = async () => {
    if (!user) return;
    const current = (user as any).weekStartDay || "sunday";
    const next = current === "sunday" ? "monday" : "sunday";
    await updateProfile({ weekStartDay: next });
  };

  const handleUnitsChange = async () => {
    if (!user) return;
    const current = user.preferredUnits || "imperial";
    const next = current === "imperial" ? "metric" : "imperial";
    await updateProfile({ preferredUnits: next });
  };

  const toggleDietary = async (option: string) => {
    if (!user) return;
    const current = user.dietaryPreferences || [];
    const updated = current.includes(option)
      ? current.filter((d) => d !== option)
      : [...current, option];
    await updateProfile({ dietaryPreferences: updated });
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear Cooking History",
      "This will reset all your cooking stats. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            // TODO: Implement clear history
          },
        },
      ]
    );
  };

  const handleExportRecipes = () => {
    Alert.alert("Coming Soon", "Recipe export will be available in a future update.");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Coming Soon", "Account deletion will be available in a future update.");
          },
        },
      ]
    );
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

  const weekStartDay = (user as any)?.weekStartDay || "sunday";
  const units = user?.preferredUnits || "imperial";
  const dietary = user?.dietaryPreferences || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cooking Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>COOKING</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="calendar-outline"
              label="Week starts on"
              value={weekStartDay === "monday" ? "Monday" : "Sunday"}
              onPress={handleWeekStartChange}
              testID="week-start-row"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="scale-outline"
              label="Measurement units"
              value={units === "metric" ? "Metric" : "Imperial"}
              onPress={handleUnitsChange}
              testID="units-row"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="people-outline"
              label="Default servings"
              value={String(user?.defaultServings || 4)}
            />
          </View>
        </Animated.View>

        {/* Dietary Section */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>DIETARY PREFERENCES</Text>
          <View style={styles.sectionCard}>
            <View style={styles.chipsContainer}>
              {DIETARY_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={[
                    styles.chip,
                    dietary.includes(option) && styles.chipActive,
                  ]}
                  onPress={() => toggleDietary(option)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      dietary.includes(option) && styles.chipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Data Section */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <Text style={styles.sectionTitle}>DATA</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="download-outline"
              label="Export my recipes"
              onPress={handleExportRecipes}
              testID="export-recipes-row"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="trash-outline"
              label="Clear cooking history"
              onPress={handleClearHistory}
              danger
              testID="clear-history-row"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="person-remove-outline"
              label="Delete account"
              onPress={handleDeleteAccount}
              danger
              testID="delete-account-row"
            />
          </View>
        </Animated.View>

        {/* About Section */}
        <Animated.View entering={FadeInDown.delay(400).duration(400)}>
          <Text style={styles.sectionTitle}>ABOUT</Text>
          <View style={styles.sectionCard}>
            <SettingsRow
              icon="information-circle-outline"
              label="Version"
              value="1.0.0"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="chatbubble-outline"
              label="Send feedback"
              onPress={() =>
                Linking.openURL("mailto:feedback@everydayfood.app")
              }
              testID="feedback-row"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="document-text-outline"
              label="Privacy policy"
              onPress={() =>
                Linking.openURL("https://everydayfood.app/privacy")
              }
              testID="privacy-row"
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="shield-outline"
              label="Terms of service"
              onPress={() => Linking.openURL("https://everydayfood.app/terms")}
              testID="terms-row"
            />
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
    width: 44,
    height: 44,
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
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wider,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.xs,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  rowLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  rowLabelDanger: {
    color: colors.error,
  },
  rowValue: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.lg + 20 + spacing.md, // icon width + gap
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    padding: spacing.lg,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
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
