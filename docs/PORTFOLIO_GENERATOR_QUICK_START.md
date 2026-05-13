# Portfolio Generator — Quick Start Guide

**For**: Backend/Frontend developers starting Phase 1 implementation  
**Time**: 5 min read  
**Next Step**: Start with Database Setup (Week 1)

---

## Feature Overview

**What users do**:
1. Upload resume (PDF/DOC)
2. Enter GitHub username
3. Provide LinkedIn profile URL (manual or OAuth Phase 2)
4. System parses all 3 sources → creates 1 unified profile
5. Select template + colors
6. Publish portfolio to yourdomain.com/u/{slug}
7. Share short link via link.yourdomain.com/{slug}

**Why it matters**: 
- Job seekers need a clean portfolio fast (60 seconds target)
- GitHub portfolio best practices = curated projects, not all repos
- Branded domain = higher trust than generic services
- High shareability = viral growth potential

---

## MVP Scope (Phase 1)

✅ **DO**:
- Resume parsing (regex + basic NLP)
- GitHub public API (no auth needed)
- LinkedIn URL field + manual input (Phase 2: OAuth)
- One template (minimal)
- Basic theme customizer (1–2 colors)
- Publish to yourdomain.com/u/{slug}
- Short branded link
- Edit after publishing

❌ **DON'T**:
- Multiple templates (Phase 2)
- AI rewriting (Phase 2)
- GitHub sync button (Phase 3)
- Analytics (Phase 3)
- Custom domains (Phase 3)
- Webhook integrations
- A/B testing framework

---

## Architecture High-Level

```
User uploads resume, GitHub, LinkedIn
           ↓
ResumeParserService → Extracts: name, email, experience, education, skills
GitHubService → Fetches: repos, README, stars, language, last commit
LinkedInService → Scrapes/manual: headline, summary, roles
           ↓
ProfileNormalizerService → Merges, dedupes, ranks, scores confidence
           ↓
Saves to normalized_profiles table (PostgreSQL)
           ↓
User edits, selects template
           ↓
PortfolioRendererService → Renders HTML from template + data
           ↓
PublishService → Stores HTML in Supabase Storage
           ↓
ShortLinkService → Creates link.yourdomain.com/{slug} → full URL
           ↓
Frontend shows URLs + QR (Phase 3) + success page
```

---

## Key Files You'll Create/Edit

### Backend (Node.js)

```
backend/
├── services/
│   ├── resumeParserService.js       ← Extract text, regex sections
│   ├── githubService.js             ← Fetch repos, score visibility
│   ├── linkedinService.js           ← URL validation, manual import
│   ├── profileNormalizerService.js  ← Merge 3 sources into 1 profile
│   ├── portfolioRendererService.js  ← Render EJS template
│   ├── publishService.js            ← Upload HTML to storage
│   └── shortLinkService.js          ← Generate short URLs
├── routes/
│   └── portfolio.js                 ← POST /import, POST /sites, etc.
├── middleware/
│   └── portfolioAuth.js             ← JWT verification
└── templates/
    └── minimal.ejs                  ← HTML template (EJS syntax)
```

### Frontend (React/Vite)

```
frontend/src/
├── pages/
│   ├── PortfolioCreator.jsx         ← Wizard main (4 steps)
│   ├── PortfolioGallery.jsx         ← List all user portfolios
│   └── PublicPortfolioPage.jsx      ← Public portfolio viewer
├── components/portfolio/
│   ├── ImportStep.jsx               ← Resume + GitHub + LinkedIn inputs
│   ├── ReviewStep.jsx               ← Edit merged profile
│   ├── TemplateSelector.jsx         ← Pick template + colors
│   ├── PublishStep.jsx              ← Final confirmation
│   └── ShareDialog.jsx              ← Copy link + QR code
└── hooks/
    ├── usePortfolioUpload.js        ← Resume upload + parsing
    ├── useGitHubFetch.js            ← GitHub repo fetching
    ├── useLinkedInImport.js         ← LinkedIn URL field
    └── usePortfolioPublish.js       ← Submit to /api/portfolio/sites
```

