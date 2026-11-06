# AnswerDe — AI Doubt Solver

A clean, mobile-responsive AI doubt solver for Indian students (Class 10–12),
built with **Next.js (App Router)**, **Tailwind CSS**, **Neon Postgres**, **Neon
Auth (Managed Better Auth)**, and the **DeepSeek API**.

## Features

- Friendly Indian tutor that answers in **Hinglish**, step-by-step, and concise
  (≤ 300 words) — powered by DeepSeek `deepseek-chat`.
- **Streaming** responses for a smooth chat experience.
- **Authentication** via Neon Auth (email/password + Google).
- **Free trial limit**: each user gets **3 free doubts**, tracked in the
  `profiles` table. Running out shows an upgrade prompt (₹49/month).
- **Payments** via **PayU** (test mode): the ₹49 plan credits **100 doubts**.
- Chat **history** persisted in Neon Postgres (sidebar with load/delete).
- Mobile-responsive UI: welcome screen, chat input, history drawer, profile menu.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Enable Neon Auth** (Managed Better Auth)

   In the Neon Console: **Project → Branch → Auth → Enable Auth**, then copy the
   **Auth URL** from **Settings → Better Auth → Project Info**.

3. **Configure environment variables**

   Copy the template and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

   - `DATABASE_URL` — your Neon Postgres connection string.
   - `DEEPSEEK_API_KEY` — your DeepSeek API key.
   - `NEON_AUTH_BASE_URL` — your Auth URL from the Neon Console.
   - `NEON_AUTH_COOKIE_SECRET` — any random 32+ char string
     (`openssl rand -base64 32`).
   - `PAYU_MERCHANT_KEY`, `PAYU_SALT`, `PAYU_MODE` — PayU credentials
     (`test` or `prod`).

4. **Create the database tables** (once)

   Run [`schema.sql`](./schema.sql) in the Neon SQL Editor (or with `psql`):

   ```bash
   psql "$DATABASE_URL" -f schema.sql
   ```

   Already have the base tables? Just run the incremental migration:

   ```bash
   psql "$DATABASE_URL" -f migrations/0001_add_profiles.sql
   ```

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000. Sign up to get your 3 free doubts.

## How the free trial works

- On the first chat, a `profiles` row is created for the user with
  `doubts_remaining = 3`.
- Each completed answer decrements it by one.
- When it hits `0`, `/api/chat` returns **403** and the UI shows the upgrade
  modal: *"Aapke free doubts khatam ho gaye! Get the ₹49 Monthly Pass."*

## Payments (PayU)

- `POST /api/payu/initiate` — builds a unique `txnid`, computes the SHA-512
  request hash (`key|txnid|amount|productinfo|firstname|email|udf1..udf5||||||salt`),
  and returns the fields the frontend needs to submit the PayU form.
- The upgrade button submits a hidden form to `https://test.payu.in/_payment`
  (test mode) with `surl`/`furl` pointing at `/api/payu/webhook`.
- `GET /api/payu/webhook` — verifies the PayU **reverse hash** (constant-time),
  and on success credits **100 doubts** to the user's profile, then redirects to
  `/?payment=success` (or `?payment=failure`).
- The app shows a toast on `?payment=success` and refreshes the doubt count.

> The `PAYU_SALT` is used **server-side only** and is never sent to the browser.
>
> `surl`/`furl` and the post-payment redirect use `getAppUrl()` — defaulting to
> `https://answers-de.vercel.app` (override per environment with
> `NEXT_PUBLIC_APP_URL`).

## Project structure

```
src/
├─ app/
│  ├─ layout.tsx / page.tsx / globals.css
│  └─ api/
│     ├─ auth/[...path]/route.ts   # Neon Auth proxy
│     ├─ chat/route.ts             # Streaming chat + free-trial gatekeeper
│     ├─ me/route.ts               # Current user + doubts_remaining
│     └─ conversations/            # History list/create/read/delete
├─ components/
│  ├─ ChatApp.tsx / Sidebar.tsx / WelcomeScreen.tsx
│  ├─ ChatMessage.tsx / ChatInput.tsx / Header.tsx
│  ├─ AuthScreen.tsx / UpgradeModal.tsx / icons.tsx
└─ lib/
   ├─ auth/server.ts & client.ts   # Neon Auth (createNeonAuth / createAuthClient)
   ├─ db.ts                        # Neon serverless client
   ├─ profile.ts                   # free-trial counter helpers
   ├─ prompt.ts / client.ts / types.ts
```

## Notes

- Auth user data lives in the `neon_auth` schema (managed by Neon Auth); the
  app's own tables (`conversations`, `messages`, `profiles`) live in `public`.
- `profiles.user_id` stores the Neon Auth user id (a UUID string) from
  `neon_auth.user.id`.
- Without the env vars, the app still builds; auth requests will fail until they
  are configured.
