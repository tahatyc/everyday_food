import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Id } from "../../convex/_generated/dataModel";
import { Badge, Card } from "./ui";
import {
  borderRadius,
  borders,
  colors,
  getDifficultyColor,
  getMealTypeColor,
  shadows,
  spacing,
  typography,
} from "../styles/neobrutalism";
import { getMealTypeEmoji, getMealTypeFromTags } from "../lib/meal-types";

export type RecipeCardData = {
  _id: Id<"recipes">;
  title: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  difficulty?: "easy" | "medium" | "hard";
  isFavorite?: boolean;
  isGlobal?: boolean;
  cookCount?: number;
  tags: string[];
};

type RecipeCardAction =
  | { type: "favorite"; onPress: (recipe: RecipeCardData) => void }
  | { type: "add"; onPress: (recipe: RecipeCardData) => void };

interface RecipeCardProps {
  recipe: RecipeCardData;
  action: RecipeCardAction;
  onCardPress?: (recipe: RecipeCardData) => void;
  index?: number;
  animated?: boolean;
}

export function RecipeCard({
  recipe,
  action,
  onCardPress,
  index = 0,
  animated = true,
}: RecipeCardProps) {
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const mealType = getMealTypeFromTags(recipe.tags);

  const handleCardPress = onCardPress
    ? () => onCardPress(recipe)
    : action.type === "add"
      ? () => action.onPress(recipe)
      : undefined;

  const content = (
    <Card
      style={styles.recipeItem}
      onPress={handleCardPress}
    >
      {recipe.isGlobal && (
        <View style={styles.globalBadge}>
          <Ionicons name="globe-outline" size={12} color={colors.primary} />
          <Text style={styles.globalBadgeText}>GLOBAL</Text>
        </View>
      )}

      <View
        style={[
          styles.recipeImage,
          { backgroundColor: getMealTypeColor(mealType) },
        ]}
      >
        <Text style={styles.recipeEmoji}>{getMealTypeEmoji(mealType)}</Text>
      </View>

      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={1}>
          {recipe.title}
        </Text>
        {recipe.description && (
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {recipe.description}
          </Text>
        )}

        <View style={styles.recipeMeta}>
          <View style={styles.recipeMetaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.recipeMetaText}>{totalTime} min</Text>
          </View>
          <View style={styles.recipeMetaItem}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.recipeMetaText}>{recipe.servings} servings</Text>
          </View>
          {recipe.difficulty && (
            <Badge
              variant="default"
              size="sm"
              color={getDifficultyColor(recipe.difficulty)}
            >
              {recipe.difficulty}
            </Badge>
          )}
        </View>

        <View style={styles.recipeTags}>
          {recipe.tags?.slice(0, 3).map((tag: string) => (
            <Badge key={tag} variant="default" size="sm">
              {tag}
            </Badge>
          ))}
        </View>
      </View>

      {action.type === "favorite" && (
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
          onPress={() => action.onPress(recipe)}
          hitSlop={8}
        >
          <Ionicons
            name={recipe.isFavorite ? "heart" : "heart-outline"}
            size={22}
            color={recipe.isFavorite ? colors.error : colors.primary}
          />
        </Pressable>
      )}

      {action.type === "add" && (
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => action.onPress(recipe)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color={colors.textLight} />
        </Pressable>
      )}
    </Card>
  );

  if (animated) {
    return (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
        {content}
      </Animated.View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  recipeItem: {
    flexDirection: "row",
    padding: 0,
    overflow: "hidden",
  },
  recipeImage: {
    width: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  recipeEmoji: {
    fontSize: 36,
  },
  recipeContent: {
    flex: 1,
    padding: spacing.md,
  },
  recipeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  recipeMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  recipeTags: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  globalBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: borders.thin,
    borderColor: borders.color,
    ...shadows.sm,
    zIndex: 1,
  },
  globalBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: "uppercase",
  },
  actionButton: {
    padding: spacing.md,
    alignSelf: "flex-start",
  },
  actionButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.85 }],
  },
  addButton: {
    alignSelf: "flex-start",
    margin: spacing.md,
    width: 34,
    height: 34,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    borderWidth: borders.thin,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  addButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.85 }],
  },
});

export default RecipeCard;
