const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gift")
    .setDescription("Gift money to another user")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("User to gift money to")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("Amount to gift")
        .setRequired(true)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const senderId = interaction.user.id;
    const receiver = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    if (receiver.id === senderId) {
      return interaction.reply({
        content: "❌ You cannot gift money to yourself.",
        ephemeral: true
      });
    }

    let data = {};
    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      console.log("⚠️ Failed to read data.json:", err);
      return interaction.reply({
        content: "❌ Economy system error. Try again later.",
        ephemeral: true
      });
    }

    if (!data.users) data.users = {};

    // Ensure sender exists safely
    if (!data.users[senderId]) {
      data.users[senderId] = { balance: 0, bookings: {} };
    }

    // Ensure receiver exists safely
    if (!data.users[receiver.id]) {
      data.users[receiver.id] = { balance: 0, bookings: {} };
    }

    const sender = data.users[senderId];
    const recipient = data.users[receiver.id];

    // Normalize balances safely
    sender.balance = Number(sender.balance || 0);
    recipient.balance = Number(recipient.balance || 0);

    if (amount <= 0) {
      return interaction.reply({
        content: "❌ Invalid amount.",
        ephemeral: true
      });
    }

    if (sender.balance < amount) {
      return interaction.reply({
        content: "❌ Not enough balance.",
        ephemeral: true
      });
    }

    // Transfer
    sender.balance -= amount;
    recipient.balance += amount;

    // Optional: transaction log (uses existing structure safely)
    if (!data.claims) data.claims = {};

    const txId = `${Date.now()}_${senderId}`;
    data.claims[txId] = {
      type: "gift",
      from: senderId,
      to: receiver.id,
      amount,
      timestamp: Date.now()
    };

    // Safe write
    try {
      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    } catch (err) {
      console.log("⚠️ Failed to write data.json:", err);
      return interaction.reply({
        content: "❌ Failed to save transaction.",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: `🎁 You gifted **$${amount}** to ${receiver.username}`,
      ephemeral: true
    });
  }
};
