const fs = require("fs");

module.exports = {
  name: "book",
  description: "Book a cabin or seat for a voyage",

  async execute(interaction) {
    const type = interaction.options.getString("type"); // cabin
    const location = interaction.options.getString("location"); // 1A
    const voyageId = interaction.options.getString("voyage"); // 0001

    const filePath = "./data.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const userId = interaction.user.id;

    const voyage = data.voyages[voyageId];

    if (!voyage) {
      return interaction.reply({ content: "❌ Voyage not found.", ephemeral: true });
    }

    if (!voyage.salesOpen) {
      return interaction.reply({ content: "❌ Sales are not open for this voyage.", ephemeral: true });
    }

    if (voyage.cancelled) {
      return interaction.reply({ content: "❌ This voyage is cancelled.", ephemeral: true });
    }

    if (!data.users[userId]) {
      data.users[userId] = {
        balance: 0,
        bookings: {}
      };
    }

    const user = data.users[userId];

    if (!user.bookings) user.bookings = {};

    if (user.bookings[voyageId]) {
      return interaction.reply({ content: "❌ You already booked for this voyage.", ephemeral: true });
    }

    // check if cabin taken
    if (voyage.cabinMap[location]) {
      return interaction.reply({ content: "❌ This cabin is already taken.", ephemeral: true });
    }

    // pricing system
    let price = 50; // economy base

    // first class cabins
    if (["1C", "1D", "2C", "2D"].includes(location)) {
      price = 150;
    }

    // double economy
    if (["3A", "3B", "3C", "3D"].includes(location)) {
      price = 120;
    }

    // voyage multiplier
    if (voyage.length === 2) price *= 1.5;
    if (voyage.length === 3) price *= 2;

    // balance check
    if (user.balance < price) {
      return interaction.reply({ content: "❌ Not enough balance.", ephemeral: true });
    }

    // deduct money
    user.balance -= price;

    // store booking (IMPORTANT for cancel system)
    user.bookings[voyageId] = {
      type: "cabin",
      location,
      paid: price
    };

    // assign cabin
    voyage.cabinMap[location] = userId;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return interaction.reply({
      content: `🛏️ Cabin ${location} booked for voyage ${voyageId}\n💰 Paid: $${price}`,
      ephemeral: true
    });
  }
};
