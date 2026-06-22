import fs from 'node:fs';
import path from 'node:path';
import { ChannelType, EmbedBuilder } from 'discord.js';
import { preploopApi } from './preploopApi.js';

function getTodayUtcKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
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

function pickProblem(problems) {
  const list = Array.isArray(problems?.problems) ? problems.problems : Array.isArray(problems) ? problems : [];
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

function shouldPostNow(config) {
  const now = new Date();
  return now.getUTCHours() >= config.dailyPostHourUtc;
}

function findTextChannel(guild, name) {
  return guild.channels.cache.find(
    (ch) => ch.type === ChannelType.GuildText && ch.name.toLowerCase() === String(name).toLowerCase(),
  );
}

function scheduleFollowUps(channel, trackLabel, challengeMessage, config) {
  const hintMs = Math.max(0, Number(config.dailyHintDelayHours || 0)) * 60 * 60 * 1000;
  const editorialMs = Math.max(0, Number(config.dailyEditorialDelayHours || 0)) * 60 * 60 * 1000;

  if (hintMs > 0) {
    setTimeout(() => {
      channel
        .send({
          content: `Hint drop for ${trackLabel}: break the problem into constraints, edge cases, and one smallest working example first.`,
          reply: { messageReference: challengeMessage.id },
        })
        .catch((error) => console.error('Daily hint post failed:', error));
    }, hintMs);
  }

  if (editorialMs > 0) {
    setTimeout(() => {
      channel
        .send({
          content: `Editorial prompt for ${trackLabel}: post your final approach, complexity, and one thing you would optimize next time.`,
          reply: { messageReference: challengeMessage.id },
        })
        .catch((error) => console.error('Daily editorial post failed:', error));
    }, editorialMs);
  }
}

async function postDsaChallenge(channel, roleMention, config) {
  let problem = null;
  try {
    const allProblems = await preploopApi.getProblems(config.apiBaseUrl);
    problem = pickProblem(allProblems);
  } catch (error) {
    console.warn('Daily DSA fetch failed, using fallback challenge:', error?.message || error);
  }

  if (!problem) {
    const fallback = new EmbedBuilder()
      .setTitle('Daily DSA Challenge (Fallback)')
      .setColor(0xf59e0b)
      .setDescription(
        [
          'Backend challenge feed is temporarily unavailable.',
          '',
          'Fallback prompt:',
          'Solve one medium-level array or two-pointer problem today and post your complexity analysis in a thread.',
        ].join('\n'),
      )
      .setFooter({ text: 'Tip: when backend is up, /daily track:dsa gives a specific problem.' });

    const posted = await channel.send({ content: `${roleMention}`, embeds: [fallback] });
    scheduleFollowUps(channel, 'DSA', posted, config);
    return;
  }

  const url = problem.leetcodeLink || problem.link || null;
  const embed = new EmbedBuilder()
    .setTitle(`Daily DSA Challenge: ${problem.title || 'Practice Problem'}`)
    .setColor(0x3b82f6)
    .setDescription(
      [
        url ? `[Open problem](${url})` : 'No external link available for this challenge.',
        '',
        'Share your approach in a thread and help at least one peer today.',
      ].join('\n'),
    )
    .addFields(
      { name: 'Difficulty', value: String(problem.difficulty || 'Unknown'), inline: true },
      { name: 'Pattern', value: String(problem.pattern || problem.category || 'General'), inline: true },
    )
    .setFooter({ text: 'Tip: Use /daily track:dsa for another random pick.' });

  const posted = await channel.send({ content: `${roleMention}`, embeds: [embed] });
  scheduleFollowUps(channel, 'DSA', posted, config);
}

async function postGenericTrackChallenge(channel, roleMention, trackLabel, config) {
  const embed = new EmbedBuilder()
    .setTitle(`Daily ${trackLabel} Challenge`)
    .setColor(0x14b8a6)
    .setDescription(
      [
        `Open Preploop and complete one ${trackLabel.toLowerCase()} task today.`,
        '',
        'Thread format:',
        '1) Problem/topic picked',
        '2) Your approach',
        '3) What you learned',
      ].join('\n'),
    );

  const posted = await channel.send({ content: `${roleMention}`, embeds: [embed] });
  scheduleFollowUps(channel, trackLabel, posted, config);
}

export function startDailyPoster(client, config) {
  if (!config.enableDailyPoster) {
    return;
  }

  const tick = async () => {
    if (!shouldPostNow(config)) return;
    const guild = config.guildId ? client.guilds.cache.get(config.guildId) : client.guilds.cache.first();
    if (!guild) return;

    const today = getTodayUtcKey();
    const state = loadState(config.dailyPostStatePath);
    if (!state[guild.id]) {
      state[guild.id] = {};
    }

    const roleByName = (name) => guild.roles.cache.find((r) => r.name.toLowerCase() === name.toLowerCase());
    const roleMention = {
      dsa: roleByName('DSA Learner')?.toString() || '@DSA Learner',
      aptitude: roleByName('Aptitude Learner')?.toString() || '@Aptitude Learner',
      lld: roleByName('LLD Learner')?.toString() || '@LLD Learner',
    };

    const channels = {
      dsa: findTextChannel(guild, config.dailyChannelDsa),
      aptitude: findTextChannel(guild, config.dailyChannelAptitude),
      lld: findTextChannel(guild, config.dailyChannelLld),
    };

    try {
      if (channels.dsa && state[guild.id][channels.dsa.id] !== today) {
        await postDsaChallenge(channels.dsa, roleMention.dsa, config);
        state[guild.id][channels.dsa.id] = today;
      }

      if (channels.aptitude && state[guild.id][channels.aptitude.id] !== today) {
        await postGenericTrackChallenge(channels.aptitude, roleMention.aptitude, 'Aptitude', config);
        state[guild.id][channels.aptitude.id] = today;
      }

      if (channels.lld && state[guild.id][channels.lld.id] !== today) {
        await postGenericTrackChallenge(channels.lld, roleMention.lld, 'LLD', config);
        state[guild.id][channels.lld.id] = today;
      }

      saveState(config.dailyPostStatePath, state);
    } catch (error) {
      console.error('Daily poster error:', error);
    }
  };

  tick().catch((error) => console.error('Daily poster initial tick failed:', error));
  setInterval(() => {
    tick().catch((error) => console.error('Daily poster tick failed:', error));
  }, 5 * 60 * 1000);
}