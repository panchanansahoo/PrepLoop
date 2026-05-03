-- Migration: Company Question Bank for full-text search
-- Stores parsed CSV/XLSX interview questions from Company_Interview/

CREATE TABLE IF NOT EXISTS company_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  year INT,
  subject TEXT DEFAULT 'General CS',
  difficulty TEXT DEFAULT 'Medium',
  model_answer TEXT DEFAULT '',
  hint TEXT DEFAULT '',
  approach TEXT DEFAULT '',
  source_file TEXT DEFAULT '',
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_company_questions_search ON company_questions USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_company_questions_company ON company_questions(company);
CREATE INDEX IF NOT EXISTS idx_company_questions_subject ON company_questions(subject);

-- Auto-populate search_vector on insert/update
CREATE OR REPLACE FUNCTION company_questions_search_trigger()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.question, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.company, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.subject, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(NEW.model_answer, '')), 'D');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_questions_search ON company_questions;
CREATE TRIGGER trg_company_questions_search
  BEFORE INSERT OR UPDATE ON company_questions
  FOR EACH ROW EXECUTE FUNCTION company_questions_search_trigger();

-- RLS: public read
ALTER TABLE company_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read questions" ON company_questions FOR SELECT USING (true);
CREATE POLICY "Only admins can modify questions" ON company_questions FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
