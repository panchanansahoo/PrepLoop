-- Migration: Portfolio generator phase 1 schema
-- Scope: normalized profiles, published portfolio sites, short links, and import account/resume tracking.

CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('github', 'linkedin')),
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_provider
  ON connected_accounts(user_id, provider);

CREATE TABLE IF NOT EXISTS resume_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  parsed_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  parse_confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  parsing_error TEXT,
  parsed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_user_id
  ON resume_uploads(user_id);

CREATE INDEX IF NOT EXISTS idx_resume_uploads_created_at
  ON resume_uploads(created_at DESC);

CREATE TABLE IF NOT EXISTS normalized_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  basic_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  contacts JSONB NOT NULL DEFAULT '{}'::jsonb,
  socials JSONB NOT NULL DEFAULT '{}'::jsonb,
  skills JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  projects JSONB NOT NULL DEFAULT '[]'::jsonb,
  certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  data_quality_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  last_import_sources TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_normalized_profiles_user_id
  ON normalized_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_normalized_profiles_data_quality
  ON normalized_profiles(data_quality_score DESC);

CREATE TABLE IF NOT EXISTS portfolio_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES normalized_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL DEFAULT 'minimal',
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  html_content TEXT,
  title TEXT,
  published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
  custom_domain TEXT,
  custom_domain_verified BOOLEAN NOT NULL DEFAULT FALSE,
  seo_data JSONB NOT NULL DEFAULT '{"title":"","description":"","keywords":[]}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_sites_user_id
  ON portfolio_sites(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_sites_slug
  ON portfolio_sites(slug);

CREATE INDEX IF NOT EXISTS idx_portfolio_sites_published
  ON portfolio_sites(published, visibility);

CREATE TABLE IF NOT EXISTS short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  full_url TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_short_links_slug
  ON short_links(slug);

CREATE INDEX IF NOT EXISTS idx_short_links_portfolio_site_id
  ON short_links(portfolio_site_id);

CREATE TABLE IF NOT EXISTS portfolio_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  visitor_ip TEXT,
  visitor_country TEXT,
  referrer TEXT,
  device_type TEXT CHECK (device_type IN ('mobile', 'tablet', 'desktop')),
  session_duration_seconds INTEGER,
  sections_viewed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_visits_site_id
  ON portfolio_visits(portfolio_site_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_visits_visited_at
  ON portfolio_visits(visited_at DESC);

ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE normalized_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_visits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'connected_accounts' AND policyname = 'Users can manage own connected accounts'
  ) THEN
    CREATE POLICY "Users can manage own connected accounts"
      ON connected_accounts
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'resume_uploads' AND policyname = 'Users can manage own resume uploads'
  ) THEN
    CREATE POLICY "Users can manage own resume uploads"
      ON resume_uploads
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'normalized_profiles' AND policyname = 'Users can manage own normalized profiles'
  ) THEN
    CREATE POLICY "Users can manage own normalized profiles"
      ON normalized_profiles
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_sites' AND policyname = 'Users can manage own portfolio sites'
  ) THEN
    CREATE POLICY "Users can manage own portfolio sites"
      ON portfolio_sites
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_sites' AND policyname = 'Public can read published portfolio sites'
  ) THEN
    CREATE POLICY "Public can read published portfolio sites"
      ON portfolio_sites
      FOR SELECT
      USING (published = TRUE AND visibility IN ('public', 'unlisted'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'short_links' AND policyname = 'Users can manage own short links through site ownership'
  ) THEN
    CREATE POLICY "Users can manage own short links through site ownership"
      ON short_links
      USING (
        EXISTS (
          SELECT 1
          FROM portfolio_sites ps
          WHERE ps.id = short_links.portfolio_site_id
            AND ps.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM portfolio_sites ps
          WHERE ps.id = short_links.portfolio_site_id
            AND ps.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'short_links' AND policyname = 'Public can resolve short links'
  ) THEN
    CREATE POLICY "Public can resolve short links"
      ON short_links
      FOR SELECT
      USING (TRUE);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_visits' AND policyname = 'Users can read own portfolio visits'
  ) THEN
    CREATE POLICY "Users can read own portfolio visits"
      ON portfolio_visits
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM portfolio_sites ps
          WHERE ps.id = portfolio_visits.portfolio_site_id
            AND ps.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_visits' AND policyname = 'Public can insert portfolio visits'
  ) THEN
    CREATE POLICY "Public can insert portfolio visits"
      ON portfolio_visits
      FOR INSERT
      WITH CHECK (TRUE);
  END IF;
END $$;
