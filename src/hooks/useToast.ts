import { useToastStore } from "../providers/ToastProvider";
import { ToastType } from "../components/ui/Toast";

// ---------------------------------------------------------------------------
// Convenience hook — call from any component in the tree
// ---------------------------------------------------------------------------

interface ShowToastOptions {
  type: ToastType;
  message: string;
  duration?: number;
}

export function useToast() {
  const add = useToastStore((s) => s.add);

  return {
    showToast: (opts: ShowToastOptions) => add(opts),
    showError: (message: string) => add({ type: "error", message }),
    showSuccess: (message: string) => add({ type: "success", message }),
    showWarning: (message: string) => add({ type: "warning", message }),
    showInfo: (message: string) => add({ type: "info", message }),
  };
}
