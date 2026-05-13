# Portfolio Generator — Complete Technical Architecture

**Status**: MVP Specification | **Target Stack**: Node.js 22.x (Express), React (Vite), Supabase PostgreSQL  
**Phases**: 3 | **Launch Target**: MVP in Phase 1  
**MVP Promise**: "Upload resume, connect GitHub and LinkedIn → get a shareable portfolio in 60 seconds"

---

## Table of Contents

1. [Data Model & Database Schema](#data-model--database-schema)
2. [API Routes & Backend Services](#api-routes--backend-services)
3. [Frontend Components & Flows](#frontend-components--flows)
4. [Service Architecture](#service-architecture)
5. [Domain & Sharing Strategy](#domain--sharing-strategy)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Security & Privacy](#security--privacy)
8. [Performance & Scalability](#performance--scalability)

---

## Data Model & Database Schema

### Unified Profile Schema (JSON)

All imported data (resume, GitHub, LinkedIn) maps into one normalized structure before rendering:

```json
{
  "id": "uuid",
  "userId": "uuid",
  "basicInfo": {
    "fullName": "string",
    "headline": "string",
    "summary": "string",
    "location": "string",
    "photo": {
      "url": "string",
      "sourceId": "enum(resume|github|linkedin)",
      "uploadedAt": "timestamp"
    }
  },
  "contacts": {
    "email": "string",
    "phone": "string",
    "website": "string"
  },
  "socials": {
    "linkedin": "string",
    "github": "string",
    "twitter": "string",
    "leetcode": "string",
    "portfolioLink": "string"
  },
  "skills": {
    "languages": ["string"],
    "frameworks": ["string"],
    "tools": ["string"],
    "domains": ["string"]
  },
  "experience": [
    {
      "id": "uuid",
      "company": "string",
      "role": "string",
      "startDate": "date",
      "endDate": "date",
      "isCurrent": "boolean",
      "description": "string",
      "achievements": ["string"],
      "confidenceScore": "float (0-1)",
      "sources": ["resume", "linkedin"]
    }
  ],
  "education": [
    {
      "id": "uuid",
      "institute": "string",
      "degree": "string",
      "field": "string",
      "graduationYear": "integer",
      "score": "string",
      "sources": ["resume", "linkedin"]
    }
  ],
  "projects": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string",
      "stack": ["string"],
      "repoUrl": "string",
      "liveUrl": "string",
      "images": ["string"],
      "highlights": ["string"],
      "sourceId": "enum(github|resume|manual)",
      "featured": "boolean",
      "visibilityScore": "float (0-1)",
      "metrics": {
        "stars": "integer",
        "forks": "integer",
        "lastCommitDate": "date",
        "hasReadme": "boolean",
        "hasLiveDemo": "boolean",
        "isPinned": "boolean"
      }
    }
  ],
  "certifications": [
    {
      "id": "uuid",
      "title": "string",
      "issuer": "string",
      "issueDate": "date",
      "expiryDate": "date",
      "credentialId": "string",
      "sources": ["resume", "linkedin"]
    }
  ],
  "achievements": [
    {
      "id": "uuid",
      "type": "enum(award|hackathon|rank|other)",
      "title": "string",
      "description": "string",
      "date": "date",
      "sources": ["resume", "linkedin"]
    }
  ],
  "metadata": {
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "lastSyncAt": "timestamp",
    "importSources": ["resume", "github", "linkedin"],
    "dataQualityScore": "float (0-1)"
  }
}
```

### PostgreSQL Tables (Supabase)

#### 1. **users** (already exists, extend if needed)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. **connected_accounts** — Store OAuth tokens and account links
```sql
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider ENUM('github', 'linkedin') NOT NULL,
  provider_id VARCHAR NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  profile_data JSONB,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

CREATE INDEX idx_connected_accounts_user_provider ON connected_accounts(user_id, provider);
```

#### 3. **resume_uploads** — Track uploaded resumes
```sql
CREATE TABLE resume_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR NOT NULL,
  file_path VARCHAR NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR,
  parsed_content JSONB NOT NULL,
  parse_confidence_score FLOAT DEFAULT 0.0,
  parsing_error TEXT,
  parsed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_resume_uploads_user_id ON resume_uploads(user_id);
CREATE INDEX idx_resume_uploads_created_at ON resume_uploads(created_at);
```

#### 4. **normalized_profiles** — Main unified profile
```sql
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
  last_import_sources TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_normalized_profiles_user_id ON normalized_profiles(user_id);
CREATE INDEX idx_normalized_profiles_data_quality ON normalized_profiles(data_quality_score DESC);
```

#### 5. **portfolio_projects** — Auto-ranked projects for portfolio
```sql
CREATE TABLE portfolio_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES normalized_profiles(id) ON DELETE CASCADE,
  project_id VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  stack TEXT[],
  repo_url VARCHAR,
  live_url VARCHAR,
  images VARCHAR[],
  featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  visibility_score FLOAT,
  metrics JSONB,
  source_id ENUM('github', 'resume', 'manual'),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_projects_profile_id ON portfolio_projects(profile_id);
CREATE INDEX idx_portfolio_projects_featured ON portfolio_projects(featured);
CREATE INDEX idx_portfolio_projects_visibility ON portfolio_projects(visibility_score DESC);
```

#### 6. **portfolio_sites** — Published portfolios
```sql
CREATE TABLE portfolio_sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES normalized_profiles(id) ON DELETE CASCADE,
  slug VARCHAR NOT NULL UNIQUE,
  template ENUM('minimal', 'dark', 'creative', 'fresher') DEFAULT 'minimal',
  theme JSONB DEFAULT '{"primaryColor": "#0070f3", "fontFamily": "Inter"}',
  title VARCHAR,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  visibility ENUM('private', 'public', 'unlisted') DEFAULT 'private',
  custom_domain VARCHAR,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  seo_data JSONB DEFAULT '{"title": "", "description": "", "keywords": []}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX idx_portfolio_sites_user_id ON portfolio_sites(user_id);
CREATE INDEX idx_portfolio_sites_slug ON portfolio_sites(slug);
CREATE INDEX idx_portfolio_sites_published ON portfolio_sites(published);
```

#### 7. **short_links** — Branded short share links
```sql
CREATE TABLE short_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  slug VARCHAR NOT NULL UNIQUE,
  full_url VARCHAR NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_short_links_slug ON short_links(slug);
CREATE INDEX idx_short_links_portfolio_site_id ON short_links(portfolio_site_id);
```

#### 8. **portfolio_visits** — Analytics (Phase 3)
```sql
CREATE TABLE portfolio_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_site_id UUID NOT NULL REFERENCES portfolio_sites(id) ON DELETE CASCADE,
  visitor_ip VARCHAR,
  visitor_country VARCHAR,
  referrer VARCHAR,
  device_type ENUM('mobile', 'tablet', 'desktop'),
  session_duration_seconds INTEGER,
  sections_viewed TEXT[],
  visited_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_portfolio_visits_site_id ON portfolio_visits(portfolio_site_id);
CREATE INDEX idx_portfolio_visits_visited_at ON portfolio_visits(visited_at);
```

---

## API Routes & Backend Services

### Base Path: `/api/portfolio`

All portfolio endpoints are scoped under `/api/portfolio` for clean separation from interview, jobs, and other features.

### Auth

All routes require authenticated user (`req.user.id` from JWT token).

---

### Phase 1 Routes

#### **POST `/api/portfolio/profiles/import`** — Parse and merge imported data

Accepts resume upload, GitHub username, LinkedIn URL and creates normalized profile.

**Request**:
```json
{
  "resume": {
    "fileBuffer": "base64",
    "fileName": "resume.pdf"
  },
  "github": {
    "username": "sangita-dev"
  },
  "linkedin": {
    "url": "https://linkedin.com/in/sangita-dev"
  }
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "userId": "uuid",
  "basicInfo": { ... },
  "dataQualityScore": 0.82,
  "importSources": ["resume", "github", "linkedin"]
}
```

**Backend Flow**:
1. Parse resume → JSON structure
2. Fetch GitHub profile (public API, no auth needed for MVP)
3. Scrape or use LinkedIn API (manual URL for MVP)
4. Merge using source priority rules
5. Score quality and confidence
6. Save to `normalized_profiles` table
7. Auto-rank projects
8. Return merged profile

---

#### **GET `/api/portfolio/profiles/:id`** — Fetch normalized profile

**Response** (200):
```json
{
  "id": "uuid",
  "basicInfo": { ... },
  "experience": [ ... ],
  "projects": [ ... ]
}
```

---

#### **PUT `/api/portfolio/profiles/:id`** — Edit profile fields

Allows user to manually edit name, summary, skills, hide sections, reorder projects.

**Request**:
```json
{
  "basicInfo": { "fullName": "Sangita Dev", "summary": "Full-stack engineer..." },
  "projects": [
    { "id": "proj-1", "featured": true, "displayOrder": 1 },
    { "id": "proj-2", "featured": false }
  ],
  "hideSections": ["achievements", "certifications"]
}
```

**Response** (200): Updated profile

---

#### **POST `/api/portfolio/sites`** — Create portfolio (publish)

Generates a portfolio page from template and publishes to shareable URL.

**Request**:
```json
{
  "profileId": "uuid",
  "slug": "sangita",
  "template": "minimal",
  "theme": {
    "primaryColor": "#0070f3",
    "fontFamily": "Inter"
  }
}
```

**Response** (201):
```json
{
  "id": "uuid",
  "slug": "sangita",
  "publishedUrl": "https://yourdomain.com/u/sangita",
  "shortUrl": "https://link.yourdomain.com/abc123",
  "template": "minimal",
  "published": true
}
```

**Backend Flow**:
1. Validate slug uniqueness
2. Render template with profile data
3. Store rendered HTML/static site
4. Publish to CDN or static host
5. Create short link (auto-generated slug)
6. Return URLs

---

#### **GET `/api/portfolio/sites/:id`** — Fetch portfolio metadata

**Response** (200):
```json
{
  "id": "uuid",
  "publishedUrl": "string",
  "shortUrl": "string",
  "template": "string",
  "published": boolean,
  "publishedAt": "timestamp"
}
```

---

#### **DELETE `/api/portfolio/sites/:id`** — Unpublish portfolio

**Response** (204): No content

---

#### **GET `/api/portfolio/settings`** — User's portfolio settings

**Response** (200):
```json
{
  "defaultTemplate": "minimal",
  "defaultTheme": { ... },
  "portfolioCount": 2,
  "totalProjectsAvailable": 15
}
```

---

### Phase 2 Routes (AI Rewriting, Theme Customization)

#### **POST `/api/portfolio/profiles/:id/rewrite-summary`** — AI-powered bio rewriting

Uses Azure OpenAI to rewrite bio/summary based on experience.

**Request**:
```json
{
  "targetTone": "professional|creative|minimal",
  "length": "short|medium|long"
}
```

**Response** (200):
```json
{
  "originalSummary": "string",
  "rewrittenSummary": "string",
  "options": ["string"]
}
```

---

#### **PUT `/api/portfolio/sites/:id/theme`** — Update theme/colors

**Request**:
```json
{
  "primaryColor": "#0070f3",
  "secondaryColor": "#ff0080",
  "fontFamily": "Poppins",
  "accentColor": "#fbbf24"
}
```

**Response** (200): Updated portfolio

---

### Phase 3 Routes (Sync, Analytics, Custom Domain)

#### **POST `/api/portfolio/profiles/:id/sync-github`** — Update from GitHub (one-click)

Re-fetches GitHub repos and updates project list.

**Response** (200):
```json
{
  "updatedAt": "timestamp",
  "newProjects": 3,
  "removedProjects": 1
}
```

---

#### **GET `/api/portfolio/sites/:id/analytics`** — View portfolio visits

**Response** (200):
```json
{
  "totalVisits": 42,
  "uniqueVisitors": 28,
  "topReferrers": ["linkedin.com", "twitter.com"],
  "lastVisitedAt": "timestamp",
  "visitsByDay": [...]
}
```

---

#### **POST `/api/portfolio/sites/:id/custom-domain`** — Set custom domain

**Request**:
```json
{
  "domain": "sangita.com"
}
```

**Response** (200):
```json
{
  "domain": "sangita.com",
  "status": "pending_verification",
  "dnsRecords": [
    {
      "type": "CNAME",
      "name": "www",
      "value": "portfolios.yourdomain.com"
    }
  ]
}
```

---

## Frontend Components & Flows

### Main Flow: Portfolio Creation Wizard

```
Home/Dashboard
  └─ "Create Portfolio" Button
      ├─ Step 1: Import Data (Resume Upload + GitHub + LinkedIn)
      ├─ Step 2: Review & Edit
      ├─ Step 3: Select Template & Theme
      └─ Step 4: Publish & Share
```

### Components (Vite React)

```
src/pages/
  ├─ PortfolioCreator.jsx           (Wizard orchestrator)
  ├─ PortfolioPreview.jsx           (Live preview)
  ├─ PortfolioGallery.jsx           (My portfolios list)
  └─ PublicPortfolioPage.jsx        (Published site)

src/components/portfolio/
  ├─ ImportStep.jsx                 (Resume + GitHub + LinkedIn)
  ├─ ReviewStep.jsx                 (Edit normalized data)
  ├─ TemplateSelector.jsx           (Choose template)
  ├─ ThemeCustomizer.jsx            (Colors, fonts)
  ├─ ProjectRanker.jsx              (Reorder projects)
  ├─ PublishStep.jsx                (Final publish)
  └─ ShareDialog.jsx                (QR + short URL)

src/hooks/
  ├─ usePortfolioUpload.js          (Resume parsing)
  ├─ useGitHubFetch.js              (GitHub repo fetching)
  ├─ useLinkedInImport.js           (LinkedIn profile)
  ├─ useProfileMerge.js             (Data merging)
  └─ usePortfolioPublish.js         (Publish logic)
```

### Step 1: Import Data

```jsx
// ImportStep.jsx

const ImportStep = ({ onNext }) => {
  const [resume, setResume] = useState(null);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portfolio/profiles/import', {
        method: 'POST',
        body: JSON.stringify({
          resume: resume ? { fileBuffer: resume, fileName: resume.name } : null,
          github: github ? { username: github } : null,
          linkedin: linkedin ? { url: linkedin } : null
        })
      });
      const profile = await response.json();
      onNext(profile);
    } catch (err) {
      setError('Import failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Import Your Career Data</h2>
      <input 
        type="file" 
        accept=".pdf,.doc,.docx"
        onChange={(e) => setResume(e.target.files[0])}
      />
      <input 
        type="text" 
        placeholder="GitHub username"
        value={github}
        onChange={(e) => setGithub(e.target.value)}
      />
      <input 
        type="url" 
        placeholder="LinkedIn profile URL"
        value={linkedin}
        onChange={(e) => setLinkedin(e.target.value)}
      />
      <button onClick={handleImport} disabled={loading}>
        {loading ? 'Importing...' : 'Import'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
};
```

### Step 2: Review & Edit

```jsx
// ReviewStep.jsx

const ReviewStep = ({ profile, onNext }) => {
  const [edited, setEdited] = useState(profile);

  const updateBasicInfo = (field, value) => {
    setEdited({
      ...edited,
      basicInfo: { ...edited.basicInfo, [field]: value }
    });
  };

  const toggleProjectFeatured = (projectId) => {
    setEdited({
      ...edited,
      projects: edited.projects.map(p =>
        p.id === projectId ? { ...p, featured: !p.featured } : p
      )
    });
  };

  return (
    <div>
      <h2>Review & Edit</h2>
      <input
        type="text"
        value={edited.basicInfo.fullName}
        onChange={(e) => updateBasicInfo('fullName', e.target.value)}
      />
      <textarea
        value={edited.basicInfo.summary}
        onChange={(e) => updateBasicInfo('summary', e.target.value)}
      />
      <div>
        <h3>Featured Projects</h3>
        {edited.projects.map(p => (
          <div key={p.id}>
            <input
              type="checkbox"
              checked={p.featured}
              onChange={() => toggleProjectFeatured(p.id)}
            />
            {p.title}
          </div>
        ))}
      </div>
      <button onClick={() => onNext(edited)}>Next</button>
    </div>
  );
};
```

### Step 3 & 4: Template Selection & Publish

```jsx
// TemplateSelector.jsx

const TemplateSelector = ({ profile, onPublish }) => {
  const [template, setTemplate] = useState('minimal');
  const [theme, setTheme] = useState({
    primaryColor: '#0070f3',
    fontFamily: 'Inter'
  });

  const handlePublish = async () => {
    const response = await fetch('/api/portfolio/sites', {
      method: 'POST',
      body: JSON.stringify({
        profileId: profile.id,
        slug: profile.basicInfo.fullName.toLowerCase().replace(/\s+/g, '-'),
        template,
        theme
      })
    });
    const site = await response.json();
    onPublish(site);
  };

  return (
    <div>
      <h2>Choose Template & Theme</h2>
      {/* Template previews */}
      {/* Theme customizer */}
      <button onClick={handlePublish}>Publish</button>
    </div>
  );
};
```

---

## Service Architecture

### Backend Services (Express.js)

#### 1. **ResumeParserService** (Phase 1)

Parses PDF/DOC resumes into structured JSON.

**File**: `backend/services/resumeParserService.js`

```javascript
class ResumeParserService {
  async parseResume(fileBuffer, fileName) {
    // Extract text from PDF/DOC
    const text = await extractText(fileBuffer, fileName);
    
    // Use regex + NLP to extract sections
    const sections = this.extractSections(text);
    
    return {
      name: sections.contact.name,
      email: sections.contact.email,
      phone: sections.contact.phone,
      experience: sections.experience.map(exp => ({
        company: exp.company,
        role: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate,
        achievements: exp.bullets
      })),
      education: sections.education.map(edu => ({
        institute: edu.school,
        degree: edu.degree,
        field: edu.field,
        graduationYear: edu.year
      })),
      skills: sections.skills,
      certifications: sections.certifications || [],
      confidenceScore: this.calculateConfidence(sections)
    };
  }

  extractSections(text) {
    // Regex patterns for each section
    // Return structured data
  }

  calculateConfidence(sections) {
    // Score completeness: contact info + experience + education + skills
    return (sections.contact.completeness + sections.experience.count + ...) / 4;
  }
}

module.exports = new ResumeParserService();
```

**Dependencies**: `pdfjs-dist`, `docx`, `natural` (NLP)

---

#### 2. **GitHubService** (Phase 1)

Fetches GitHub profile and repositories.

**File**: `backend/services/githubService.js`

```javascript
class GitHubService {
  async fetchProfile(username) {
    const profile = await fetch(`https://api.github.com/users/${username}`);
    return {
      name: profile.name,
      bio: profile.bio,
      location: profile.location,
      websiteUrl: profile.blog,
      followers: profile.followers
    };
  }

  async fetchRepositories(username) {
    const repos = await fetch(
      `https://api.github.com/users/${username}/repos?sort=stars&per_page=100`
    );
    
    return Promise.all(
      repos.map(async (repo) => {
        const readme = await this.fetchReadme(username, repo.name);
        return {
          id: repo.id,
          name: repo.name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          language: repo.language,
          lastCommitDate: repo.pushed_at,
          hasReadme: !!readme,
          readme: readme,
          isPinned: false // Check via GitHub GraphQL if needed
        };
      })
    );
  }

  async fetchReadme(username, repoName) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${username}/${repoName}/readme`
      );
      return response.text();
    } catch {
      return null;
    }
  }

  scoreRepository(repo) {
    // Ranking formula
    const score =
      (repo.stars / 1000) * 0.4 +          // Star weight
      (repo.forks / 100) * 0.1 +            // Fork weight
      (repo.hasReadme ? 0.2 : 0) +          // README bonus
      (this.isRecent(repo.lastCommitDate) ? 0.2 : 0) + // Recency bonus
      (repo.description ? 0.1 : 0);        // Description bonus
    
    return Math.min(score, 1.0);
  }

  isRecent(date) {
    const daysSinceCommit = (Date.now() - new Date(date)) / (1000 * 60 * 60 * 24);
    return daysSinceCommit < 90;
  }
}

module.exports = new GitHubService();
```

---

#### 3. **LinkedInService** (Phase 1 MVP: Manual URL, Phase 2: OAuth)

**File**: `backend/services/linkedinService.js`

For MVP, accept LinkedIn URL and scrape public profile (or user copy-paste).
Phase 2: Add OAuth for automatic import.

```javascript
class LinkedInService {
  async importFromUrl(linkedinUrl) {
    // MVP: User provides URL, we scrape publicly available data
    // Or: User manually copy-paste key info
    // Phase 2: Add LinkedIn OAuth
    
    return {
      headline: "string",
      summary: "string",
      experience: [ /* roles */ ],
      education: [ /* degrees */ ]
    };
  }
}

module.exports = new LinkedInService();
```

---

#### 4. **ProfileNormalizerService** (Phase 1)

Merges resume, GitHub, and LinkedIn into one unified profile.

**File**: `backend/services/profileNormalizerService.js`

```javascript
class ProfileNormalizerService {
  mergeProfiles(resumeData, githubData, linkedinData) {
    return {
      basicInfo: this.mergeBasicInfo(resumeData, githubData, linkedinData),
      contacts: resumeData.contacts, // Resume first
      socials: this.mergeSocials(resumeData, githubData, linkedinData),
      skills: this.mergeSkills(resumeData, githubData, linkedinData),
      experience: this.mergeExperience(resumeData, linkedinData),
      education: this.mergeEducation(resumeData, linkedinData),
      projects: this.mapGitHubProjectsToPortfolio(githubData),
      certifications: resumeData.certifications || [],
      achievements: linkedinData.achievements || []
    };
  }

  mergeBasicInfo(resume, github, linkedin) {
    return {
      fullName: resume.name || linkedin.name,
      headline: linkedin.headline || resume.role || '',
      summary: linkedin.summary || resume.summary || '',
      photo: github.avatar_url || resume.photo,
      location: resume.location || linkedin.location
    };
  }

  mergeSkills(resume, github, linkedin) {
    const skills = new Map();

    // Resume skills: high confidence
    (resume.skills || []).forEach(s => {
      skills.set(s, (skills.get(s) || 0) + 2);
    });

    // GitHub language: medium confidence
    (github.topLanguages || []).forEach(lang => {
      skills.set(lang, (skills.get(lang) || 0) + 1);
    });

    // LinkedIn skills: medium confidence
    (linkedin.skills || []).forEach(s => {
      skills.set(s, (skills.get(s) || 0) + 1);
    });

    // Sort by confidence score
    return Array.from(skills.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([skill, score]) => ({
        name: skill,
        confidenceScore: Math.min(score / 4, 1.0)
      }));
  }

  mergeExperience(resume, linkedin) {
    const combined = [
      ...(resume.experience || []),
      ...(linkedin.experience || [])
    ];

    // Deduplicate by company + role + date
    const deduped = new Map();
    combined.forEach(exp => {
      const key = `${exp.company}|${exp.role}|${exp.startDate}`;
      if (!deduped.has(key)) {
        deduped.set(key, { ...exp, sources: [exp.source] });
      } else {
        const existing = deduped.get(key);
        existing.sources.push(exp.source);
      }
    });

    return Array.from(deduped.values())
      .map(exp => ({
        ...exp,
        confidenceScore: exp.sources.length > 1 ? 1.0 : 0.8
      }))
      .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  }

  mapGitHubProjectsToPortfolio(githubData) {
    return (githubData.repositories || []).map(repo => ({
      title: repo.name,
      description: repo.description,
      stack: [repo.language].filter(Boolean),
      repoUrl: repo.url,
      liveUrl: this.extractLiveUrl(repo.description, repo.readme),
      highlights: this.extractHighlights(repo.readme),
      sourceId: 'github',
      featured: false,
      visibilityScore: githubService.scoreRepository(repo),
      metrics: {
        stars: repo.stars,
        forks: repo.forks,
        lastCommitDate: repo.lastCommitDate,
        hasReadme: repo.hasReadme,
        hasLiveDemo: !!this.extractLiveUrl(repo.description, repo.readme),
        isPinned: repo.isPinned
      }
    }));
  }

  extractLiveUrl(description, readme) {
    // Look for http/https links in description or README
    const urlRegex = /https?:\/\/[^\s]+/g;
    const match = (description + ' ' + (readme || '')).match(urlRegex);
    return match ? match[0] : null;
  }

  extractHighlights(readme) {
    // Extract key features from README
    // Return first 3-5 bullet points
    if (!readme) return [];
    const lines = readme.split('\n');
    return lines
      .filter(l => l.startsWith('-') || l.startsWith('*'))
      .slice(0, 5)
      .map(l => l.replace(/^[-*]\s/, ''));
  }
}

module.exports = new ProfileNormalizerService();
```

---

#### 5. **PortfolioRendererService** (Phase 1)

Generates HTML from template + normalized profile.

**File**: `backend/services/portfolioRendererService.js`

```javascript
class PortfolioRendererService {
  renderPortfolio(profile, template, theme) {
    const templates = {
      minimal: require('../templates/minimal.ejs'),
      dark: require('../templates/dark.ejs'),
      creative: require('../templates/creative.ejs'),
      fresher: require('../templates/fresher.ejs')
    };

    const tmpl = templates[template];
    const html = ejs.render(tmpl, {
      profile,
      theme,
      publishedAt: new Date().toISOString()
    });

    return html;
  }
}

module.exports = new PortfolioRendererService();
```

**Template Example** (`backend/templates/minimal.ejs`):

```ejs
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title><%= profile.basicInfo.fullName %> - Portfolio</title>
  <style>
    :root {
      --primary: <%= theme.primaryColor %>;
      --font: <%= theme.fontFamily %>;
    }
    body { font-family: var(--font); color: #333; }
    .hero { background: var(--primary); color: white; padding: 60px 20px; }
    .hero h1 { margin: 0; }
    .hero p { font-size: 1.2em; margin: 10px 0 0; }
  </style>
</head>
<body>
  <section class="hero">
    <h1><%= profile.basicInfo.fullName %></h1>
    <p><%= profile.basicInfo.headline %></p>
  </section>

  <section class="about">
    <h2>About</h2>
    <p><%= profile.basicInfo.summary %></p>
  </section>

  <section class="skills">
    <h2>Skills</h2>
    <div class="skills-grid">
      <% profile.skills.languages.forEach(skill => { %>
        <span class="skill-badge"><%= skill %></span>
      <% }); %>
    </div>
  </section>

  <section class="experience">
    <h2>Experience</h2>
    <% profile.experience.forEach(exp => { %>
      <div class="experience-item">
        <h3><%= exp.role %> at <%= exp.company %></h3>
        <p class="date"><%= exp.startDate %> - <%= exp.endDate || 'Present' %></p>
        <ul>
          <% exp.achievements.forEach(achievement => { %>
            <li><%= achievement %></li>
          <% }); %>
        </ul>
      </div>
    <% }); %>
  </section>

  <section class="projects">
    <h2>Featured Projects</h2>
    <% profile.projects.filter(p => p.featured).forEach(project => { %>
      <div class="project-card">
        <h3><%= project.title %></h3>
        <p><%= project.description %></p>
        <div class="tags">
          <% project.stack.forEach(tech => { %>
            <span><%= tech %></span>
          <% }); %>
        </div>
        <% if (project.repoUrl) { %>
          <a href="<%= project.repoUrl %>">View Source</a>
        <% } %>
        <% if (project.liveUrl) { %>
          <a href="<%= project.liveUrl %>">Live Demo</a>
        <% } %>
      </div>
    <% }); %>
  </section>

  <section class="contact">
    <h2>Get in Touch</h2>
    <p><a href="mailto:<%= profile.contacts.email %>"><%= profile.contacts.email %></a></p>
    <% if (profile.socials.github) { %>
      <a href="https://github.com/<%= profile.socials.github %>">GitHub</a>
    <% } %>
    <% if (profile.socials.linkedin) { %>
      <a href="<%= profile.socials.linkedin %>">LinkedIn</a>
    <% } %>
  </section>
</body>
</html>
```

---

#### 6. **PublishService** (Phase 1)

Publishes portfolio to static hosting or CDN.

**File**: `backend/services/publishService.js`

```javascript
class PublishService {
  async publishPortfolio(html, slug) {
    // Option 1: Store in Supabase Storage and serve via CDN
    const fileName = `portfolios/${slug}.html`;
    const { data, error } = await supabase
      .storage
      .from('portfolio-sites')
      .upload(fileName, html, {
        contentType: 'text/html',
        upsert: true
      });

    if (error) throw error;

    // Option 2: Store in Azure Blob Storage
    // OR: Static site generator to Vercel

    return {
      url: `https://yourdomain.com/u/${slug}`,
      publishedAt: new Date().toISOString()
    };
  }
}

module.exports = new PublishService();
```

---

#### 7. **ShortLinkService** (Phase 1)

Generates short branded links.

**File**: `backend/services/shortLinkService.js`

```javascript
class ShortLinkService {
  generateSlug(length = 6) {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  async createShortLink(portfolioSiteId, fullUrl) {
    const slug = this.generateSlug();
    
    const { data, error } = await supabase
      .from('short_links')
      .insert({
        portfolio_site_id: portfolioSiteId,
        slug,
        full_url: fullUrl
      });

    if (error) throw error;

    return {
      slug,
      shortUrl: `https://link.yourdomain.com/${slug}`,
      fullUrl
    };
  }

  async resolveShortLink(slug) {
    const { data, error } = await supabase
      .from('short_links')
      .select('full_url')
      .eq('slug', slug)
      .single();

    if (error) throw error;
    return data.full_url;
  }
}

module.exports = new ShortLinkService();
```

---

## Domain & Sharing Strategy

### Primary Domain Setup

```
yourdomain.com                  → Main marketing site
app.yourdomain.com              → App dashboard (where users manage portfolios)
portfolio.yourdomain.com/u/{username}  → Public portfolio (alternative: yourdomain.com/u/{username})
link.yourdomain.com/{slug}      → Short share link (301 redirect)
api.yourdomain.com              → Backend API (optional, if frontend and backend have different domains)
```

### Nginx Configuration (for Vercel + Backend)

```nginx
# Main marketing site
upstream marketing_site {
  server marketing.vercel.app;
}

# App (frontend)
upstream app {
  server preploop-app.vercel.app;
}

# Backend
upstream backend {
  server backend.yourdomain.com:3000;
}

# Short link redirects
upstream short_link_service {
  server backend.yourdomain.com:3000;
}

server {
  listen 80;
  server_name yourdomain.com;

  # App subdomain
  location ~ ^/app(.*) {
    proxy_pass http://app$1;
  }

  # Portfolio public pages
  location ~ ^/u/(.+)$ {
    # Fetch from Supabase Storage or static host
    proxy_pass https://storage.supabase.com/portfolio-sites/$1.html;
  }

  # API
  location ~ ^/api(.*) {
    proxy_pass http://backend$1;
  }

  # Everything else → marketing site
  location / {
    proxy_pass http://marketing_site;
  }
}

server {
  listen 80;
  server_name link.yourdomain.com;

  # Redirect short links to full URL
  location ~ ^/(.+)$ {
    proxy_pass http://short_link_service/api/portfolio/short-links/$1/resolve;
    # Expect JSON with 'url' field
    # Return 301 redirect to that URL
  }
}
```

### Public Portfolio URL Patterns

**Pattern 1** (Recommended for MVP):
```
yourdomain.com/u/sangita
yourdomain.com/u/priya-dev
yourdomain.com/u/dev-john
```

**Pattern 2** (Alternative):
```
portfolio.yourdomain.com/sangita
sangita.portfolio.yourdomain.com
```

**Short Alias** (All options):
```
link.yourdomain.com/abc123  → https://yourdomain.com/u/sangita
link.yourdomain.com/sangita → https://yourdomain.com/u/sangita
```

---

## Implementation Roadmap

### Phase 1: MVP (6–8 weeks)

**Goal**: "Upload resume, connect GitHub, and LinkedIn URL → published portfolio in 60 seconds"

#### Week 1–2: Database & Core Services

- [ ] Create database schema (Supabase migrations)
- [ ] Implement `ResumeParserService` (PDF/DOC extraction)
- [ ] Implement `GitHubService` (public repo fetching + scoring)
- [ ] Implement `LinkedInService` (URL parsing / manual import)
- [ ] Implement `ProfileNormalizerService` (merge logic)

#### Week 3–4: Backend API

- [ ] POST `/api/portfolio/profiles/import` — Parse and merge
- [ ] GET `/api/portfolio/profiles/:id` — Fetch profile
- [ ] PUT `/api/portfolio/profiles/:id` — Edit profile
- [ ] POST `/api/portfolio/sites` — Create + publish portfolio
- [ ] GET `/api/portfolio/sites/:id` — Fetch portfolio metadata
- [ ] Implement template rendering with EJS

#### Week 5–6: Frontend (React/Vite)

- [ ] Build `ImportStep` component (resume upload + GitHub + LinkedIn fields)
- [ ] Build `ReviewStep` component (edit data, select projects)
- [ ] Build `TemplateSelector` component (minimal template + basic theme picker)
- [ ] Build `PublishStep` component (final confirm)
- [ ] Build `PortfolioCreator` wizard (orchestrate all steps)

#### Week 7–8: Publishing & QA

- [ ] Implement `PublishService` (static storage + CDN)
- [ ] Implement `ShortLinkService` (branded short links)
- [ ] Set up domain routing (yourdomain.com/u/{slug})
- [ ] Create "My Portfolios" list page
- [ ] QA and smoke testing
- [ ] Deploy to production

**Phase 1 Deliverables**:
- Fully functional portfolio generator
- Public portfolios at yourdomain.com/u/{slug}
- Short share links at link.yourdomain.com/{slug}
- Basic editing + template selection
- Email notification when published

---

### Phase 2: Auto-Ranking & AI Rewriting (4–6 weeks)

**Goal**: Add intelligent project selection, AI bio rewriting, and theme customization.

- [ ] **GitHub Repo Scoring**: Auto-select top 3–5 projects based on visibility score
- [ ] **AI Summary Rewriting**: Use Azure OpenAI to rewrite bio/summary
- [ ] **Theme Customization**: Advanced color picker, font selection
- [ ] **More Templates**: Add dark, creative, and fresher templates
- [ ] **Project Reordering**: Drag-to-reorder projects
- [ ] **Section Visibility**: Hide/show sections (achievements, certifications, etc.)
- [ ] **AI-Powered Project Descriptions**: Improve auto-generated descriptions

**Routes**:
- POST `/api/portfolio/profiles/:id/rewrite-summary`
- PUT `/api/portfolio/sites/:id/theme`

**Frontend**:
- Add AI rewrite UI with tone + length options
- Theme customizer with live preview

---

### Phase 3: Advanced Features (6–8 weeks)

**Goal**: One-click GitHub sync, analytics, QR codes, PDF export, custom domains.

- [ ] **GitHub Sync**: One-click "Update from GitHub" button
- [ ] **Portfolio Analytics**: View visits, referrers, device types
- [ ] **QR Code**: Generate shareable QR code
- [ ] **PDF Export**: Download portfolio as PDF
- [ ] **Custom Domain Support**: Premium feature for custom domains (sangita.com)
- [ ] **Email Integration**: Notify portfolio visitors they can connect on LinkedIn
- [ ] **LinkedIn OAuth**: Automatic LinkedIn profile import (instead of manual URL)
- [ ] **Version History**: Ability to revert to previous portfolio versions

**Routes**:
- POST `/api/portfolio/profiles/:id/sync-github`
- GET `/api/portfolio/sites/:id/analytics`
- POST `/api/portfolio/sites/:id/custom-domain`
- GET `/api/portfolio/sites/:id/export-pdf`
- POST `/api/portfolio/sites/:id/versions` (rollback)

---

## Security & Privacy

### Authentication & Authorization

- **All portfolio endpoints** require JWT authentication (`req.user.id` from middleware)
- **Public portfolio pages** are readable by anyone (unless set to `private`)
- **Portfolio editing** is restricted to owner only
- **Resume uploads** are stored securely in Supabase Storage with row-level security (RLS)

### Data Protection

```sql
-- Row-Level Security: Users can only access their own portfolios
CREATE POLICY "Users can access their own profiles"
  ON normalized_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON normalized_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Resume uploads: Users can only view/delete their own
CREATE POLICY "Users can access their own resume uploads"
  ON resume_uploads
  FOR SELECT USING (auth.uid() = user_id);
```

### Privacy Levels

```
Private     → Only owner can view (auth required)
Unlisted    → Anyone with URL can view (no indexing)
Public      → Indexed, searchable, visible to all
```

---

## Performance & Scalability

### Caching Strategy

- **GitHub repos** cached for 24 hours (set TTL in Redis or Supabase)
- **Normalized profiles** cached for 1 hour after edit
- **Rendered portfolios** (HTML) stored in CDN with 7-day TTL

### Database Optimization

- Indexes on `user_id`, `profile_id`, `featured`, `visibility_score`
- Periodic cleanup of old resume uploads (>6 months)
- Archive analytics data monthly

### Frontend Performance

- Lazy-load portfolio templates
- Code-split wizard steps
- Service worker for offline support

### Scaling Considerations

- **Supabase**: Auto-scales PostgreSQL
- **Storage**: Use Supabase Storage or Azure Blob Storage (CDN-backed)
- **Short links**: Redis cache for URL resolution
- **Portfolio rendering**: Pre-render static HTMLs on publish (avoid on-the-fly)

---

## Next Steps

1. **Database Setup** → Create Supabase migrations for all tables
2. **Resume Parser** → Test with real resumes (use `pdfjs-dist` + regex)
3. **GitHub Integration** → Implement repo fetching and scoring
4. **Profile Merger** → Build deduplication and ranking logic
5. **Frontend Wizard** → Create step-by-step component flow
6. **Template System** → Design and code 1 (minimal) template for MVP
7. **Publishing** → Integrate with static storage (Supabase, Azure, Vercel)
8. **Testing** → Write unit tests for each service + integration tests for flows

---

## Appendix: Code File Structure

```
backend/
├── services/
│   ├── resumeParserService.js
│   ├── githubService.js
│   ├── linkedinService.js
│   ├── profileNormalizerService.js
│   ├── portfolioRendererService.js
│   ├── publishService.js
│   └── shortLinkService.js
├── routes/
│   └── portfolio.js           (POST /import, GET /:id, PUT /:id, POST /sites, etc.)
├── middleware/
│   └── portfolioAuth.js       (JWT + user check)
└── templates/
    ├── minimal.ejs
    ├── dark.ejs
    ├── creative.ejs
    └── fresher.ejs

frontend/
├── pages/
│   ├── PortfolioCreator.jsx
│   ├── PortfolioGallery.jsx
│   ├── PortfolioPreview.jsx
│   └── PublicPortfolioPage.jsx
├── components/
│   └── portfolio/
│       ├── ImportStep.jsx
│       ├── ReviewStep.jsx
│       ├── TemplateSelector.jsx
│       ├── ThemeCustomizer.jsx
│       ├── ProjectRanker.jsx
│       ├── PublishStep.jsx
│       └── ShareDialog.jsx
└── hooks/
    ├── usePortfolioUpload.js
    ├── useGitHubFetch.js
    ├── useLinkedInImport.js
    ├── useProfileMerge.js
    └── usePortfolioPublish.js

docs/
└── PORTFOLIO_GENERATOR_ARCHITECTURE.md (this file)
```

---

**Version**: 1.0  
**Last Updated**: May 14, 2026  
**Status**: Ready for Phase 1 Implementation
