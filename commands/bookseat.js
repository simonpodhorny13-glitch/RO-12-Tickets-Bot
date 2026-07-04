const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bookseat")
    .setDescription("Book a seat for a voyage")
    .addStringOption(option =>
      option.setName("voyage")
        .setDescription("Voyage ID")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("seat")
        .setDescription("Seat (e.g. 1A, 2B, 3C)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const seat = interaction.options.getString("seat").toUpperCase();
    const voyageId = interaction.options.getString("voyage");

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const userId = interaction.user.id;

    const voyage = data.voyages?.[voyageId];

    if (!voyage) {
      return interaction.reply({ content: "❌ Voyage not found.", ephemeral: true });
    }

    if (!voyage.salesOpen) {
      return interaction.reply({ content: "❌ Sales are not open.", ephemeral: true });
    }

    if (voyage.cancelled) {
      return interaction.reply({ content: "❌ Voyage is cancelled.", ephemeral: true });
    }

    if (!data.users[userId]) {
      data.users[userId] = { balance: 0, bookings: {} };
    }

    const user = data.users[userId];
    if (!user.bookings) user.bookings = {};

    if (user.bookings[voyageId]) {
      return interaction.reply({ content: "❌ You already booked for this voyage.", ephemeral: true });
    }

    // 🧠 VALID SEAT FORMAT
    const validSeat = /^(?:[1-9]|1\d|20)[A-D]$/;
    if (!validSeat.test(seat)) {
      return interaction.reply({
        content: "❌ Invalid seat. Use format like 1A, 2B, 3D.",
        ephemeral: true
      });
    }

    if (!voyage.seatMap) voyage.seatMap = {};

    if (voyage.seatMap[seat]) {
      return interaction.reply({ content: "❌ Seat already taken.", ephemeral: true });
    }

    // 💰 pricing
    let price = 40;

    if (["1A", "1B", "1C", "1D"].includes(seat)) price = 80;
    if (["2A", "2B", "2C", "2D"].includes(seat)) price = 50;

    if (voyage.length === 2) price = Math.round(price * 1.5);
    if (voyage.length === 3) price = Math.round(price * 2);

    if (user.balance < price) {
      return interaction.reply({ content: "❌ Not enough balance.", ephemeral: true });
    }

    user.balance -= price;

    user.bookings[voyageId] = {
      type: "seat",
      location: seat,
      paid: price,
      bookedAt: Date.now()
    };

    voyage.seatMap[seat] = userId;

    // 🧾 TRANSACTION LOG
    if (!data.transactions) data.transactions = [];

    data.transactions.push({
      type: "seat_booking",
      userId,
      voyageId,
      seat,
      amount: -price,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `💺 Seat ${seat} booked for ${voyageId}\n💰 Paid: $${price}`,
      ephemeral: true
    });
  }
};
