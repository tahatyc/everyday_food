import React, { useState } from "react";
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
  FadeInRight,
  Layout,
} from "react-native-reanimated";

import {
  colors,
  spacing,
  borders,
  borderRadius,
  shadows,
  typography,
} from "../src/styles/neobrutalism";

// Mock grocery items
const initialGroceryItems = {
  produce: [
    { id: "1", name: "Apples", quantity: "2 Qty", aisle: "AISLE 1", recipe: "Fruit Salad", checked: false },
    { id: "2", name: "Spinach", quantity: "1 Bag", aisle: "AISLE 1", recipe: "Green Smoothie", checked: false },
    { id: "3", name: "Tomatoes", quantity: "4 Qty", aisle: "AISLE 1", recipe: "Pasta Sauce", checked: false },
  ],
  dairy: [
    { id: "4", name: "Whole Milk", quantity: "1 Ltr", aisle: "AISLE 4", recipe: "Carbonara", checked: true },
    { id: "5", name: "Parmesan", quantity: "200g", aisle: "AISLE 4", recipe: "Carbonara", checked: false },
    { id: "6", name: "Eggs", quantity: "12 Qty", aisle: "AISLE 4", recipe: "Breakfast", checked: false },
  ],
  pantry: [
    { id: "7", name: "Pasta", quantity: "500g", aisle: "AISLE 3", recipe: "Carbonara", checked: false },
    { id: "8", name: "Olive Oil", quantity: "1 Bottle", aisle: "AISLE 3", recipe: "Various", checked: false },
  ],
};

type GroceryItem = {
  id: string;
  name: string;
  quantity: string;
  aisle: string;
  recipe: string;
  checked: boolean;
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
  onToggleItem: (id: string) => void;
  index: number;
}) {
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
            key={item.id}
            item={item}
            onToggle={() => onToggleItem(item.id)}
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
  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      layout={Layout.springify()}
    >
      <Pressable
        style={({ pressed }) => [
          styles.itemCard,
          item.checked && styles.itemCardChecked,
          pressed && styles.cardPressed,
        ]}
        onPress={onToggle}
      >
        {/* Checkbox */}
        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
          {item.checked && (
            <Ionicons name="checkmark" size={16} color={colors.textLight} />
          )}
        </View>

        {/* Item Info */}
        <View style={styles.itemInfo}>
          <Text
            style={[styles.itemName, item.checked && styles.itemNameChecked]}
          >
            {item.name}
          </Text>
          <View style={styles.recipeBadge}>
            <Text style={styles.recipeBadgeText}>{item.recipe}</Text>
          </View>
        </View>

        {/* Quantity & Aisle */}
        <View style={styles.itemMeta}>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
          <Text style={styles.itemAisle}>{item.aisle}</Text>
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
  const [items, setItems] = useState(initialGroceryItems);

  const toggleItem = (id: string) => {
    setItems((prev) => {
      const newItems = { ...prev };
      for (const category of Object.keys(newItems) as (keyof typeof newItems)[]) {
        newItems[category] = newItems[category].map((item) =>
          item.id === id ? { ...item, checked: !item.checked } : item
        );
      }
      return newItems;
    });
  };

  const totalItems = Object.values(items).flat().length;
  const checkedItems = Object.values(items)
    .flat()
    .filter((item) => item.checked).length;
  const uncheckedItems = totalItems - checkedItems;

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
        <CategorySection
          title="PRODUCE"
          items={items.produce}
          onToggleItem={toggleItem}
          index={0}
        />
        <CategorySection
          title="DAIRY"
          items={items.dairy}
          onToggleItem={toggleItem}
          index={1}
        />
        <CategorySection
          title="PANTRY"
          items={items.pantry}
          onToggleItem={toggleItem}
          index={2}
        />

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
    height: 100,
  },
});
