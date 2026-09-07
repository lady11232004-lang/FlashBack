/*
# User Gallery for Saved Photos, Strips, and Videos

## Purpose
Stores user-generated content from photobooth sessions: individual photos,
finished photo strips, and session video recordings. Used to populate the
"MY PHOTOS / MY STRIPS / MY VIDEOS" gallery tabs.

## New Tables

### gallery_items
- `id` (uuid, PK)
- `item_type` (text) — 'photo', 'strip', or 'video'
- `data_url` (text) — base64 JPEG for photos/strips, or blob URL for video
- `thumbnail` (text) — optional small preview image
- `title` (text) — optional user-given title
- `template` (text) — which template was used
- `mode` (text) — 'SOLO' or 'DOUBLE'
- `created_at` (timestamptz)

## Security
- No auth app — all policies use `TO anon, authenticated` so the anon-key
  frontend can read and write gallery data.

## Notes
1. Photos/strips are stored as base64 data URLs (like couple session photos).
2. Videos are stored as blob URLs in browser memory; only the thumbnail is persisted
   (a captured frame from the video) so the gallery can show a preview.
*/

CREATE TABLE IF NOT EXISTS gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL DEFAULT 'photo',
  data_url text NOT NULL DEFAULT '',
  thumbnail text DEFAULT '',
  title text DEFAULT '',
  template text DEFAULT '',
  mode text DEFAULT 'SOLO',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_gallery" ON gallery_items;
CREATE POLICY "anon_select_gallery"
  ON gallery_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_gallery" ON gallery_items;
CREATE POLICY "anon_insert_gallery"
  ON gallery_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_gallery" ON gallery_items;
CREATE POLICY "anon_update_gallery"
  ON gallery_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_gallery" ON gallery_items;
CREATE POLICY "anon_delete_gallery"
  ON gallery_items FOR DELETE
  TO anon, authenticated USING (true);
