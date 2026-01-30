import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  Layout,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

import {
  borderRadius,
  borders,
  colors,
  shadows,
  spacing,
  typography,
} from "../src/styles/neobrutalism";

type GroceryItem = {
  _id: Id<"shoppingItems">;
  name: string;
  amount?: number | null;
  unit?: string | null;
  aisle?: string | null;
  recipeName?: string | null;
  isChecked: boolean;
};

// Category Section Component
function CategorySection({
  title,
  items,
  onToggleItem,
  index,
}: {
  title: string;
  items: GroceryItem[];
  onToggleItem: (id: Id<"shoppingItems">) => void;
  index: number;
}) {
  if (items.length === 0) return null;

  return (
    <Animated.View
      style={styles.categorySection}
      entering={FadeInDown.delay(200 + index * 100).duration(400)}
    >
      {/* Category Label */}
      <View style={styles.categoryLabelContainer}>
        <View style={styles.categoryLabel}>
          <Text style={styles.categoryLabelText}>{title}</Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsContainer}>
        {items.map((item, itemIndex) => (
          <GroceryItemCard
            key={item._id}
            item={item}
            onToggle={() => onToggleItem(item._id)}
            index={itemIndex}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Grocery Item Card
function GroceryItemCard({
  item,
  onToggle,
  index,
}: {
  item: GroceryItem;
  onToggle: () => void;
  index: number;
}) {
  const quantity = item.amount ? `${item.amount} ${item.unit || ""}`.trim() : "";
  const aisle = item.aisle ? item.aisle.toUpperCase() : "";

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      layout={Layout.springify()}
    >
      <Pressable
        style={({ pressed }) => [
          styles.itemCard,
          item.isChecked && styles.itemCardChecked,
          pressed && styles.cardPressed,
        ]}
        onPress={onToggle}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
          {item.isChecked && (
            <Ionicons name="checkmark" size={16} color={colors.textLight} />
          )}
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <Text
            style={[styles.itemName, item.isChecked && styles.itemNameChecked]}
          >
            {item.name}
          </Text>
          {item.recipeName && (
            <View style={styles.recipeBadge}>
              <Text style={styles.recipeBadgeText}>{item.recipeName}</Text>
            </View>
          )}
        </View>

        {/* Quantity & Aisle */}
        <View style={styles.itemMeta}>
          {quantity && <Text style={styles.itemQuantity}>{quantity}</Text>}
          {aisle && <Text style={styles.itemAisle}>{aisle}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// View Toggle Button
function ViewToggle({
  activeView,
  onChangeView,
}: {
  activeView: "aisle" | "recipe";
  onChangeView: (view: "aisle" | "recipe") => void;
}) {
  return (
    <View style={styles.viewToggle}>
      <Pressable
        style={[
          styles.toggleButton,
          activeView === "aisle" && styles.toggleButtonActive,
        ]}
        onPress={() => onChangeView("aisle")}
      >
        <Text
          style={[
            styles.toggleButtonText,
            activeView === "aisle" && styles.toggleButtonTextActive,
          ]}
        >
          AISLE
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.toggleButton,
          activeView === "recipe" && styles.toggleButtonActive,
        ]}
        onPress={() => onChangeView("recipe")}
      >
        <Text
          style={[
            styles.toggleButtonText,
            activeView === "recipe" && styles.toggleButtonTextActive,
          ]}
        >
          RECIPE
        </Text>
      </Pressable>
    </View>
  );
}

export default function GroceryListScreen() {
  const [activeView, setActiveView] = useState<"aisle" | "recipe">("aisle");

  // Fetch shopping list from Convex
  const shoppingList = useQuery(api.shoppingLists.getActive);
  const toggleItemMutation = useMutation(api.shoppingLists.toggleItem);

  const toggleItem = async (id: Id<"shoppingItems">) => {
    try {
      await toggleItemMutation({ itemId: id });
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  // Group items by category/aisle
  const groupedItems = useMemo(() => {
    if (!shoppingList?.items) {
      return { Produce: [], Dairy: [], Meat: [], Bakery: [], Pantry: [], Other: [] };
    }

    const groups: Record<string, GroceryItem[]> = {
      Produce: [],
      Dairy: [],
      Meat: [],
      Bakery: [],
      Pantry: [],
      Other: [],
    };

    for (const item of shoppingList.items) {
      const category = item.aisle || "Other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item as GroceryItem);
    }

    return groups;
  }, [shoppingList?.items]);

  const totalItems = shoppingList?.items?.length || 0;
  const checkedItems = shoppingList?.items?.filter((item) => item.isChecked).length || 0;
  const uncheckedItems = totalItems - checkedItems;

  // Loading state
  if (shoppingList === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>Loading grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!shoppingList || totalItems === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Animated.View style={styles.header} entering={FadeInDown.duration(300)}>
          <Pressable style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>SMART GROCERY LIST</Text>
          <Pressable style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
          </Pressable>
        </Animated.View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySubtitle}>Add ingredients from recipes to get started</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>SMART GROCERY LIST</Text>
        <Pressable style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </Pressable>
      </Animated.View>

      {/* View Toggle */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(300)}
        style={styles.toggleContainer}
      >
        <ViewToggle activeView={activeView} onChangeView={setActiveView} />
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Categories */}
        {Object.entries(groupedItems).map(([category, categoryItems], index) => (
          <CategorySection
            key={category}
            title={category.toUpperCase()}
            items={categoryItems}
            onToggleItem={toggleItem}
            index={index}
          />
        ))}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Checkout Button */}
      <Animated.View
        style={styles.checkoutContainer}
        entering={FadeInDown.delay(500).duration(400)}
      >
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            pressed && styles.checkoutButtonPressed,
          ]}
        >
          <View style={styles.checkoutContent}>
            <Text style={styles.checkoutTitle}>CHECKOUT / ORDER LIST</Text>
            <Text style={styles.checkoutSubtitle}>
              {uncheckedItems} Items remaining
            </Text>
          </View>
          <View style={styles.checkoutBadge}>
            <Text style={styles.checkoutBadgeText}>{uncheckedItems}</Text>
            <Text style={styles.checkoutBadgeLabel}>Items</Text>
          </View>
          <Ionicons name="cart" size={24} color={colors.textLight} />
        </Pressable>
      </Animated.View>
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
  toggleContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  viewToggle: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    ...shadows.sm,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: colors.text,
  },
  toggleButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  toggleButtonTextActive: {
    color: colors.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  categorySection: {
    marginBottom: spacing.xl,
  },
  categoryLabelContainer: {
    marginBottom: spacing.md,
  },
  categoryLabel: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryLabelText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
  },
  itemsContainer: {
    gap: spacing.sm,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  itemCardChecked: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.8,
  },
  cardPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  checkboxChecked: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  recipeBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  recipeBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  itemMeta: {
    alignItems: "flex-end",
  },
  itemQuantity: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemAisle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
  },
  checkoutContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: borders.thin,
    borderTopColor: colors.borderLight,
  },
  checkoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cyan,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  checkoutButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  checkoutContent: {
    flex: 1,
  },
  checkoutTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
  checkoutSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    opacity: 0.8,
  },
  checkoutBadge: {
    alignItems: "center",
    marginRight: spacing.md,
  },
  checkoutBadgeText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.textLight,
  },
  checkoutBadgeLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textLight,
    opacity: 0.8,
  },
  bottomSpacer: {
    height: 170,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: "center",
  },
});
