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

  async execute(interaction, { getUser }) {
    // Owner role check
    if (!interaction.member.roles.cache.has(OWNER_ROLE_ID)) {
      return interaction.reply({
        content: "❌ Only the server owner can use this command.",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");
    const newBalance = interaction.options.getInteger("balance");

    const userData = getUser(target.id);
    userData.balance = newBalance;

    return interaction.reply({
      content: `✅ Set **${target.username}**'s balance to **$${newBalance.toLocaleString()}**.`,
      ephemeral: true
    });
  }
};
