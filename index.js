import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs-extra';
import path, { dirname as getDirname } from 'path';
import chalk from 'chalk';
import figlet from 'figlet';
import express from 'express';
import { fileURLToPath } from 'url';
import config from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirname(__filename);

// Banner
console.log(
  chalk.green(figlet.textSync(config.botFileName || 'TelegramBot', { font: 'Standard' }))
);
console.log(chalk.cyan(`🤖 Bot Name: ${config.botName}`));
console.log(chalk.cyan(`👑 Owner: ${config.ownerName}`));
console.log(chalk.cyan(`📦 Prefix: ${config.prefix}`));
console.log(chalk.yellow(`🚀 Starting bot...`));

// Initialize Telegram bot
const bot = new TelegramBot(config.token, { polling: true });

// Load commands
const commands = new Map();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = await fs.readdir(commandsPath);

for (const file of commandFiles) {
  if (file.endsWith('.js')) {
    try {
      const { default: command } = await import(`./commands/${file}`);
      if (!command.name || typeof command.execute !== 'function') {
        console.warn(chalk.red(`❌ Invalid command: ${file}`));
        continue;
      }
      commands.set(command.name, command);
      console.log(chalk.green(`✅ Loaded command: ${command.name}`));
    } catch (err) {
      console.error(chalk.red(`❌ Failed to load ${file}:`), err);
    }
  }
}

// Load events
const eventsPath = path.join(__dirname, 'events');
if (await fs.pathExists(eventsPath)) {
  const eventFiles = await fs.readdir(eventsPath);
  for (const file of eventFiles) {
    if (file.endsWith('.js')) {
      try {
        const { default: event } = await import(`./events/${file}`);
        if (typeof event === 'function') {
          event({ bot, config, commands });
          console.log(chalk.green(`✅ Loaded event: ${file}`));
        } else {
          console.warn(chalk.red(`❌ Event must export a function: ${file}`));
        }
      } catch (err) {
        console.error(chalk.red(`❌ Failed to load event ${file}:`), err);
      }
    }
  }
}

// Express Web UI
const app = express();
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.listen(3000, () => console.log(chalk.green(`🌐 Web UI running at http://localhost:3000`)));

// Message handling
bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.username
    ? `@${msg.from.username}`
    : `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim();

  console.log(chalk.blue(`[MESSAGE] From ${userName} (${userId}) in ${msg.chat.type}: ${msg.text}`));

  const text = msg.text.trim();
  if (!text.startsWith(config.prefix)) return;

  const args = text.slice(config.prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();

  const command = commands.get(cmdName);
  if (!command) {
    console.log(chalk.yellow(`⚠️ Unknown command: ${cmdName}`));
    return;
  }

  try {
    await command.execute(bot, msg, args, config, commands);
  } catch (err) {
    console.error(chalk.red(`[COMMAND ERROR] ${cmdName}:`), err);
    bot.sendMessage(chatId, '❌ Error while executing the command.');
  }
});

// Handle inline buttons
bot.on('callback_query', async (cb) => {
  for (const command of commands.values()) {
    if (typeof command.onCallbackQuery === 'function') {
      try {
        await command.onCallbackQuery({ bot, callbackQuery: cb, log: console });
      } catch (err) {
        console.error(chalk.red(`[CALLBACK ERROR]`), err);
        bot.answerCallbackQuery(cb.id, { text: "❌ Error processing action", show_alert: true });
      }
    }
  }
});
