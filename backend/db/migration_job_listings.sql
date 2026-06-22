-- Migration: Add job_listings table for the Job Updates feature

CREATE TABLE IF NOT EXISTS job_listings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  company VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'fresher',
  type VARCHAR(50) DEFAULT 'full-time',
  location VARCHAR(255),
  salary_range VARCHAR(100),
  description TEXT NOT NULL,
  requirements JSONB DEFAULT '[]'::jsonb,
  apply_link VARCHAR(1000),
  deadline TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  posted_by UUID REFERENCES profiles(id),
  tags JSONB DEFAULT '[]'::jsonb,
  source VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON job_listings(category);
CREATE INDEX IF NOT EXISTS idx_job_listings_active ON job_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_job_listings_company ON job_listings(company);
CREATE INDEX IF NOT EXISTS idx_job_listings_created ON job_listings(created_at DESC);

-- Enable RLS
ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active job listings
CREATE POLICY "Anyone can view active jobs" ON job_listings
  FOR SELECT USING (is_active = true);

-- Admins can manage all jobs (insert/update/delete handled via service role key)
