-- ============================================
-- UNIVERSITY TASK MANAGER - COMPLETE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor for a fresh installation
-- This includes all tables, policies, functions, triggers, and indexes
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

-- Task links (Plugins, Documentación, Tutoriales)
CREATE TABLE public.task_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('plugins', 'documentacion', 'tutoriales')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assignment requests
CREATE TABLE public.assignment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, user_id, status)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('assignment_response', 'task_comment', 'mention')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assignment_request_id UUID REFERENCES public.assignment_requests(id) ON DELETE CASCADE,
  task_comment_id UUID REFERENCES public.task_comments(id) ON DELETE CASCADE
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
  "order" INTEGER NOT NULL DEFAULT 0,
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
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
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

-- Users can view comments on tasks they're assigned to or if they're admin
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

-- Assigned users and admins can add comments
CREATE POLICY "Assigned users and admins can comment"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Admin can comment on any task
      EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
      )
      OR
      -- User can comment on assigned tasks
      EXISTS (
        SELECT 1 FROM public.task_assignments
        WHERE task_assignments.task_id = task_comments.task_id
          AND task_assignments.user_id = auth.uid()
      )
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON public.task_comments FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- TASK LINKS POLICIES
-- ============================================

-- Anyone authenticated can read task links
CREATE POLICY "Anyone can view task links"
  ON public.task_links FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert task links
CREATE POLICY "Only admins can create task links"
  ON public.task_links FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Only admins can update task links
CREATE POLICY "Only admins can update task links"
  ON public.task_links FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Only admins can delete task links
CREATE POLICY "Only admins can delete task links"
  ON public.task_links FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================
-- ASSIGNMENT REQUESTS POLICIES
-- ============================================

-- Users can view their own requests, admins can view all
CREATE POLICY "Users can view own requests, admins view all"
  ON public.assignment_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Users can create assignment requests
CREATE POLICY "Users can create assignment requests"
  ON public.assignment_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update requests (approve/reject)
CREATE POLICY "Only admins can update requests"
  ON public.assignment_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can create notifications
CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
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
    -- Check if this is the admin user (update this email as needed)
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

-- Users indexes
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_email ON public.users(email);

-- Tasks indexes
CREATE INDEX idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);

-- Task assignments indexes
CREATE INDEX idx_task_assignments_task_id ON public.task_assignments(task_id);
CREATE INDEX idx_task_assignments_user_id ON public.task_assignments(user_id);

-- Task comments indexes
CREATE INDEX idx_task_comments_task_id ON public.task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON public.task_comments(user_id);
CREATE INDEX idx_task_comments_created_at ON public.task_comments(created_at DESC);

-- Task links indexes
CREATE INDEX idx_task_links_task_id ON public.task_links(task_id);
CREATE INDEX idx_task_links_type ON public.task_links(link_type);

-- Assignment requests indexes
CREATE INDEX idx_assignment_requests_status ON public.assignment_requests(status);
CREATE INDEX idx_assignment_requests_user_id ON public.assignment_requests(user_id);
CREATE INDEX idx_assignment_requests_task_id ON public.assignment_requests(task_id);
CREATE INDEX idx_assignment_requests_reviewed_by ON public.assignment_requests(reviewed_by);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Documentation indexes
CREATE INDEX idx_documentation_pages_section_id ON public.documentation_pages(section_id);
CREATE INDEX idx_documentation_pages_section_order ON public.documentation_pages(section_id, "order");
CREATE INDEX idx_documentation_sections_order ON public.documentation_sections("order");

-- ============================================
-- COMPLETE!
-- ============================================
-- Your database is now ready to use with all features:
-- ✅ User authentication and roles
-- ✅ Task management with assignments
-- ✅ Task comments and links
-- ✅ Assignment requests with admin feedback
-- ✅ Notifications system
-- ✅ Documentation wiki
-- ✅ Keep-alive system
-- ✅ All RLS policies
-- ✅ Performance indexes
--
-- Remember to:
-- 1. Update the admin email in handle_new_user() function (line 462)
-- 2. Set your environment variables in .env.local:
--    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
-- 3. Run 'npm install' in your project directory
-- 4. Run 'npm run dev' to start the development server
-- ============================================
