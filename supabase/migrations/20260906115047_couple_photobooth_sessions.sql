/*
# Couple Photobooth Sessions

## Purpose
Enables long-distance couple photobooth sessions where two users on different devices
join the same session via a shareable link/code, synchronize their countdown, and
capture photos simultaneously. Photos are stored as base64 data URLs in the database
so both participants can access the final composite strip.

## New Tables

### couple_sessions
- `id` (uuid, PK) — unique session identifier, shared via link
- `code` (text, unique) — short 6-char code for easy sharing
- `host_label` (text) — host's display name/location (e.g. "MIA / MANILA")
- `partner_label` (text) — partner's display name/location
- `status` (text) — session lifecycle: 'waiting', 'joined', 'active', 'capturing', 'completed'
- `total_shots` (int) — number of photos in the session (default 4)
- `current_shot` (int) — which shot we're on, 0-indexed (default 0)
- `countdown_active` (boolean) — whether a countdown is in progress
- `host_ready` (boolean) — host camera connected
- `partner_ready` (boolean) — partner camera connected
- `host_photos` (text[]) — array of host's captured photo data URLs
- `partner_photos` (text[]) — array of partner's captured photo data URLs
- `final_strip` (text) — final composite strip data URL (nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

## Security
- This is a no-auth app (no sign-in screen). All policies use `TO anon, authenticated`
  because the anon-key frontend must be able to read and write session data.
- Sessions are intentionally shared between two anonymous participants via a link/code,
  so all CRUD is open to anon + authenticated.

## Notes
1. `host_photos` and `partner_photos` are text arrays storing base64 JPEG data URLs.
   Each photo is ~50-100KB as base64, well within Postgres text limits for 4-8 photos.
2. Realtime is enabled via Supabase realtime subscriptions on this table — the frontend
   subscribes to row changes to synchronize countdown and capture events.
3. `updated_at` auto-updates on every row change via trigger.
*/

CREATE TABLE IF NOT EXISTS couple_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL DEFAULT upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 6)),
  host_label text DEFAULT '',
  partner_label text DEFAULT '',
  status text NOT NULL DEFAULT 'waiting',
  total_shots int NOT NULL DEFAULT 4,
  current_shot int NOT NULL DEFAULT 0,
  countdown_active boolean NOT NULL DEFAULT false,
  host_ready boolean NOT NULL DEFAULT false,
  partner_ready boolean NOT NULL DEFAULT false,
  host_photos text[] NOT NULL DEFAULT '{}',
  partner_photos text[] NOT NULL DEFAULT '{}',
  final_strip text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE couple_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON couple_sessions;
CREATE POLICY "anon_select_sessions"
  ON couple_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON couple_sessions;
CREATE POLICY "anon_insert_sessions"
  ON couple_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON couple_sessions;
CREATE POLICY "anon_update_sessions"
  ON couple_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON couple_sessions;
CREATE POLICY "anon_delete_sessions"
  ON couple_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS couple_sessions_updated_at ON couple_sessions;
CREATE TRIGGER couple_sessions_updated_at
  BEFORE UPDATE ON couple_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE couple_sessions;
