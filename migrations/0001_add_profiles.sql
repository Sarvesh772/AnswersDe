-- Migration 0001: add the `profiles` table for the free-trial doubt counter.
--
-- Each row links to a Neon Auth (Managed Better Auth) user. The auth user id is
-- a UUID string returned as `session.user.id` by @neon/auth, and lives in the
-- `neon_auth.user` table (`id` column). We store it as TEXT here so it stays
-- compatible regardless of the exact `id` column type in the `neon_auth` schema.

CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL UNIQUE,
  doubts_remaining INTEGER NOT NULL DEFAULT 3 CHECK (doubts_remaining >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles (user_id);
