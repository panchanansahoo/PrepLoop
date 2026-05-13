# 📋 Portfolio Generator — Master Index & Quick Reference

**Feature Status**: ✅ Architecture Complete & Ready for Implementation  
**Created**: May 14, 2026  
**Phase 1 Timeline**: 6-8 weeks  
**Team Size**: 2-3 backend, 2 frontend, 1 designer (recommended)

---

## 🎯 Feature Summary in 30 Seconds

**What**: Generate professional portfolio websites from resume + GitHub + LinkedIn  
**Who**: Job seekers, students, developers  
**How**: 4-step wizard (import → review → customize → publish)  
**Where**: yourdomain.com/u/{slug} + short links at link.yourdomain.com/{slug}  
**Why**: Viral growth potential + student/job-seeker appeal + premium upsell path

---

## 📚 Complete Documentation Set

### 1. **PORTFOLIO_GENERATOR_OVERVIEW.md** (This Repo)
**Length**: ~30 min read | **Audience**: Everyone  
**Contains**: Big picture, data flow diagram, user flow, business impact, risk mitigation

**👉 START HERE** if you want a bird's-eye view of the entire feature.

---

### 2. **PORTFOLIO_GENERATOR_ARCHITECTURE.md** (26 KB)
**Length**: ~60 min read | **Audience**: Architects, tech leads

**Contains**:
- ✅ Unified data model (JSON schema for profile)
- ✅ PostgreSQL table definitions (6 tables + RLS)
- ✅ Complete API specification (7 endpoints)
- ✅ 7 Backend services with code examples
- ✅ 4 Frontend page designs + 5 hooks
- ✅ Domain & sharing strategy
- ✅ Performance & scalability notes

**👉 USE THIS** for detailed technical design and code patterns.

---

### 3. **PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md** (12 KB)
**Length**: ~30 min read | **Audience**: Project managers, developers

**Contains**:
- ✅ Week-by-week breakdown (8 weeks)
- ✅ Detailed task checklists per week
- ✅ Dependencies & testing strategy
- ✅ Launch checklist
- ✅ Success metrics

**👉 USE THIS** for sprint planning and tracking progress.

---

### 4. **PORTFOLIO_GENERATOR_QUICK_START.md** (8 KB)
**Length**: ~10 min read | **Audience**: Backend/frontend developers

**Contains**:
- ✅ MVP scope clarification (what's in, what's not)
- ✅ Key algorithms (resume parsing regex, GitHub scoring)
- ✅ File structure reference
- ✅ API endpoints table
- ✅ Common pitfalls
- ✅ Testing strategy

**👉 USE THIS** when implementing individual services/components.

---

## 🗂️ File Organization

```
docs/
├─ PORTFOLIO_GENERATOR_OVERVIEW.md          ← Start here (30 min)
├─ PORTFOLIO_GENERATOR_ARCHITECTURE.md      ← Tech spec (60 min)
├─ PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md ← Tasks (30 min)
├─ PORTFOLIO_GENERATOR_QUICK_START.md       ← Dev guide (10 min)
└─ PORTFOLIO_GENERATOR_MASTER_INDEX.md      ← This file

backend/
├─ services/
│   ├─ resumeParserService.js              ← To implement (Week 1)
│   ├─ githubService.js                    ← To implement (Week 1)
│   ├─ linkedinService.js                  ← To implement (Week 2)
│   ├─ profileNormalizerService.js         ← To implement (Week 2)
│   ├─ portfolioRendererService.js         ← To implement (Week 3)
│   ├─ publishService.js                   ← To implement (Week 3)
│   └─ shortLinkService.js                 ← To implement (Week 3)
├─ routes/
│   └─ portfolio.js                        ← To implement (Week 3-4)
├─ middleware/
│   └─ portfolioAuth.js                    ← To implement (Week 3)
└─ templates/
    ├─ minimal.ejs                         ← To create (Week 3)
    ├─ dark.ejs                            ← Phase 2
    ├─ creative.ejs                        ← Phase 2
    └─ fresher.ejs                         ← Phase 2

frontend/src/
├─ pages/
│   ├─ PortfolioCreator.jsx                ← To implement (Week 5)
│   ├─ PortfolioGallery.jsx                ← To implement (Week 6)
│   └─ PublicPortfolioPage.jsx             ← To implement (Week 6)
├─ components/portfolio/
│   ├─ ImportStep.jsx                      ← To implement (Week 5)
│   ├─ ReviewStep.jsx                      ← To implement (Week 5)
│   ├─ TemplateSelector.jsx                ← To implement (Week 5)
│   ├─ PublishStep.jsx                     ← To implement (Week 6)
│   └─ ShareDialog.jsx                     ← To implement (Week 6)
└─ hooks/
    ├─ usePortfolioUpload.js               ← To implement (Week 5)
    ├─ useGitHubFetch.js                   ← To implement (Week 5)
    ├─ useLinkedInImport.js                ← To implement (Week 5)
    ├─ useProfileMerge.js                  ← To implement (Week 5)
    └─ usePortfolioPublish.js              ← To implement (Week 6)
```

