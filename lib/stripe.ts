// TEMPORARY - Replace with real Stripe configuration from course
// For now, create a mock Stripe instance to prevent build errors
import { env } from "./env";
import Stripe from "stripe";

// Use placeholder key in CI to allow build to succeed
// Actual Stripe operations won't work without a real key
export const stripe = new Stripe(
  env.STRIPE_SECRET_KEY || "sk_test_placeholder",
  {
    apiVersion: "2025-07-30.basil",
    typescript: true,
  }
);
