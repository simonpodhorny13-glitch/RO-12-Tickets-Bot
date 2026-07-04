const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setbalance")
    .setDescription("Set a user's balance (admin only)")
    .addUserOption(option =>
      option.setName("user").setDescription("Target user").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount").setDescription("New balance").setRequired(true)
    ),

  async execute(interaction, { getUser }) {
    const member = interaction.member;

    const allowed =
      member.permissions?.has("Administrator") ||
      member.roles?.cache?.some(r =>
        ["1519406529495961873", "1519408960803700948"].includes(r.id)
      );

    if (!allowed) {
      return interaction.reply({
        content: "❌ No permission.",
        ephemeral: true
      });
    }

    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const user = getUser(target.id);
    user.balance = amount;

    return interaction.reply({
      content: `✅ Set ${target.username}'s balance to $${amount}`,
      ephemeral: true
    });
  }
};
