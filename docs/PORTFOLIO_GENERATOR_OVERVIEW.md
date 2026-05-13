# Portfolio Generator — Complete Feature Overview

**Status**: ✅ Architecture Complete & Ready for Implementation  
**Created**: May 14, 2026  
**Target Launch**: Phase 1 in 6-8 weeks  
**Type**: User-facing feature (high impact, viral potential)

---

## The Opportunity

A portfolio generator is a **strong differentiator** for Preploop:

- **Job seekers** need a professional online presence (resume alone ≠ memorable)
- **GitHub developers** should showcase projects, not dump all repos
- **Preploop users** already have interview prep → perfect fit for portfolio feature
- **Sharing potential** = viral growth (LinkedIn, Discord, Twitter)
- **Upsell path** = custom domains, analytics, premium templates (Phase 3)

**MVP Promise**: "Upload resume, connect GitHub and LinkedIn → get a shareable portfolio in 60 seconds"

---

## Three-Phase Roadmap

```
Phase 1 (MVP) ────────────────────┐
"Core Portfolio Generator"         │
6-8 weeks, high impact             │
                                   │
├─ Resume upload                   │
├─ GitHub profile import           │ 
├─ LinkedIn URL field              │
├─ Profile merging                 │  → Launch
├─ 1 template (minimal)            │     "Portfolio in 60 seconds"
├─ Publish to yourdomain.com/u/{x} │
├─ Short branded links             │
└─ Basic editing                   │
                                   ↓
Phase 2 (Pro Features) ────────────┐
"Smart Portfolio"                  │
4-6 weeks after Phase 1            │
                                   │
├─ GitHub repo auto-ranking        │
├─ AI bio rewriting                │  → "Made for you"
├─ 4 templates (minimal, dark,     │
│  creative, fresher)              │
├─ Advanced theme customizer       │
├─ Project reordering              │
├─ Section visibility toggle       │
└─ Resume redesign AI              │
                                   ↓
Phase 3 (Premium) ──────────────┐
"Enterprise Portfolio"          │
6-8 weeks after Phase 2         │
                                │
├─ GitHub sync (one-click)      │
├─ Portfolio analytics          │  → "Grow your reach"
├─ QR code generation           │
├─ PDF export                   │
├─ Custom domain support        │
├─ Version history              │
├─ LinkedIn OAuth               │
└─ Email notifications          │
                                ↓
```

---

## Data Flow (Bird's Eye View)

```
┌─────────────────┐
│   User Input    │
├─────────────────┤
│ • Resume (PDF)  │
│ • GitHub user   │
│ • LinkedIn URL  │
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────────┐
│       Parsing & Extraction Layer        │
├─────────────────────────────────────────┤
│ ResumeParser:  → name, email, exp, edu │
│ GitHubService: → repos, stars, lang    │
│ LinkedInService: → headline, summary   │
└────────┬────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│   Profile Normalizer (Merge Layer)      │
├──────────────────────────────────────────┤
│ • Deduplicate (same company/role/date)  │
│ • Apply source priority rules           │
│ • Calculate confidence scores           │
│ • Auto-rank projects (visibility score) │
│ • Fill missing fields                   │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│    Unified Profile (PostgreSQL)         │
├──────────────────────────────────────────┤
│ {                                        │
│   basicInfo: { name, headline, ... },   │
│   skills: [ language, framework, ... ], │
│   experience: [ {...}, {...} ],         │
│   projects: [ {...}, {...}, {...} ],    │
│   ...                                    │
│ }                                        │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│   User Reviews & Edits                  │
├──────────────────────────────────────────┤
│ • Change headline/summary               │
│ • Mark projects as featured             │
│ • Reorder sections                      │
│ • Select template + colors              │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│  Portfolio Renderer (Template Engine)   │
├──────────────────────────────────────────┤
│ EJS Template + Profile Data              │
│ → Renders HTML (hero, about, projects)  │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│  Publish Service (Storage + CDN)        │
├──────────────────────────────────────────┤
│ • Upload HTML to Supabase Storage        │
│ • Set CDN headers                        │
│ • Generate short link                   │
│ • Return URLs                           │
└────────┬─────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────┐
│  Public Portfolio Live                  │
├──────────────────────────────────────────┤
│ yourdomain.com/u/sangita                │
│ link.yourdomain.com/abc123 (short URL)  │
│ (publicly shareable on LinkedIn, etc.)  │
└──────────────────────────────────────────┘
```

