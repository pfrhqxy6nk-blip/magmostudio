-- MASTER SCHEMA FOR FUTURE AGENCY

-- 1. PROFILES Table (User metadata and roles)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  avatar TEXT,
  password TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_root BOOLEAN DEFAULT FALSE,
  notifications JSONB DEFAULT '{"email": true, "push": true, "browser": false}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PROJECTS Table (Active customer projects)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  budget TEXT,
  description TEXT,
  contact TEXT,
  status TEXT DEFAULT 'PENDING',
  progress INTEGER DEFAULT 0,
  owner_email TEXT NOT NULL,
  -- Maintenance (optional, after delivery)
  maintenance_status TEXT DEFAULT 'NONE', -- NONE | REQUESTED | ACTIVE | CANCELED
  maintenance_plan_id TEXT,
  maintenance_plan_name TEXT,
  maintenance_plan_price TEXT,
  maintenance_started_at TIMESTAMP WITH TIME ZONE,
  maintenance_ended_at TIMESTAMP WITH TIME ZONE,
  maintenance_requested_plan_id TEXT,
  maintenance_requested_plan_name TEXT,
  maintenance_requested_plan_price TEXT,
  maintenance_requested_at TIMESTAMP WITH TIME ZONE,
  roadmap JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  tech_log JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  visuals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PORTFOLIO Table (Agency showcase/cases)
CREATE TABLE IF NOT EXISTS portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  image TEXT,
  description TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. REQUESTS Table (Initial landing page inquiries)
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  telegram TEXT,
  details TEXT,
  category TEXT,
  budget TEXT,
  status TEXT DEFAULT 'NEW',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
-- Allow any user to see profiles (necessary for login check by email)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Allow any user to insert a profile (registration)
CREATE POLICY "Anyone can create a profile" ON profiles
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (true); -- In a real app, restrict by Auth ID

-- PROJECTS POLICIES
-- Allow any user to see all projects (Admins need this, clients filter in UI)
-- For better security: restrict to owner_email or is_admin
CREATE POLICY "Projects are viewable by everyone" ON projects
  FOR SELECT USING (true);

-- Allow any user to insert a project
CREATE POLICY "Anyone can create a project" ON projects
  FOR INSERT WITH CHECK (true);

-- Allow updates to projects
CREATE POLICY "Anyone can update projects" ON projects
  FOR UPDATE USING (true);

-- Allow deletion of projects
CREATE POLICY "Anyone can delete projects" ON projects
  FOR DELETE USING (true);

-- PORTFOLIO POLICIES
-- Everyone can view portfolio
CREATE POLICY "Portfolio is viewable by everyone" ON portfolio
  FOR SELECT USING (true);

-- Only admins can modify portfolio (Management via API handled by logic)
CREATE POLICY "Anyone can modify portfolio" ON portfolio
  FOR ALL USING (true); -- Simplified for now, restrict in production

-- REQUESTS POLICIES
CREATE POLICY "Requests are manageable" ON requests
  FOR ALL USING (true);

-- Initial Data for Portfolio
INSERT INTO portfolio (title, category, image, description, tags)
VALUES 
('xatko.com', 'REAL_ESTATE_AI', 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=2073&auto=format&fit=crop', 'Перша AI-платформа для оренди нерухомості без посередників.', '["AI Search", "Marketplace", "Automated Booking"]'),
('Future Launch', 'FINTECH_DASHBOARD', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop', 'Високопродуктивна аналітична панель для фінансових операцій.', '["Analytics", "B2B", "Web App"]');

-- ==========================================
-- STORAGE CONFIGURATION
-- ==========================================

-- 1. Create 'videos' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true);

-- 2. Storage Policies
-- Allow public viewing of videos
CREATE POLICY "Public Videos" ON storage.objects
  FOR SELECT USING ( bucket_id = 'videos' );

-- Allow uploads (Permissive for Custom Auth)
CREATE POLICY "Allow Video Uploads" ON storage.objects
  FOR INSERT WITH CHECK ( bucket_id = 'videos' );
