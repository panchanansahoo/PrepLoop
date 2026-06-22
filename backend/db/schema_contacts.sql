-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'new' -- new, read, replied
);

-- Enable RLS (optional, depends on if we want admin dashboard to read them)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public contact form)
CREATE POLICY "Anyone can insert contacts" 
ON contacts FOR INSERT 
WITH CHECK (true);

-- Only admins/service role can view (handled by backend suppression of RLS usually, or specific policy)
-- For now, we'll rely on service_role key in backend to read/write if needed, or just insert.
-- The backend uses supabaseAdmin which bypasses RLS, so this is fine.
