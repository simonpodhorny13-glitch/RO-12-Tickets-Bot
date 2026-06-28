const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your current balance"),

  async execute(interaction, { getUser }) {
    const user = getUser(interaction.user.id);

    return interaction.reply({
      content: `💰 Your balance: $${user.balance}`,
      ephemeral: true,
    });
  },
};
