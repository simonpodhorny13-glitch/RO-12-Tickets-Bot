const { SlashCommandBuilder } = require("discord.js");

const DAY = 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily $20 reward"),

  async execute(interaction, { getUser }) {
    const user = getUser(interaction.user.id);

    const now = Date.now();
    const last = user.lastDaily || 0;

    if (now - last < DAY) {
      const remaining = DAY - (now - last);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining / (1000 * 60)) % 60);

      return interaction.reply({
        content: `⏳ You already claimed your daily!\nCome back in **${hours}h ${minutes}m**.`,
        ephemeral: true
      });
    }

    const reward = 20;

    user.balance = Number(user.balance || 0) + reward;
    user.lastDaily = now;

    return interaction.reply({
      content: `🎁 Daily claimed!\n💰 +$${reward}\n💳 New balance: $${user.balance}`,
      ephemeral: true
    });
  }
};
