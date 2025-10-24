/**
 * Welcome Form Component - Terms Agreement and Account Creation
 *
 * This form requires users to explicitly agree to terms before
 * creating their agency account, preventing accidental organization
 * creation from login typos.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";

export function WelcomeForm() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    if (!agreed) return;

    setLoading(true);
    // Redirect to organization setup
    router.push("/setup/organization");
  };

  return (
    <div className="border rounded-lg p-6 bg-card shadow-sm">
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <Checkbox
            id="terms"
            checked={agreed}
            onCheckedChange={checked => setAgreed(checked as boolean)}
            className="mt-1"
          />
          <label
            htmlFor="terms"
            className="text-sm leading-relaxed cursor-pointer text-muted-foreground"
          >
            I agree to SideCar&apos;s{" "}
            <Link
              href="/terms"
              className="underline hover:text-primary"
              target="_blank"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline hover:text-primary"
              target="_blank"
            >
              Privacy Policy
            </Link>{" "}
            and confirm that I am at least 18 years of age.
          </label>
        </div>

        <Button
          className="w-full"
          size="lg"
          onClick={handleContinue}
          disabled={!agreed || loading}
        >
          {loading ? "Continuing..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
