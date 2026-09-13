-- Client-side error logging: every uncaught error, failed promise, React
-- render crash, and destructive/error toast shown to a user gets written
-- here so bugs can be found and fixed from real usage instead of reports.
CREATE TABLE public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  context JSONB,
  path TEXT,
  user_agent TEXT
);

CREATE INDEX error_logs_created_at_idx ON public.error_logs (created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in or not) can report an error - logging must never be
-- blocked by auth state, since auth itself is a common failure point.
CREATE POLICY "anyone can insert error logs"
  ON public.error_logs FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE policy for regular users - logs are reviewed via
-- the Supabase dashboard/SQL editor (service role bypasses RLS).
