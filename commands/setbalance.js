const { SlashCommandBuilder } = require("discord.js");

const OWNER_ROLE_ID = "1519408960803700948";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbalance")
    .setDescription("Set a user's balance (Owner only)")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to modify")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("balance")
        .setDescription("New balance")
        .setRequired(true)
        .setMinValue(0)
    ),

  async execute(interaction, { getUser, data, saveData }) {

    if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Only the server owner can use this command.",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");
    const newBalance = interaction.options.getInteger("balance");

    const userData = getUser(target.id);

    const oldBalance = userData.balance;

    userData.balance = newBalance;

    // 🧾 LOG TRANSACTION (IMPORTANT)
    data.transactions.push({
      type: "setbalance",
      userId: target.id,
      oldBalance,
      newBalance,
      performedBy: interaction.user.id,
      timestamp: new Date().toISOString()
    });

    await saveData();

    return interaction.reply({
      content: `✅ Set **${target.username}**'s balance to **$${newBalance.toLocaleString()}**.`,
      ephemeral: true
    });
  }
};
