import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  name: "shoti",
  aliases: [],
  author: "April Manalo",
  description: "Fetch a random TikTok video from Shoti API.",
  usage: [""],
  cooldown: 5,
  access: "anyone",
  category: "entertainment",

  execute: async (bot, msg, args, config, commands) => {
    const chatId = msg.chat.id;
    const log = console; // or replace with your logger if you have one

    try {
      await bot.sendMessage(chatId, "🕛 Fetching TikTok video...");

      const res = await axios.get("https://tikapi-shotiapi.onrender.com/tikrandom");
      const data = res.data;

      if (!data || !data.url) {
        return bot.sendMessage(chatId, "⚠️ No video URL received from API.");
      }

      const videoUrl = data.url;
      const title = data.title || "Untitled";
      const duration = data.duration || "Unknown";

      const filePath = path.join(__dirname, "tikrandom.mp4");

      const writer = fs.createWriteStream(filePath);
      const videoStream = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
      });

      videoStream.data.pipe(writer);

      writer.on("finish", async () => {
        const caption =
          "🎬 𝗧𝗶𝗸𝗧𝗼𝗸 𝗖𝗹𝗶𝗽 𝗙𝗲𝗮𝘁𝘂𝗿𝗲𝗱 🎬\n\n" +
          `📺 𝙑𝙞𝙙𝙚𝙤 𝙏𝙞𝙩𝙡𝙚: ${title}\n` +
          `⏱️ 𝘿𝙪𝙧𝙖𝙩𝙞𝙤𝙣: ${duration}\n\n` +
          `📤 Enjoy your video!`;

        await bot.sendVideo(chatId, fs.createReadStream(filePath), {
          caption,
        });

        fs.unlink(filePath, () => {});
      });

      writer.on("error", (err) => {
        log.error("Error writing video:", err);
        bot.sendMessage(chatId, "⚠️ Failed to save video file.");
      });
    } catch (error) {
      log.error("Error fetching TikTok video:", error);
      bot.sendMessage(
        chatId,
        `⚠️ Could not fetch the video.\n\nError: ${error.message}`
      );
    }
  },
};
