import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useAction } from "convex/react";
import Animated, { FadeInDown, BounceIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { api } from "../convex/_generated/api";
import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

export default function PaymentSuccessScreen() {
  const { checkout_id } = useLocalSearchParams<{ checkout_id?: string }>();
  const verifyCheckout = useAction(api.payments.verifyCheckout);

  useEffect(() => {
    if (checkout_id) {
      verifyCheckout({ checkoutId: checkout_id }).catch((err) =>
        console.error("Verify checkout fallback failed:", err)
      );
    }
  }, [checkout_id]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        {/* Success Icon */}
        <Animated.View
          style={styles.iconContainer}
          entering={BounceIn.delay(200).duration(600)}
        >
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={colors.primary}
          />
        </Animated.View>

        {/* Text */}
        <Animated.View
          style={styles.textSection}
          entering={FadeInDown.delay(500).duration(400)}
        >
          <Text style={styles.title}>WELCOME TO PRO!</Text>
          <Text style={styles.subtitle}>
            You now have unlimited access to all premium features. Happy
            cooking!
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View
          style={styles.ctaSection}
          entering={FadeInDown.delay(700).duration(400)}
        >
          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
            onPress={() => router.replace("/(tabs)/" as any)}
          >
            <Ionicons name="restaurant" size={20} color={colors.textLight} />
            <Text style={styles.ctaText}>START COOKING</Text>
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.xxl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    backgroundColor: colors.surface,
    borderWidth: borders.thick,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  textSection: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: typography.sizes.md * 1.5,
  },
  ctaSection: {
    width: "100%",
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
    gap: spacing.sm,
    ...shadows.md,
  },
  ctaButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  ctaText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.black,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wider,
  },
});
