import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

// Change Detection Banner
function ChangeBanner({
  onSync,
  onDismiss,
}: {
  onSync: () => void;
  onDismiss: () => void;
}) {
  return (
    <Animated.View
      style={styles.changeBanner}
      entering={FadeInDown.duration(300)}
    >
      <Text style={styles.changeBannerText}>Your meal plan has changed.</Text>
      <View style={styles.changeBannerActions}>
        <Pressable
          style={({ pressed }) => [
            styles.changeBannerButton,
            pressed && styles.changeBannerButtonPressed,
          ]}
          onPress={onSync}
        >
          <Text style={styles.changeBannerButtonText}>UPDATE LIST</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.changeBannerDismiss,
            pressed && { opacity: 0.7 },
          ]}
          onPress={onDismiss}
        >
          <Text style={styles.changeBannerDismissText}>DISMISS</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function GroceryListScreen() {
  const [activeView, setActiveView] = useState<"aisle" | "recipe">("aisle");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // 4.1 Route Params
  const { weekStartDate, weekEndDate } = useLocalSearchParams<{
    weekStartDate: string;
    weekEndDate: string;
  }>();

  const isWeekScoped = !!weekStartDate && !!weekEndDate;

  // 4.2 Data Fetching
  // Week-scoped list (when navigated from meal plan)
  const weekList = useQuery(
    api.shoppingLists.getByWeek,
    isWeekScoped ? { weekStartDate } : "skip"
  );

  // Legacy active list (when opened directly without week params)
  const activeList = useQuery(
    api.shoppingLists.getActive,
    !isWeekScoped ? {} : "skip"
  );

  // Use whichever list applies
  const shoppingList = isWeekScoped ? weekList : activeList;

  // Detect meal plan changes (only for week-scoped lists that exist)
  const changeDetection = useQuery(
    api.shoppingLists.detectMealPlanChanges,
    isWeekScoped && shoppingList?._id ? { listId: shoppingList._id } : "skip"
  );

  // Mutations
  const createForWeek = useMutation(api.shoppingLists.createForWeek);
  const syncWithMealPlan = useMutation(api.shoppingLists.syncWithMealPlan);
  const toggleItemMutation = useMutation(api.shoppingLists.toggleItem);
  const addItemMutation = useMutation(api.shoppingLists.addItem);
  const clearCheckedMutation = useMutation(api.shoppingLists.clearChecked);

  // 4.3 Auto-Create on First Visit
  const hasTriggeredCreate = useRef(false);
  useEffect(() => {
    if (
      isWeekScoped &&
      weekList === null &&
      !hasTriggeredCreate.current &&
      !isCreating
    ) {
      hasTriggeredCreate.current = true;
      setIsCreating(true);
      createForWeek({ weekStartDate: weekStartDate!, weekEndDate: weekEndDate! })
        .catch((err) => console.error("Failed to create week list:", err))
        .finally(() => setIsCreating(false));
    }
  }, [weekList, isWeekScoped, weekStartDate, weekEndDate]);

  // 4.5 Header Title with Week Range
  const headerTitle = useMemo(() => {
    if (!isWeekScoped) return "GROCERY LIST";
    try {
      const start = new Date(weekStartDate + "T00:00:00");
      const end = new Date(weekEndDate + "T00:00:00");
      const startStr = format(start, "MMM d").toUpperCase();
      const endStr = format(end, "d").toUpperCase();
      return `GROCERY LIST — ${startStr}-${endStr}`;
    } catch {
      return "GROCERY LIST";
    }
  }, [isWeekScoped, weekStartDate, weekEndDate]);

  const toggleItem = async (id: Id<"shoppingItems">) => {
    try {
      await toggleItemMutation({ itemId: id });
    } catch (error) {
      console.error("Failed to toggle item:", error);
    }
  };

  // 4.4 Sync handler
  const handleSync = async () => {
    if (!shoppingList?._id) return;
    try {
      await syncWithMealPlan({ listId: shoppingList._id });
      setBannerDismissed(true);
    } catch (error) {
      console.error("Failed to sync with meal plan:", error);
    }
  };

  // 4.7 Add manual item handler
  const handleAddManualItem = async () => {
    const trimmed = newItemName.trim();
    if (!trimmed || !shoppingList?._id) return;
    try {
      await addItemMutation({ name: trimmed, listId: shoppingList._id });
      setNewItemName("");
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  // 4.8 Clear checked handler
  const handleClearChecked = async () => {
    if (!shoppingList?._id) return;
    try {
      await clearCheckedMutation({ listId: shoppingList._id });
    } catch (error) {
      console.error("Failed to clear checked items:", error);
    }
  };

  // Group items by aisle
  const aisleGroupedItems = useMemo(() => {
    if (!shoppingList?.items) return {};

    const groups: Record<string, GroceryItem[]> = {};

    for (const item of shoppingList.items) {
      const category = item.aisle || "Other";
      if (!groups[category]) groups[category] = [];
      groups[category].push(item as GroceryItem);
    }

    return groups;
  }, [shoppingList?.items]);

  // 4.6 Group items by recipe
  const recipeGroupedItems = useMemo(() => {
    if (!shoppingList?.items) return {};

    const groups: Record<string, GroceryItem[]> = {};

    for (const item of shoppingList.items) {
      const groupName = (item as GroceryItem).recipeName || "Other Items";
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(item as GroceryItem);
    }

    return groups;
  }, [shoppingList?.items]);

  const displayedGroups = activeView === "aisle" ? aisleGroupedItems : recipeGroupedItems;

  const totalItems = shoppingList?.items?.length || 0;
  const checkedItems = shoppingList?.items?.filter((item) => item.isChecked).length || 0;
  const uncheckedItems = totalItems - checkedItems;

  const showChangeBanner =
    isWeekScoped &&
    changeDetection?.hasChanges &&
    !bannerDismissed;

  // Loading state
  if (shoppingList === undefined || isCreating) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
          <Text style={styles.loadingText}>
            {isCreating ? "Generating grocery list..." : "Loading grocery list..."}
          </Text>
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
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
          </View>
        </Animated.View>
        {showChangeBanner && (
          <ChangeBanner
            onSync={handleSync}
            onDismiss={() => setBannerDismissed(true)}
          />
        )}
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptySubtitle}>
            {isWeekScoped
              ? showChangeBanner
                ? "Your meal plan has recipes. Tap \"UPDATE LIST\" to populate your grocery list."
                : "Add meals to your plan, then come back to generate your list"
              : "Add ingredients from recipes to get started"}
          </Text>
        </View>

        {/* Add Manual Item even on empty state */}
        {shoppingList && (
          <View style={styles.addItemContainer}>
            <View style={styles.addItemRow}>
              <TextInput
                style={styles.addItemInput}
                placeholder="Add an item..."
                placeholderTextColor={colors.textMuted}
                value={newItemName}
                onChangeText={setNewItemName}
                onSubmitEditing={handleAddManualItem}
                returnKeyType="done"
              />
              <Pressable
                style={({ pressed }) => [
                  styles.addItemButton,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleAddManualItem}
              >
                <Ionicons name="add-circle" size={32} color={colors.cyan} />
              </Pressable>
            </View>
          </View>
        )}
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
        <Text style={styles.headerTitle} numberOfLines={1}>{headerTitle}</Text>
        <Pressable style={styles.headerButton} onPress={handleClearChecked}>
          <Ionicons name="trash-outline" size={22} color={checkedItems > 0 ? colors.accent : colors.textMuted} />
        </Pressable>
      </Animated.View>

      {/* Change Detection Banner */}
      {showChangeBanner && (
        <ChangeBanner
          onSync={handleSync}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

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
        {/* Categories / Recipe Groups */}
        {Object.entries(displayedGroups).map(([category, categoryItems], index) => (
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

      {/* Add Manual Item Input */}
      <View style={styles.addItemContainer}>
        <View style={styles.addItemRow}>
          <TextInput
            style={styles.addItemInput}
            placeholder="Add an item..."
            placeholderTextColor={colors.textMuted}
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={handleAddManualItem}
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [
              styles.addItemButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleAddManualItem}
          >
            <Ionicons name="add-circle" size={32} color={colors.cyan} />
          </Pressable>
        </View>
      </View>
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
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wider,
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  // Change Detection Banner
  changeBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.secondary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  changeBannerText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  changeBannerActions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  changeBannerButton: {
    backgroundColor: colors.text,
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  changeBannerButtonPressed: {
    opacity: 0.8,
  },
  changeBannerButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.textLight,
    letterSpacing: typography.letterSpacing.wide,
  },
  changeBannerDismiss: {
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  changeBannerDismissText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: typography.letterSpacing.wide,
  },
  // View Toggle
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
  // Add Manual Item
  addItemContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: borders.thin,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.background,
  },
  addItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  addItemInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  addItemButton: {
    padding: spacing.xs,
  },
  // Checkout
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
    height: 20,
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
