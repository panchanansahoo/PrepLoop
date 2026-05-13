# Portfolio Generator — Phase 1 Implementation Plan

**Target Timeline**: 6–8 weeks (140–160 days of effort across team)  
**Priority**: High (strong product differentiator, student/job-seeker appeal)  
**Dependencies**: Supabase RLS, Resume parser, GitHub API

---

## Week 1–2: Database & Core Services Setup

### Database Layer

- [ ] Create Supabase migrations for:
  - [ ] `connected_accounts` table (OAuth credentials)
  - [ ] `resume_uploads` table (file tracking)
  - [ ] `normalized_profiles` table (unified profile)
  - [ ] `portfolio_projects` table (featured projects)
  - [ ] `portfolio_sites` table (published portfolios)
  - [ ] `short_links` table (branded URLs)
  - [ ] `portfolio_visits` table (Phase 3)

- [ ] Set up Row-Level Security (RLS) policies:
  - [ ] Users can only view/edit their own profiles
  - [ ] Resume uploads are private to user
  - [ ] Public portfolios are readable by anyone

- [ ] Create database indexes for performance

### Core Services Implementation

- [ ] **ResumeParserService**
  - [ ] PDF extraction (`pdfjs-dist`)
  - [ ] DOC/DOCX extraction (`docx`)
  - [ ] Regex patterns for name, email, phone, experience, education
  - [ ] Section detection (EXPERIENCE, EDUCATION, SKILLS, CERTIFICATIONS)
  - [ ] Confidence scoring
  - [ ] Unit tests

- [ ] **GitHubService**
  - [ ] Fetch user profile (public API)
  - [ ] Fetch repositories (sorted by stars)
  - [ ] Extract README content
  - [ ] Score repositories (visibility formula)
  - [ ] Cache results (24-hour TTL)
  - [ ] Unit tests + rate limiting

- [ ] **LinkedInService** (MVP: Manual URL)
  - [ ] Accept LinkedIn profile URL
  - [ ] Scrape publicly available data (or user copy-paste key info)
  - [ ] Phase 2: Implement LinkedIn OAuth
  - [ ] Basic validation

- [ ] **ProfileNormalizerService**
  - [ ] Merge resume + GitHub + LinkedIn data
  - [ ] Deduplication logic (company + role + date)
  - [ ] Source priority rules
  - [ ] Confidence scoring per field
  - [ ] Skill aggregation
  - [ ] Experience ranking (newest first)
  - [ ] Project mapping from GitHub
  - [ ] Unit tests + edge cases

---

## Week 3–4: Backend API Routes

### Express Routes (`backend/routes/portfolio.js`)

#### Import & Profile Management

- [ ] **POST `/api/portfolio/profiles/import`**
  - [ ] Multipart form parsing (resume file)
  - [ ] Call ResumeParserService
  - [ ] Call GitHubService
  - [ ] Call LinkedInService
  - [ ] Call ProfileNormalizerService
  - [ ] Save to `normalized_profiles` table
  - [ ] Return merged profile JSON
  - [ ] Error handling + validation

- [ ] **GET `/api/portfolio/profiles/:id`**
  - [ ] Fetch from database
  - [ ] Auth check (user owns profile)
  - [ ] Return full profile

- [ ] **PUT `/api/portfolio/profiles/:id`**
  - [ ] Update profile fields (basicInfo, summary, projects, etc.)
  - [ ] Validate changes
  - [ ] Update `updated_at` timestamp
  - [ ] Return updated profile

#### Portfolio Creation & Publishing

- [ ] **POST `/api/portfolio/sites`**
  - [ ] Validate slug uniqueness
  - [ ] Select template (minimal for MVP)
  - [ ] Call PortfolioRendererService
  - [ ] Call PublishService (save HTML)
  - [ ] Call ShortLinkService (create short URL)
  - [ ] Save to `portfolio_sites` table
  - [ ] Return URLs + metadata

- [ ] **GET `/api/portfolio/sites/:id`**
  - [ ] Fetch portfolio metadata
  - [ ] Auth check (owner or public)

- [ ] **DELETE `/api/portfolio/sites/:id`**
  - [ ] Unpublish portfolio
  - [ ] Delete from storage
  - [ ] Mark as unpublished in DB