---

## 📊 Database Schema Overview

**6 Tables Total** (all with Row-Level Security):

| Table | Purpose | Records | Key Fields |
|-------|---------|---------|-----------|
| `normalized_profiles` | Unified profile (1 per user) | ~10K | basicInfo, skills, experience, projects |
| `portfolio_sites` | Published portfolios | ~20K | slug, template, theme, published_at |
| `portfolio_projects` | Featured projects (auto-ranked) | ~60K | title, featured, visibility_score, metrics |
| `connected_accounts` | OAuth tokens (Phase 2) | ~5K | provider, access_token, last_synced_at |
| `resume_uploads` | File tracking | ~15K | file_path, parsed_content, parse_confidence |
| `short_links` | Branded short URLs | ~20K | slug, full_url, created_at |

**Indexes**: On `user_id`, `profile_id`, `featured`, `visibility_score`, `slug`  
**Security**: Row-Level Policies prevent cross-user data access

---

## 🔌 API Endpoints (Phase 1)

| Method | Endpoint | Purpose | Response |
|--------|----------|---------|----------|
| POST | `/api/portfolio/profiles/import` | Parse + merge all sources | 201: Merged profile |
| GET | `/api/portfolio/profiles/:id` | Fetch profile | 200: Profile JSON |
| PUT | `/api/portfolio/profiles/:id` | Edit profile | 200: Updated profile |
| POST | `/api/portfolio/sites` | Create + publish portfolio | 201: Portfolio URLs |
| GET | `/api/portfolio/sites/:id` | Fetch portfolio metadata | 200: Metadata |
| DELETE | `/api/portfolio/sites/:id` | Unpublish portfolio | 204: No content |
| GET | `/public/portfolios/:slug` | View public portfolio | 200: HTML |
| GET | `/api/portfolio/short-links/:slug/resolve` | Redirect short link | 301: Full URL |

---

## 🎨 User Journey (4-Step Wizard)

```
Step 1: IMPORT DATA (5 min)
├─ Upload resume (PDF/DOC/DOCX)
├─ Enter GitHub username
├─ Paste LinkedIn profile URL
└─ [Import] → Backend parses + merges

Step 2: REVIEW & EDIT (10 min)
├─ Edit name, headline, summary
├─ Manage skills, experience, education
├─ Select featured projects (top 3-5)
└─ [Next]

Step 3: CUSTOMIZE (5 min)
├─ Select template (minimal for MVP)
├─ Pick primary color
├─ Choose font family
└─ [Next]

Step 4: PUBLISH & SHARE (2 min)
├─ Customize URL slug
├─ Set visibility (private/unlisted/public)
├─ [Publish] → Live in <5 seconds
└─ Copy URL + short link + QR code
```

---

## 🛠️ Core Technology Stack

### Backend
- **Runtime**: Node.js 22.x
- **Framework**: Express.js
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage
- **Parsing**: pdfjs-dist, docx, natural
- **Templating**: EJS
- **HTTP Client**: axios

### Frontend
- **Framework**: React (Vite)
- **Forms**: react-hook-form
- **File Upload**: react-dropzone
- **Styling**: Tailwind CSS
- **QR Codes**: qrcode.react (Phase 3)

