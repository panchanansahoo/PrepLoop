import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
};
