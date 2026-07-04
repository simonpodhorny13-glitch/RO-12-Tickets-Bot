const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

const DAILY_REWARD = 20;
const COOLDOWN = 1000 * 60 * 60 * 24;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily RO-12 reward"),

  async execute(interaction) {
    const userId = interaction.user.id;

    let data = {};
    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      console.log("⚠️ data.json error:", err);
      data = { users: {} };
    }

    if (!data.users) data.users = {};

    if (!data.users[userId]) {
      data.users[userId] = {
        balance: 0,
        lastDaily: 0
      };
    }

    const user = data.users[userId];
    const now = Date.now();

    const last = Number(user.lastDaily || 0);

    if (last && now - last < COOLDOWN) {
      const remaining = COOLDOWN - (now - last);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      return interaction.reply({
        content: `⏳ You already claimed your daily reward. Try again in ${hours}h ${minutes}m.`,
        ephemeral: true
      });
    }

    user.balance = Number(user.balance || 0) + DAILY_REWARD;
    user.lastDaily = now;

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `✅ Claimed daily reward: $${DAILY_REWARD}`,
      ephemeral: true
    });
  }
};