---

## User Flow (UX)

```
Landing Page / Dashboard
         │
         ↓
┌─────────────────────────────────────┐
│   "Create Portfolio" Button          │
└────────────┬────────────────────────┘
             │
             ↓
    ┌────────────────────┐
    │  STEP 1: IMPORT    │
    │   (Resume Upload)  │ ← Resume file
    │  (GitHub Username) │ ← sangita-dev
    │  (LinkedIn URL)    │ ← linkedin.com/in/sangita
    │                    │
    │  [Import Button]   │
    └────────┬───────────┘
             │
             ↓
         Loading...
      (Parse, fetch, merge)
             │
             ↓
    ┌─────────────────────┐
    │  STEP 2: REVIEW     │
    │                     │
    │  ✏️ Name: Sangita   │
    │  ✏️ Headline:       │
    │  ✏️ Summary:        │
    │                     │
    │  Skills: [Python] [JS]
    │  Experience: [3 items]
    │  Projects: [7 items]
    │                     │
    │  [Next]             │
    └────────┬────────────┘
             │
             ↓
    ┌──────────────────────┐
    │ STEP 3: TEMPLATE     │
    │ & THEME              │
    │                      │
    │ Template: Minimal    │
    │ (preview below)      │
    │                      │
    │ Colors: [███ #0070f3]
    │ Font: [Dropdown]     │
    │                      │
    │ [Next]               │
    └────────┬─────────────┘
             │
             ↓
    ┌───────────────────────┐
    │ STEP 4: PUBLISH       │
    │                       │
    │ Slug: sangita         │
    │ Visibility: Public    │
    │                       │
    │ Your portfolio will   │
    │ be at:                │
    │ yourdomain.com/u/...  │
    │                       │
    │ [Publish Button]      │
    └────────┬──────────────┘
             │
             ↓
         Uploading...
             │
             ↓
    ┌──────────────────────────┐
    │ SUCCESS! 🎉              │
    │                          │
    │ Portfolio URL:           │
    │ https://yourdomain.com/  │
    │ u/sangita                │
    │ [Copy] [QR Code]         │
    │                          │
    │ Short Link:              │
    │ https://link.yourdomain  │
    │ .com/abc123              │
    │ [Copy]                   │
    │                          │
    │ [Edit] [View Live]       │
    │ [Share on LinkedIn]      │
    └──────────────────────────┘
```

---

## Key Numbers & Targets

### Phase 1 MVP

| Metric | Target | Notes |
|--------|--------|-------|
| **Time to Portfolio** | 60 seconds | Parse + merge + render + publish |
| **Resume Parse Accuracy** | 95%+ | Extraction of key fields |
| **GitHub Repo Ranking** | Top 3-5 auto-selected | Based on visibility formula |
| **API Response Time** | <1 second | 95th percentile |
| **Page Load Time** | <2 seconds | Public portfolio |
| **User Satisfaction** | 4.5/5 | Post-launch survey |
| **Adoption Rate** | 10% of users | Create at least 1 portfolio |
| **Short Link Usage** | 30% CTR | Of shared links |

### Business Impact (Estimated)

- **Viral Growth**: Sharing portfolios on LinkedIn = organic acquisition
- **Feature Stickiness**: Users return to edit → higher retention
- **Premium Upgrade Path**: Custom domains, analytics (Phase 3) → revenue
- **Competitive Advantage**: Few coding apps have built-in portfolio generators

