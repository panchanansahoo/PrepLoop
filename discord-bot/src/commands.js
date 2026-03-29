import {
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { preploopApi } from './preploopApi.js';
import { getLinkedToken, removeLinkedToken, setLinkedToken } from './linkStore.js';

function truncate(text, max = 3500) {
  const safe = String(text || '').trim();
  return safe.length <= max ? safe : `${safe.slice(0, max - 3)}...`;
}

function requireLinkedToken(config, interaction) {
  const token = getLinkedToken(config.linksFilePath, interaction.user.id);
  if (!token) {
    return {
      error: 'Your Discord account is not linked yet. Run `/link token:<your_preploop_jwt>` first.',
      token: null,
    };
  }
  return { error: null, token };
}

function pickProblem(problems, difficulty) {
  const list = Array.isArray(problems?.problems) ? problems.problems : Array.isArray(problems) ? problems : [];
  if (!list.length) return null;

  const filtered = difficulty
    ? list.filter((p) => String(p?.difficulty || '').toLowerCase() === difficulty.toLowerCase())
    : list;

  if (!filtered.length) return null;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export const commandBuilders = [
  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),

  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Preploop account token with Discord')
    .addStringOption((option) =>
      option
        .setName('token')
        .setDescription('Your Preploop JWT token from the web app')
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('Remove your linked Preploop token from this bot'),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Get a daily practice problem')
    .addStringOption((option) =>
      option
        .setName('track')
        .setDescription('Current starter supports dsa track')
        .setRequired(true)
        .addChoices(
          { name: 'dsa', value: 'dsa' },
          { name: 'aptitude', value: 'aptitude' },
          { name: 'lld', value: 'lld' },
        ),
    )
    .addStringOption((option) =>
      option
        .setName('difficulty')
        .setDescription('Optional difficulty filter')
        .setRequired(false)
        .addChoices(
          { name: 'easy', value: 'Easy' },
          { name: 'medium', value: 'Medium' },
          { name: 'hard', value: 'Hard' },
        ),
    ),

  new SlashCommandBuilder()
    .setName('streak')
    .setDescription('Show your current Preploop streak'),

  new SlashCommandBuilder()
    .setName('coins')
    .setDescription('Show your current Preploop coin balance'),

  new SlashCommandBuilder()
    .setName('ask-ai')
    .setDescription('Ask the Preploop AI assistant (spends coins)')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('Question to ask')
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('mock-slots')
    .setDescription('List available real interview slots')
    .addStringOption((option) =>
      option
        .setName('date')
        .setDescription('Optional date in YYYY-MM-DD')
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName('mock-book')
    .setDescription('Book a real interview slot by slot ID')
    .addStringOption((option) =>
      option.setName('slot_id').setDescription('Slot ID from /mock-slots').setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName('my-bookings')
    .setDescription('Show your booked interviews'),
].map((builder) => builder.toJSON());

export async function handleCommand(config, interaction) {
  const { commandName } = interaction;

  if (commandName === 'ping') {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong: ${latency}ms`);
    return;
  }

  if (commandName === 'link') {
    const token = interaction.options.getString('token', true).trim();
    if (token.length < 20) {
      await interaction.reply({
        content: 'That token does not look valid. Please paste a full Preploop JWT token.',
        ephemeral: true,
      });
      return;
    }

    setLinkedToken(config.linksFilePath, interaction.user.id, token);
    await interaction.reply({
      content: 'Account linked. You can now use /streak, /coins, /ask-ai, /mock-slots, and /my-bookings.',
      ephemeral: true,
    });
    return;
  }

  if (commandName === 'unlink') {
    removeLinkedToken(config.linksFilePath, interaction.user.id);
    await interaction.reply({ content: 'Link removed successfully.', ephemeral: true });
    return;
  }

  if (commandName === 'daily') {
    const track = interaction.options.getString('track', true);
    const difficulty = interaction.options.getString('difficulty', false);

    if (track !== 'dsa') {
      await interaction.reply({
        content: 'This starter currently fetches from the DSA problem pool. Use track `dsa` for now.',
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();
    const allProblems = await preploopApi.getProblems(config.apiBaseUrl);
    const problem = pickProblem(allProblems, difficulty);

    if (!problem) {
      await interaction.editReply('No problem found for that filter. Try a different difficulty.');
      return;
    }

    const url = problem.leetcodeLink || problem.link || null;
    const embed = new EmbedBuilder()
      .setTitle(`Daily DSA: ${problem.title || 'Practice Problem'}`)
      .setColor(0x818cf8)
      .addFields(
        { name: 'Difficulty', value: String(problem.difficulty || 'Unknown'), inline: true },
        { name: 'Pattern', value: String(problem.pattern || problem.category || 'General'), inline: true },
        { name: 'Problem ID', value: String(problem.id || 'N/A'), inline: true },
      )
      .setDescription(url ? `[Open problem](${url})` : 'No external link available for this problem.');

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  const linked = requireLinkedToken(config, interaction);
  if (linked.error) {
    await interaction.reply({ content: linked.error, ephemeral: true });
    return;
  }

  if (commandName === 'streak') {
    await interaction.deferReply({ ephemeral: true });
    const streak = await preploopApi.getStreak(config.apiBaseUrl, linked.token);
    await interaction.editReply(
      `Streak: ${streak.streak ?? 0} days\nBest streak: ${streak.bestStreak ?? 0}\nBonus coins today: ${streak.bonusCoins ?? 0}`,
    );
    return;
  }

  if (commandName === 'coins') {
    await interaction.deferReply({ ephemeral: true });
    const coins = await preploopApi.getCoins(config.apiBaseUrl, linked.token);
    await interaction.editReply(`Current coin balance: ${coins.coins ?? 0}`);
    return;
  }

  if (commandName === 'ask-ai') {
    const message = interaction.options.getString('message', true).trim();
    if (!message) {
      await interaction.reply({ content: 'Please provide a message.', ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const ai = await preploopApi.askAi(config.apiBaseUrl, linked.token, message);
      const response = truncate(ai.response || 'No response generated.', 1800);
      const spent = Number(ai.spent || 0);
      const coins = ai.coins;
      await interaction.editReply(
        `AI Response:\n\n${response}\n\n${spent > 0 ? `Spent: ${spent} coins` : 'No coins spent'}${coins !== null && coins !== undefined ? ` | Balance: ${coins}` : ''}`,
      );
    } catch (err) {
      if (err.status === 400 && /insufficient coins/i.test(err.message)) {
        await interaction.editReply(`Insufficient coins. You need around ${config.aiChatCoinCost} coins per AI query.`);
        return;
      }
      throw err;
    }
    return;
  }

  if (commandName === 'mock-slots') {
    const date = interaction.options.getString('date', false);
    await interaction.deferReply({ ephemeral: true });
    const slots = await preploopApi.getMockSlots(config.apiBaseUrl, linked.token, date || undefined);

    if (!Array.isArray(slots) || slots.length === 0) {
      await interaction.editReply('No available interview slots found.');
      return;
    }

    const preview = slots.slice(0, 10).map((slot) => {
      const hrName = slot.hr?.full_name || 'HR';
      return `- ID: ${slot.id} | ${slot.slot_date} ${slot.start_time}-${slot.end_time} | ${hrName}`;
    });

    await interaction.editReply(`Available slots:\n${preview.join('\n')}\n\nUse /mock-book slot_id:<id> to reserve one.`);
    return;
  }

  if (commandName === 'mock-book') {
    const slotId = interaction.options.getString('slot_id', true);
    await interaction.deferReply({ ephemeral: true });
    const booked = await preploopApi.bookMockSlot(config.apiBaseUrl, linked.token, slotId);

    const scheduledAt = booked?.interview?.scheduled_at || 'Scheduled';
    await interaction.editReply(`Interview booked successfully. Time: ${scheduledAt}`);
    return;
  }

  if (commandName === 'my-bookings') {
    await interaction.deferReply({ ephemeral: true });
    const bookings = await preploopApi.getMyBookings(config.apiBaseUrl, linked.token);
    if (!Array.isArray(bookings) || bookings.length === 0) {
      await interaction.editReply('No bookings found.');
      return;
    }

    const lines = bookings.slice(0, 10).map((b) => {
      const when = b.slot?.slot_date
        ? `${b.slot.slot_date} ${b.slot.start_time}-${b.slot.end_time}`
        : b.scheduled_at;
      const status = b.status || 'unknown';
      const hrName = b.hr?.full_name || 'HR';
      return `- ${when} | ${hrName} | status: ${status}`;
    });

    await interaction.editReply(`Your bookings:\n${lines.join('\n')}`);
    return;
  }

  await interaction.reply({ content: 'Command not implemented.', ephemeral: true });
}
