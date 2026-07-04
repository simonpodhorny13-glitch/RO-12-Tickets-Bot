const { SlashCommandBuilder } = require("discord.js");

const ADMIN_ROLE_ID = "1519406529495961873";
const OWNER_ROLE_ID = "1519408960803700948";
const SENIOR_CAPTAIN_ROLE_ID = "1521172459385126922";

function hasAccess(interaction) {
  return (
    interaction.member.roles.cache.has(ADMIN_ROLE_ID) ||
    interaction.member.roles.cache.has(OWNER_ROLE_ID) ||
    interaction.member.roles.cache.has(SENIOR_CAPTAIN_ROLE_ID)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("transactions")
    .setDescription("View transaction history")
    .addUserOption(option =>
      option
        .setName("user")
        .setDescription("User to view transactions for")
        .setRequired(false)
    ),

  async execute(interaction, { data }) {
    const target = interaction.options.getUser("user") || interaction.user;

    const isSelfRequest = target.id === interaction.user.id;
    const isStaff = hasAccess(interaction);

    // 🔐 Permission check
    if (!isSelfRequest && !isStaff) {
      return interaction.reply({
        content: "❌ You can only view your own transactions.",
        ephemeral: true
      });
    }

    const userTx = data.transactions.filter(t => t.userId === target.id);

    if (userTx.length === 0) {
      return interaction.reply({
        content: `📭 No transactions found for **${target.username}**.`,
        ephemeral: true
      });
    }

    // 📊 Format last 10 transactions
    const recent = userTx.slice(-10).reverse();

    const formatted = recent.map(t => {
      const amount = t.amount ? `$${t.amount}` : "";
      const type = t.type.toUpperCase();

      return `• **${type}** ${amount} — <t:${Math.floor(new Date(t.timestamp).getTime() / 1000)}:R>`;
    }).join("\n");

    return interaction.reply({
      content:
        `📊 **Transaction history for ${target.username}**\n\n` +
        formatted,
      ephemeral: true
    });
  }
};
