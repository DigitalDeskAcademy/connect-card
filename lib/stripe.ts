// TEMPORARY - Replace with real Stripe configuration from course
// For now, create a mock Stripe instance to prevent build errors
import { env } from "./env";
import Stripe from "stripe";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
  typescript: true,
});
