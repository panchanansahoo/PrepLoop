# PrepLoop Database Migrations Registry & Manifest

This manifest documents all 50 SQL migrations in `backend/db/`, organized by domain, execution order, target tables, and dependencies.

---

## 1. Domain Groupings & Dependencies

### Domain A: Auth, Security & Profile Management
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_enable_profiles_rls.sql` | Enables Row Level Security on `profiles` | `profiles` |
| `migration_fix_rls_recursion.sql` | Resolves infinite recursion in profile RLS policies | `profiles` |
| `migration_fix_mismatches.sql` | Fixes column type mismatches between auth & profile | `profiles`, `auth.users` |
| `migration_add_roles.sql` | Creates role enum and RBAC role assignments | `user_roles`, `profiles.role` |
| `migration_email_verification.sql` | Adds email verification tokens & timestamps | `profiles.email_verified_at` |
| `migration_github_username.sql` | Adds GitHub username binding | `profiles.github_username` |
| `migration_profile_fields.sql` | Extends basic profile fields (skills, designation) | `profiles` |
| `migration_profile_enhancements.sql` | Adds social links, location, bio | `profiles` |
| `migration_profile_themes.sql` | Adds portfolio profile theme preferences | `profiles.theme` |
| `migration_usage_quotas.sql` | RPC function `consume_usage_quota` & quota audit | `usage_quotas` |

### Domain B: Coins, Streaks & Gamification
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_coins_streaks.sql` | Initial coin balances & daily streaks | `user_streaks`, `coin_balances` |
| `migration_user_streaks_badges.sql` | User streak freezes, longest streaks, badges | `user_badges`, `user_streaks` |
| `migration_atomic_coin_transactions.sql` | Atomic ledger for coin balance debits/credits | `coin_transactions`, `coin_balances` |
| `migration_coin_transaction_idempotency.sql` | Idempotency key constraint on transactions | `coin_transactions.reference_key` |
| `migration_coin_real_data_sync.sql` | Syncs cached coin balances with transactions sum | `coin_balances` |

### Domain C: AI Mock Interviews & Telemetry
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_ai_features.sql` | Core mock interview runs, transcripts, scores | `mock_interviews`, `transcripts` |
| `migration_interview_enhancement.sql` | Enhanced interview rubrics and scoring breakdowns | `mock_interviews` |
| `migration_interview_checkpoints.sql` | Mid-interview checkpoint saves for resilience | `interview_checkpoints` |
| `migration_interview_idempotency.sql` | Prevents duplicate interview finalization | `mock_interviews.idempotency_key` |
| `migration_interview_suite_features.sql` | Voice telemetry, pacing metrics, score cues | `interview_telemetry` |
| `migration_admin_question_sets.sql` | Custom question sets uploaded by administrators | `custom_question_sets` |
| `migration_private_fixed_interviews.sql` | Invite-only and private interview links | `private_interviews` |
| `migration_invitee_email_allowlist.sql` | Domain & email allowlists for private rooms | `invitee_allowlist` |
| `migration_secure_user_interview_stats_view.sql` | RLS-safe view for user interview analytics | `view_user_interview_stats` |
| `migration_retention_cleanup.sql` | Auto-purging retention policies for old transcripts | Retention trigger |

### Domain D: Career Guidance, Jobs & Portfolios
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_preploop_career_guidance.sql` | Career pathways, interaction history, roadmaps | `career_pathways`, `career_interactions` |
| `migration_career_ops_history.sql` | Candidate application ops tracking | `career_ops_history` |
| `migration_profiles_job_matching.sql` | Semantic embeddings & skills vector index | `profiles.skills_embedding` |
| `migration_job_listings.sql` | Scraped and partner job postings table | `jobs` |
| `migration_portfolio_phase1.sql` | Public portfolio builder rows & vanity slugs | `portfolios` |
| `migration_portfolio_resume_upload.sql` | Storage bucket permissions for PDF/DOCX resumes | Supabase Storage RLS |
| `migration_add_custom_url.sql` | Custom portfolio vanity URLs | `portfolios.vanity_slug` |
| `migration_improvement_plans.sql` | AI-generated action plans for skill recovery | `improvement_plans` |
| `migration_improvement_plan_indexes.sql` | Indexes on user improvement plan queries | `idx_improvement_plans_user` |

### Domain E: Peer Interview Rooms (Multiplayer)
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_peer_interview_rooms.sql` | Real-time 1-on-1 peer room coordination & rubrics | `peer_interview_rooms` |

### Domain F: Community Challenges & Study Groups
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_community_challenges.sql` | Weekly challenges, test cases, and submissions | `community_challenges`, `challenge_submissions` |
| `migration_community_likes.sql` | Social reactions on public submissions & notes | `community_likes` |
| `migration_study_groups.sql` | Collaborative study cohorts and chat sessions | `study_groups`, `study_group_members` |
| `migration_library.sql` | Shared reference articles and code templates | `library_articles` |
| `migration_blog_posts.sql` | Public engineering blog posts & author profiles | `blog_posts` |
| `migration_feedback.sql` | User feedback reports & issue ticketing | `feedback` |
| `migration_quiz_feature.sql` | DSA quick-quizzes with multiple choice questions | `quizzes`, `quiz_attempts` |

### Domain G: Platform API, Webhooks & Performance Indexes
| Migration File | Description | Target Tables / Views |
| :--- | :--- | :--- |
| `migration_platform_api_webhooks.sql` | Third-party API keys, webhook subscriptions & delivery logs | `api_keys`, `webhook_subscriptions`, `webhook_deliveries` |
| `migration_performance_indexes.sql` | First-generation composite indexes | `mock_interviews`, `submissions` |
| `migration_core_query_indexes.sql` | High-frequency composite query indexes | `submissions`, `user_progress`, `mock_interviews` |
| `migration_core_query_indexes_v2.sql` | GIN indexes on problem companies/tags, submissions timestamp ordering, and profile subscription tiers | `problems`, `submissions`, `profiles` |
| `migration_performance_indexes_v3.sql` | Composite query indexes for session checkpoints, career ops evaluations, quiz attempts, and peer rooms | `interview_session_checkpoints`, `career_ops_evaluations`, `peer_interview_rooms`, `quiz_attempts` |
| `migration_rls_security_hardening.sql` | Row Level Security policies for peer rooms, challenges, API keys, webhooks | `peer_interview_rooms`, `challenge_submissions`, `api_keys`, `webhook_subscriptions`, `webhook_deliveries` |

---

## 2. Automated Migration Runner

To apply migrations sequentially and check migration state:

\`\`\`bash
# Run migration verification and apply pending scripts
node backend/scripts/runMigrations.js
\`\`\`