- [ ] **GET `/api/portfolio/settings`**
  - [ ] Return user's portfolio count
  - [ ] Default template + theme
  - [ ] Quota info

### Middleware

- [ ] **portfolioAuth.js**
  - [ ] Verify JWT token
  - [ ] Attach `req.user` from token
  - [ ] Error handling

---

## Week 5–6: Frontend Components (React/Vite)

### Portfolio Wizard Pages

- [ ] **PortfolioCreator.jsx** (Main orchestrator)
  - [ ] Step progress tracker
  - [ ] Route to step 1, 2, 3, 4
  - [ ] Cancel/back navigation
  - [ ] Save draft locally (localStorage)

- [ ] **Step 1: ImportStep.jsx**
  - [ ] Resume file upload (accept PDF, DOC, DOCX)
  - [ ] GitHub username input with validation
  - [ ] LinkedIn URL input with validation
  - [ ] "Import" button (calls `/api/portfolio/profiles/import`)
  - [ ] Loading spinner
  - [ ] Error messages
  - [ ] Accessibility (labels, ARIA)

- [ ] **Step 2: ReviewStep.jsx**
  - [ ] Display merged profile in editable form
  - [ ] Edit basic info (name, headline, summary, location, email, phone)
  - [ ] Skill pills with delete/add
  - [ ] Experience timeline with edit buttons
  - [ ] Education items (collapsible)
  - [ ] Project cards with featured checkbox + reorder
  - [ ] Save changes locally or to server

- [ ] **Step 3: TemplateSelector.jsx** (MVP: minimal only)
  - [ ] Show template preview
  - [ ] Basic color picker (primary color)
  - [ ] Font selector (system fonts for MVP)
  - [ ] Live preview (iframe)
  - [ ] Next button

- [ ] **Step 4: PublishStep.jsx**
  - [ ] Final confirmation
  - [ ] Slug/URL customization
  - [ ] Visibility setting (private/unlisted/public)
  - [ ] Publish button
  - [ ] Success message with URLs

### Supporting Components

- [ ] **PortfolioGallery.jsx** (My Portfolios)
  - [ ] List all user portfolios
  - [ ] Quick actions (view, edit, share, delete)
  - [ ] Create new button
  - [ ] Last updated timestamp

- [ ] **PublicPortfolioPage.jsx** (Published site viewer)
  - [ ] Fetch portfolio HTML from server
  - [ ] Render in iframe or direct render
  - [ ] Social meta tags (OG, Twitter)
  - [ ] Analytics tracking (Phase 3)

- [ ] **ShareDialog.jsx** (Share modal)
  - [ ] Display full portfolio URL
  - [ ] Display short link
  - [ ] Copy-to-clipboard buttons
  - [ ] QR code display (Phase 3: use `qrcode.react`)
  - [ ] Email share option

### Custom Hooks

- [ ] **usePortfolioUpload.js**
  - [ ] Resume file upload logic
  - [ ] Progress tracking
  - [ ] Error handling

- [ ] **useGitHubFetch.js**
  - [ ] Validate GitHub username
  - [ ] Fetch repos (client calls backend)

- [ ] **useLinkedInImport.js**
  - [ ] Validate LinkedIn URL
  - [ ] Parse URL

- [ ] **useProfileMerge.js**
  - [ ] Call `/api/portfolio/profiles/import`
  - [ ] Handle loading/error states
  - [ ] Cache result in local state

- [ ] **usePortfolioPublish.js**
  - [ ] Call `/api/portfolio/sites` (POST)
  - [ ] Handle response with URLs
  - [ ] Redirect to success page

### Styling

- [ ] Tailwind CSS integration (if not already done)
- [ ] Responsive design (mobile-first)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Dark mode support (optional for MVP)

---

## Week 7–8: Publishing, Domain Routing & QA

### Publishing Infrastructure

- [ ] **PublishService Implementation**
  - [ ] Supabase Storage bucket setup (`portfolio-sites`)
  - [ ] Upload rendered HTML to storage
  - [ ] Set CDN headers (caching)
  - [ ] Security headers (Content-Security-Policy, etc.)

