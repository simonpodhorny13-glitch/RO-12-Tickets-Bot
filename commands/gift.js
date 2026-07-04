const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Send credits to another user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to gift money to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount to send")
        .setRequired(true)
    ),

  async execute(interaction, { getUser }) {
    const sender = getUser(interaction.user.id);
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (amount <= 0) {
      return interaction.reply({
        content: "❌ Amount must be greater than 0.",
        ephemeral: true
      });
    }

    if (sender.balance < amount) {
      return interaction.reply({
        content: "❌ You don’t have enough balance.",
        ephemeral: true
      });
    }

    const receiver = getUser(target.id);

    sender.balance -= amount;
    receiver.balance += amount;

    return interaction.reply({
      content: `🎁 Sent $${amount} to ${target.username}!`,
      ephemeral: true
    });
  }
};