### Database (Supabase)

```sql
-- 6 main tables
normalized_profiles     ← Merged user profile
portfolio_sites         ← Published portfolio + metadata
portfolio_projects      ← Featured projects (auto-ranked)
connected_accounts      ← OAuth tokens (Phase 2)
resume_uploads          ← File tracking
short_links             ← Brand short URLs
```

---

## Dependencies

### Backend NPM Packages (add to `backend/package.json`)

```json
{
  "pdfjs-dist": "^4.0.0",           // PDF parsing
  "docx": "^8.0.0",                 // DOC/DOCX parsing
  "natural": "^6.0.0",              // NLP (extract sections)
  "ejs": "^3.1.0",                  // Template rendering
  "axios": "^1.6.0",                // HTTP (GitHub API)
  "nanoid": "^4.0.0"                // Generate short slugs
}
```

### Frontend NPM Packages (add to `frontend/package.json`)

```json
{
  "react-dropzone": "^14.0.0",      // File upload
  "react-hook-form": "^7.0.0",      // Form handling
  "qrcode.react": "^1.0.0"          // QR codes (Phase 3)
}
```

---

## Database Setup (Week 1)

Run these Supabase migrations:

```sql
-- 1. connected_accounts
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'github', 'linkedin'
  provider_id TEXT NOT NULL,
  access_token TEXT,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- 2. resume_uploads
CREATE TABLE resume_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  parsed_content JSONB,
  parse_confidence_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. normalized_profiles
CREATE TABLE normalized_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  basic_info JSONB NOT NULL,
  contacts JSONB,
  socials JSONB,
  skills JSONB,
  experience JSONB,
  education JSONB,
  projects JSONB,
  certifications JSONB,
  achievements JSONB,
  metadata JSONB,
  data_quality_score FLOAT DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 4. portfolio_projects
CREATE TABLE portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES normalized_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  live_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  visibility_score FLOAT,
  metrics JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. portfolio_sites
CREATE TABLE portfolio_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES normalized_profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  template TEXT DEFAULT 'minimal',
  theme JSONB,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. short_links
CREATE TABLE short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  full_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS: Users can only access their own data
ALTER TABLE normalized_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own profiles"
  ON normalized_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users access own portfolios"
  ON portfolio_sites
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Key Algorithms

### Resume Parsing Regex

```javascript
// Extract experience section
const experienceRegex = /(?:EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE)([\s\S]*?)(?=\n\n(?:EDUCATION|SKILLS|CERTIFICATIONS|$))/i;

// Extract company + role + dates
const jobRegex = /(?:^|\n)\s*([^,\n]+?)(?:\s*,\s*)?(?:•|-|\–)?\s*([^\n]+?)(?:\s*[-–]\s*(.+?))?(?:\n|$)/m;
```

### GitHub Visibility Score Formula

```javascript
const score =
  (repo.stars / 1000) * 0.4 +         // 40% weight for stars
  (repo.forks / 100) * 0.1 +          // 10% weight for forks
  (repo.hasReadme ? 0.2 : 0) +        // 20% bonus for README
  (isRecent(repo.lastCommitDate) ? 0.2 : 0) + // 20% bonus for recency
  (repo.description ? 0.1 : 0);       // 10% bonus for description

// Cap at 1.0, auto-feature top 3–5 repos
```

### Profile Merge Priority

```
Field           Priority
name            Resume > LinkedIn > GitHub
headline        LinkedIn > Resume
summary         LinkedIn > Resume
location        Resume > LinkedIn
email           Resume (always)
skills          Merge from all 3 (weighted)
experience      Resume + LinkedIn (dedupe by company+role)
projects        GitHub (ranked by visibility score)
education       Resume (primary source)
```

---

## API Endpoints (Phase 1)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/portfolio/profiles/import` | Parse resume + GitHub + LinkedIn → merged profile |
| GET | `/api/portfolio/profiles/:id` | Fetch normalized profile |
| PUT | `/api/portfolio/profiles/:id` | Edit profile |
| POST | `/api/portfolio/sites` | Publish portfolio |
| GET | `/api/portfolio/sites/:id` | Portfolio metadata |
| DELETE | `/api/portfolio/sites/:id` | Unpublish |
| GET | `/public/portfolios/:slug` | View public portfolio |
| GET | `/api/portfolio/short-links/:slug/resolve` | Redirect short link |