---

## Architecture Summary

### Database (Supabase PostgreSQL)

**6 Tables** (with RLS policies for security):
- `normalized_profiles` — One unified profile per user
- `portfolio_sites` — Published portfolios (users can have multiple)
- `portfolio_projects` — Featured projects (auto-ranked)
- `connected_accounts` — OAuth tokens (for Phase 2 LinkedIn)
- `resume_uploads` — File tracking
- `short_links` — Branded short URLs

### Backend (Node.js/Express)

**7 Services**:
1. **ResumeParserService** — Extract text, regex sections, score confidence
2. **GitHubService** — Fetch repos, calculate visibility score, cache results
3. **LinkedInService** — URL validation + manual import (Phase 2: OAuth)
4. **ProfileNormalizerService** — Merge & deduplicate data from 3 sources
5. **PortfolioRendererService** — Render EJS templates with profile data
6. **PublishService** — Upload HTML to Supabase Storage + CDN
7. **ShortLinkService** — Generate branded short URLs with auto-redirect

**7 API Routes**:
- POST `/api/portfolio/profiles/import` — Parse and merge all sources
- GET/PUT `/api/portfolio/profiles/:id` — Fetch and edit profile
- POST `/api/portfolio/sites` — Publish portfolio
- GET/DELETE `/api/portfolio/sites/:id` — View and unpublish
- GET `/public/portfolios/:slug` — Public portfolio viewer
- GET `/api/portfolio/short-links/:slug/resolve` — Redirect short link

### Frontend (React/Vite)

**3 Pages**:
- `PortfolioCreator.jsx` — 4-step wizard
- `PortfolioGallery.jsx` — My portfolios list
- `PublicPortfolioPage.jsx` — Published site viewer

**5 Step Components**:
- `ImportStep.jsx` — Resume + GitHub + LinkedIn inputs
- `ReviewStep.jsx` — Edit merged profile
- `TemplateSelector.jsx` — Choose template + colors
- `PublishStep.jsx` — Final confirmation
- `ShareDialog.jsx` — Copy + QR code

**5 Custom Hooks**:
- `usePortfolioUpload.js` — Resume file handling
- `useGitHubFetch.js` — GitHub repo fetching
- `useLinkedInImport.js` — LinkedIn URL parsing
- `useProfileMerge.js` — Call import API
- `usePortfolioPublish.js` — Publish flow

### Domain Strategy

```
yourdomain.com/u/sangita              ← Public portfolio (clean, shareable)
link.yourdomain.com/abc123            ← Short branded link (301 redirect)
app.yourdomain.com                    ← App dashboard (where users manage)
yourdomain.com                        ← Marketing site
```

---

## Critical Success Factors

✅ **Must Have**:
- Resume parsing works on real resumes (95%+ accuracy)
- GitHub repo scoring correctly identifies best projects
- Portfolio publishes in <5 seconds
- Public URL is clean and shareable
- RLS policies prevent data leaks
- Mobile-responsive design

❌ **Avoid**:
- Trusting one data source blindly
- Parsing every GitHub repo (rank top 5)
- Calling GitHub API without caching
- Complex forms before seeing preview
- Exposing user data in URLs

---

## Implementation Phases

### Phase 1: MVP (Weeks 1–8)
**Output**: Fully functional portfolio generator launched publicly

**Deliverables**:
- Database schema (6 tables)
- 7 backend services
- 7 API routes
- React wizard (4 steps)
- Public portfolio viewer
- Portfolio gallery
- Domain routing

**Success Metric**: Users can go from resume to published portfolio in <2 min

---

### Phase 2: Smart Features (Weeks 9–14)
**Output**: Enhanced portfolio with AI and multiple templates

