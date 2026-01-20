-- ============================================
-- UNIVERSITY TASK MANAGER - DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unassigned' CHECK (status IN ('unassigned', 'pending', 'in_progress', 'completed')),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Task assignments (many-to-many)
CREATE TABLE public.task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- Task comments
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignment requests
CREATE TABLE public.assignment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id, status)
);

-- Documentation sections
CREATE TABLE public.documentation_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documentation pages
CREATE TABLE public.documentation_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id UUID NOT NULL REFERENCES public.documentation_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep alive table
CREATE TABLE public.keep_alive (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert initial keep_alive row
INSERT INTO public.keep_alive (last_ping) VALUES (NOW());

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read all users
CREATE POLICY "Users can view all users"
  ON public.users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Only authenticated users can insert (handled by trigger)
CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- TASKS TABLE POLICIES
-- ============================================

-- Everyone can read all tasks
CREATE POLICY "Anyone can view tasks"
  ON public.tasks FOR SELECT
  USING (true);

-- Only admins can create tasks
CREATE POLICY "Only admins can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update tasks
CREATE POLICY "Only admins can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete tasks
CREATE POLICY "Only admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TASK ASSIGNMENTS POLICIES
-- ============================================

-- Everyone can view assignments
CREATE POLICY "Anyone can view assignments"
  ON public.task_assignments FOR SELECT
  USING (true);

-- Only admins can create assignments
CREATE POLICY "Only admins can assign tasks"
  ON public.task_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete assignments
CREATE POLICY "Only admins can remove assignments"
  ON public.task_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- TASK COMMENTS POLICIES
-- ============================================

-- Users can view comments on tasks they're assigned to, admins can view all
CREATE POLICY "Users can view comments on assigned tasks"
  ON public.task_comments FOR SELECT
  USING (
    -- Admin can see all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- User can see comments on tasks they're assigned to
    EXISTS (
      SELECT 1 FROM public.task_assignments
      WHERE task_assignments.task_id = task_comments.task_id
        AND task_assignments.user_id = auth.uid()
    )
  );

-- Only assigned users can add comments
CREATE POLICY "Only assigned users can comment"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.task_assignments
      WHERE task_assignments.task_id = task_comments.task_id
        AND task_assignments.user_id = auth.uid()
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.task_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- ASSIGNMENT REQUESTS POLICIES
-- ============================================

-- Users can view their own requests, admins can view all
CREATE POLICY "Users can view own requests, admins view all"
  ON public.assignment_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can create assignment requests
CREATE POLICY "Users can create assignment requests"
  ON public.assignment_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only admins can update requests (approve/reject)
CREATE POLICY "Only admins can update requests"
  ON public.assignment_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- DOCUMENTATION POLICIES
-- ============================================

-- Everyone can read documentation
CREATE POLICY "Anyone can view documentation sections"
  ON public.documentation_sections FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view documentation pages"
  ON public.documentation_pages FOR SELECT
  USING (true);

-- Only admins can manage documentation
CREATE POLICY "Only admins can manage documentation sections"
  ON public.documentation_sections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can manage documentation pages"
  ON public.documentation_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- KEEP ALIVE POLICIES
-- ============================================

-- Allow public read access for keep-alive
CREATE POLICY "Anyone can read keep_alive"
  ON public.keep_alive FOR SELECT
  USING (true);

-- Allow public update for keep-alive
CREATE POLICY "Anyone can update keep_alive"
  ON public.keep_alive FOR UPDATE
  USING (true);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    -- Check if this is Jose Morales
    CASE 
      WHEN NEW.email = 'jose.morales@example.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update task status based on assignments
CREATE OR REPLACE FUNCTION public.update_task_status_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When a task gets its first assignment, change status from unassigned to pending
  IF (SELECT status FROM public.tasks WHERE id = NEW.task_id) = 'unassigned' THEN
    UPDATE public.tasks
    SET status = 'pending'
    WHERE id = NEW.task_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update task status when assigned
CREATE TRIGGER on_task_assigned
  AFTER INSERT ON public.task_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_task_status_on_assignment();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX idx_assignment_requests_status ON public.assignment_requests(status);
CREATE INDEX idx_assignment_requests_user_id ON public.assignment_requests(user_id);
CREATE INDEX idx_documentation_pages_section_id ON public.documentation_pages(section_id);

-- ============================================
-- COMPLETE!
-- ============================================
-- Your database is now ready to use.
-- Remember to:
-- 1. Update the admin email in handle_new_user() function if needed
-- 2. Set your environment variables in .env.local
-- 3. Run 'npm install' in your project directory
-- ============================================
