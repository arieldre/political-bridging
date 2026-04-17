# Political Bridging — Setup Guide

Israeli political video-matching app. Pair people with opposing political views + shared hobbies for guided video conversations.

**Stack:** SvelteKit 5 · Supabase (Postgres + Realtime + Auth) · WebRTC P2P · Open Relay TURN · Tailwind CSS v4 · Hebrew RTL

---

## Prerequisites

- Node.js 18+
- A free Supabase account → https://supabase.com

---

## Step 1 — Create a new Supabase project

1. Go to https://supabase.com → **New project**
2. Name it: `political-bridging` (or anything)
3. **Region: Frankfurt (eu-central-1)** — required for Israeli PDPL compliance
4. Choose a strong database password and save it

Wait ~2 minutes for the project to provision.

---

## Step 2 — Run the database migrations

In your Supabase project dashboard:

1. Go to **SQL Editor**
2. Paste and run `supabase/migrations/001_initial.sql` — creates all 11 tables, RLS policies, and seeds achievements
3. Paste and run `supabase/migrations/002_triggers.sql` — creates the signup trigger that auto-creates profiles + streaks

---

## Step 3 — Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values from the Supabase dashboard (**Settings → API**):

```env
PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key  # optional, for admin ops
```

---

## Step 4 — Enable Google OAuth (optional but recommended)

In Supabase dashboard → **Authentication → Providers → Google**:

1. Enable Google provider
2. Go to Google Cloud Console → create OAuth 2.0 credentials
3. Authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Paste Client ID + Client Secret into Supabase

---

## Step 5 — Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Step 6 — Test the full flow

1. **Sign up** at `/auth` — creates profile automatically via DB trigger
2. **Consent** at `/consent` — tick both checkboxes
3. **Questionnaire** at `/questionnaire` — complete all 30 questions (hobbies → values → politics)
4. **Home** at `/home` — see your XP, level, and "Find Match" button
5. **Matching** — click "Find Match". Two users must both be in the queue to get matched. You can test with two browser tabs (two accounts).
6. To trigger matching: POST to `/api/match` (the server processes the queue and pairs users)
7. **Video call** at `/call/[matchId]` — WebRTC connects automatically
8. **Rate** at `/rate/[matchId]` — mandatory before returning home

---

## What's wired up vs. TODO

### Working end-to-end ✅
- Auth (email + Google OAuth)
- Age gate + PDPL consent
- 30-question Hebrew questionnaire (saves to DB + calculates political vectors)
- Matching queue + political algorithm with time-based relaxation
- WebRTC P2P video with Open Relay TURN (free 20GB/month)
- Supabase Realtime signaling (offer/answer/ICE exchange)
- Post-call rating + XP award
- Home dashboard (XP bar, level, recent matches)
- Match waiting room with mini-game

### TODOs for next iteration 🔧
- **Streak counter** on home: loads `current_days` from DB but needs server-side daily update logic
- **Weekly quests**: progress bar shows but needs a cron/function to track completions
- **XP award**: currently client-side; move to a Supabase Edge Function for integrity
- **Automatic match processing**: `/api/match` needs a cron job or Supabase pg_cron to run every 30s
- **Level 2–5 content**: prompts + game formats exist in the plan but only L1 is implemented
- **Profile page** (`/profile`): linked from home header but page not built yet
- **Achievements unlock logic**: DB table + seeded data exist, trigger logic not wired
- **Google OAuth redirect URL**: update for production domain when deploying

---

## Automatic matching — quick setup

The match queue is processed by `POST /api/match`. To run it automatically:

**Option A — Supabase pg_cron** (easiest):
```sql
-- In SQL Editor after enabling pg_cron extension:
SELECT cron.schedule('process-match-queue', '*/30 * * * * *', $$
  SELECT net.http_post(
    url := 'https://YOUR_DOMAIN/api/match',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
$$);
```

**Option B — Manual for testing**:
```bash
curl -X POST http://localhost:5173/api/match
```

---

## Deployment (Vercel)

```bash
npm install -g vercel
vercel --prod
```

Add env vars in Vercel dashboard (same as `.env`).

For Google OAuth, add your Vercel domain to the authorized redirect URIs.

---

## TURN server

The app uses [Open Relay Project](https://www.metered.ca/tools/openrelay/) — **free, no signup, 20GB/month**.

Credentials are hardcoded in `src/lib/webrtc/peer.ts`. For production with high traffic, upgrade to:
- Xirsys Pro: $9.99/month for 25GB
- Cloudflare Calls: free up to 1TB/month (requires a bit more setup)

---

## Legal (Israeli PDPL Amendment 13)

Before public launch:
- [ ] Deploy to Frankfurt region (already configured above)
- [ ] Sign Supabase DPA: email support@supabase.io
- [ ] Publish privacy policy at `/privacy` (already built)
- [ ] Verify consent records are being saved (`profiles.consented_at`)
- [ ] Set up account deletion flow (currently: manual DB delete; needs a UI)

---

## Repo

GitHub: https://github.com/arieldre/political-bridging
