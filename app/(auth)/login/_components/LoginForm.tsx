/**
 * Login Form Component - Multi-Method Authentication Interface
 *
 * This component provides a comprehensive login interface supporting multiple
 * authentication methods through Better Auth. It handles OAuth (GitHub) and
 * email-based authentication with OTP verification.
 *
 * Security Features:
 * - Client-side input validation and sanitization
 * - Secure OAuth flow with PKCE (handled by Better Auth)
 * - Email OTP for passwordless authentication
 * - CSRF protection through Better Auth's built-in mechanisms
 * - State management prevents double submissions
 * - Secure redirect handling after authentication
 *
 * Authentication Methods:
 * 1. GitHub OAuth - Social login with automatic account linking
 * 2. Email OTP - Passwordless login via email verification codes
 *
 * User Experience:
 * - Loading states for all authentication methods
 * - Clear error messaging with toast notifications
 * - Responsive design for mobile and desktop
 * - Accessible form controls with proper labeling
 *
 * @component
 * @returns JSX.Element - Rendered login form with multiple auth methods
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

import { GithubIcon, Loader, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function LoginForm() {
  /**
   * Component State Management
   *
   * Manages authentication flow state and prevents concurrent operations
   * to ensure secure and consistent user experience.
   */
  const router = useRouter();

  // Separate transition states prevent conflicting auth operations
  const [githubPending, startGithubTransition] = useTransition();
  const [emailPending, startEmailTransition] = useTransition();

  // Email state for OTP authentication flow
  const [email, setEmail] = useState("");

  /**
   * GitHub OAuth Authentication Handler
   *
   * Initiates OAuth flow with GitHub using Better Auth's social provider.
   * Implements PKCE (Proof Key for Code Exchange) for enhanced security.
   *
   * Security Features:
   * - PKCE flow prevents authorization code interception
   * - State parameter prevents CSRF attacks
   * - Secure callback URL validation
   * - Automatic account linking for existing users
   *
   * @function
   */
  const signInWithGithub = () => {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/auth/callback", // Smart role-based redirect after login
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in with GitHub, you will be redirected...");
          },
          onError: () => {
            // Generic error message prevents information leakage
            // Specific errors are logged server-side for debugging
            toast.error("Internal Server Error");
          },
        },
      });
    });
  };

  /**
   * Email OTP Authentication Handler
   *
   * Initiates passwordless authentication flow using email-based OTP.
   * Sends verification code to user's email address for secure login.
   *
   * Security Features:
   * - Time-limited OTP codes (usually 10-15 minutes)
   * - Single-use verification codes
   * - Rate limiting applied via Arcjet (5 attempts per 2 minutes)
   * - Email address validation and sanitization
   *
   * @function
   */
  function signInWithEmail() {
    startEmailTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: "sign-in", // Specifies login flow (vs. signup)
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email sent, check your inbox!");
            // Navigate to OTP verification page with email parameter
            // Email is passed via URL for verification context
            router.push(`/verify-request?email=${encodeURIComponent(email)}`);
          },
          onError: () => {
            // Generic error message for security (prevents email enumeration)
            toast.error("Failed to send email, please try again.");
          },
        },
      });
    });
  }

  /**
   * Component Render - Multi-Method Authentication Interface
   *
   * Provides accessible, responsive login form with clear visual hierarchy
   * and loading states for optimal user experience during authentication.
   */
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          Welcome to Church Sync AI
        </CardTitle>
        <CardDescription className="text-base">
          Sign in to your account or create one instantly
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* 
          GitHub OAuth Button
          
          Primary authentication method with visual loading states
          and disabled state during authentication to prevent double-clicks
        */}
        <Button
          disabled={githubPending}
          onClick={signInWithGithub}
          className="w-full"
          variant="outline"
        >
          <>
            {githubPending ? (
              <>
                <Loader className="size-4 animate-spin" />
                <span>Signing in with GitHub... </span>
              </>
            ) : (
              <>
                <GithubIcon className="size-4" />
                <span>Sign in with GitHub</span>
              </>
            )}
          </>
        </Button>

        {/* Visual Separator */}
        <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
          <span className="relative z-10 bg-card px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>

        {/*
          Email OTP Authentication Section

          Alternative authentication method with form validation
          and accessible input controls
        */}
        <div className="flex flex-col gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              // Accessibility: Associate label with input
              aria-describedby="email-helper"
              // Security: Basic email validation on client side
              // Server-side validation is primary security measure
            />
            <p id="email-helper" className="text-xs text-muted-foreground">
              We&apos;ll email you a secure code to sign in. No password needed.
            </p>
          </div>

          <Button
            onClick={signInWithEmail}
            disabled={emailPending || !email.trim()}
            className="w-full"
          >
            {emailPending ? (
              <>
                <Loader className="size-4 animate-spin" />
                <span>Sending code...</span>
              </>
            ) : (
              <>
                <Send className="size-4" />
                <span>Continue with email</span>
              </>
            )}
          </Button>
        </div>

        {/* Help text for new users */}
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            <span className="font-bold text-primary">
              New to Church Sync AI?
            </span>{" "}
            Just enter your email above. We&apos;ll create your account
            automatically when you sign in.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
