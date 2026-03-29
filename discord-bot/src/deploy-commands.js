import { REST, Routes } from 'discord.js';
import { commandBuilders } from './commands.js';
import { config } from './config.js';

async function main() {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);

  if (config.guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guildId),
      { body: commandBuilders },
    );
    console.log(`Deployed ${commandBuilders.length} guild commands to ${config.guildId}`);
    return;
  }

  await rest.put(Routes.applicationCommands(config.clientId), { body: commandBuilders });
  console.log(`Deployed ${commandBuilders.length} global commands`);
}

main().catch((error) => {
  console.error('Failed to deploy commands:', error);
  process.exit(1);
});
