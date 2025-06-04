import axios from "axios";

const SEARCH_URL = "https://kaiz-apis.gleeze.com/api/ytsearch";
const DOWNLOAD_URL = "https://kaiz-apis.gleeze.com/api/ytdown-mp3";
const API_KEY = "95c78af8-050f-4d0e-92c1-ddc78b5a4e19";

// Cache search results per user
const trackCache = new Map();

export default {
  name: "ytsearch",
  aliases: ["ytmp3"],
  author: "ChatGPT",
  description: "Search and download YouTube videos as MP3 using Kaiz API.",
  usage: ["ytsearch <video title>"],
  cooldown: 5,
  access: "anyone",
  category: "music",

  async execute(bot, message, args, config, commands, log) {
    const chatId = message.chat.id;
    const userId = message.from.id;

    if (!args.length) {
      return bot.sendMessage(chatId, "❌ Please provide a video title.");
    }

    const query = args.join(" ");
    await bot.sendMessage(chatId, `🔍 Searching YouTube for *${query}*...`, {
      parse_mode: "Markdown"
    });

    try {
      const res = await axios.get(SEARCH_URL, {
        params: { q: query, apikey: API_KEY }
      });

      const results = res.data;
      if (!Array.isArray(results) || results.length === 0) {
        return bot.sendMessage(chatId, "❌ No results found.");
      }

      // Save top 5 results for callback selection
      const topResults = results.slice(0, 5);
      trackCache.set(userId, topResults);

      const keyboard = topResults.map((vid, i) => [{
        text: `${vid.title} (${vid.duration || "?"})`,
        callback_data: `ytmp3_${i}`
      }]);

      await bot.sendMessage(chatId, "🎵 Choose a video to download:", {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (err) {
      log?.error?.("❌ YouTube Search Error:", err.response?.data || err.message);
      return bot.sendMessage(chatId, "❌ Error: " + (err.response?.data?.error?.message || err.message));
    }
  },

  async onCallbackQuery({ bot, callbackQuery, log }) {
    const { data, message, from } = callbackQuery;
    const chatId = message.chat.id;
    const userId = from.id;

    if (!data.startsWith("ytmp3_")) return;

    const index = parseInt(data.split("_")[1]);
    const cachedVideos = trackCache.get(userId);

    if (!cachedVideos || !cachedVideos[index]) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Video not found or expired.",
        show_alert: true
      });
    }

    const video = cachedVideos[index];
    const videoUrl = video.videoUrl || video.url;

    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: message.message_id
    });

    if (!videoUrl || !videoUrl.startsWith("http")) {
      return bot.sendMessage(chatId, "❌ Invalid video URL. Try again.");
    }

    try {
      const res = await axios.get(DOWNLOAD_URL, {
        params: { url: videoUrl, apikey: API_KEY }
      });

      const { title, url, channel, thumbnail } = res.data || {};
      if (!url || !title) {
        return bot.sendMessage(chatId, "⚠️ Failed to download MP3.");
      }

      const caption =
        `🎧 *YouTube MP3*\n\n` +
        `🎵 *Title:* ${title}\n` +
        `📺 *Channel:* ${channel || "Unknown"}\n\n` +
        `📥 Downloading...`;

      if (thumbnail) {
        await bot.sendPhoto(chatId, thumbnail, { caption, parse_mode: "Markdown" });
      } else {
        await bot.sendMessage(chatId, caption, { parse_mode: "Markdown" });
      }

      await bot.sendAudio(chatId, url, {
        title,
        performer: channel || "Unknown"
      });

    } catch (err) {
      log?.error?.("❌ MP3 Download Error:", err.response?.data || err.message);
      return bot.sendMessage(chatId, "❌ Error downloading the video.");
    }
  }
};
