const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("cancel")
    .setDescription("Cancel your booking and receive a refund")
    .addStringOption(option =>
      option.setName("voyage")
        .setDescription("Voyage ID")
        .setRequired(true)
    ),

  async execute(interaction) {
    const voyageId = interaction.options.getString("voyage");

    const filePath = "./data.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const userId = interaction.user.id;

    const user = data.users?.[userId];

    if (!user || !user.bookings || !user.bookings[voyageId]) {
      return interaction.reply({
        content: "❌ You have nothing to cancel for this voyage.",
        ephemeral: true
      });
    }

    const voyage = data.voyages?.[voyageId];

    if (!voyage) {
      return interaction.reply({
        content: "❌ Voyage not found.",
        ephemeral: true
      });
    }

    const booking = user.bookings[voyageId];

    // 💰 refund logic (90%)
    const refund = (booking.paid || 0) * 0.9;

    user.balance += refund;

    // 🧹 remove from maps
    if (booking.type === "cabin") {
      if (voyage.cabinMap?.[booking.location]) {
        delete voyage.cabinMap[booking.location];
      }
    }

    if (booking.type === "seat") {
      if (voyage.seatMap?.[booking.location]) {
        delete voyage.seatMap[booking.location];
      }
    }

    // 🧹 remove booking
    delete user.bookings[voyageId];

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `❌ Booking cancelled for **${voyageId}**\n💰 Refund: $${refund.toFixed(2)}`,
      ephemeral: true
    });
  }
};
