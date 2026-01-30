# Expo Screen Skill

Create new Expo Router screens following project patterns.

## File Locations

| Type          | Location               | Example                          |
| ------------- | ---------------------- | -------------------------------- |
| Tab screen    | `app/(tabs)/name.tsx`  | `app/(tabs)/settings.tsx`        |
| Auth screen   | `app/(auth)/name.tsx`  | `app/(auth)/forgot-password.tsx` |
| Dynamic route | `app/feature/[id].tsx` | `app/recipe/[id].tsx`            |
| Modal         | `app/name.tsx`         | `app/import.tsx`                 |

## Basic Screen Template

```tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
} from "../../src/styles/neobrutalism";

export default function ScreenName() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          style={styles.header}
          entering={FadeInDown.duration(400)}
        >
          <Text style={styles.headerTitle}>SCREEN TITLE</Text>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          {/* Your content here */}
        </Animated.View>

        {/* Bottom spacing for tab bar */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic",
    color: colors.text,
    textTransform: "uppercase",
  },
  bottomSpacer: {
    height: 170,
  },
});
```

## Dynamic Route Screen

```tsx
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const item = useQuery(api.items.getById, { id: id as Id<"items"> });

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Content with item data */}
    </SafeAreaView>
  );
}
```

## Section Header Pattern

```tsx
function SectionHeader({
  title,
  onViewAll,
}: {
  title: string;
  onViewAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onViewAll && (
        <Pressable onPress={onViewAll}>
          <Text style={styles.sectionLink}>VIEW ALL</Text>
        </Pressable>
      )}
    </View>
  );
}

// Styles
sectionHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: spacing.xxl,
  marginBottom: spacing.lg,
},
sectionTitle: {
  fontSize: typography.sizes.lg,
  fontWeight: typography.weights.black,
  fontStyle: "italic",
  color: colors.text,
  flex: 1,
},
sectionLink: {
  fontSize: typography.sizes.sm,
  fontWeight: typography.weights.bold,
  color: colors.textSecondary,
  textDecorationLine: "underline",
},
```

## Card with Press Feedback

```tsx
function ItemCard({ item, index }: { item: Item; index: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 100).duration(400)}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={() => router.push(`/item/${item.id}`)}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardMeta}>{item.subtitle}</Text>
      </Pressable>
    </Animated.View>
  );
}

// Styles
card: {
  backgroundColor: colors.surface,
  borderWidth: borders.regular,
  borderColor: borders.color,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  ...shadows.sm,
},
cardPressed: {
  transform: [{ translateX: 2 }, { translateY: 2 }],
  ...shadows.pressed,
},
cardTitle: {
  fontSize: typography.sizes.lg,
  fontWeight: typography.weights.bold,
  color: colors.text,
},
cardMeta: {
  fontSize: typography.sizes.sm,
  color: colors.textSecondary,
  marginTop: spacing.xs,
},
```

## Horizontal Scroll List

```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.horizontalScrollContent}
  style={styles.horizontalScroll}
>
  {items.map((item, index) => (
    <ItemCard key={item.id} item={item} index={index} />
  ))}
</ScrollView>

// Styles
horizontalScroll: {
  marginHorizontal: -spacing.lg,
},
horizontalScrollContent: {
  paddingHorizontal: spacing.lg,
  gap: spacing.md,
},
```

## Action Button

```tsx
<Pressable
  style={({ pressed }) => [
    styles.actionButton,
    pressed && styles.actionButtonPressed,
  ]}
  onPress={handleAction}
>
  <Ionicons name="add-circle-outline" size={22} color={colors.text} />
  <Text style={styles.actionButtonText}>ACTION NAME</Text>
</Pressable>

// Styles
actionButton: {
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
actionButtonPressed: {
  transform: [{ translateX: 2 }, { translateY: 2 }],
  ...shadows.pressed,
},
actionButtonText: {
  fontSize: typography.sizes.md,
  fontWeight: typography.weights.bold,
  color: colors.text,
  letterSpacing: typography.letterSpacing.wide,
},
```

## Animation Patterns

```tsx
// Staggered fade in from bottom
<Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>

// Fade in from right (for horizontal lists)
<Animated.View entering={FadeInRight.delay(index * 100).duration(400)}>

// Spring animation for interactive elements
import { useAnimatedStyle, withSpring } from "react-native-reanimated";
```

## Navigation

```tsx
import { router, useLocalSearchParams, Stack } from "expo-router";

// Navigate forward
router.push("/recipe/123");
router.push("/(tabs)/recipes");

// Navigate back
router.back();

// Replace current screen
router.replace("/home");

// Get route params
const { id } = useLocalSearchParams<{ id: string }>();
```
