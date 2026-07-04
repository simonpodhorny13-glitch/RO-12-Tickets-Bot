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

    // Self-gift prevention
    if (interaction.user.id === target.id) {
      if (Math.random() < 0.1) {
        return interaction.reply({
          content: "Gifting to yourself? Greedy.",
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: "❌️ Cannot gift to yourself.",
          ephemeral: true
        });
      }
    }

    // Prevent gifting to bots
    if (target.bot) {
      // If this bot got gifted
      if (target.id === interaction.client.user.id) {
        return interaction.reply({
          content: "Thanks, this is kind of you but you can't donate to bots like me.",
          ephemeral: true
        });
      } else {
        // Any other bots
        return interaction.reply({
          content: "❌️ Cannot gift to bots.",
          ephemeral: true
        });
      }
    }

    // 3. Checks if amoumt >0
    if (amount <= 0) {
      return interaction.reply({
        content: "❌ Amount must be greater than 0.",
        ephemeral: true
      });
    }

    // Check if enough cash
    if (sender.balance < amount) {
      return interaction.reply({
        content: "❌ You don’t have enough balance.",
        ephemeral: true
      });
    }

    // Run transaction
    const receiver = getUser(target.id);

    sender.balance -= amount;
    receiver.balance += amount;

    return interaction.reply({
      content: `🎁 Sent $${amount} to ${target.username}!`,
      ephemeral: true
    });
  }
};
