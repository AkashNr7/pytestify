-- =========================================================================
-- ENTERPRISE POSTMAN -> PYTEST MIGRATOR DATABASE SCHEMA
-- Target Platform: Supabase PostgreSQL (SQL Editor Console)
-- Compatibility: Auth Triggers, Audit Trail Logging, MCP Analytics Tracking
-- =========================================================================

-- Enable Extension for UUID generation if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. TEAMMATE PROFILES TABLE (public.users)
-- -------------------------------------------------------------------------
-- Stores corporate details for secure authentication, authorization, and RBAC
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE DEFAULT NULL,
    password TEXT DEFAULT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    employee_id TEXT UNIQUE DEFAULT NULL,
    full_name TEXT DEFAULT 'New Employee',
    department TEXT DEFAULT 'Engineering',
    designation TEXT DEFAULT 'Staff Software Engineer',
    role TEXT DEFAULT 'Developer' CHECK (role IN ('Admin', 'Manager', 'QA Engineer', 'Developer', 'Viewer')),
    account_status TEXT DEFAULT 'Active' CHECK (account_status IN ('Active', 'Disabled', 'Locked'))
);

-- Index user queries for fast searches
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- -------------------------------------------------------------------------
-- 2. AUTHENTICATION AUTOMATIC PROFILE TRIGGER
-- -------------------------------------------------------------------------
-- Triggers whenever a new account completes registration in Supabase Auth.
-- It automatically provisions a standard profile inside public.users.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (
        id, 
        email, 
        full_name, 
        role, 
        account_status,
        department,
        designation
    )
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'fullName', 'New Employee'),
        coalesce(new.raw_user_meta_data->>'role', 'Developer'),
        'Active',
        coalesce(new.raw_user_meta_data->>'department', 'Engineering'),
        coalesce(new.raw_user_meta_data->>'designation', 'Staff Engineer')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------------------------
-- 3. PROJECTS TABLE (public.projects)
-- -------------------------------------------------------------------------
-- Stores user-owned Postman Collection workspace mappings & configuration
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    project_name TEXT NOT NULL DEFAULT 'Untitled Project',
    collection_name TEXT DEFAULT 'Uploaded Collection',
    collection_items JSONB DEFAULT '[]'::jsonb,
    library TEXT DEFAULT 'requests',
    base_url TEXT DEFAULT '',
    inject_fixture BOOLEAN DEFAULT TRUE,
    add_comments BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);

-- -------------------------------------------------------------------------
-- 4. GENERATED FILES TABLE (public.generated_files)
-- -------------------------------------------------------------------------
-- Stores generated python test suites (both consolidated file AND modular scripts)
CREATE TABLE IF NOT EXISTS public.generated_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_content TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generated_files_project_id ON public.generated_files(project_id);

-- -------------------------------------------------------------------------
-- 5. TEST SUITE EXECUTION RESULTS (public.execution_results)
-- -------------------------------------------------------------------------
-- Tracks pytest outcomes (success rates, diagnostics console output metadata)
CREATE TABLE IF NOT EXISTS public.execution_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    passed_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    execution_time NUMERIC DEFAULT 0,
    report_json TEXT DEFAULT '{}',
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_execution_results_project_id ON public.execution_results(project_id);

-- -------------------------------------------------------------------------
-- 6. AI DIAGNOSTIC FAILURE ANALYSIS (public.ai_analysis)
-- -------------------------------------------------------------------------
-- Persists smart recommendations from the Gemini-3.5 loop agent on test failures
CREATE TABLE IF NOT EXISTS public.ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    error_message TEXT,
    diagnosis TEXT,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_project_id ON public.ai_analysis(project_id);

-- -------------------------------------------------------------------------
-- 7. AUDIT TRIAL COMPLIANCE TRAIL (public.audit_logs)
-- -------------------------------------------------------------------------
-- Captures system edits, modifications, elevation operations for Sox compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT DEFAULT 'system',
    target_table TEXT DEFAULT 'system', -- Supports both naming fallbacks
    resource_id TEXT,
    status TEXT DEFAULT 'Success',
    details TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT 'Chrome',
    device_information TEXT DEFAULT 'Chrome', -- Supports both naming fallbacks
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() -- Supports both naming fallbacks
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- -------------------------------------------------------------------------
-- 8. SECURITY CONNECTION ATTENDANCE HISTORY (public.login_history)
-- -------------------------------------------------------------------------
-- Logs active sessions, locking incidents, and user login traces
CREATE TABLE IF NOT EXISTS public.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email TEXT,
    login_time TIMESTAMPTZ DEFAULT NOW(),
    logout_time TIMESTAMPTZ DEFAULT NULL,
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT DEFAULT 'Chrome',
    device_information TEXT DEFAULT 'Chrome', -- Supports both naming fallbacks
    status TEXT DEFAULT 'Success',
    login_status TEXT DEFAULT 'Success', -- Supports both naming fallbacks
    details TEXT DEFAULT 'Handshake Completed'
);

CREATE INDEX IF NOT EXISTS idx_login_history_time ON public.login_history(login_time DESC);

-- -------------------------------------------------------------------------
-- 9. DELEGATED AI CONTROLLER METRICS (public.mcp_activity)
-- -------------------------------------------------------------------------
-- Tracks real-time context injections on the MCP background automation server
CREATE TABLE IF NOT EXISTS public.mcp_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    tool_name TEXT NOT NULL,
    request_payload TEXT,
    arguments JSONB DEFAULT '{}'::jsonb, -- Supports both naming fallbacks
    response_summary TEXT,
    response JSONB DEFAULT '{}'::jsonb, -- Supports both naming fallbacks
    execution_status TEXT DEFAULT 'Success',
    status TEXT DEFAULT 'Success', -- Supports both naming fallbacks
    execution_time NUMERIC DEFAULT 0,
    elapsed_seconds NUMERIC DEFAULT 0, -- Supports both naming fallbacks
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() -- Supports both naming fallbacks
);

CREATE INDEX IF NOT EXISTS idx_mcp_activity_time ON public.mcp_activity(timestamp DESC);

-- -------------------------------------------------------------------------
-- 10. ENABLE ROW LEVEL SECURITY (RLS) FOR SAFE CORNERSTONES
-- -------------------------------------------------------------------------
-- Ensures general isolation so players only gain access through our proxy server
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow authenticated service role full access
CREATE POLICY service_role_bypass_users ON public.users TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_bypass_projects ON public.projects TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view profiles in the tenant
CREATE POLICY auth_users_select ON public.users FOR SELECT TO authenticated USING (true);
-- Allow users to update their own profiles
CREATE POLICY auth_users_self_update ON public.users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Allow users to fully query/manage their own projects
CREATE POLICY auth_projects_all ON public.projects TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- DATABASE SETUP COMPLETE
-- Run the queries above inside the SQL editor of your Supabase Workspace.
-- =========================================================================