**Additions**:
- GitHub repo auto-ranking
- AI summary rewriting (Azure OpenAI)
- 4 templates (minimal, dark, creative, fresher)
- Advanced theme customizer
- Project reordering UI
- Section visibility controls

**Success Metric**: 50% of portfolios use advanced features

---

### Phase 3: Premium (Weeks 15–22)
**Output**: Enterprise portfolio platform

**Additions**:
- GitHub sync button
- Portfolio analytics
- QR code generation
- PDF export
- Custom domain support
- Version history
- LinkedIn OAuth
- Email notifications

**Success Metric**: 20% of active users adopt premium features

---

## Dependencies & Tech Stack

### Backend
```
Node.js 22.x
├─ Express
├─ Supabase JS Client
├─ pdfjs-dist (PDF parsing)
├─ docx (DOC/DOCX)
├─ natural (NLP)
├─ ejs (templating)
├─ axios (HTTP)
└─ nanoid (slug generation)
```

### Frontend
```
React (Vite)
├─ react-hook-form
├─ react-dropzone
└─ qrcode.react (Phase 3)
```

### Database
```
Supabase PostgreSQL
├─ 6 tables
├─ Row-Level Security
├─ Full Text Search (Phase 3)
└─ Realtime subscriptions (optional)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Resume parsing fails | Use existing libraries + allow manual editing |
| GitHub rate limit hit | Cache 24h, implement exponential backoff |
| LinkedIn scraping blocks | Use Phase 2 OAuth, or manual URL input |
| Storage costs explode | Set quota per user (100 MB), archive old resumes |
| SEO penalty for duplicate content | Add `rel=canonical`, unique meta tags per portfolio |
| RLS data leaks | Test with multiple user accounts, code review |

---

## Marketing Angle

### For Job Seekers
*"Stop copying your resume into web builders. Let Preploop do it for you — upload once, publish instantly."*

### For GitHub Developers
*"Showcase your best 5 projects, not your whole GitHub. Automatic, clean, professional."*

### For Preploop Users
*"You've crushed interview prep. Now let your portfolio match your skill level."*

### Social Share Message
*"I just generated my portfolio in 60 seconds with @PrepLoop 🚀 Check it out: link.yourdomain.com/abc123"*

---

## Documentation Structure

| File | Purpose | Audience |
|------|---------|----------|
| **PORTFOLIO_GENERATOR_ARCHITECTURE.md** | Full spec (data, API, services) | Architects, leads |
| **PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md** | Week-by-week tasks + checklist | Developers, PMs |
| **PORTFOLIO_GENERATOR_QUICK_START.md** | Dev-focused quickstart (algorithms, APIs) | Backend/frontend devs |
| **PORTFOLIO_GENERATOR_OVERVIEW.md** | This file (big picture) | Everyone |

---

## Next Steps (Action Items)

### Immediate (This Week)
- [ ] Review architecture with team
- [ ] Approve MVP scope (Phase 1)
- [ ] Allocate resources (backend, frontend, design)
- [ ] Set up Supabase branch for development

### Week 1 Kickoff
- [ ] Create database migrations
- [ ] Start ResumeParserService implementation
- [ ] Set up test fixtures (sample resumes)
- [ ] Frontend component stubs

### Ongoing
- [ ] Daily standups on Phase 1 progress
- [ ] Weekly demos of features
- [ ] Performance testing after each service
- [ ] User testing with beta users before launch

---

## Questions? Contact

- **Architecture Questions**: See [PORTFOLIO_GENERATOR_ARCHITECTURE.md](./PORTFOLIO_GENERATOR_ARCHITECTURE.md)
- **Implementation Help**: See [PORTFOLIO_GENERATOR_QUICK_START.md](./PORTFOLIO_GENERATOR_QUICK_START.md)
- **Timeline & Tasks**: See [PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md](./PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md)

---

**Status**: ✅ Ready for Phase 1 Kickoff  
**Created**: May 14, 2026  
**Version**: 1.0
