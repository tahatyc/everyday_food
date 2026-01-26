# UI Component Skill

Create reusable UI components following project patterns.

## File Location

Place in `src/components/ui/` (e.g., `src/components/ui/ComponentName.tsx`).

## Basic Component Template

```tsx
import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  colors,
  borders,
  shadows,
  spacing,
  typography,
  borderRadius,
} from "../../styles/neobrutalism";

type ComponentVariant = "primary" | "secondary" | "outline" | "ghost";
type ComponentSize = "sm" | "md" | "lg";

interface ComponentNameProps {
  children: React.ReactNode;
  variant?: ComponentVariant;
  size?: ComponentSize;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ComponentVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: { backgroundColor: colors.primary },
    text: { color: colors.text },
  },
  secondary: {
    container: { backgroundColor: colors.secondary },
    text: { color: colors.text },
  },
  outline: {
    container: { backgroundColor: colors.surface },
    text: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: "transparent", borderWidth: 0 },
    text: { color: colors.text },
  },
};

const sizeStyles: Record<ComponentSize, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.sm,
    },
    text: { fontSize: typography.sizes.sm },
  },
  md: {
    container: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.md,
    },
    text: { fontSize: typography.sizes.md },
  },
  lg: {
    container: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.lg,
    },
    text: { fontSize: typography.sizes.lg },
  },
};

export function ComponentName({
  children,
  variant = "primary",
  size = "md",
  onPress,
  disabled = false,
  style,
}: ComponentNameProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        sizeStyle.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.text, variantStyle.text, sizeStyle.text]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: borders.regular,
    borderColor: borders.color,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    ...shadows.md,
  },
  text: {
    fontWeight: typography.weights.bold,
    textAlign: "center",
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default ComponentName;
```

## Card Component Pattern

```tsx
interface CardProps {
  children: React.ReactNode;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, color, onPress, style }: CardProps) {
  const content = (
    <View style={[styles.card, color && { backgroundColor: color }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
});
```

## Badge Component Pattern

```tsx
type BadgeVariant = "default" | "primary" | "success" | "warning" | "error";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const badgeColors: Record<BadgeVariant, string> = {
  default: colors.surfaceAlt,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export function Badge({ children, variant = "default", size = "sm" }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeColors[variant] },
        size === "sm" ? styles.badgeSm : styles.badgeMd,
      ]}
    >
      <Text style={[styles.badgeText, size === "sm" ? styles.textSm : styles.textMd]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: borders.thin,
    borderColor: borders.color,
    borderRadius: borderRadius.sm,
  },
  badgeSm: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  badgeMd: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  badgeText: {
    fontWeight: typography.weights.bold,
    color: colors.text,
    textTransform: "uppercase",
  },
  textSm: {
    fontSize: typography.sizes.xs,
  },
  textMd: {
    fontSize: typography.sizes.sm,
  },
});
```

## Input Component Pattern

```tsx
interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  icon,
  error,
}: InputProps) {
  return (
    <View>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {icon && (
          <Ionicons name={icon} size={20} color={colors.textMuted} />
        )}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
    marginLeft: spacing.sm,
  },
});
```

## Icon Button Pattern

```tsx
interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: "sm" | "md" | "lg";
  color?: string;
  backgroundColor?: string;
}

const iconSizes = { sm: 18, md: 24, lg: 32 };
const buttonSizes = { sm: 36, md: 44, lg: 56 };

export function IconButton({
  icon,
  onPress,
  size = "md",
  color = colors.text,
  backgroundColor = colors.surface,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor,
          width: buttonSizes[size],
          height: buttonSizes[size],
        },
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={iconSizes[size]} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.sm,
  },
  pressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    ...shadows.pressed,
  },
});
```

## Design System Tokens Reference

```tsx
import {
  colors,        // Color palette
  spacing,       // xs=4, sm=8, md=12, lg=16, xl=20, xxl=24
  borders,       // thin=2, regular=3, thick=4, color=#1A1A1A
  borderRadius,  // xs=4, sm=8, md=12, lg=16, full=9999
  shadows,       // none, xs, sm, md, lg, xl, pressed
  typography,    // sizes, weights, lineHeights
  getMealTypeColor,      // breakfast/lunch/dinner/snack colors
  getMealTypeAccentColor,
  getDifficultyColor,    // easy/medium/hard colors
} from "../../styles/neobrutalism";
```