- [ ] **ShortLinkService Implementation**
  - [ ] Generate short slugs
  - [ ] Store in `short_links` table
  - [ ] Create redirect endpoint

### Domain & Routing Setup

- [ ] **Configure Nginx/Vercel**
  - [ ] Route `yourdomain.com/u/{slug}` to Supabase Storage
  - [ ] Route `link.yourdomain.com/{slug}` to backend redirect
  - [ ] Set up SSL certificates
  - [ ] Test DNS resolution

- [ ] **Public Portfolio Endpoint**
  - [ ] GET `/public/portfolios/{slug}` (unauthenticated)
  - [ ] Fetch HTML from storage
  - [ ] Return with SEO meta tags

### List Page: My Portfolios

- [ ] **GET `/api/portfolio/sites`** (list user's portfolios)
  - [ ] Return slug, template, published, URL, updated_at
  - [ ] Pagination (10 per page)

### Quality Assurance

- [ ] **Smoke Tests**
  - [ ] Resume parsing (test with 5 real resumes)
  - [ ] GitHub fetching (test with 5 real accounts)
  - [ ] Profile merging (verify deduplication)
  - [ ] Template rendering (visual inspection)
  - [ ] Publishing workflow (end-to-end)

- [ ] **Performance Testing**
  - [ ] Import latency (<5 seconds)
  - [ ] Page load (<2 seconds)
  - [ ] Database query times
  - [ ] API response times

- [ ] **Security Testing**
  - [ ] RLS policies (user isolation)
  - [ ] XSS prevention (HTML escaping in templates)
  - [ ] CSRF protection
  - [ ] Rate limiting (GitHub API calls)

- [ ] **Accessibility Testing**
  - [ ] Keyboard navigation
  - [ ] Screen reader compatibility
  - [ ] Color contrast
  - [ ] Focus management

- [ ] **Cross-Browser Testing**
  - [ ] Chrome, Firefox, Safari
  - [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Deployment

- [ ] **Production Deployment**
  - [ ] Database migrations (verify)
  - [ ] Backend build & deploy
  - [ ] Frontend build & deploy
  - [ ] DNS configuration
  - [ ] Monitor logs

- [ ] **Post-Launch Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Performance monitoring (APM)
  - [ ] User feedback collection
  - [ ] Bug hotline

---

## Launch Checklist

- [ ] Feature flag enabled (if A/B testing)
- [ ] Help docs written (portfolio generator guide)
- [ ] Email notification setup (portfolio published)
- [ ] Analytics dashboard (portfolio metrics)
- [ ] Social media announcement (Twitter, LinkedIn)
- [ ] Discord community notification
- [ ] Customer success email to early users

---

## Success Metrics (Phase 1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Import success rate | >95% | Resume + GitHub + LinkedIn data parsed correctly |
| Time to publish | <2 min | From import to published URL |
| Template render time | <500ms | HTML generation time |
| API response time | <1s | 95th percentile |
| User satisfaction | 4.5/5 | Post-launch survey |
| Adoption rate | 10% of users | Create at least 1 portfolio |
| Public portfolio traffic | 100 visits/day | Assuming 50 published portfolios |
| Short link click-through | 30% | Of shared links |

---

## Dependency & Risk Summary

| Risk | Mitigation |
|------|-----------|
| Resume parsing accuracy | Use existing libraries + fallback to manual edit |
| GitHub API rate limits | Cache results, use Redis, implement backoff |
| Template rendering performance | Pre-render on publish, cache in CDN |
| Storage costs (file uploads) | Set quota per user (100 MB), archive old resumes |
| SEO for portfolios | Add meta tags, sitemap, robots.txt |
| GDPR/Privacy | Inform users about data collection, allow deletion |

---

## Related Documentation

- [Portfolio Generator Architecture](./PORTFOLIO_GENERATOR_ARCHITECTURE.md) — Full tech spec
- [Database Schema](./PORTFOLIO_GENERATOR_ARCHITECTURE.md#postgresql-tables-supabase) — Tables & RLS
- [API Reference](./PORTFOLIO_GENERATOR_ARCHITECTURE.md#api-routes--backend-services) — All endpoints

---

**Version**: 1.0  
**Created**: May 14, 2026  
**Last Updated**: May 14, 2026  
**Status**: Ready for Implementation