---

## Testing Strategy

### Unit Tests (Jest)

```javascript
// resumeParserService.test.js
test('extracts experience from resume', () => {
  const parsed = resumeParser.parseResume(pdfBuffer);
  expect(parsed.experience.length).toBeGreaterThan(0);
  expect(parsed.experience[0]).toHaveProperty('company');
  expect(parsed.experience[0]).toHaveProperty('role');
});

// githubService.test.js
test('ranks repositories by visibility', () => {
  const scores = repos.map(r => githubService.scoreRepository(r));
  expect(scores[0]).toBeGreaterThan(scores[scores.length - 1]);
});
```

### Integration Tests

```javascript
// Test full import flow
test('imports resume + github + linkedin', async () => {
  const response = await fetch('/api/portfolio/profiles/import', {
    method: 'POST',
    body: formData // resume file + github username + linkedin url
  });
  expect(response.status).toBe(201);
  const profile = await response.json();
  expect(profile.basicInfo.fullName).toBeDefined();
  expect(profile.projects.length).toBeGreaterThan(0);
});
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Resume parsing | <2s |
| GitHub API call | <1s (cached 24h) |
| Profile merging | <500ms |
| Template rendering | <500ms |
| Page load (portfolio site) | <2s |
| API response (import) | <5s total |

---

## Common Pitfalls

❌ **Don't do**:
1. Parse resume without error boundaries (PDFs fail unpredictably)
2. Call GitHub API on every request (respect rate limits: 60/hour unauthenticated)
3. Trust LinkedIn scraping (they block it; use manual input or Phase 2 OAuth)
4. Render portfolio on every view (pre-render on publish, cache in CDN)
5. Forget RLS policies (open door for data leaks)

✅ **Do**:
1. Validate file types + sizes before parsing
2. Cache GitHub results in Redis (24-hour TTL)
3. Use LinkedIn API (requires auth; Phase 2)
4. Store rendered HTML as static file
5. Test RLS with test user accounts

---

## Launch Checklist

Before going to production:

- [ ] Database migrations applied
- [ ] All 7 services tested (unit tests passing)
- [ ] All 7 API routes tested (integration tests passing)
- [ ] Frontend wizard flow tested (manual, all steps)
- [ ] Resume parsing tested with 3+ real resumes
- [ ] GitHub fetching tested with 3+ real accounts
- [ ] Published portfolio renders correctly
- [ ] Short links redirect correctly
- [ ] RLS policies verified (user isolation working)
- [ ] SEO meta tags on public portfolios
- [ ] Error messages clear + helpful
- [ ] Performance tests pass (<5s import, <2s page load)

---

## Helpful Resources

- **Resume Parser Libraries**: `pdfjs-dist`, `docx`, `mammoth`
- **GitHub API Docs**: https://docs.github.com/en/rest
- **LinkedIn API**: https://www.linkedin.com/developers/apps (Phase 2)
- **EJS Template Engine**: https://ejs.co/
- **Supabase Storage**: https://supabase.com/docs/guides/storage
- **Regex Tester**: https://regex101.com/

---

## Questions? Next Steps

1. **Start here**: [Full Architecture Spec](./PORTFOLIO_GENERATOR_ARCHITECTURE.md)
2. **Week 1 tasks**: [Implementation Plan](./PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md)
3. **Stuck on resume parsing?** → Check resume samples in `/Company_Interview/*.csv` for expected formats
4. **Need GitHub examples?** → Use test accounts (your GitHub repos)

---

**Created**: May 14, 2026  
**Version**: 1.0  
**Status**: Ready for Phase 1 kickoff
