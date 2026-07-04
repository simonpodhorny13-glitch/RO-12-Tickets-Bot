const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Gift credits to another user"),

  async execute(interaction, { getUser }) {
    const sender = getUser(interaction.user.id);

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (!target || !amount || amount <= 0) {
      return interaction.reply({
        content: "❌ Invalid usage.",
        ephemeral: true
      });
    }

    const receiver = getUser(target.id);

    if (sender.balance < amount) {
      return interaction.reply({
        content: "❌ Not enough balance.",
        ephemeral: true
      });
    }

    sender.balance -= amount;
    receiver.balance += amount;

    return interaction.reply({
      content: `🎁 Sent $${amount} to ${target.username}!`,
      ephemeral: true
    });
  }
};
