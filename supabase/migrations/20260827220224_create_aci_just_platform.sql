/*
# Create ACI JUST team platform

1. New Tables
- `departments`: public department directory with descriptions, member counts, and imagery.
- `members`: public member profiles connected to a department, including role, bio, academic details, and score.
- `point_history`: private administrator-only audit trail for score adjustments.
- `research_projects`: public research work showcase.
- `events`: public event and workshop listings.
- `achievements`: public awards and milestones.
- `admins`: authenticated administrator assignments and role levels.
2. Security
- Row-level security is enabled on every table.
- Public content can be read by anon and authenticated visitors.
- Only active authenticated admins can create, edit, or delete managed content.
- Point history and admin assignments are readable only by authenticated admins.
3. Important Notes
- This is a single ACI JUST team workspace, not a multi-tenant product.
- Supabase Auth owns passwords and sessions; no password data is stored here.
*/

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  image_url text,
  accent text NOT NULL DEFAULT 'blue',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'Member',
  academic_info text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  image_url text,
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS point_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS research_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  status text NOT NULL DEFAULT 'Active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_date date NOT NULL,
  location text NOT NULL DEFAULT 'JUST Campus',
  event_type text NOT NULL DEFAULT 'Workshop',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  year integer NOT NULL,
  description text NOT NULL DEFAULT '',
  ranking text,
  image_url text,
  external_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'department_admin' CHECK (role IN ('super_admin', 'department_admin')),
  department_id uuid REFERENCES departments(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS members_department_id_idx ON members(department_id);
CREATE INDEX IF NOT EXISTS point_history_member_id_idx ON point_history(member_id);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view departments" ON departments;
CREATE POLICY "Public can view departments" ON departments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert departments" ON departments;
CREATE POLICY "Admins can insert departments" ON departments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update departments" ON departments;
CREATE POLICY "Admins can update departments" ON departments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete departments" ON departments;
CREATE POLICY "Admins can delete departments" ON departments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

DROP POLICY IF EXISTS "Public can view members" ON members;
CREATE POLICY "Public can view members" ON members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert members" ON members;
CREATE POLICY "Admins can insert members" ON members FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update members" ON members;
CREATE POLICY "Admins can update members" ON members FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete members" ON members;
CREATE POLICY "Admins can delete members" ON members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

DROP POLICY IF EXISTS "Public can view research" ON research_projects;
CREATE POLICY "Public can view research" ON research_projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert research" ON research_projects;
CREATE POLICY "Admins can insert research" ON research_projects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update research" ON research_projects;
CREATE POLICY "Admins can update research" ON research_projects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete research" ON research_projects;
CREATE POLICY "Admins can delete research" ON research_projects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

DROP POLICY IF EXISTS "Public can view events" ON events;
CREATE POLICY "Public can view events" ON events FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert events" ON events;
CREATE POLICY "Admins can insert events" ON events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update events" ON events;
CREATE POLICY "Admins can update events" ON events FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete events" ON events;
CREATE POLICY "Admins can delete events" ON events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

DROP POLICY IF EXISTS "Public can view achievements" ON achievements;
CREATE POLICY "Public can view achievements" ON achievements FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admins can insert achievements" ON achievements;
CREATE POLICY "Admins can insert achievements" ON achievements FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update achievements" ON achievements;
CREATE POLICY "Admins can update achievements" ON achievements FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete achievements" ON achievements;
CREATE POLICY "Admins can delete achievements" ON achievements FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

DROP POLICY IF EXISTS "Admins can view point history" ON point_history;
CREATE POLICY "Admins can view point history" ON point_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can insert point history" ON point_history;
CREATE POLICY "Admins can insert point history" ON point_history FOR INSERT TO authenticated WITH CHECK (admin_id = auth.uid() AND EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can update point history" ON point_history;
CREATE POLICY "Admins can update point history" ON point_history FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));
DROP POLICY IF EXISTS "Admins can delete point history" ON point_history;
CREATE POLICY "Admins can delete point history" ON point_history FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND is_active));

DROP POLICY IF EXISTS "Admins can view own assignment" ON admins;
CREATE POLICY "Admins can view own assignment" ON admins FOR SELECT TO authenticated USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin' AND a.is_active));
DROP POLICY IF EXISTS "Super admins can insert assignments" ON admins;
CREATE POLICY "Super admins can insert assignments" ON admins FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin' AND a.is_active));
DROP POLICY IF EXISTS "Super admins can update assignments" ON admins;
CREATE POLICY "Super admins can update assignments" ON admins FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin' AND a.is_active)) WITH CHECK (EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin' AND a.is_active));
DROP POLICY IF EXISTS "Super admins can delete assignments" ON admins;
CREATE POLICY "Super admins can delete assignments" ON admins FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin' AND a.is_active));

INSERT INTO departments (name, slug, description, accent) VALUES
('Research Department', 'research', 'Turning questions about concrete and construction materials into practical, evidence-based work.', 'blue'),
('Public Relations', 'public-relations', 'Connecting ACI JUST with students, faculty, industry partners, and the wider engineering community.', 'orange'),
('Events Department', 'events', 'Creating memorable workshops, competitions, lectures, and hands-on engineering experiences.', 'teal'),
('Social Media', 'social-media', 'Making engineering knowledge and the team''s story accessible, useful, and easy to share.', 'navy')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO achievements (title, year, description, ranking) SELECT 'Ranked #1 Worldwide', 2025, 'ACI JUST achieved first place among ACI student chapters around the world in 2025.', '1st place among ACI student chapters worldwide' WHERE NOT EXISTS (SELECT 1 FROM achievements WHERE title = 'Ranked #1 Worldwide' AND year = 2025);

INSERT INTO research_projects (title, description, year, status) SELECT 'Concrete Innovation & Sustainable Materials', 'Exploring practical ways to make concrete more responsible, resilient, and ready for the future.', 2025, 'Active' WHERE NOT EXISTS (SELECT 1 FROM research_projects WHERE title = 'Concrete Innovation & Sustainable Materials');

INSERT INTO events (title, description, event_date, location, event_type) SELECT 'ACI JUST Concrete Talks', 'A student-led evening of ideas, case studies, and conversation around the material that shapes our world.', '2026-10-15', 'Civil Engineering Department, JUST', 'Lecture' WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'ACI JUST Concrete Talks');