### Hosting
- **Frontend**: Vercel
- **Backend**: Node.js on Azure App Service (or similar)
- **Database**: Supabase Cloud
- **Storage**: Supabase Storage (CDN-backed)

---

## 📈 Key Metrics & Targets

### Performance Targets
| Metric | Target | Critical? |
|--------|--------|-----------|
| Resume parse time | <2s | ✅ Yes |
| Full import time | <5s | ✅ Yes |
| Portfolio publish time | <2s | ✅ Yes |
| Page load time | <2s | ✅ Yes |
| API response time (p95) | <1s | ✅ Yes |

### User Adoption Targets
| Metric | Target |
|--------|--------|
| % of users creating portfolio | 10% (Phase 1 launch) |
| % of portfolios publicly shared | 30% |
| Avg. time from import to publish | <2 min |
| User satisfaction score | 4.5/5 |

---

## 🚀 Phase 1 Milestones

| Week | Deliverable | Owner |
|------|-------------|-------|
| 1-2 | Database schema + services | Backend |
| 3-4 | API routes + endpoints | Backend |
| 5-6 | Frontend wizard + components | Frontend |
| 7-8 | Publishing, domain routing, QA | Backend + DevOps |

**Launch Target**: End of Week 8 (60 days from start)

---

## 🎁 What Users Get

### MVP (Phase 1)
✅ Professional portfolio in 60 seconds  
✅ Data from resume, GitHub, LinkedIn  
✅ Hosted on your domain (yourdomain.com/u/username)  
✅ Shareable short link (link.yourdomain.com/abc123)  
✅ Edit after publishing  
✅ One clean template

### Phase 2
✅ AI bio rewriting  
✅ GitHub repo auto-ranking  
✅ 4 templates + advanced theme customizer  
✅ Section visibility controls

### Phase 3
✅ Analytics (view counts, referrers)  
✅ GitHub sync (one-click update)  
✅ Custom domain support  
✅ PDF export  
✅ LinkedIn OAuth  
✅ QR code generation

---

## ⚠️ Common Pitfalls (Don't Do These)

| Pitfall | Why It Fails | Solution |
|---------|-------------|----------|
| Parse every GitHub repo | Too many, user overwhelmed | Rank by stars/activity, auto-select top 5 |
| Call GitHub API on every view | Rate limit hit (60/hr unauthenticated) | Cache results 24 hours |
| Trust one data source blindly | Resume vs LinkedIn might conflict | Apply source priority rules + confidence scores |
| Render portfolio on-the-fly | Slow, kills performance | Pre-render HTML on publish, cache in CDN |
| Skip RLS policies | Data leaks, security nightmare | Test with multiple users, code review required |
| Require perfect resume parsing | Resumes are messy, no universal format | Allow user edits, score confidence, show warnings |

---

## 📞 Getting Help

