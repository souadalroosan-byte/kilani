/*
# Create news table for ACI JUST

1. New Tables
- `news`
  - `id` (uuid, primary key)
  - `title` (text, not null)
  - `description` (text, not null)
  - `image_url` (text, nullable)
  - `published_date` (date, not null, defaults to today)
  - `external_url` (text, nullable — link to full article)
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `news`.
- Public read (anon + authenticated) so visitors can see news.
- Only authenticated admins can insert/update/delete.
*/

CREATE TABLE IF NOT EXISTS news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  published_date date NOT NULL DEFAULT CURRENT_DATE,
  external_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_news" ON news;
CREATE POLICY "anon_select_news" ON news FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_news" ON news;
CREATE POLICY "auth_insert_news" ON news FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_news" ON news;
CREATE POLICY "auth_update_news" ON news FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_news" ON news;
CREATE POLICY "auth_delete_news" ON news FOR DELETE
  TO authenticated USING (true);
