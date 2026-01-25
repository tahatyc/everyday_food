import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, {
  FadeInDown,
} from "react-native-reanimated";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
} from "../../src/styles/neobrutalism";

// Cookbook Card Component
function CookbookCard({
  title,
  recipeCount,
  color,
  index,
  onPress,
}: {
  title: string;
  recipeCount: number;
  color: string;
  index: number;
  onPress: () => void;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).duration(400)}
      style={styles.cookbookCardContainer}
    >
      <Pressable
        style={({ pressed }) => [
          styles.cookbookCard,
          { backgroundColor: color },
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
      >
        <View style={styles.cookbookBadge}>
          <Text style={styles.cookbookBadgeText}>{recipeCount} RECIPES</Text>
        </View>
        <Text style={styles.cookbookTitle}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}

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
  const cookbooks = [
    { id: "1", title: "ITALIAN FAVORITES", recipeCount: 12, color: colors.primaryLight },
    { id: "2", title: "QUICK VEGAN", recipeCount: 8, color: colors.secondary },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <Animated.View
        style={styles.header}
        entering={FadeInDown.duration(300)}
      >
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>CHEF PROFILE</Text>
        <Pressable style={styles.headerButton}>
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

          <Text style={styles.userName}>ALEX CULINARIA</Text>
          <Text style={styles.userBio}>
            Home chef & flavor seeker.{"\n"}
            Exploring the art of Italian pasta{"\n"}
            & vegan treats. 🍝
          </Text>

          {/* Edit Profile Button */}
          <Pressable
            style={({ pressed }) => [
              styles.editProfileButton,
              pressed && styles.cardPressed,
            ]}
          >
            <Text style={styles.editProfileText}>EDIT PROFILE</Text>
          </Pressable>
        </Animated.View>

        {/* My Cookbooks Section */}
        <Animated.View
          style={styles.sectionHeader}
          entering={FadeInDown.delay(200).duration(400)}
        >
          <View style={styles.sectionLabelContainer}>
            <Text style={styles.sectionLabel}>MY COOKBOOKS</Text>
          </View>
        </Animated.View>

        <View style={styles.cookbooksGrid}>
          {cookbooks.map((cookbook, index) => (
            <CookbookCard
              key={cookbook.id}
              title={cookbook.title}
              recipeCount={cookbook.recipeCount}
              color={cookbook.color}
              index={index}
              onPress={() => router.push(`/cookbook/${cookbook.id}` as any)}
            />
          ))}
        </View>

        {/* Stats Section */}
        <Animated.View
          style={styles.statsContainer}
          entering={FadeInDown.delay(500).duration(400)}
        >
          <StatsItem icon="heart" value="1.2k" label="LIKES" />
          <View style={styles.statsDivider} />
          <StatsItem icon="people" value="450" label="FOLLOWERS" />
        </Animated.View>

        {/* Connect Section */}
        <Animated.View
          style={styles.connectSection}
          entering={FadeInDown.delay(600).duration(400)}
        >
          <View style={styles.connectLabelContainer}>
            <Text style={styles.connectLabel}>CONNECT</Text>
          </View>

          <View style={styles.socialButtons}>
            <SocialButton icon="camera" color={colors.text} />
            <SocialButton icon="videocam" color={colors.secondary} />
            <SocialButton icon="share-social" color={colors.cyan} />
          </View>
        </Animated.View>

        {/* Settings Preview */}
        <Animated.View
          entering={FadeInDown.delay(700).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.settingsPreview,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.settingsPreviewContent}>
              <Ionicons name="settings-outline" size={24} color={colors.text} />
              <View style={styles.settingsPreviewText}>
                <Text style={styles.settingsPreviewTitle}>APP SETTINGS</Text>
                <Text style={styles.settingsPreviewSubtitle}>
                  Preferences, notifications, sync
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View
          entering={FadeInDown.delay(800).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.replace("/(auth)/login")}
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
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionLabelContainer: {
    alignSelf: "flex-start",
    backgroundColor: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
  cookbooksGrid: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  cookbookCardContainer: {
    flex: 1,
  },
  cookbookCard: {
    height: 140,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    justifyContent: "flex-end",
    ...shadows.sm,
  },
  cookbookBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginBottom: spacing.sm,
  },
  cookbookBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  cookbookTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
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
    gap: spacing.sm,
  },
  signOutText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.error,
    letterSpacing: typography.letterSpacing.wide,
  },
  bottomSpacer: {
    height: 120,
  },
});
