import { StyleSheet } from "react-native";

// ============================================
// REFINED NEOBRUTALISM DESIGN SYSTEM
// Bold, playful, and memorable
// ============================================

// Color Palette - Vibrant and intentional
export const colors = {
  // Primary actions - Fresh green
  primary: "#2DD881",
  primaryLight: "#E8FFF3",

  // Secondary palette
  secondary: "#FFE14D", // Bright yellow
  accent: "#FF6B54", // Coral/Orange for FAB

  // Semantic colors
  success: "#2DD881",
  warning: "#FFB800",
  error: "#FF4757",
  info: "#00D4FF",

  // Magenta/Pink for special actions
  magenta: "#FF2D92",
  magentaLight: "#FFE5F1",

  // Cyan for accents
  cyan: "#00D4FF",
  cyanLight: "#E5FAFF",

  // Neutral palette
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F5F5F5",

  // Text colors
  text: "#1A1A1A",
  textSecondary: "#4A4A4A",
  textMuted: "#8A8A8A",
  textLight: "#FFFFFF",

  // Border
  border: "#1A1A1A",
  borderLight: "#E5E5E5",

  // Meal type colors (pastel backgrounds)
  breakfast: "#D4F5E0", // Light mint green
  breakfastAccent: "#2DD881",
  lunch: "#FFF4CC", // Light yellow
  lunchAccent: "#FFB800",
  dinner: "#FFE8D4", // Light peach/cream
  dinnerAccent: "#FF8C42",
  snack: "#E5FAFF", // Light cyan
  snackAccent: "#00D4FF",
  dessert: "#FFE5F1", // Light pink
  dessertAccent: "#FF2D92",

  // Nutrition label colors
  calories: "#1A1A1A",
  protein: "#2DD881",
  carbs: "#FF2D92",
  fat: "#FFE14D",
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 48,
};

// Border radius
export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// Border widths
export const borders = {
  thin: 2,
  regular: 3,
  thick: 4,
  heavy: 5,
  color: "#1A1A1A",
};

// Shadows (neobrutalist offset shadows)
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  sm: {
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  md: {
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  lg: {
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  xl: {
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  pressed: {
    shadowColor: "#1A1A1A",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  // Colored shadows for special elements
  primaryGlow: {
    shadowColor: "#2DD881",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  accentGlow: {
    shadowColor: "#FF6B54",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

// Typography
export const typography = {
  // Font families - Using system fonts for now
  // Will be replaced with custom fonts
  fonts: {
    // Bold italic display font for headings
    display: "System",
    displayBold: "System",
    // Body font
    body: "System",
    mono: "SpaceMono",
  },

  // Font sizes
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    hero: 48,
  },

  // Font weights
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    heavy: "800" as const,
    black: "900" as const,
  },

  // Line heights
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.4,
    relaxed: 1.6,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// Common component styles
export const componentStyles = StyleSheet.create({
  // Card base
  card: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },

  // Card flat (no shadow)
  cardFlat: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
  },

  // Input base
  input: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text,
  },

  // Button base
  buttonPrimary: {
    backgroundColor: colors.primary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    ...shadows.md,
  },

  // Badge/Tag base
  badge: {
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },

  // Section label (like "BREAKFAST", "LUNCH")
  sectionLabel: {
    backgroundColor: colors.text,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },

  sectionLabelText: {
    color: colors.textLight,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: "uppercase" as const,
  },

  // Screen header title (italic bold)
  screenTitle: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.black,
    fontStyle: "italic" as const,
    color: colors.text,
    textTransform: "uppercase" as const,
  },

  // Section title
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    fontStyle: "italic" as const,
    color: colors.text,
    textTransform: "uppercase" as const,
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

  // Container with safe area padding
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Content padding
  contentPadding: {
    paddingHorizontal: spacing.lg,
  },
});

// Helper function to get meal type color
export const getMealTypeColor = (
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | string
): string => {
  switch (mealType) {
    case "breakfast":
      return colors.breakfast;
    case "lunch":
      return colors.lunch;
    case "dinner":
      return colors.dinner;
    case "snack":
      return colors.snack;
    default:
      return colors.surfaceAlt;
  }
};

// Helper function to get meal type accent color
export const getMealTypeAccentColor = (
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | string
): string => {
  switch (mealType) {
    case "breakfast":
      return colors.breakfastAccent;
    case "lunch":
      return colors.lunchAccent;
    case "dinner":
      return colors.dinnerAccent;
    case "snack":
      return colors.snackAccent;
    default:
      return colors.primary;
  }
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

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
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
  getMealTypeAccentColor,
  getDifficultyColor,
  animation,
};
