import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import figlet from 'figlet';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname as getDirname } from 'path';
import config from './config.json' assert { type: 'json' };


// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = getDirname(__filename);

// Banner
console.log(
  chalk.green(
    figlet.textSync(config.botFileName || 'TelegramBot', {
      font: 'Standard',
    })
  )
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
      const { default: command } = await import(path.join(commandsPath, file));

      if (!command || typeof command.name !== 'string' || typeof command.execute !== 'function') {
        console.warn(chalk.red(`❌ Invalid command file: ${file}`));
        continue;
      }

      commands.set(command.name, command);
      console.log(chalk.green(`✅ Loaded command: ${command.name}`));
    } catch (e) {
      console.error(chalk.red(`❌ Error loading command ${file}:`), e);
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
        const { default: event } = await import(path.join(eventsPath, file));

        if (typeof event === 'function') {
          event({ bot, config, commands });
          console.log(chalk.green(`✅ Loaded event: ${file}`));
        } else {
          console.warn(chalk.red(`❌ Invalid event file (must export function): ${file}`));
        }
      } catch (e) {
        console.error(chalk.red(`❌ Error loading event ${file}:`), e);
      }
    }
  }
}


// Express Web UI (serving index.html)
const app = express(); // <--- MAKE SURE THIS IS INCLUDED

// If you want to serve CSS/JS/images from a 'public' folder:
// app.use(express.static(path.join(__dirname, 'public')));

// Serve index.html from root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => {
  console.log(chalk.green(`🌐 Web UI running at http://localhost:3000`));
});


app.listen(3000, () => {
  console.log(chalk.green(`🌐 Web UI running at http://localhost:3000`));
});


app.listen(3000, () => {
  console.log(chalk.green(`🌐 Web UI running at http://localhost:3000`));
});


// Handle incoming messages
bot.on('message', async (msg) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.username
    ? `@${msg.from.username}`
    : `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim();

  // Log message
  console.log(chalk.blue(`[MESSAGE] From ${userName} (${userId}) in ${msg.chat.type}: ${msg.text}`));

  const prefix = config.prefix || '!';
  const text = msg.text.trim();

  const isCommand = text.startsWith(prefix);
  if (!isCommand) return;

  const args = text.slice(prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();

  if (!commands.has(cmdName)) {
    console.log(chalk.yellow(`⚠️ Unknown command: ${cmdName}`));
    return;
  }

  const command = commands.get(cmdName);

  try {
    await command.execute(bot, msg, args, config, commands);
  } catch (err) {
    console.error(chalk.red(`[COMMAND ERROR] ${cmdName}:`), err);
    bot.sendMessage(chatId, '❌ Error while executing the command.');
  }
});

// Handle callback queries (inline buttons)
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
