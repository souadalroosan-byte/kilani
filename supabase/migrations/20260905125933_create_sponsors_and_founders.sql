/*
# Create Sponsors table and add is_founder flag to Members

1. New Tables
- `sponsors` — stores sponsor organizations for the ACI JUST chapter.
  - `id` (uuid, primary key)
  - `name` (text, not null) — sponsor name
  - `logo_url` (text, nullable) — sponsor logo image URL
  - `website_url` (text, nullable) — link to sponsor's website
  - `description` (text, nullable) — short description of the sponsor
  - `display_order` (integer, default 0) — ordering for display
  - `created_at` (timestamptz, default now())

2. Modified Tables
- `members` — added `is_founder` boolean column (default false) to mark founding members.

3. Security
- Enable RLS on `sponsors`.
- Public read (anon + authenticated) so the public site can display sponsors.
- Authenticated-only write (insert, update, delete) for admin management.
*/

CREATE TABLE IF NOT EXISTS sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website_url text,
  description text DEFAULT '',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sponsors" ON sponsors;
CREATE POLICY "anon_select_sponsors" ON sponsors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_sponsors" ON sponsors;
CREATE POLICY "auth_insert_sponsors" ON sponsors FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_sponsors" ON sponsors;
CREATE POLICY "auth_update_sponsors" ON sponsors FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_sponsors" ON sponsors;
CREATE POLICY "auth_delete_sponsors" ON sponsors FOR DELETE
  TO authenticated USING (true);

ALTER TABLE members ADD COLUMN IF NOT EXISTS is_founder boolean DEFAULT false;
