import axios from "axios";

// Constants
const SEARCH_URL = "https://kaiz-apis.gleeze.com/api/spotify-search";
const DOWNLOAD_URL = "https://kaiz-apis.gleeze.com/api/spankbang-dl";
const API_KEY = "95c78af8-050f-4d0e-92c1-ddc78b5a4e19";

// Cache search results per user
const trackCache = new Map();

export default {
  name: "spotify",
  aliases: [],
  author: "GPT Fix",
  description: "Search and download a Spotify track using Kaiz API.",
  usage: ["spotify <song name>"],
  cooldown: 5,
  access: "anyone",
  category: "music",

  async execute(bot, message, args, config, commands, log) {
    const chatId = message.chat.id;
    const userId = message.from.id;

    if (!args.length) {
      return bot.sendMessage(chatId, "❌ Please provide a song name.");
    }

    const query = args.join(" ");
    await bot.sendMessage(chatId, `🔍 Searching for *${query}* on Spotify...`, { parse_mode: 'Markdown' });

    try {
      const { data } = await axios.get(SEARCH_URL, {
        params: { q: query, apikey: API_KEY }
      });

      console.log("🔍 Full search results:", data);

      if (!Array.isArray(data) || data.length === 0) {
        return bot.sendMessage(chatId, "❌ No results found.");
      }

      const results = data.slice(0, 5);
      trackCache.set(userId, results);

      const keyboard = results.map((track, i) => [{
        text: `${track.title} (${track.duration || "?"})`,
        callback_data: `spotify_${i}`
      }]);

      await bot.sendMessage(chatId, "🎶 Select a track to download:", {
        reply_markup: { inline_keyboard: keyboard }
      });

    } catch (err) {
      log?.error?.("❌ Spotify Search Error:", err.response?.data || err.message);
      return bot.sendMessage(chatId, "❌ Search Error: " + (err.response?.data?.error?.message || err.message));
    }
  },

  async onCallbackQuery({ bot, callbackQuery, log }) {
    const { data, message, from } = callbackQuery;
    const chatId = message.chat.id;
    const userId = from.id;

    if (!data.startsWith("spotify_")) return;

    const index = parseInt(data.split("_")[1]);
    const cachedTracks = trackCache.get(userId);

    if (!cachedTracks || !cachedTracks[index]) {
      return bot.answerCallbackQuery(callbackQuery.id, {
        text: "❌ Track not found or expired.",
        show_alert: true
      });
    }

    const track = cachedTracks[index];

    // Log for debugging
    console.log("🎧 Selected track:", track);

    // Determine actual track URL field (adjust if API changes)
    const trackUrl = track.url || track.trackUrl || track.link || "";

    if (!trackUrl || !trackUrl.startsWith("http")) {
      return bot.sendMessage(chatId, "❌ Invalid track URL.");
    }

    await bot.answerCallbackQuery(callbackQuery.id);
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: chatId,
      message_id: message.message_id
    });

    try {
      const { data } = await axios.get(DOWNLOAD_URL, {
        params: { url: trackUrl, apikey: API_KEY }
      });

      const { title, url, artist, thumbnail } = data || {};
      if (!url || !title) {
        return bot.sendMessage(chatId, "⚠️ Failed to download track.");
      }

      const caption =
        "🎧 *𝗦𝗽𝗼𝘁𝗶𝗳𝘆 𝗧𝗿𝗮𝗰𝗸 𝗙𝗲𝘁𝗰𝗵𝗲𝗱*\n\n" +
        `🎵 *Title:* ${title}\n` +
        `👤 *Artist:* ${artist || "Unknown"}\n\n` +
        "📥 Downloading audio...";

      if (thumbnail) {
        await bot.sendPhoto(chatId, thumbnail, { caption, parse_mode: "Markdown" });
      } else {
        await bot.sendMessage(chatId, caption, { parse_mode: "Markdown" });
      }

      await bot.sendAudio(chatId, url, {
        title,
        performer: artist || "Unknown"
      });

    } catch (err) {
      log?.error?.("❌ Download Error:", err.response?.data || err.message);
      await bot.sendMessage(chatId, "❌ Error downloading the track.");
    }
  }
};
