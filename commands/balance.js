const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Check your balance"),

  async execute(interaction) {
    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      console.log("Data file error:", err);
    }

    const userId = interaction.user.id;
    const userBalance = data?.users?.[userId]?.balance ?? 0;

    const user = getUser(interaction.user.id);

return interaction.reply({
  content: `💰 Your balance: $${user.balance}`
});
