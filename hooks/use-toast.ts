/**
 * Toast Hook Wrapper for Sonner
 *
 * Provides a shadcn-style toast API that wraps the sonner toast library.
 * This allows components to use a consistent toast interface across the app.
 */

import { toast as sonnerToast } from "sonner";

type ToastProps = {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
};

/**
 * Toast Hook
 *
 * Returns a toast function compatible with shadcn's toast API.
 * Internally uses sonner for the actual toast notifications.
 */
export function useToast() {
  const toast = ({ title, description, variant }: ToastProps) => {
    const message = [title, description].filter(Boolean).join(": ");

    if (variant === "destructive") {
      sonnerToast.error(message || "An error occurred");
    } else {
      sonnerToast.success(message || "Success");
    }
  };

  return { toast };
}
