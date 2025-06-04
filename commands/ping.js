export default {
  name: 'ping',
  description: 'Ping command',
  execute: async (bot, message) => {
    await bot.sendMessage(message.chat.id, 'Pong!');
  }
};
