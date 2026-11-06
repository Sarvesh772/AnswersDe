import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/** True when a DATABASE_URL is configured in the environment. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * Lazy Neon SQL client (HTTP driver — works in Node.js and Edge runtimes).
 * Throws a helpful error if DATABASE_URL is missing.
 */
export function sql(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Add it to your .env.local file.",
      );
    }
    client = neon(url);
  }
  return client;
}
