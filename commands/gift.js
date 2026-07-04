const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily $20 reward"),

  async execute(interaction, { getUser }) {
    const user = getUser(interaction.user.id);

    const reward = 20;

    user.balance = Number(user.balance || 0) + reward;

    return interaction.reply({
      content: `🎁 You claimed your daily reward of **$${reward}**!\n💰 New balance: **$${user.balance}**`,
      ephemeral: true
    });
  }
};
