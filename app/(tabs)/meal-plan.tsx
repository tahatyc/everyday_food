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

import { Card, Badge, IconButton } from "../../src/components/ui";
import {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  borderRadius,
} from "../../src/styles/neobrutalism";

// Get days of current week
function getWeekDays(startDate: Date): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast", icon: "sunny-outline" as const, color: colors.breakfast },
  { id: "lunch", label: "Lunch", icon: "restaurant-outline" as const, color: colors.lunch },
  { id: "dinner", label: "Dinner", icon: "moon-outline" as const, color: colors.dinner },
];

// Day column component
function DayColumn({ date, isToday }: { date: Date; isToday: boolean }) {
  const dayName = DAY_NAMES[date.getDay()];
  const dayNumber = date.getDate();

  return (
    <View style={styles.dayColumn}>
      <View style={[styles.dayHeader, isToday && styles.dayHeaderToday]}>
        <Text style={[styles.dayName, isToday && styles.dayNameToday]}>
          {dayName}
        </Text>
        <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
          {dayNumber}
        </Text>
      </View>

      {MEAL_TYPES.map((meal) => (
        <Pressable
          key={meal.id}
          style={[styles.mealSlot, { borderLeftColor: meal.color }]}
        >
          <Ionicons name="add" size={20} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

export default function MealPlanScreen() {
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const weekDays = getWeekDays(currentWeekStart);
  const today = new Date();

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    setCurrentWeekStart(new Date());
  };

  // Format week range for header
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const weekRangeText = `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} - ${weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plan</Text>
        <IconButton icon="list-outline" variant="default" onPress={() => {}} />
      </View>

      {/* Week navigation */}
      <Card style={styles.weekNavCard}>
        <View style={styles.weekNav}>
          <IconButton
            icon="chevron-back"
            variant="ghost"
            size="sm"
            onPress={goToPreviousWeek}
          />
          <Pressable onPress={goToToday}>
            <Text style={styles.weekRangeText}>{weekRangeText}</Text>
          </Pressable>
          <IconButton
            icon="chevron-forward"
            variant="ghost"
            size="sm"
            onPress={goToNextWeek}
          />
        </View>
      </Card>

      {/* Meal type legend */}
      <View style={styles.legend}>
        {MEAL_TYPES.map((meal) => (
          <View key={meal.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: meal.color }]} />
            <Text style={styles.legendText}>{meal.label}</Text>
          </View>
        ))}
      </View>

      {/* Week calendar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.calendarContainer}
      >
        {weekDays.map((date) => (
          <DayColumn
            key={date.toISOString()}
            date={date}
            isToday={date.toDateString() === today.toDateString()}
          />
        ))}
      </ScrollView>

      {/* Quick stats */}
      <Card style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Meals Planned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Recipes Used</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Shopping Items</Text>
          </View>
        </View>
      </Card>

      {/* Tips */}
      <Card style={styles.tipCard} color={colors.accent}>
        <View style={styles.tipContent}>
          <Ionicons name="bulb-outline" size={24} color={colors.text} />
          <View style={styles.tipText}>
            <Text style={styles.tipTitle}>Pro Tip</Text>
            <Text style={styles.tipDescription}>
              Tap any meal slot to add a recipe from your collection
            </Text>
          </View>
        </View>
      </Card>
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
  weekNavCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.sm,
  },
  weekNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekRangeText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  calendarContainer: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  dayColumn: {
    width: 80,
    marginHorizontal: spacing.xs,
  },
  dayHeader: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: colors.border,
  },
  dayHeaderToday: {
    backgroundColor: colors.accent,
    borderColor: colors.border,
    ...shadows.sm,
  },
  dayName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  dayNameToday: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  dayNumber: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  dayNumberToday: {
    color: colors.text,
  },
  mealSlot: {
    height: 60,
    backgroundColor: colors.surface,
    borderWidth: borders.thin,
    borderColor: colors.border,
    borderLeftWidth: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
    alignItems: "center",
    justifyContent: "center",
  },
  statsCard: {
    margin: spacing.lg,
    padding: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: "center",
  },
  statDivider: {
    width: 2,
    height: 40,
    backgroundColor: colors.border,
  },
  tipCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
  },
  tipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  tipText: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  tipDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
