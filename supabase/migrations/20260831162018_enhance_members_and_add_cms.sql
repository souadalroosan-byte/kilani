/*
# Enhance members table + add site content CMS

1. Members table additions:
- member_id: short unique text ID (max 5 chars) the admin enters
- join_date: when the member joined the team
- linkedin_url: clickable LinkedIn profile link
2. Site content table:
- Stores editable homepage text (hero title, hero subtitle, about text, etc.)
- Admin can update without touching code
3. Security:
- site_content readable by all, writable only by admins
- New member columns covered by existing member RLS policies
*/

ALTER TABLE members ADD COLUMN IF NOT EXISTS member_id text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS join_date date;
ALTER TABLE members ADD COLUMN IF NOT EXISTS linkedin_url text;

CREATE UNIQUE INDEX IF NOT EXISTS members_member_id_key ON members (member_id) WHERE member_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS site_content (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view site content" ON site_content;
CREATE POLICY "Public can view site content" ON site_content FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert site content" ON site_content;
CREATE POLICY "Admins can insert site content" ON site_content FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update site content" ON site_content;
CREATE POLICY "Admins can update site content" ON site_content FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete site content" ON site_content;
CREATE POLICY "Admins can delete site content" ON site_content FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

INSERT INTO site_content (key, value) VALUES
('hero_title', 'We build ideas in concrete.'),
('hero_subtitle', 'ACI JUST is a student engineering chapter where curiosity becomes research, teamwork becomes impact, and every project brings us closer to shaping a stronger built environment.'),
('hero_eyebrow', 'Jordan University of Science & Technology'),
('about_heading', 'A chapter with purpose.'),
('about_text_main', 'ACI JUST brings together civil engineering students at Jordan University of Science and Technology to explore concrete, engineering innovation, research, and professional development.'),
('about_text_secondary', 'Within the Civil Engineering Department, we create meaningful opportunities to learn beyond the classroom — through research, workshops, competitions, conversations, and the shared belief that engineering is at its best when it serves people.'),
('departments_heading', 'One team. Four directions.'),
('departments_subtext', 'Different strengths, one shared standard: bring energy, precision, and care to everything we do.'),
('research_heading', 'Questions worth testing.'),
('research_subtext', 'From sustainable materials to better construction practices, our research starts with the real challenges around us.'),
('events_heading', 'What''s happening.'),
('events_subtext', 'Ideas are better when they''re shared. Find us at the next talk, workshop, or competition.'),
('team_heading', 'Meet the makers.'),
('team_subtext', 'Students with different stories, skills, and perspectives — learning from one another as we go.')
ON CONFLICT (key) DO NOTHING;