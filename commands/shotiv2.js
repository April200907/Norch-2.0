import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  name: "shotiv2",
  aliases: ["shoti2", "tiktokv2"],
  author: "April Manalo",
  description: "Fetch another random TikTok video (v2) from Shoti API.",
  usage: [""],
  cooldown: 5,
  access: "anyone",
  category: "entertainment",

  execute: async (bot, msg, args, config, commands) => {
    const chatId = msg.chat.id;
    const log = console;

    try {
      await bot.sendMessage(chatId, "⏳ Getting another TikTok video...");

      const res = await axios.get("https://shotiv3apiget.onrender.com/tikrandom");
      const data = res.data;

      if (!data || !data.url) {
        return bot.sendMessage(chatId, "⚠️ No video received from API.");
      }

      const videoUrl = data.url;
      const title = data.title || "Untitled";
      const duration = data.duration || "Unknown";

      const filePath = path.join(__dirname, "tikrandom_v2.mp4");

      const writer = fs.createWriteStream(filePath);
      const videoStream = await axios({
        url: videoUrl,
        method: "GET",
        responseType: "stream",
      });

      videoStream.data.pipe(writer);

      writer.on("finish", async () => {
        const caption =
          "🎥 𝗧𝗶𝗸𝗧𝗼𝗸 𝗥𝗲𝗲𝗹 𝗩𝟮 🎥\n\n" +
          `📺 Title: ${title}\n` +
          `🕒 Duration: ${duration}\n\n` +
          `✨ Enjoy the vibe!`;

        await bot.sendVideo(chatId, fs.createReadStream(filePath), {
          caption,
        });

        fs.unlink(filePath, () => {});
      });

      writer.on("error", (err) => {
        log.error("Error writing video:", err);
        bot.sendMessage(chatId, "⚠️ Failed to write video file.");
      });
    } catch (error) {
      log.error("Error fetching TikTok video (v2):", error);
      bot.sendMessage(
        chatId,
        `⚠️ Could not fetch the video.\n\nError: ${error.message}`
      );
    }
  },
};
