import { ChannelType, Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  const parsed = dotenv.parse(fs.readFileSync(envPath, 'utf8'));
  for (const [key, value] of Object.entries(parsed)) {
    process.env[key] = value;
  }
}

const requiredRoles = [
  'Admin',
  'Moderator',
  'Mentor',
  'Event Host',
  'DSA Learner',
  'Aptitude Learner',
  'LLD Learner',
  'Interview Prep',
];

const requiredTextChannels = [
  'announcements',
  'daily-dsa',
  'daily-aptitude',
  'daily-lld',
  'dsa-help',
  'aptitude-help',
  'lld-help',
  'interview-help',
  'choose-track',
  'verify-and-intros',
];

function printCheck(ok, label, details = '') {
  const status = ok ? '[OK] ' : '[WARN]';
  const suffix = details ? ` - ${details}` : '';
  console.log(`${status} ${label}${suffix}`);
}

function envBool(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
}

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function buildRuntimeConfig() {
  return {
    discordToken: process.env.DISCORD_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
    apiBaseUrl: process.env.PREPLOOP_API_URL || '',
    enableDailyPoster: envBool('ENABLE_DAILY_POSTER', false),
    enableHelpSlaMonitor: envBool('ENABLE_HELP_SLA_MONITOR', false),
    enableOnboardingDm: envBool('ENABLE_ONBOARDING_DM', true),
    dailyChannelDsa: process.env.DAILY_CHANNEL_DSA || 'daily-dsa',
    dailyChannelAptitude: process.env.DAILY_CHANNEL_APTITUDE || 'daily-aptitude',
    dailyChannelLld: process.env.DAILY_CHANNEL_LLD || 'daily-lld',
    helpSlaChannels: String(process.env.HELP_SLA_CHANNELS || 'dsa-help,aptitude-help,lld-help,interview-help')
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
    helpSlaMinutes: envNumber('HELP_SLA_MINUTES', 45),
  };
}

function summarizeConfig(cfg) {
  printCheck(Boolean(cfg.discordToken), 'DISCORD_TOKEN present');
  printCheck(Boolean(cfg.clientId), 'DISCORD_CLIENT_ID present');
  printCheck(Boolean(cfg.apiBaseUrl), 'PREPLOOP_API_URL present', cfg.apiBaseUrl || 'missing');
  printCheck(Boolean(cfg.guildId), 'DISCORD_GUILD_ID present', cfg.guildId || 'missing (recommended)');
  printCheck(true, 'ENABLE_DAILY_POSTER', String(cfg.enableDailyPoster));
  printCheck(true, 'ENABLE_HELP_SLA_MONITOR', String(cfg.enableHelpSlaMonitor));
  printCheck(true, 'ENABLE_ONBOARDING_DM', String(cfg.enableOnboardingDm));
}

async function main() {
  const config = buildRuntimeConfig();
  console.log('Preploop Discord Doctor\n');
  summarizeConfig(config);

  if (!config.discordToken) {
    printCheck(false, 'Guild checks skipped', 'DISCORD_TOKEN is required to query guild data');
    process.exitCode = 1;
    return;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    try {
      let guild = null;

      if (config.guildId) {
        try {
          guild = await client.guilds.fetch(config.guildId);
        } catch (err) {
          if (err?.code === 10004 || /Unknown Guild/i.test(err?.message || '')) {
            const visibleGuilds = [...client.guilds.cache.values()].map((g) => `${g.name} (${g.id})`);
            printCheck(false, 'Configured DISCORD_GUILD_ID access', 'Unknown Guild for this bot token');
            if (visibleGuilds.length > 0) {
              printCheck(true, 'Bot currently visible guilds', visibleGuilds.join(' | '));
            } else {
              printCheck(false, 'Bot currently visible guilds', 'None. Invite the bot to your target server first.');
            }
            process.exitCode = 1;
            return;
          }
          throw err;
        }
      } else {
        guild = client.guilds.cache.first();
      }

      if (!guild) {
        printCheck(false, 'Guild discovery', 'No guild found for bot');
        process.exitCode = 1;
        return;
      }

      await guild.roles.fetch();
      await guild.channels.fetch();

      printCheck(true, 'Guild connected', `${guild.name} (${guild.id})`);

      const roleNames = new Set(guild.roles.cache.map((r) => r.name.toLowerCase()));
      const missingRoles = requiredRoles.filter((name) => !roleNames.has(name.toLowerCase()));
      printCheck(missingRoles.length === 0, 'Required roles', missingRoles.length ? `Missing: ${missingRoles.join(', ')}` : 'All found');

      const textChannels = guild.channels.cache
        .filter((ch) => ch.type === ChannelType.GuildText)
        .map((ch) => ch.name.toLowerCase());
      const textSet = new Set(textChannels);

      const missingChannels = requiredTextChannels.filter((name) => !textSet.has(name.toLowerCase()));
      printCheck(
        missingChannels.length === 0,
        'Required text channels',
        missingChannels.length ? `Missing: ${missingChannels.join(', ')}` : 'All found',
      );

      if (config.enableDailyPoster) {
        const dailyMissing = [config.dailyChannelDsa, config.dailyChannelAptitude, config.dailyChannelLld]
          .filter((name) => !textSet.has(String(name).toLowerCase()));
        printCheck(
          dailyMissing.length === 0,
          'Daily poster channels',
          dailyMissing.length ? `Missing: ${dailyMissing.join(', ')}` : 'Configured channels exist',
        );
      }

      if (config.enableHelpSlaMonitor) {
        const slaMissing = config.helpSlaChannels.filter((name) => !textSet.has(String(name).toLowerCase()));
        printCheck(
          slaMissing.length === 0,
          'Help SLA channels',
          slaMissing.length
            ? `Missing: ${slaMissing.join(', ')} | SLA=${config.helpSlaMinutes}m`
            : `All monitored channels exist | SLA=${config.helpSlaMinutes}m`,
        );
      }
    } catch (error) {
      printCheck(false, 'Doctor run failed', error?.message || String(error));
      process.exitCode = 1;
    } finally {
      client.destroy();
    }
  });

  await client.login(config.discordToken);
}

main().catch((error) => {
  console.error('Doctor crashed:', error);
  process.exit(1);
});