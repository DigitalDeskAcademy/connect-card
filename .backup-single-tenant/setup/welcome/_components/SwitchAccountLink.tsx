/**
 * Switch Account Link Component
 *
 * Provides a secure way to switch accounts by signing out the current
 * user and redirecting to the login page. Uses the existing useSignOut
 * hook for consistency with other logout functionality in the app.
 */

"use client";

import { useSignOut } from "@/hooks/use-signout";
import { useState } from "react";

export function SwitchAccountLink() {
  const handleSignOut = useSignOut();
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitchAccount = async () => {
    setIsLoading(true);
    // Sign out will redirect to "/" which will then redirect to "/login"
    // since the user won't have a session
    await handleSignOut();
  };

  return (
    <button
      onClick={handleSwitchAccount}
      disabled={isLoading}
      className="text-sm text-primary underline hover:no-underline mt-1 inline-block disabled:opacity-50"
    >
      {isLoading ? "Switching..." : "Use a different email"}
    </button>
  );
}
