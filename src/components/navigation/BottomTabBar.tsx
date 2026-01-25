import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
  animation,
} from "../../styles/neobrutalism";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Tab configuration
const TAB_CONFIG: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; iconFilled: keyof typeof Ionicons.glyphMap; label: string }
> = {
  index: { icon: "home-outline", iconFilled: "home", label: "HOME" },
  recipes: { icon: "book-outline", iconFilled: "book", label: "RECIPES" },
  "meal-plan": { icon: "calendar-outline", iconFilled: "calendar", label: "PLAN" },
  profile: { icon: "person-outline", iconFilled: "person", label: "PROFILE" },
};

interface TabItemProps {
  routeName: string;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ routeName, isFocused, onPress, onLongPress }: TabItemProps) {
  const config = TAB_CONFIG[routeName];

  if (!config) return null;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isFocused ? 1.05 : 1, {
            damping: animation.spring.damping,
            stiffness: animation.spring.stiffness,
          }),
        },
      ],
    };
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.tabItem, animatedStyle]}
    >
      <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
        <Ionicons
          name={isFocused ? config.iconFilled : config.icon}
          size={22}
          color={colors.text}
        />
      </View>
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
        {config.label}
      </Text>
    </AnimatedPressable>
  );
}

interface FloatingFABProps {
  onPress: () => void;
}

function FloatingFAB({ onPress }: FloatingFABProps) {
  const [isPressed, setIsPressed] = React.useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(isPressed ? 0.92 : 1, {
            damping: 12,
            stiffness: 200,
          }),
        },
        {
          translateY: withSpring(isPressed ? 2 : 0, {
            damping: 12,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.fabContainer}>
      <AnimatedPressable
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        onPress={onPress}
        style={[styles.fab, animatedStyle, isPressed && styles.fabPressed]}
      >
        <Ionicons name="add" size={32} color={colors.textLight} />
      </AnimatedPressable>
    </View>
  );
}

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  // Filter out hidden routes and get visible tabs
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return options.tabBarButton !== undefined
      ? options.tabBarButton !== null
      : TAB_CONFIG[route.name] !== undefined;
  });

  // Split tabs for left and right of FAB
  const leftTabs = visibleRoutes.slice(0, 2);
  const rightTabs = visibleRoutes.slice(2, 4);

  const handleFABPress = () => {
    // Navigate to import/add recipe screen
    navigation.navigate("import" as never);
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {/* Tab bar background */}
      <View style={styles.tabBar}>
        {/* Left tabs */}
        <View style={styles.tabGroup}>
          {leftTabs.map((route) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === state.routes.indexOf(route);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>

        {/* Spacer for FAB */}
        <View style={styles.fabSpacer} />

        {/* Right tabs */}
        <View style={styles.tabGroup}>
          {rightTabs.map((route) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === state.routes.indexOf(route);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: "tabLongPress",
                target: route.key,
              });
            };

            return (
              <TabItem
                key={route.key}
                routeName={route.name}
                isFocused={isFocused}
                onPress={onPress}
                onLongPress={onLongPress}
              />
            );
          })}
        </View>
      </View>

      {/* Floating FAB */}
      <FloatingFAB onPress={handleFABPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xxl,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.md,
  },
  tabGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    minWidth: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
  },
  iconContainerActive: {
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    ...shadows.xs,
  },
  tabLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    marginTop: spacing.xs,
    letterSpacing: typography.letterSpacing.wide,
  },
  tabLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  fabSpacer: {
    width: 70,
  },
  fabContainer: {
    position: "absolute",
    top: -20,
    alignSelf: "center",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.accent,
    borderWidth: borders.regular,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  fabPressed: {
    ...shadows.pressed,
  },
});

export default BottomTabBar;
