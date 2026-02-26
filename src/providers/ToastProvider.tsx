import React from "react";
import { StyleSheet, View } from "react-native";
import { create } from "zustand";

import { Toast, ToastType } from "../components/ui/Toast";
import { spacing } from "../styles/neobrutalism";

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, "id">) => void;
  remove: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Zustand store (global — no React context needed)
// ---------------------------------------------------------------------------

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((s) => ({
      // Keep at most 3 toasts; drop the oldest when over limit
      toasts: [
        ...s.toasts.slice(-2),
        { ...toast, id: Date.now().toString() },
      ],
    })),
  remove: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// ---------------------------------------------------------------------------
// ToastContainer — render at app root
// ---------------------------------------------------------------------------

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={remove} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    top: 60, // below status bar / notch
    paddingHorizontal: spacing.lg,
    gap: 8,
    flexDirection: "column",
    alignItems: "stretch",
  },
});
