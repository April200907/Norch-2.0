export default ({ bot, config, commands }) => {
  const prefix = config.prefix; // e.g. "!"

  bot.on('message', (msg) => {
    if (!msg.text) return;

    const text = msg.text.trim();

    let cmdName = null;
    let args = [];

    if (text.startsWith(prefix)) {
      // Command with prefix, e.g. "!gpt hello"
      args = text.slice(prefix.length).trim().split(/\s+/);
      cmdName = args.shift().toLowerCase();
    } else if (text.startsWith('?')) {
      // Slash command, e.g. "/gpt@MyBot hello" or "/gpt hello"
      const firstWord = text.split(/\s+/)[0]; // "/gpt@MyBot"
      // Remove leading slash and optional bot username after @
      const slashCmd = firstWord.slice(1).split('@')[0].toLowerCase();

      cmdName = slashCmd;
      // Now get args after the first word
      args = text.split(/\s+/).slice(1);
    } else {
      // Not a command, ignore
      return;
    }

    // Get command from map
    const command = commands.get(cmdName);
    if (!command) return;

    try {
      command.execute(bot, msg, args, config, commands);
    } catch (err) {
      bot.sendMessage(msg.chat.id, '❌ Error while executing the command.');
      console.error(`[COMMAND ERROR] ${cmdName}:`, err);
    }
  });
};
