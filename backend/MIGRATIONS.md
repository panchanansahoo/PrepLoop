# Database Migration Guide — PrepLoop

## Current State
PrepLoop uses **Supabase** (v2.95+) for database operations. Currently there is **no migration tooling** — schema changes are made directly via the Supabase Dashboard SQL editor.

## Recommended Setup

### Option 1: Supabase CLI (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref <your-project-ref>

# Pull current schema as baseline
supabase db pull

# Create a new migration
supabase migration new add_user_preferences_table

# Apply migrations
supabase db push
```

### Option 2: Manual SQL Migration Files
Create `backend/migrations/` with numbered SQL files:
```
backend/migrations/
├── 001_initial_schema.sql
├── 002_add_user_preferences.sql
└── 003_add_activity_feed_index.sql
```

Apply via Supabase Dashboard SQL editor or RPC.

### Migration Best Practices
1. **Never modify production directly** — always use migration files
2. **Test in staging first** — Supabase supports branching for preview environments
3. **Include both UP and DOWN** — for rollback capability
4. **Version control all migrations** — commit to git

## Tables Used by PrepLoop
Based on codebase analysis, the app uses these Supabase tables:
- `profiles` — user profiles and preferences
- `submissions` — code submission history
- `mock_interviews` — AI mock interview sessions
- `community_posts` — community hub content
- `blog_posts` — blog content
- `coins_transactions` — virtual currency ledger
- `study_groups` — collaborative study features
- `portfolios` — user portfolios
- `notes` — user notes
- `schedules` — study schedules
- `feedback` — user feedback
- `contacts` — contact form submissions
