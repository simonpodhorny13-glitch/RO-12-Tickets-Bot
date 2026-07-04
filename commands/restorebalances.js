const { SlashCommandBuilder } = require("discord.js");

const OWNER_ROLE_ID = "1519408960803700948";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("restorebalances")
    .setDescription("Restore all balances from transaction history (Owner only)"),

  async execute(interaction, { data, saveData }) {
    if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Only the owner can use this command.",
        ephemeral: true
      });
    }

    // Reset all balances
    const users = {};

    // Rebuild from scratch
    for (const tx of data.transactions) {
      const userId = tx.userId;

      if (!users[userId]) {
        users[userId] = { balance: 0 };
      }

      // Apply transaction changes
      if (typeof tx.amount === "number") {
        users[userId].balance += tx.amount;
      }

      if (typeof tx.newBalance === "number") {
        users[userId].balance = tx.newBalance;
      }
    }

    data.users = users;

    await saveData();

    return interaction.reply({
      content: "✅ Balances restored from transactions history.",
      ephemeral: true
    });
  }
};
