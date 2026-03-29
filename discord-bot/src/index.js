import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';
import { handleCommand } from './commands.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Discord bot ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
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

client.login(config.discordToken).catch((error) => {
  console.error('Discord login failed:', error);
  process.exit(1);
});
