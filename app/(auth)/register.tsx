import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuthActions } from "@convex-dev/auth/react";

import { Button, Input, Card } from "../../src/components/ui";
import {
  colors,
  spacing,
  typography,
  shadows,
  borders,
  borderRadius,
} from "../../src/styles/neobrutalism";
import { useToast } from "../../src/hooks/useToast";
import { parseAuthError } from "../../src/lib/errors";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const { signIn } = useAuthActions();
  const { showError } = useToast();

  const handleRegister = async () => {
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name) { setNameError("Name is required"); return; }
    if (!email) { setEmailError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Please enter a valid email address"); return; }
    if (!password) { setPasswordError("Password is required"); return; }
    if (password.length < 8) { setPasswordError("Password must be at least 8 characters"); return; }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setPasswordError("Password must include uppercase, lowercase, and a number");
      return;
    }
    if (!confirmPassword) { setConfirmPasswordError("Please confirm your password"); return; }
    if (password !== confirmPassword) { setConfirmPasswordError("Passwords do not match"); return; }

    setLoading(true);
    try {
      await signIn("password", { email, password, name, flow: "signUp" });
      // Navigation is handled automatically by _layout.tsx when isAuthenticated changes
    } catch (error) {
      showError(parseAuthError(error));
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>👨‍🍳</Text>
          </View>
          <Text style={styles.title}>Join Everyday Food</Text>
          <Text style={styles.subtitle}>Start organizing your recipes</Text>
        </View>

        {/* Register Form */}
        <Card style={styles.formCard}>
          <Text style={styles.formTitle}>Create Account</Text>

          <Input
            label="Name"
            placeholder="Your name"
            value={name}
            onChangeText={(v) => { setName(v); setNameError(""); }}
            autoCapitalize="words"
            leftIcon="person-outline"
            error={nameError}
          />

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={(v) => { setEmail(v); setEmailError(""); }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail-outline"
            error={emailError}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            value={password}
            onChangeText={(v) => { setPassword(v); setPasswordError(""); }}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
            onRightIconPress={() => setShowPassword(!showPassword)}
            helperText={!passwordError ? "At least 8 characters with uppercase, lowercase, and number" : undefined}
            error={passwordError}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setConfirmPasswordError(""); }}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed-outline"
            error={confirmPasswordError}
          />

          <Button
            onPress={handleRegister}
            loading={loading}
            fullWidth
            style={styles.registerButton}
          >
            Create Account
          </Button>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Link href="/(auth)/login" asChild>
            <Button variant="outline" fullWidth>
              Already have an account? Sign In
            </Button>
          </Link>
        </Card>

        {/* Footer */}
        <Text style={styles.footer}>
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: colors.secondary,
    borderWidth: borders.regular,
    borderColor: borders.color,
    borderRadius: borderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  logoEmoji: {
    fontSize: 50,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  formCard: {
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  formTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  registerButton: {
    marginTop: spacing.md,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
  },
  footer: {
    textAlign: "center",
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
  },
});
