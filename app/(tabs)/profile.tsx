import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
} from "../../src/styles/neobrutalism";

// Stats Item Component
function StatsItem({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.statsItem}>
      <View style={styles.statsIconContainer}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
      </View>
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </View>
  );
}

// Social Button Component
function SocialButton({
  icon,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.socialButton,
        { backgroundColor: color },
        pressed && styles.cardPressed,
      ]}
    >
      <Ionicons name={icon} size={24} color={colors.textLight} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.current);
  const stats = useQuery(api.users.getStats);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const isLoading = user === undefined || stats === undefined;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = user?.name || "CHEF";
  const displayBio = user?.dietaryPreferences?.length
    ? `Preferences: ${user.dietaryPreferences.join(", ")}`
    : "Home chef & flavor seeker.\nExploring new recipes every day.";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View style={styles.header} entering={FadeInDown.duration(300)}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>CHEF PROFILE</Text>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.push("/settings" as any)}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Animated.View
          style={styles.avatarSection}
          entering={FadeInDown.delay(100).duration(400)}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>👨‍🍳</Text>
            </View>
          </View>

          <Text style={styles.userName}>{displayName.toUpperCase()}</Text>
          <Text style={styles.userBio}>{displayBio}</Text>

          {/* Edit Profile Button */}
          <Pressable
            style={({ pressed }) => [
              styles.editProfileButton,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push("/edit-profile" as any)}
          >
            <Text style={styles.editProfileText}>EDIT PROFILE</Text>
          </Pressable>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View
          style={styles.statsContainer}
          entering={FadeInDown.delay(500).duration(400)}
        >
          <StatsItem
            icon="restaurant"
            value={stats?.totalRecipes?.toString() || "0"}
            label="RECIPES"
          />
          <View style={styles.statsDivider} />
          <StatsItem
            icon="heart"
            value={stats?.totalFavorites?.toString() || "0"}
            label="FAVORITES"
          />
          <View style={styles.statsDivider} />
          <StatsItem
            icon="flame"
            value={stats?.totalMealsCooked?.toString() || "0"}
            label="COOKED"
          />
        </Animated.View>

        {/* My Recipes */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Pressable
            style={({ pressed }) => [
              styles.settingsPreview,
              pressed && styles.cardPressed,
            ]}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/recipes",
                params: { filter: "my-recipes" },
              })
            }
          >
            <View style={styles.settingsPreviewContent}>
              <Ionicons name="book-outline" size={24} color={colors.text} />
              <View style={styles.settingsPreviewText}>
                <Text style={styles.settingsPreviewTitle}>MY RECIPES</Text>
                <Text style={styles.settingsPreviewSubtitle}>
                  View your personal recipes
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Friends Section */}
        <Animated.View entering={FadeInDown.delay(600).duration(400)}>
          <Pressable
            style={({ pressed }) => [
              styles.settingsPreview,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push("/friends" as any)}
          >
            <View style={styles.settingsPreviewContent}>
              <Ionicons name="people-outline" size={24} color={colors.text} />
              <View style={styles.settingsPreviewText}>
                <Text style={styles.settingsPreviewTitle}>MY FRIENDS</Text>
                <Text style={styles.settingsPreviewSubtitle}>
                  Manage friends & share recipes
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* App Settings */}
        <Animated.View entering={FadeInDown.delay(700).duration(400)}>
          <Pressable
            style={({ pressed }) => [
              styles.settingsPreview,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push("/settings" as any)}
          >
            <View style={styles.settingsPreviewContent}>
              <Ionicons
                name="settings-outline"
                size={24}
                color={colors.text}
              />
              <View style={styles.settingsPreviewText}>
                <Text style={styles.settingsPreviewTitle}>APP SETTINGS</Text>
                <Text style={styles.settingsPreviewSubtitle}>
                  Preferences & app configuration
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInDown.delay(800).duration(400)}>
          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.cardPressed,
            ]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutText}>SIGN OUT</Text>
          </Pressable>
        </Animated.View>

        {/* Bottom Spacing */}
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
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    backgroundColor: colors.secondary,
    borderWidth: borders.thick,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  userName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  userBio: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.lg,
  },
  editProfileButton: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    ...shadows.sm,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  editProfileText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  statsItem: {
    flex: 1,
    alignItems: "center",
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  statsValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statsLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
  },
  statsDivider: {
    width: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.lg,
  },
  connectSection: {
    marginBottom: spacing.xl,
  },
  connectLabelContainer: {
    alignSelf: "center",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.lg,
  },
  connectLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  settingsPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  settingsPreviewContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingsPreviewText: {},
  settingsPreviewTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  settingsPreviewSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: colors.error,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.error,
    letterSpacing: typography.letterSpacing.wide,
  },
  bottomSpacer: {
    height: 170,
  },
});
