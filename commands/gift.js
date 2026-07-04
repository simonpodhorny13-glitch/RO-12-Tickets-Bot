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

  async execute(interaction, { getUser, transactions, treasury }) {
    const sender = getUser(interaction.user.id);
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    // 🚫 Self-gift check
    if (interaction.user.id === target.id) {
      return interaction.reply({
        content:
          Math.random() < 0.1
            ? "Gifting to yourself? Greedy."
            : "❌ You cannot gift to yourself.",
        ephemeral: true
      });
    }

    // 🚫 Bot check
    if (target.bot) {
      if (target.id === interaction.client.user.id) {
        return interaction.reply({
          content: "Thanks, but I can’t accept donations 🤖",
          ephemeral: true
        });
      }

      return interaction.reply({
        content: "❌ You cannot gift to bots.",
        ephemeral: true
      });
    }

    // ⚠️ Validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
      return interaction.reply({
        content: "❌ Amount must be a positive number.",
        ephemeral: true
      });
    }

    // 🚫 Anti-whale limit
    if (amount > 100000) {
      return interaction.reply({
        content: "❌ That amount is too large.",
        ephemeral: true
      });
    }

    // 💸 Fee system (5%)
    const feeRate = 0.05;
    const fee = Math.ceil(amount * feeRate);
    const totalCost = amount + fee;

    // 💳 Balance check
    if (!sender.balance || sender.balance < totalCost) {
      return interaction.reply({
        content: `❌ Not enough balance.\n💸 Required: $${totalCost} (including $${fee} fee)`,
        ephemeral: true
      });
    }

    const receiver = getUser(target.id);

    // 💰 Execute transaction
    sender.balance -= totalCost;
    receiver.balance = (receiver.balance || 0) + amount;

    // 🏦 Treasury cut (optional but recommended)
    if (treasury && typeof treasury.balance === "number") {
      treasury.balance += fee;
    }

    // 📜 Log transaction
    if (Array.isArray(transactions)) {
      transactions.push({
        id: Date.now(),
        type: "gift",
        from: sender.id,
        to: receiver.id,
        amount,
        fee,
        totalCost,
        timestamp: Date.now()
      });
    }

    // 🎲 Message system
    let message = `🎁 Gift sent to ${target.username}.`;
    const roll = Math.random();

    // 💸 $1–$5 roast (10% chance)
    if (amount >= 1 && amount <= 5) {
      if (roll < 0.10) {
        message = `🎁 Tip sent to ${target.username}. I don't think you really helped them. 😭`;
      }
    }

    // 💸 special 99,999
    else if (amount === 99999) {
      message = `🎁 Gift sent to ${target.username}. You couldn't send a whole 100, could you? 😏`;
    }

    // 💰 max gift
    else if (amount === 100000) {
      message = `🎁 Gift sent to ${target.username}. Can I have some? 😭`;
    }

    // 🏦 big donation
    else if (amount >= 50000) {
      const treasuryDonation = Math.floor(amount * 0.05);
      message = `🎁 Gift sent to ${target.username}. You also donated $${treasuryDonation} to the treasury, thanks! 🏦`;
    }

    // 🎁 Final response
    return interaction.reply({
      content:
        `${message}\n` +
        `💰 Amount: $${amount}\n` +
        `🏦 Fee: $${fee}`,
      ephemeral: true
    });
  }
};
