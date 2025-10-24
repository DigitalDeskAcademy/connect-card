import "server-only"; // Ensures server-only imports are handled correctly

import arcjet, {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
} from "@arcjet/next";
import { env } from "./env";

export {
  detectBot,
  fixedWindow,
  protectSignup,
  sensitiveInfo,
  shield,
  slidingWindow,
  // Exporting the Arcjet Next.js middleware functions
  // so they can be used in the Next.js application.
};

export default arcjet({
  key: env.ARCJET_KEY,

  characteristics: ["fingerprint"],
  rules: [
    shield({
      mode: "LIVE",
    }),
  ],
});
