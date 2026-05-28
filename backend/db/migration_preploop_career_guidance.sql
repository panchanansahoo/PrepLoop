-- PrepLoop career guidance data model

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS qualification TEXT;

CREATE TABLE IF NOT EXISTS career_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name TEXT NOT NULL,
  institution TEXT,
  category TEXT,
  level TEXT,
  qualification TEXT,
  skills TEXT[] DEFAULT '{}'::text[],
  normalized_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_courses_course_name ON career_courses(course_name);
CREATE INDEX IF NOT EXISTS idx_career_courses_category ON career_courses(category);
CREATE INDEX IF NOT EXISTS idx_career_courses_level ON career_courses(level);

CREATE TABLE IF NOT EXISTS career_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  company_type TEXT,
  location TEXT,
  qualification TEXT,
  skills TEXT[] DEFAULT '{}'::text[],
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  demand_score NUMERIC(5,2) DEFAULT 0,
  normalized_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_roles_role_name ON career_roles(role_name);
CREATE INDEX IF NOT EXISTS idx_career_roles_location ON career_roles(location);
CREATE INDEX IF NOT EXISTS idx_career_roles_demand_score ON career_roles(demand_score DESC);

CREATE TABLE IF NOT EXISTS career_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES career_courses(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES career_roles(id) ON DELETE CASCADE,
  similarity_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  skill_overlap NUMERIC(5,2) NOT NULL DEFAULT 0,
  demand_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_pathways_course_id ON career_pathways(course_id);
CREATE INDEX IF NOT EXISTS idx_career_pathways_role_id ON career_pathways(role_id);
CREATE INDEX IF NOT EXISTS idx_career_pathways_similarity_score ON career_pathways(similarity_score DESC);

CREATE TABLE IF NOT EXISTS career_market_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES career_roles(id) ON DELETE CASCADE,
  location TEXT,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  trend_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  emerging_skills TEXT[] DEFAULT '{}'::text[],
  source TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_career_market_signals_role_id ON career_market_signals(role_id);
CREATE INDEX IF NOT EXISTS idx_career_market_signals_location ON career_market_signals(location);
CREATE INDEX IF NOT EXISTS idx_career_market_signals_trend_score ON career_market_signals(trend_score DESC);
