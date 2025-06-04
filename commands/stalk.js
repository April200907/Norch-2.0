export default {
  name: "stalk",
  aliases: ["info", "userinfo"],
  author: "Lance Cochangco",
  description: "Get detailed information about a user with their profile picture.",
  usage: ["", "@username", "replied to other user's message"],
  access: "anyone",
  cooldown: 5,
  category: "utility",

  execute: async (bot, msg, args, config) => {
    try {
      let targetUser;

      if (msg.reply_to_message) {
        targetUser = msg.reply_to_message.from;
      } else if (args.length > 0) {
        const username = args[0].replace('@', '');
        try {
          const chatMember = await bot.getChatMember(msg.chat.id, `@${username}`);
          targetUser = chatMember.user;
        } catch (error) {
          await bot.sendMessage(msg.chat.id, `User @${username} not found in this chat.`);
          return;
        }
      } else {
        targetUser = msg.from;
      }

      const userInfo = await bot.getUserProfilePhotos(targetUser.id, 0, 1);
      const chatMember = await bot.getChatMember(msg.chat.id, targetUser.id);

      let infoMessage = `👤 User Information:\n\n`;
      infoMessage += `🆔 User ID: ${targetUser.id}\n`;
      infoMessage += `👤 Name: ${targetUser.first_name}${targetUser.last_name ? ' ' + targetUser.last_name : ''}\n`;
      infoMessage += `🏷️ Username: ${targetUser.username ? '@' + targetUser.username : 'Not set'}\n`;
      infoMessage += `🤖 Is Bot: ${targetUser.is_bot ? 'Yes' : 'No'}\n`;
      infoMessage += `🚦 User Status: ${chatMember.status}\n`;

      if (chatMember.status === 'administrator' || chatMember.status === 'creator') {
        infoMessage += `\n👑 Admin Status:\n`;
        infoMessage += `- Administrator: ✅\n`;
      }

      if (userInfo.total_count > 0) {
        const photoFile = userInfo.photos[0][0].file_id;
        await bot.sendPhoto(msg.chat.id, photoFile, { caption: infoMessage });
      } else {
        // If no photo, you can send a placeholder image or just send the text
        await bot.sendMessage(msg.chat.id, infoMessage);
      }
    } catch (error) {
      console.error("Error executing stalk command:", error);
      await bot.sendMessage(msg.chat.id, `An error occurred: ${error.message}`);
    }
  },
};

// Optional: If you want the capitalize function globally, define it somewhere common
String.prototype.capitalize = function () {
  return this.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
