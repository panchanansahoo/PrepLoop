# Preploop Discord Bot Command Spec

## 1. Scope

This specification defines Discord slash commands, request/response contracts, and backend endpoint mappings for a Preploop community bot.

## 2. Runtime and SDK

- Runtime: Node.js 20+
- SDK: Discord.js v14
- Command style: Slash commands only (no message-content command dependency)
- Intents: minimum required (`Guilds`, optional others only when needed)

## 3. Auth and Identity Linking

## 3.1 Goal
Map Discord user IDs to Preploop accounts so command execution can call authenticated backend APIs.

## 3.2 Recommended flow
1. User runs `/link`.
2. Bot sends one-time secure link to Preploop frontend.
3. User confirms account in browser.
4. Backend stores mapping: `discord_user_id -> preploop_user_id`.

If user is not linked, commands that require account data must return a helpful prompt to run `/link`.

## 4. Commands

## 4.1 `/start`
Onboard user and assign track roles.

Inputs:
- `track` (`dsa|aptitude|lld|interview`)
- `level` (`beginner|intermediate|advanced`)
- `timezone` (string)
- `target_company` (optional string)

Behavior:
- Assign Discord roles.
- Save preferences in bot DB.
- Reply with starter checklist.

Backend dependency:
- None required for initial launch.

## 4.2 `/daily`
Get a challenge (or list) for a given track.

Inputs:
- `track` (`dsa|aptitude|lld`)
- `difficulty` (optional)

Backend mapping:
- `GET /api/practice/all-problems`
- Optional filter client-side by difficulty/topic/company.

Response:
- Problem title, tags, difficulty, link.
- Thread creation prompt for submissions.

## 4.3 `/submit`
Submit a practice attempt to Preploop judge.

Inputs:
- `problem_id` (string)
- `language` (string)
- `code` (string)

Backend mapping:
- `POST /api/practice/submit`

Expected outcome:
- Pass/fail summary, test stats.
- If solved first time, coins may be awarded by backend logic.

## 4.4 `/run`
Run code against sample tests without final submit.

Inputs:
- `problem_id`
- `language`
- `code`

Backend mapping:
- `POST /api/practice/run`

## 4.5 `/streak`
Show and refresh streak data.

Backend mapping:
- `GET /api/streak/check`
- Optional read-only variant: `GET /api/streak/status`

Bot-side actions:
- If streak reaches threshold (7, 30), assign achievement role.

## 4.6 `/coins`
Show coin balance and recent transactions.

Backend mapping:
- `GET /api/coins/balance`
- `GET /api/coins/history`

## 4.7 `/ask-ai`
Forward a learning question to Preploop AI chat.

Inputs:
- `message` (string)

Backend mapping:
- `POST /api/chat/message`

Notes:
 AI features are now free (no coin cost).

## 4.8 `/leaderboard`
Show weekly standings.

Inputs:
- `scope` (`weekly|monthly`)

Initial implementation:
- Build from bot events + local DB.

Future implementation:
- Add dedicated backend leaderboard endpoint.

## 4.9 `/mock-slots`
List available real interview slots.

Inputs:
- `date` (optional `YYYY-MM-DD`)

Backend mapping:
- `GET /api/real-interview/slots?date=...`

## 4.10 `/mock-book`
Book a real interview slot.

Inputs:
- `slot_id` (string)

Backend mapping:
- `POST /api/real-interview/book`

Known rule:
- Booking requires non-free subscription tier.

## 4.11 `/my-bookings`
Show user interview bookings.

Backend mapping:
- `GET /api/real-interview/my-bookings`

## 4.12 `/mock-cancel`
Cancel scheduled interview.

Inputs:
- `booking_id` (string)

Backend mapping:
- `PUT /api/real-interview/cancel/:id`

## 4.13 `/community-post`
Create a community discussion post.

Inputs:
- `title`
- `content`
- `tags` (optional)

Backend mapping:
- `POST /api/community/posts`

## 4.14 `/help-unsolved` (staff/mentor helper)
Show stale help threads and ping mentors.

Initial implementation:
- Bot-managed SLA based on thread age.

Future implementation:
- Optional sync with `community` backend records.

## 5. Error Handling Contract

## 5.1 User-facing categories
- Not linked account
- Auth/session expired
- Permission denied
- Insufficient coins
- Premium required
- Validation failure
- Service temporarily unavailable

## 5.2 Message style
- Keep concise.
- Include one actionable next step.
- Avoid exposing stack traces or internal IDs.

## 6. Rate Limiting and Safety

- Add per-user command cooldowns for expensive routes (`/ask-ai`, `/submit`, `/mock-book`).
- Retry only idempotent reads.
- Use deferred replies for commands that call slower backend paths.
- Audit-log admin and moderation commands.

## 7. Data Model (Bot Side)

Minimum tables:
- `discord_links` (`discord_user_id`, `preploop_user_id`, `linked_at`)
- `discord_profiles` (`discord_user_id`, `track`, `level`, `timezone`, `target_company`)
- `command_usage` (`discord_user_id`, `command_name`, `created_at`)
- `help_threads` (`thread_id`, `channel_id`, `creator_id`, `status`, `created_at`, `resolved_at`)
- `leaderboard_cache` (`period`, `user_id`, `score`, `updated_at`)

## 8. Delivery Milestones

## Milestone 1 (Week 1)
- `/start`, `/link`, `/daily`, `/streak`, `/coins`
- Daily challenge posting automation
- Basic leaderboard post

## Milestone 2 (Week 2)
- `/submit`, `/run`, `/ask-ai`
- Mentor SLA pings for unresolved doubts

## Milestone 3 (Week 3)
- `/mock-slots`, `/mock-book`, `/my-bookings`, `/mock-cancel`
- Event reminders

## Milestone 4 (Week 4)
- `/community-post` and engagement automations
- Analytics and retention reports

## 9. Notes About Existing Backend Behavior

- `GET /api/schedule/my-slots` is HR/admin-only and should not be used for learner booking flows.
- Learner mock interview booking should use `real-interview` routes instead.
- Coin and streak routes have graceful degraded responses if schema migrations are missing.
