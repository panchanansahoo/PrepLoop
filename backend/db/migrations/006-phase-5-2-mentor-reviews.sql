-- Phase 5.2: Mentor Reviews & Feedback
-- Creates tables for expert code review system with annotations, mentor profiles, and progress tracking

-- mentor_reviews: Core review records
-- Lifecycle: pending -> in_review -> submitted -> completed
CREATE TABLE IF NOT EXISTS mentor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solution_id UUID NOT NULL REFERENCES solution_submissions(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'submitted', 'completed')),
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  notes TEXT,
  feedback_summary TEXT,
  deadline TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- review_annotations: Line-level code feedback
-- severity levels: low, medium, high
CREATE TABLE IF NOT EXISTS review_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES mentor_reviews(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  code_snippet TEXT,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('bug', 'style', 'performance', 'clarity', 'design')),
  suggestion_text TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- mentor_profiles: Mentor reputation and expertise
CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  expertise_areas JSONB DEFAULT '[]'::jsonb,
  review_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.0,
  badges JSONB DEFAULT '[]'::jsonb,
  bio TEXT,
  availability TEXT DEFAULT 'available',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- review_responses: Track user implementation of feedback
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES mentor_reviews(id) ON DELETE CASCADE,
  implementor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response_code TEXT,
  annotations_implemented JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'implemented', 'dismissed')),
  implementation_score INTEGER CHECK (implementation_score IS NULL OR implementation_score BETWEEN 0 AND 100),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Indexes for mentor_reviews
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_solution_id ON mentor_reviews(solution_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_mentor_id ON mentor_reviews(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_requester_id ON mentor_reviews(requester_id);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_status ON mentor_reviews(status);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_created_at ON mentor_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_reviews_deadline ON mentor_reviews(deadline) WHERE status IN ('pending', 'in_review');

-- Indexes for review_annotations
CREATE INDEX IF NOT EXISTS idx_review_annotations_review_id ON review_annotations(review_id);
CREATE INDEX IF NOT EXISTS idx_review_annotations_severity ON review_annotations(severity);
CREATE INDEX IF NOT EXISTS idx_review_annotations_type ON review_annotations(suggestion_type);

-- Indexes for mentor_profiles
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_rating ON mentor_profiles(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_mentor_profiles_review_count ON mentor_profiles(review_count DESC);

-- Indexes for review_responses
CREATE INDEX IF NOT EXISTS idx_review_responses_review_id ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_implementor_id ON review_responses(implementor_id);
CREATE INDEX IF NOT EXISTS idx_review_responses_status ON review_responses(status);

-- RLS Policies
ALTER TABLE mentor_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;

-- mentor_reviews: Requester can see own reviews, mentors can see assigned reviews
CREATE POLICY mentor_reviews_select_policy ON mentor_reviews
  FOR SELECT USING (
    auth.uid() = requester_id OR 
    auth.uid() = mentor_id OR
    (SELECT user_id FROM auth.users WHERE id = auth.uid() LIMIT 1) = (SELECT user_id FROM auth.users WHERE id = auth.uid() LIMIT 1)
  );

CREATE POLICY mentor_reviews_insert_policy ON mentor_reviews
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY mentor_reviews_update_policy ON mentor_reviews
  FOR UPDATE USING (
    auth.uid() = mentor_id OR auth.uid() = requester_id
  );

-- review_annotations: Read by requester and mentor, write by mentor only
CREATE POLICY review_annotations_select_policy ON review_annotations
  FOR SELECT USING (
    (SELECT mentor_id FROM mentor_reviews WHERE id = review_id) = auth.uid() OR
    (SELECT requester_id FROM mentor_reviews WHERE id = review_id) = auth.uid()
  );

CREATE POLICY review_annotations_insert_policy ON review_annotations
  FOR INSERT WITH CHECK (
    (SELECT mentor_id FROM mentor_reviews WHERE id = review_id) = auth.uid()
  );

CREATE POLICY review_annotations_delete_policy ON review_annotations
  FOR DELETE USING (
    (SELECT mentor_id FROM mentor_reviews WHERE id = review_id) = auth.uid()
  );

-- mentor_profiles: Public read, owner update
CREATE POLICY mentor_profiles_select_policy ON mentor_profiles
  FOR SELECT USING (true);

CREATE POLICY mentor_profiles_update_policy ON mentor_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- review_responses: Read by requester and mentor, write by implementor
CREATE POLICY review_responses_select_policy ON review_responses
  FOR SELECT USING (
    (SELECT mentor_id FROM mentor_reviews WHERE id = review_id) = auth.uid() OR
    (SELECT requester_id FROM mentor_reviews WHERE id = review_id) = auth.uid() OR
    auth.uid() = implementor_id
  );

CREATE POLICY review_responses_insert_policy ON review_responses
  FOR INSERT WITH CHECK (auth.uid() = implementor_id);

CREATE POLICY review_responses_update_policy ON review_responses
  FOR UPDATE USING (auth.uid() = implementor_id);
