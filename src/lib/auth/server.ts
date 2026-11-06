import { createNeonAuth } from "@neon/auth/next/server";

// Development fallback so the app still builds/runs before you configure auth.
// Auth calls will fail until you set a real NEON_AUTH_BASE_URL in .env.local.
const DEV_COOKIE_SECRET = "answerde-development-cookie-secret-replace-me-32chars";

const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim() || "";
const rawSecret = process.env.NEON_AUTH_COOKIE_SECRET?.trim();
// Use the real secret when provided; otherwise fall back so the build succeeds.
const cookieSecret = rawSecret ? rawSecret : DEV_COOKIE_SECRET;

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret: cookieSecret,
  },
});
