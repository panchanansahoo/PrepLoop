import fs from 'node:fs';
import path from 'node:path';
import { ChannelType } from 'discord.js';

function loadState(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveState(filePath, state) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));
}

function utcDateKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

function isHelpChannel(channel, names) {
  return channel && channel.type === ChannelType.GuildText && names.has(String(channel.name || '').toLowerCase());
}

function isResolvedByName(thread) {
  return /^\[resolved\]/i.test(String(thread.name || '').trim());
}

async function hasSupportReply(thread, supportRoleIds) {
  try {
    const messages = await thread.messages.fetch({ limit: 25 });
    for (const message of messages.values()) {
      if (message.author.bot) continue;
      const member = await thread.guild.members.fetch(message.author.id).catch(() => null);
      if (!member) continue;
      const hasSupportRole = member.roles.cache.some((role) => supportRoleIds.has(role.id));
      if (hasSupportRole) return true;
    }
    return false;
  } catch {
    // If fetch fails, keep conservative and do not auto-resolve.
    return false;
  }
}

export function startHelpSlaMonitor(client, config) {
  if (!config.enableHelpSlaMonitor) return;

  const helpNames = new Set(config.helpSlaChannels.map((n) => n.toLowerCase()));

  const tick = async () => {
    const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
    if (!guild) return;

    const mentorRole = guild.roles.cache.find((r) => r.name.toLowerCase() === 'mentor');
    if (!mentorRole) return;

    const supportRoleIds = new Set(
      guild.roles.cache
        .filter((role) => config.helpSlaResolverRoles.some((name) => role.name.toLowerCase() === name.toLowerCase()))
        .map((role) => role.id),
    );

    supportRoleIds.add(mentorRole.id);

    const state = loadState(config.helpSlaStatePath);
    const today = utcDateKey();

    const channels = guild.channels.cache.filter((channel) => isHelpChannel(channel, helpNames));

    for (const channel of channels.values()) {
      try {
        const active = await channel.threads.fetchActive();
        for (const thread of active.threads.values()) {
          if (thread.archived || thread.locked) continue;

          if (!state[thread.id]) state[thread.id] = {};

          if (state[thread.id].resolved || isResolvedByName(thread)) {
            state[thread.id].resolved = true;
            if (!state[thread.id].resolvedAt) {
              state[thread.id].resolvedAt = new Date().toISOString();
            }
            continue;
          }

          const supportReply = await hasSupportReply(thread, supportRoleIds);
          if (supportReply) {
            state[thread.id].resolved = true;
            state[thread.id].resolvedAt = new Date().toISOString();
            state[thread.id].resolvedBy = 'support-reply';
            continue;
          }

          const referenceTime = thread.createdTimestamp || Date.now();
          const ageMinutes = (Date.now() - referenceTime) / (1000 * 60);

          if (ageMinutes < config.helpSlaMinutes) continue;
          if (state[thread.id].lastPingDay === today) continue;

          await thread.send(`${mentorRole} SLA alert: this doubt thread has been unresolved for ${config.helpSlaMinutes}+ minutes.`);
          state[thread.id].lastPingDay = today;
          state[thread.id].lastPingAt = new Date().toISOString();
        }
      } catch (error) {
        console.error(`SLA monitor channel error (${channel.name}):`, error?.message || error);
      }
    }

    saveState(config.helpSlaStatePath, state);
  };

  tick().catch((error) => console.error('Help SLA monitor initial tick failed:', error));
  setInterval(() => {
    tick().catch((error) => console.error('Help SLA monitor tick failed:', error));
  }, config.helpSlaScanMs);
}