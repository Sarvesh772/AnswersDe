import { sql } from "./db";

/**
 * Create a profile row for a user if it doesn't exist yet (first doubt).
 * `doubts_remaining` defaults to 3 via the database schema.
 */
export async function ensureProfile(userId: string): Promise<void> {
  await sql()`INSERT INTO profiles (user_id) VALUES (${userId}) ON CONFLICT (user_id) DO NOTHING`;
}

/** Returns the number of free doubts the user has left (creates the row on first call). */
export async function getDoubtsRemaining(userId: string): Promise<number> {
  await ensureProfile(userId);
  const rows =
    await sql()`SELECT doubts_remaining FROM profiles WHERE user_id = ${userId}`;
  return Number(rows[0]?.doubts_remaining ?? 3);
}

/** Decrements the free-doubt counter by one (never below zero). */
export async function decrementDoubts(userId: string): Promise<void> {
  await sql()`UPDATE profiles SET doubts_remaining = GREATEST(doubts_remaining - 1, 0), updated_at = now() WHERE user_id = ${userId}`;
}
