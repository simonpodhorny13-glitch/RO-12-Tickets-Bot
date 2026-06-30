const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Send RO-12 cash to another user")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to send money to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("amount")
        .setDescription("Amount of money to send")
        .setRequired(true)
    ),

  async execute(interaction) {
    const senderId = interaction.user.id;
    const targetUser = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (targetUser.id === senderId) {
      return interaction.reply({
        content: "❌ You cannot gift money to yourself.",
        ephemeral: true
      });
    }

    if (amount <= 0) {
      return interaction.reply({
        content: "❌ Amount must be greater than 0.",
        ephemeral: true
      });
    }

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));

    if (!data.users) data.users = {};

    if (!data.users[senderId]) data.users[senderId] = { balance: 0 };
    if (!data.users[targetUser.id]) data.users[targetUser.id] = { balance: 0 };

    const senderBalance = data.users[senderId].balance || 0;

    if (senderBalance < amount) {
      return interaction.reply({
        content: "❌ You don't have enough money.",
        ephemeral: true
      });
    }

    data.users[senderId].balance -= amount;
    data.users[targetUser.id].balance += amount;

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `✅ Sent $${amount} to <@${targetUser.id}>`,
      ephemeral: true
    });
  }
};