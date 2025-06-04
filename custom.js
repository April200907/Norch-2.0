import { names } from "module"; // <-- top-level import

const INTERVAL_MINUTES = 30;

export default ({ bot, config }) => {
  const ownerId = config.ownerUID;

  console.log(`[CUSTOM] ${config.botName} will auto-restart every ${INTERVAL_MINUTES} minutes`);

  setInterval(async () => {
    try {
      if (ownerId) {
        await bot.sendMessage(ownerId, `🔁 ${config.botName} is restarting now to stay fresh and stable...`);
      }
      console.log(`[CUSTOM] ${config.botName} restarting...`);
      process.exit(0);
    } catch (err) {
      console.error(`[CUSTOM] Failed to notify owner: ${err.message}`);
      process.exit(0);
    }
  }, INTERVAL_MINUTES * 60 * 1000);
};
