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

## Setup

1. Install dependencies:

```bash
npm run discord:install
```

2. Create env file:

```bash
copy discord-bot\.env.example discord-bot\.env
```

3. Fill required values in `discord-bot/.env`:

- `DISCORD_TOKEN`
- `DISCORD_CLIENT_ID`
- `PREPLOOP_API_URL`
- optional: `DISCORD_GUILD_ID`

4. Deploy slash commands:

```bash
npm run discord:deploy
```

5. Start bot:

```bash
npm run discord:start
```

For local development with auto-reload:

```bash
npm run discord:dev
```

## Notes

- This starter stores linked JWT tokens in `discord-bot/data/links.json`.
- For production, replace file storage with encrypted database storage and a proper account-link flow.
- Use `DISCORD_GUILD_ID` during development for near-instant slash command updates.
