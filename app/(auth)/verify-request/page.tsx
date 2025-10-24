/**
 * Email OTP Verification Page - Passwordless Authentication Completion
 *
 * This page handles the second step of email-based passwordless authentication.
 * Users arrive here after requesting an OTP code via email from the login form.
 * The page provides a secure interface for OTP code entry and verification.
 *
 * Security Architecture:
 * - Time-limited OTP codes (typically 10-15 minutes expiration)
 * - Single-use verification codes (cannot be reused after successful verification)
 * - Rate limiting via Arcjet (prevents brute force attempts on OTP codes)
 * - Secure transmission of OTP codes via email
 * - Client-side code validation (6-digit format enforcement)
 * - Server-side verification with Better Auth
 *
 * Threat Model Protection:
 * - OTP Brute Force: Rate limiting + time expiration + single-use codes
 * - Email Interception: Short code lifespan limits exposure window
 * - Session Fixation: Better Auth handles secure session creation
 * - Code Enumeration: Generic error messages prevent information leakage
 *
 * User Experience:
 * - Visual 6-digit OTP input with clear formatting
 * - Real-time validation and submission state management
 * - Accessible form controls with proper focus management
 * - Clear feedback through toast notifications
 * - Automatic navigation after successful verification
 *
 * Next.js 15 Compatibility:
 * - Wrapped in Suspense boundary for useSearchParams() usage
 * - Prevents hydration issues in server-side rendering
 *
 * @page /verify-request
 */

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { toast } from "sonner";

/**
 * Verify Request Route Wrapper Component
 *
 * Wraps the main verification component in a Suspense boundary to handle
 * the asynchronous loading of URL search parameters in Next.js 15.
 *
 * @component
 * @returns JSX.Element - Suspense-wrapped verification component
 */
export default function VerifyRequestRoute() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyRequest />
    </Suspense>
  );
}

/**
 * OTP Verification Component
 *
 * Handles the core OTP verification logic and user interface.
 * Manages state for OTP input, email context, and verification process.
 *
 * @component
 * @returns JSX.Element - OTP verification interface
 */
function VerifyRequest() {
  /**
   * Component State and Navigation
   *
   * Manages verification flow state and provides navigation control
   * after successful authentication.
   */
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [emailPending, startTransition] = useTransition();

  // Extract email from URL parameters (passed from login form)
  // Email is needed for OTP verification context
  const params = useSearchParams();
  const email = params.get("email") as string;

  // Validation helper: OTP must be exactly 6 digits
  const isOtpCompleted = otp.length === 6;

  /**
   * OTP Verification Handler
   *
   * Processes the submitted OTP code through Better Auth's email OTP verification.
   * Handles both successful authentication and error scenarios with appropriate
   * user feedback and navigation.
   *
   * Security Features:
   * - Server-side OTP validation with time and usage limits
   * - Secure session creation upon successful verification
   * - Generic error messages to prevent information leakage
   * - Rate limiting protection via Arcjet
   *
   * @function
   */
  function verifyOtp() {
    startTransition(async () => {
      await authClient.signIn.emailOtp({
        email: email,
        otp: otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email verified");
            // Redirect to smart callback for role-based routing
            router.push("/auth/callback");
          },
          onError: () => {
            // Generic error message prevents information leakage about:
            // - Whether the email exists in the system
            // - Whether the OTP was incorrect vs expired
            // - Specific failure reasons that could aid attackers
            toast.error("Error verifying Email/OTP");
          },
        },
      });
    });
  }
  /**
   * Component Render - OTP Verification Interface
   *
   * Provides a secure, accessible interface for OTP code entry with
   * clear visual guidance and real-time validation feedback.
   */
  return (
    <Card className="w-full mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Please check your email</CardTitle>
        <CardDescription>
          We have sent a verification email code to your email address. Please
          open the email and paste the code below.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 
          OTP Input Section
          
          Visual 6-digit code input with grouped formatting for better
          user experience and reduced input errors
        */}
        <div className="flex flex-col items-center space-y-2">
          <InputOTP
            value={otp}
            onChange={value => setOtp(value)}
            maxLength={6}
            className="gap-2"
            // Security: Only accepts numeric input by default
            // Accessibility: Proper keyboard navigation between slots
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>

          {/* Helper text for user guidance */}
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* 
          Verification Submit Button
          
          Disabled until OTP is complete and not processing to prevent
          invalid submissions and double-clicks during verification
        */}
        <Button
          onClick={verifyOtp}
          disabled={emailPending || !isOtpCompleted}
          className="w-full"
          // Accessibility: Button clearly indicates current state
        >
          {emailPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            "Verify Account"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
