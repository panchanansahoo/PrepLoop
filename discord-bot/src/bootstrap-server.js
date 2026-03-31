import {
  ChannelType,
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
} from 'discord.js';
import { config } from './config.js';

if (!config.guildId) {
  throw new Error('DISCORD_GUILD_ID is required for server bootstrap.');
}

const coreRoles = [
  'Admin',
  'Moderator',
  'Mentor',
  'Event Host',
  'DSA Learner',
  'Aptitude Learner',
  'LLD Learner',
  'Interview Prep',
  '7-Day Streak',
  '30-Day Streak',
  'Top Solver',
  'Top Helper',
];

const blueprint = [
  {
    category: 'START_HERE',
    channels: ['welcome', 'rules', 'verify-and-intros', 'choose-track', 'announcements'],
  },
  {
    category: 'DAILY_PRACTICE',
    channels: ['daily-dsa', 'daily-aptitude', 'daily-lld', 'challenge-submissions', 'hints-and-editorial'],
  },
  {
    category: 'HELP_DESK',
    channels: ['dsa-help', 'aptitude-help', 'lld-help', 'interview-help', 'code-review-clinic'],
  },
  {
    category: 'COMPANY_PREP',
    channels: ['amazon-prep', 'google-prep', 'uber-prep', 'openai-prep', 'company-requests'],
  },
  {
    category: 'MOCK_INTERVIEW',
    channels: ['book-mock', 'upcoming-mocks', 'mock-feedback'],
    voiceChannels: ['voice-mock-room-1', 'voice-mock-room-2'],
  },
  {
    category: 'COMMUNITY',
    channels: ['study-buddy-match', 'wins-and-progress', 'resources', 'off-topic'],
  },
  {
    category: 'GAMIFICATION',
    channels: ['leaderboard', 'streak-wall', 'badges-and-rewards'],
  },
  {
    category: 'STAFF_ONLY',
    channels: ['mod-log', 'reports', 'event-planning', 'mentor-coordination'],
    isStaffOnly: true,
  },
];

function byName(collection, name) {
  const normalized = name.toLowerCase();
  return collection.find((item) => item.name.toLowerCase() === normalized) || null;
}

async function ensureRole(guild, roleName) {
  const existing = byName(guild.roles.cache, roleName);
  if (existing) return existing;
  return guild.roles.create({
    name: roleName,
    mentionable: true,
    reason: 'Preploop Discord bootstrap',
  });
}

async function ensureCategory(guild, name) {
  const existing = guild.channels.cache.find(
    (channel) => channel.type === ChannelType.GuildCategory && channel.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) return existing;
  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    reason: 'Preploop Discord bootstrap',
  });
}

async function ensureChannel(guild, name, type, parentId) {
  const existing = guild.channels.cache.find(
    (channel) => channel.type === type && channel.name.toLowerCase() === name.toLowerCase(),
  );

  if (existing) {
    if (existing.parentId !== parentId) {
      await existing.setParent(parentId, { lockPermissions: false });
    }
    return existing;
  }

  return guild.channels.create({
    name,
    type,
    parent: parentId,
    reason: 'Preploop Discord bootstrap',
  });
}

async function run() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once('ready', async () => {
    try {
      const guild = await client.guilds.fetch(config.guildId);
      await guild.roles.fetch();
      await guild.channels.fetch();

      const roleMap = new Map();
      for (const roleName of coreRoles) {
        const role = await ensureRole(guild, roleName);
        roleMap.set(roleName, role);
      }

      for (const section of blueprint) {
        const category = await ensureCategory(guild, section.category);

        if (section.isStaffOnly) {
          await category.permissionOverwrites.set([
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: roleMap.get('Admin').id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: roleMap.get('Moderator').id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: roleMap.get('Mentor').id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
            {
              id: roleMap.get('Event Host').id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
            },
          ]);
        }

        for (const textName of section.channels || []) {
          const channel = await ensureChannel(guild, textName, ChannelType.GuildText, category.id);
          if (textName === 'announcements') {
            await channel.permissionOverwrites.set([
              {
                id: guild.roles.everyone.id,
                allow: [PermissionFlagsBits.ViewChannel],
                deny: [PermissionFlagsBits.SendMessages],
              },
              {
                id: roleMap.get('Admin').id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              },
              {
                id: roleMap.get('Moderator').id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
              },
            ]);
          }
        }

        for (const voiceName of section.voiceChannels || []) {
          await ensureChannel(guild, voiceName, ChannelType.GuildVoice, category.id);
        }
      }

      console.log('Preploop Discord bootstrap complete.');
    } catch (error) {
      console.error('Bootstrap failed:', error);
      process.exitCode = 1;
    } finally {
      client.destroy();
    }
  });

  await client.login(config.discordToken);
}

run().catch((error) => {
  console.error('Bootstrap crashed:', error);
  process.exit(1);
});