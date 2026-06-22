import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { handleCommand, handleRoleButton } from './commands.js';
import { startDailyPoster } from './dailyPoster.js';
import { startHelpSlaMonitor } from './helpSla.js';

const intents = [GatewayIntentBits.Guilds];
if (config.enableOnboardingDm) {
  intents.push(GatewayIntentBits.GuildMembers);
}
if (config.enableHelpSlaMonitor) {
  intents.push(GatewayIntentBits.GuildMessages);
}

const client = new Client({
  intents,
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot ready as ${readyClient.user.tag}`);
  startDailyPoster(client, config);
  startHelpSlaMonitor(client, config);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try {
      await handleRoleButton(interaction);
    } catch (error) {
      console.error(`Button error (${interaction.customId}):`, error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Could not update role right now.', ephemeral: true }).catch(() => {});
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  try {
    await handleCommand(config, interaction);
  } catch (error) {
    console.error(`Command error (${interaction.commandName}):`, error);

    const message = error?.message || 'Unexpected error while processing command.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: `Error: ${message}` }).catch(() => {});
      return;
    }

    await interaction.reply({ content: `Error: ${message}`, ephemeral: true }).catch(() => {});
  }
});

if (config.enableOnboardingDm) {
  client.on(Events.GuildMemberAdd, async (member) => {
    const intro = member.guild.channels.cache.find((ch) => ch.name === 'verify-and-intros');
    const chooseTrack = member.guild.channels.cache.find((ch) => ch.name === 'choose-track');
    const dailyDsa = member.guild.channels.cache.find((ch) => ch.name === 'daily-dsa');

    const lines = [
      `Welcome to Preploop, ${member.user.username}.`,
      '',
      'Quick start checklist:',
      `1) Introduce yourself in ${intro ? intro.toString() : '#verify-and-intros'}`,
      `2) Pick your track in ${chooseTrack ? chooseTrack.toString() : '#choose-track'}`,
      `3) Start today\'s challenge in ${dailyDsa ? dailyDsa.toString() : '#daily-dsa'}`,
      '4) Use /link with your Preploop JWT to unlock streak, coins, AI and mock commands.',
    ];

    await member.send(lines.join('\n')).catch(() => {});
  });
}

client.login(config.discordToken).catch((error) => {
  console.error('Discord login failed:', error);
  process.exit(1);
});
