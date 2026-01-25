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

import { Card, Button, Badge } from "../../src/components/ui";
import {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  borderRadius,
} from "../../src/styles/neobrutalism";

// Settings menu item
function SettingsItem({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <View style={styles.settingsIconContainer}>
          <Ionicons name={icon} size={20} color={colors.text} />
        </View>
        <Text style={styles.settingsItemLabel}>{label}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {value && <Text style={styles.settingsItemValue}>{value}</Text>}
        {showChevron && (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </View>
    </Pressable>
  );
}

// Stats card
function StatsCard({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <Card style={[styles.statsCard, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={colors.text} />
      <Text style={styles.statsValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </Card>
  );
}

export default function ProfileScreen() {
  const handleLogout = () => {
    // Handle logout
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User info */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👨‍🍳</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>Home Chef</Text>
            <Text style={styles.userEmail}>chef@everyday.food</Text>
            <Badge variant="primary" size="sm" style={styles.userBadge}>
              Free Plan
            </Badge>
          </View>
          <Pressable style={styles.editButton}>
            <Ionicons name="pencil" size={18} color={colors.text} />
          </Pressable>
        </Card>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatsCard
            icon="book"
            value="8"
            label="Recipes"
            color={colors.primary}
          />
          <StatsCard
            icon="restaurant"
            value="24"
            label="Cooked"
            color={colors.secondary}
          />
          <StatsCard
            icon="heart"
            value="5"
            label="Favorites"
            color={colors.accent}
          />
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>Preferences</Text>
        <Card style={styles.settingsCard}>
          <SettingsItem
            icon="scale-outline"
            label="Measurement Units"
            value="Imperial"
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="people-outline"
            label="Default Servings"
            value="4"
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="nutrition-outline"
            label="Dietary Preferences"
            value="None"
          />
        </Card>

        <Text style={styles.sectionTitle}>App Settings</Text>
        <Card style={styles.settingsCard}>
          <SettingsItem
            icon="notifications-outline"
            label="Notifications"
            value="On"
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="moon-outline"
            label="Dark Mode"
            value="Off"
          />
          <View style={styles.settingsDivider} />
          <SettingsItem
            icon="cloud-outline"
            label="Sync Status"
            value="Connected"
          />
        </Card>

        <Text style={styles.sectionTitle}>Support</Text>
        <Card style={styles.settingsCard}>
          <SettingsItem icon="help-circle-outline" label="Help Center" />
          <View style={styles.settingsDivider} />
          <SettingsItem icon="chatbubble-outline" label="Send Feedback" />
          <View style={styles.settingsDivider} />
          <SettingsItem icon="star-outline" label="Rate the App" />
          <View style={styles.settingsDivider} />
          <SettingsItem icon="document-text-outline" label="Privacy Policy" />
        </Card>

        {/* Logout button */}
        <Button
          variant="outline"
          fullWidth
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.text} />
          <Text style={styles.logoutText}>  Sign Out</Text>
        </Button>

        {/* Version */}
        <Text style={styles.versionText}>Everyday Food v1.0.0</Text>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    backgroundColor: colors.accent,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  userEmail: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  userBadge: {
    alignSelf: "flex-start",
  },
  editButton: {
    padding: spacing.sm,
  },
  statsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statsCard: {
    flex: 1,
    alignItems: "center",
    padding: spacing.md,
  },
  statsValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  settingsCard: {
    padding: 0,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  settingsItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsItemLabel: {
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  settingsItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  settingsItemValue: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 36 + spacing.md,
  },
  logoutButton: {
    marginTop: spacing.xl,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  versionText: {
    textAlign: "center",
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
});
