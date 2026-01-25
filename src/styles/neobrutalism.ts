import { StyleSheet } from "react-native";

// Neobrutalism Design Tokens
export const colors = {
  // Primary palette
  primary: "#FF6B6B", // Coral red
  secondary: "#4ECDC4", // Teal
  accent: "#FFE66D", // Yellow
  success: "#7BC950", // Green
  warning: "#FFA94D", // Orange
  error: "#FF6B6B", // Red

  // Neutral palette
  background: "#FEFEFE", // Off-white
  surface: "#FFFFFF", // White
  surfaceAlt: "#F5F5F5", // Light gray
  text: "#1A1A1A", // Near black
  textSecondary: "#4A4A4A", // Dark gray
  textMuted: "#8A8A8A", // Gray
  border: "#000000", // Black borders

  // Semantic colors for food categories
  breakfast: "#FFE66D", // Yellow
  lunch: "#7BC950", // Green
  dinner: "#FF6B6B", // Coral
  snack: "#4ECDC4", // Teal
  dessert: "#DDA0DD", // Plum
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const borders = {
  thin: 2,
  regular: 3,
  thick: 4,
  color: "#000000",
};

export const shadows = {
  sm: {
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  md: {
    shadowColor: "#000000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000000",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  // Pressed state - reduced shadow
  pressed: {
    shadowColor: "#000000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
};

export const typography = {
  // Font families
  fonts: {
    heading: "SpaceMono-Regular", // Monospace for headings
    body: "System", // System font for body
  },
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },
  // Font weights
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Common component styles
export const componentStyles = StyleSheet.create({
  // Card base
  card: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },

  // Input base
  input: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
  },

  // Button base
  buttonBase: {
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...shadows.md,
  },

  // Badge base
  badge: {
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },

  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },

  // Screen header
  screenHeader: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  // Section title
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },

  // Body text
  bodyText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },

  // Muted text
  mutedText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});

// Helper function to get meal type color
export const getMealTypeColor = (
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
): string => {
  return colors[mealType] || colors.primary;
};

// Helper function to get difficulty color
export const getDifficultyColor = (
  difficulty: "easy" | "medium" | "hard"
): string => {
  switch (difficulty) {
    case "easy":
      return colors.success;
    case "medium":
      return colors.warning;
    case "hard":
      return colors.error;
    default:
      return colors.textMuted;
  }
};

export default {
  colors,
  spacing,
  borderRadius,
  borders,
  shadows,
  typography,
  componentStyles,
  getMealTypeColor,
  getDifficultyColor,
};
