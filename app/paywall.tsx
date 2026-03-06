import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSubscription } from "../src/hooks/useSubscription";
import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

const FEATURES = [
  { icon: "restaurant" as const, text: "Unlimited recipes" },
  { icon: "calendar" as const, text: "Unlimited meal planning" },
  { icon: "cloud-download" as const, text: "Unlimited recipe imports" },
  { icon: "cart" as const, text: "Unlimited shopping lists" },
  { icon: "share-social" as const, text: "Unlimited recipe sharing" },
  { icon: "nutrition" as const, text: "Detailed nutrition breakdown" },
  { icon: "trophy" as const, text: "Exclusive achievements" },
  { icon: "ban" as const, text: "Ad-free experience" },
];

export default function PaywallScreen() {
  const { startCheckout, isPro, status } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await startCheckout();
    } catch (error) {
      console.error("Checkout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Already subscribed
  if (isPro) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <Pressable style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.alreadyProContainer}>
          <Text style={styles.crownEmoji}>👨‍🍳</Text>
          <Text style={styles.alreadyProTitle}>YOU'RE ALREADY PRO!</Text>
          <Text style={styles.alreadyProSubtitle}>
            {status === "trialing"
              ? "Enjoying your free trial"
              : "Enjoying all premium features"}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.ctaText}>CONTINUE COOKING</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Crown / Pro Badge */}
        <Animated.View
          style={styles.heroSection}
          entering={FadeInDown.duration(400)}
        >
          <View style={styles.proBadge}>
            <Text style={styles.crownEmoji}>👨‍🍳</Text>
            <View style={styles.proLabelBadge}>
              <Text style={styles.proLabel}>PRO</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>EVERYDAY FOOD PRO</Text>
          <Text style={styles.heroSubtitle}>
            Unlock the full cooking experience
          </Text>
        </Animated.View>

        {/* Features List */}
        <Animated.View
          style={styles.featuresCard}
          entering={FadeInDown.delay(150).duration(400)}
        >
          {FEATURES.map((feature, index) => (
            <View key={feature.text} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        {/* CTA */}
        <Animated.View
          style={styles.ctaSection}
          entering={FadeInDown.delay(300).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
              isLoading && styles.ctaButtonDisabled,
            ]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.textLight} />
            ) : (
              <>
                <Ionicons name="star" size={20} color={colors.textLight} />
                <Text style={styles.ctaText}>START 7-DAY FREE TRIAL</Text>
              </>
            )}
          </Pressable>
          <Text style={styles.priceText}>Then EUR 8/month</Text>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          style={styles.footer}
          entering={FadeInDown.delay(400).duration(400)}
        >
          <Text style={styles.footerText}>Cancel anytime</Text>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    justifyContent: "flex-end",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  closeButton: {
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    marginTop: spacing.lg,
  },
  proBadge: {
    width: 100,
    height: 100,
    backgroundColor: colors.secondary,
    borderWidth: borders.thick,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  crownEmoji: {
    fontSize: 48,
  },
  proLabelBadge: {
    position: "absolute",
    bottom: -8,
    backgroundColor: colors.accent,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  proLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.black,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
  heroTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  featuresCard: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    gap: spacing.md,
    ...shadows.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  featureCheck: {
    width: 28,
    alignItems: "center",
  },
  featureText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    flex: 1,
  },
  ctaSection: {
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderWidth: borders.thick,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxxl,
    gap: spacing.sm,
    width: "100%",
    ...shadows.md,
  },
  ctaButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.black,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
  priceText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.semibold,
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  alreadyProContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  alreadyProTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
  },
  alreadyProSubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
});
