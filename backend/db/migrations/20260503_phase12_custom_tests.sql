-- Phase 1.2 Migration: Custom Test Case System
-- Adds tables for user-created custom test cases and test run history

-- user_custom_tests: Store custom test cases per user per problem per language
CREATE TABLE IF NOT EXISTS user_custom_tests (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id INT NOT NULL,
  language VARCHAR(20) NOT NULL,
  test_cases JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, problem_id, language)
);

CREATE INDEX idx_user_custom_tests_user_id ON user_custom_tests(user_id);
CREATE INDEX idx_user_custom_tests_problem_id ON user_custom_tests(problem_id);

-- user_custom_test_runs: Track custom test execution history for analytics
CREATE TABLE IF NOT EXISTS user_custom_test_runs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  problem_id INT NOT NULL,
  language VARCHAR(20) NOT NULL,
  test_case_count INT NOT NULL,
  passed_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_custom_test_runs_user_id ON user_custom_test_runs(user_id);
CREATE INDEX idx_custom_test_runs_problem_id ON user_custom_test_runs(problem_id);
CREATE INDEX idx_custom_test_runs_created_at ON user_custom_test_runs(created_at DESC);

-- RLS Policies: Users can only access their own custom tests
ALTER TABLE user_custom_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_test_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_create_own_custom_tests" ON user_custom_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_read_own_custom_tests" ON user_custom_tests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_custom_tests" ON user_custom_tests
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_custom_tests" ON user_custom_tests
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_own_test_runs" ON user_custom_test_runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_read_own_test_runs" ON user_custom_test_runs
  FOR SELECT USING (auth.uid() = user_id);
