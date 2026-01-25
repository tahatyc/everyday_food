import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card, Checkbox, Button, Input, IconButton, Badge } from "../../src/components/ui";
import {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  borderRadius,
} from "../../src/styles/neobrutalism";

// Sample shopping items for demo
const SAMPLE_ITEMS = [
  { id: "1", name: "Eggs", amount: 12, unit: "large", aisle: "Dairy", checked: false },
  { id: "2", name: "Butter", amount: 1, unit: "cup", aisle: "Dairy", checked: false },
  { id: "3", name: "All-purpose flour", amount: 2, unit: "cups", aisle: "Pantry", checked: true },
  { id: "4", name: "Buttermilk", amount: 1.5, unit: "cups", aisle: "Dairy", checked: false },
  { id: "5", name: "Romaine lettuce", amount: 2, unit: "heads", aisle: "Produce", checked: false },
  { id: "6", name: "Chicken breast", amount: 1, unit: "lb", aisle: "Meat", checked: false },
  { id: "7", name: "Parmesan cheese", amount: 0.5, unit: "cup", aisle: "Dairy", checked: true },
];

// Group items by aisle
function groupByAisle(items: typeof SAMPLE_ITEMS) {
  return items.reduce((acc, item) => {
    if (!acc[item.aisle]) {
      acc[item.aisle] = [];
    }
    acc[item.aisle].push(item);
    return acc;
  }, {} as Record<string, typeof SAMPLE_ITEMS>);
}

// Aisle section component
function AisleSection({
  aisle,
  items,
  onToggleItem,
}: {
  aisle: string;
  items: typeof SAMPLE_ITEMS;
  onToggleItem: (id: string) => void;
}) {
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <View style={styles.aisleSection}>
      <View style={styles.aisleHeader}>
        <Text style={styles.aisleName}>{aisle}</Text>
        <Badge variant="default" size="sm">
          {checkedCount}/{items.length}
        </Badge>
      </View>
      {items.map((item) => (
        <Pressable
          key={item.id}
          style={[styles.shoppingItem, item.checked && styles.shoppingItemChecked]}
          onPress={() => onToggleItem(item.id)}
        >
          <Checkbox
            checked={item.checked}
            onToggle={() => onToggleItem(item.id)}
          />
          <View style={styles.itemDetails}>
            <Text
              style={[styles.itemName, item.checked && styles.itemNameChecked]}
            >
              {item.name}
            </Text>
            <Text style={styles.itemAmount}>
              {item.amount} {item.unit}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

export default function ShoppingScreen() {
  const [items, setItems] = useState(SAMPLE_ITEMS);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newItemName, setNewItemName] = useState("");

  const groupedItems = groupByAisle(items);
  const aisles = Object.keys(groupedItems).sort();

  const checkedCount = items.filter((i) => i.checked).length;
  const totalCount = items.length;

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const addItem = () => {
    if (newItemName.trim()) {
      setItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          name: newItemName.trim(),
          amount: 1,
          unit: "",
          aisle: "Other",
          checked: false,
        },
      ]);
      setNewItemName("");
      setShowAddInput(false);
    }
  };

  const clearChecked = () => {
    setItems((prev) => prev.filter((item) => !item.checked));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping List</Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="add"
            variant="primary"
            onPress={() => setShowAddInput(true)}
          />
        </View>
      </View>

      {/* Progress card */}
      <Card style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressCount}>
            {checkedCount} of {totalCount} items
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` },
            ]}
          />
        </View>
        {checkedCount > 0 && (
          <Pressable onPress={clearChecked} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear checked items</Text>
          </Pressable>
        )}
      </Card>

      {/* Add item input */}
      {showAddInput && (
        <Card style={styles.addItemCard}>
          <Input
            placeholder="Add item..."
            value={newItemName}
            onChangeText={setNewItemName}
            autoFocus
            containerStyle={styles.addItemInput}
          />
          <View style={styles.addItemActions}>
            <Button variant="ghost" size="sm" onPress={() => setShowAddInput(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onPress={addItem}>
              Add
            </Button>
          </View>
        </Card>
      )}

      {/* Shopping list */}
      {totalCount === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={80} color={colors.textMuted} />
          <Text style={styles.emptyStateTitle}>Your list is empty</Text>
          <Text style={styles.emptyStateText}>
            Add items manually or generate a list from your meal plan
          </Text>
          <Button
            variant="secondary"
            onPress={() => setShowAddInput(true)}
            style={styles.emptyStateButton}
          >
            Add First Item
          </Button>
        </View>
      ) : (
        <FlatList
          data={aisles}
          keyExtractor={(item) => item}
          renderItem={({ item: aisle }) => (
            <AisleSection
              aisle={aisle}
              items={groupedItems[aisle]}
              onToggleItem={toggleItem}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Generate from recipes button */}
      {totalCount > 0 && (
        <View style={styles.bottomAction}>
          <Button variant="secondary" fullWidth onPress={() => {}}>
            <Ionicons name="restaurant-outline" size={18} color={colors.text} />
            <Text style={styles.bottomActionText}>  Generate from Recipes</Text>
          </Button>
        </View>
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  headerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  progressTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  progressCount: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.surfaceAlt,
    borderRadius: borderRadius.full,
    borderWidth: borders.thin,
    borderColor: colors.border,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  clearButton: {
    marginTop: spacing.sm,
    alignSelf: "flex-end",
  },
  clearButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  addItemCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  addItemInput: {
    marginBottom: spacing.sm,
  },
  addItemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  aisleSection: {
    marginBottom: spacing.lg,
  },
  aisleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  aisleName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  shoppingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  shoppingItemChecked: {
    backgroundColor: colors.surfaceAlt,
    opacity: 0.7,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  itemNameChecked: {
    textDecorationLine: "line-through",
    color: colors.textMuted,
  },
  itemAmount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  bottomAction: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: borders.thin,
    borderTopColor: colors.border,
  },
  bottomActionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
});
