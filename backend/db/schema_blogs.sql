-- Create blogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS blogs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content JSONB NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  category TEXT DEFAULT 'General',
  cover_image TEXT,
  read_time INTEGER DEFAULT 5,
  is_published BOOLEAN DEFAULT TRUE,
  views INTEGER DEFAULT 0
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);

-- Enable RLS
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public blogs are viewable by everyone" 
ON blogs FOR SELECT 
USING (is_published = true);

CREATE POLICY "Users can create blogs" 
ON blogs FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own blogs" 
ON blogs FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own blogs" 
ON blogs FOR DELETE 
USING (auth.uid() = author_id);
