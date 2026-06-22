# Preploop Discord Bot Starter

This package provides a Discord.js v14 slash-command bot wired to existing Preploop backend APIs.

## Commands

- `/ping`
- `/link token:<jwt>`
- `/unlink`
- `/daily track:dsa [difficulty]`
- `/streak`
- `/coins`
- `/ask-ai message:<text>`
- `/mock-slots [date:YYYY-MM-DD]`
- `/mock-book slot_id:<id>`
- `/my-bookings`
- `/post-onboarding` (admin/mod command to post role picker panel)
- `/resolve-thread` (staff: mark current help thread resolved)
- `/escalate-thread` (staff: escalate current thread to mentors)
- `/mentor-remind` (staff: send manual mentor reminder)

## Setup

1. Install dependencies:

```bash
npm run discord:install
```

2. Create env file:

```bash
copy discord-bot\.env.example discord-bot\.env
```

Or auto-create it:

```bash
npm run discord:setup-env
```

3. Fill required values in `discord-bot/.env`:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `PREPLOOP_API_URL`
- `DISCORD_GUILD_ID` (required for server bootstrap)

4. Optional: bootstrap your Discord server structure (roles, categories, channels, key permissions):

```bash
npm run discord:bootstrap
```

5. Deploy slash commands:

```bash
npm run discord:deploy
```

6. Start bot:

```bash
npm run discord:start
```

7. Run launch-readiness checks (env + roles + channels):

```bash
npm run discord:doctor
```

Quick preflight (create env file if missing + run doctor):

```bash
npm run discord:prepare
```

## Onboarding automation

- Use `/post-onboarding` in your chosen channel to post a role picker panel.
- New members receive a DM checklist when `ENABLE_ONBOARDING_DM=true`.

## Daily challenge auto-posting

Enable in `discord-bot/.env`:

- `ENABLE_DAILY_POSTER=true`
- `DAILY_POST_HOUR_UTC=5` (or preferred UTC hour)

The bot posts one challenge per day to:

- `daily-dsa`
- `daily-aptitude`
- `daily-lld`

It also posts timed follow-ups (same message thread reference):

- hint prompt after `DAILY_HINT_DELAY_HOURS`
- editorial prompt after `DAILY_EDITORIAL_DELAY_HOURS`

You can override channel names with:

- `DAILY_CHANNEL_DSA`
- `DAILY_CHANNEL_APTITUDE`
- `DAILY_CHANNEL_LLD`

## Doubt SLA automation

Enable in `discord-bot/.env`:

- `ENABLE_HELP_SLA_MONITOR=true`
- `HELP_SLA_MINUTES=45`
- `HELP_SLA_RESOLVER_ROLES=Mentor,Moderator,Admin,Event Host`

Behavior:

- Scans configured help channels for active unresolved threads.
- If a thread has no non-author reply past SLA, bot pings `Mentor` role.
- One SLA ping per thread per day (tracked in local state file).
- Thread is treated as resolved if:
	- Staff runs `/resolve-thread`,
	- Thread name starts with `[resolved]`, or
	- A configured resolver role posts in the thread.

For local development with auto-reload:

```bash
npm run discord:dev
```

## Notes

- This starter stores linked JWT tokens in `discord-bot/data/links.json`.
- For production, replace file storage with encrypted database storage and a proper account-link flow.
- Use `DISCORD_GUILD_ID` during development for near-instant slash command updates.