### "How do I implement the resume parser?"
👉 See [PORTFOLIO_GENERATOR_QUICK_START.md](./PORTFOLIO_GENERATOR_QUICK_START.md#resume-parsing-regex) — Includes regex patterns

### "What's the GitHub visibility formula?"
👉 See [PORTFOLIO_GENERATOR_QUICK_START.md](./PORTFOLIO_GENERATOR_QUICK_START.md#github-visibility-score-formula) — Full formula + explanation

### "What API endpoints do I need?"
👉 See [PORTFOLIO_GENERATOR_QUICK_START.md](./PORTFOLIO_GENERATOR_QUICK_START.md#api-endpoints-phase-1) — Complete table

### "What's my implementation timeline?"
👉 See [PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md](./PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md) — Week-by-week breakdown

### "I need the full database schema"
👉 See [PORTFOLIO_GENERATOR_ARCHITECTURE.md](./PORTFOLIO_GENERATOR_ARCHITECTURE.md#postgresql-tables-supabase) — All 6 tables with RLS

---

## ✅ Pre-Implementation Checklist

Before kicking off Phase 1, verify:

- [ ] Team alignment on scope (MVP = 1 template, no AI, no custom domains)
- [ ] Design mockups approved (4-step wizard + published portfolio)
- [ ] Supabase project ready (migrations can be applied)
- [ ] GitHub API token available (for testing)
- [ ] Node.js 22.x installed locally
- [ ] npm dependencies listed (will add pdfjs-dist, docx, etc.)
- [ ] Frontend Vite setup ready
- [ ] Testing framework decision (Jest for backend, Vitest/RTL for frontend)
- [ ] DevOps ready (domain routing, CDN setup)

---

## 🎬 How to Kick Off Phase 1

### Day 1: Planning
1. Review [PORTFOLIO_GENERATOR_OVERVIEW.md](./PORTFOLIO_GENERATOR_OVERVIEW.md) with team (30 min)
2. Review [PORTFOLIO_GENERATOR_ARCHITECTURE.md](./PORTFOLIO_GENERATOR_ARCHITECTURE.md) with architects (60 min)
3. Break down [PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md](./PORTFOLIO_GENERATOR_IMPLEMENTATION_PLAN.md) into Jira tickets

### Day 2–3: Database Setup
1. Create Supabase migrations (Week 1 task)
2. Apply migrations to dev environment
3. Test RLS policies with multiple test users

### Week 1: Backend Services
1. Implement ResumeParserService
2. Implement GitHubService
3. Implement LinkedInService
4. Write unit tests for each

### Week 2–3: API Routes & Publishing
1. Build portfolio routes
2. Implement PublishService
3. Integration tests

### Week 4–6: Frontend
1. Build wizard components
2. Integration with API
3. UI/UX testing

### Week 7–8: QA & Launch
1. Smoke tests (end-to-end)
2. Performance testing
3. Security audit (RLS, XSS, CSRF)
4. Deploy to production

---

## 📖 Document Quick-Links

| Need | File | Section |
|------|------|---------|
| Big picture overview | OVERVIEW | All |
| Database schema | ARCHITECTURE | PostgreSQL Tables |
| API design | ARCHITECTURE | API Routes |
| Service code patterns | ARCHITECTURE | Service Architecture |
| Implementation tasks | IMPLEMENTATION_PLAN | Week-by-week |
| Algorithms & code | QUICK_START | Key Algorithms |
| Launch checklist | IMPLEMENTATION_PLAN | Launch Checklist |

---

## 🏁 Success Criteria (Phase 1)

**Launch is successful when:**

✅ Users can upload resume + GitHub + LinkedIn URL  
✅ System automatically merges data into one profile  
✅ Users can edit before publishing  
✅ Portfolio renders cleanly (minimal template)  
✅ Portfolio publishes in <5 seconds  
✅ Users get shareable URLs (yourdomain.com/u/{slug} + short link)  
✅ RLS policies prevent data leaks  
✅ Performance targets met (all <2s)  
✅ User satisfaction >4.0/5 (beta feedback)  
✅ 10%+ of users adopt feature within 1 month

---

## 📋 Implementation Status

| Component | Status | Owner | ETA |
|-----------|--------|-------|-----|
| ✅ Architecture | Complete | — | Done |
| ✅ Implementation Plan | Complete | — | Done |
| ✅ Documentation | Complete | — | Done |
| ⏳ Database Setup | Not Started | Backend | Week 1 |
| ⏳ Services | Not Started | Backend | Week 1-2 |
| ⏳ API Routes | Not Started | Backend | Week 3-4 |
| ⏳ Frontend | Not Started | Frontend | Week 5-6 |
| ⏳ Testing & QA | Not Started | QA | Week 7-8 |
| ⏳ Deployment | Not Started | DevOps | Week 8 |

---

## 💡 Final Thought

This feature has **high impact** because:

1. **Problem Solved**: Job seekers need portfolios fast (saves >10 hours per person)
2. **Viral Potential**: Shared portfolios = organic growth on LinkedIn/Twitter
3. **Competitive Advantage**: Few coding platforms have portfolio generators
4. **Upsell Path**: Custom domains (Phase 3) = premium revenue stream
5. **User Retention**: Portfolio editing = users return to app

**Time to Value**: 8 weeks → Launch → Growth 🚀

---

**Version**: 1.0  
**Created**: May 14, 2026  
**Last Updated**: May 14, 2026  
**Status**: ✅ Ready for Implementation

---

**Next Step**: Pick a documentation link above and start implementing! 👆
