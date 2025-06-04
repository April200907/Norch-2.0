export default {
  name: "gpt",
  description: "Ask anything to GPT-4o via Kaiz API",
  usage: ["gpt <your question>"],
  cooldown: 3,
  access: "anyone",
  category: "ai",

  execute: async (bot, msg, args, config) => {
    if (!args.length) {
      return bot.sendMessage(
        msg.chat.id,
        "❓ Please provide a question.\n\nExample: `gpt Anong magandang ulam ngayon?`"
      );
    }

    const question = encodeURIComponent(args.join(" "));
    const uid = msg.from?.id || msg.chat.id;
    const apiUrl = `https://kaiz-apis.gleeze.com/api/gpt-4o?ask=${question}&uid=${uid}&webSearch=off&apikey=95c78af8-050f-4d0e-92c1-ddc78b5a4e19`;

    try {
      await bot.sendMessage(msg.chat.id, "💬 Thinking... Please wait a moment.");

      const res = await fetch(apiUrl);
      const data = await res.json();

      const answer = data.response || "❌ No response from GPT.";

      await bot.sendMessage(msg.chat.id, `🤖 *GPT-4o Response:*\n\n${answer}`, {
        parse_mode: "Markdown",
      });
    } catch (err) {
      console.error("GPT Error:", err);
      await bot.sendMessage(msg.chat.id, "⚠️ Failed to get response. Try again later.");
    }
  },
};
