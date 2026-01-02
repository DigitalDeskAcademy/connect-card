import { Resend } from "resend";
import { env } from "./env";

// Use placeholder key in CI to allow build to succeed
// Actual emails won't be sent without a real key
export const resend = new Resend(env.RESEND_API_KEY || "re_placeholder");
