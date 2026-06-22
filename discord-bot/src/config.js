import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
}

const required = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'PREPLOOP_API_URL'];

const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  throw new Error(`Missing required env vars: ${missing.join(', ')}`);
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID || null,
  apiBaseUrl: process.env.PREPLOOP_API_URL.replace(/\/$/, ''),
  aiChatCoinCost: Number(process.env.AI_CHAT_COIN_COST || 5),
  linksFilePath: path.resolve(__dirname, '../data/links.json'),
  enableDailyPoster: String(process.env.ENABLE_DAILY_POSTER || 'false').toLowerCase() === 'true',
  dailyPostHourUtc: Number(process.env.DAILY_POST_HOUR_UTC || 5),
  dailyPostStatePath: path.resolve(__dirname, '../data/daily-post-state.json'),
  dailyChannelDsa: process.env.DAILY_CHANNEL_DSA || 'daily-dsa',
  dailyChannelAptitude: process.env.DAILY_CHANNEL_APTITUDE || 'daily-aptitude',
  dailyChannelLld: process.env.DAILY_CHANNEL_LLD || 'daily-lld',
  dailyHintDelayHours: Number(process.env.DAILY_HINT_DELAY_HOURS || 6),
  dailyEditorialDelayHours: Number(process.env.DAILY_EDITORIAL_DELAY_HOURS || 12),
  enableOnboardingDm: String(process.env.ENABLE_ONBOARDING_DM || 'true').toLowerCase() === 'true',
  enableHelpSlaMonitor: String(process.env.ENABLE_HELP_SLA_MONITOR || 'false').toLowerCase() === 'true',
  helpSlaMinutes: Number(process.env.HELP_SLA_MINUTES || 45),
  helpSlaScanMs: Number(process.env.HELP_SLA_SCAN_MS || 5 * 60 * 1000),
  helpSlaStatePath: path.resolve(__dirname, '../data/help-sla-state.json'),
  helpSlaChannels: String(process.env.HELP_SLA_CHANNELS || 'dsa-help,aptitude-help,lld-help,interview-help')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
  helpSlaResolverRoles: String(process.env.HELP_SLA_RESOLVER_ROLES || 'Mentor,Moderator,Admin,Event Host')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean),
};
