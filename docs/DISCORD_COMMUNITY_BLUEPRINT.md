# Preploop Discord Community Blueprint

## 1. Purpose

Build a Discord community that increases practice consistency, interview readiness, and retention by connecting Discord participation with Preploop features (problems, coins, streaks, interviews).

## 2. Server Information Architecture

### Category: START_HERE
- `welcome`
- `rules`
- `verify-and-intros`
- `choose-track`
- `announcements`

### Category: DAILY_PRACTICE
- `daily-dsa`
- `daily-aptitude`
- `daily-lld`
- `challenge-submissions`
- `hints-and-editorial`

### Category: HELP_DESK
- `dsa-help`
- `aptitude-help`
- `lld-help`
- `interview-help`
- `code-review-clinic`

### Category: COMPANY_PREP
- `amazon-prep`
- `google-prep`
- `uber-prep`
- `openai-prep`
- `company-requests`

### Category: MOCK_INTERVIEW
- `book-mock`
- `upcoming-mocks`
- `mock-feedback`
- `voice-mock-room-1`
- `voice-mock-room-2`

### Category: COMMUNITY
- `study-buddy-match`
- `wins-and-progress`
- `resources`
- `off-topic`

### Category: GAMIFICATION
- `leaderboard`
- `streak-wall`
- `badges-and-rewards`

### Category: STAFF_ONLY
- `mod-log`
- `reports`
- `event-planning`
- `mentor-coordination`

## 3. Roles and Access Model

### Core roles
- `Admin`
- `Moderator`
- `Mentor`
- `Event Host`

### Learner roles (self-select)
- `DSA Learner`
- `Aptitude Learner`
- `LLD Learner`
- `Interview Prep`

### Achievement roles (bot-managed)
- `7-Day Streak`
- `30-Day Streak`
- `Top Solver`
- `Top Helper`

### Permission policy
- `announcements`: post-only for `Admin`/`Moderator`.
- `daily-*` channels: bot and mentors create challenge posts; members discuss in threads.
- `STAFF_ONLY`: visible only to staff roles.
- Voice mock rooms: `Priority Speaker` for booked participants during scheduled slots.

## 4. Community Feature Set

## 4.1 Onboarding
- Role picker and quick profile capture (track, timezone, target company, experience level).
- Auto-DM with starter checklist and first 3 tasks.

## 4.2 Daily challenge engine
- One challenge per day per track.
- Auto-thread created for each challenge.
- Timed hint release (for example after 6 hours).
- End-of-day editorial and top submissions highlight.

## 4.3 Doubt resolution SLA
- Members post doubts in help channels as threads.
- If unresolved for 45 minutes, ping `Mentor` role.
- Tag resolved threads with a bot command so they become reusable knowledge.

## 4.4 Accountability loops
- Weekly check-in prompts in `wins-and-progress`.
- Study buddy matching based on timezone + target company.
- Streak reminder notifications for inactive members.

## 4.5 Mock interview lifecycle
- Slot discovery and booking announcement in `book-mock`.
- Calendar reminders before start.
- Structured feedback template posted in `mock-feedback`.

## 4.6 Recognition and rewards
- Weekly leaderboard post (solves, helpful answers, streaks).
- Achievement role automation.
- Optional coin rewards synced from backend for community contributions.

## 5. Moderation and Safety Policy

### Rules baseline
- No harassment, hate speech, or personal attacks.
- No plagiarism or leaked interview content that violates platform policies.
- Keep answers educational; avoid posting full solutions immediately in daily challenge threads.
- No unsolicited DMs, scam links, or referral spam.

### Enforcement ladder
1. Warning
2. Temporary mute
3. Temporary ban
4. Permanent ban

### Incident handling
- All reports go to `reports` channel.
- Moderator must log action reason in `mod-log`.
- Escalate repeat violations to `Admin`.

## 6. Event Program (First 4 Weeks)

### Week 1
- Launch and onboarding campaign.
- Daily challenge starts.
- First live orientation session.

### Week 2
- Resume and interview Q and A event.
- First weekly leaderboard and badges.
- Study buddy pairing push.

### Week 3
- Mock interview week (mentor-led).
- Company-prep spotlight (Amazon style round).

### Week 4
- Mini contest (90-minute challenge).
- Community retrospective and roadmap vote.

## 7. KPIs

### Activation KPIs
- Join to role-selection conversion.
- Role-selection to first challenge participation.

### Engagement KPIs
- Daily active Discord members.
- Daily challenge attempts.
- Help thread response time.

### Outcome KPIs
- 7-day and 30-day streak retention.
- Mock interview bookings per week.
- Correlation between Discord participation and practice submissions.

## 8. Rollout Plan

### Phase 1 (MVP)
- Channels, roles, moderation rules.
- Onboarding + daily challenge posting.
- Leaderboard and streak role updates.

### Phase 2
- Mock booking integration and reminders.
- Mentor SLA automation for unresolved doubts.

### Phase 3
- Advanced reward economy and campaign events.
- Analytics dashboard for Discord to app funnel.
