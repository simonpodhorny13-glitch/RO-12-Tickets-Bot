const fs = require("fs");

module.exports = {
  name: "balance",
  description: "Check your balance and bookings",

  async execute(interaction) {
    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const userId = interaction.user.id;

    const user = data.users[userId];

    if (!user) {
      return interaction.reply({
        content: "💰 Balance: $0\nYou have no bookings yet.",
        ephemeral: true
      });
    }

    const balance = user.balance || 0;
    const bookings = user.bookings || {};

    let msg = `💰 Balance: $${balance}\n\n🎟️ Bookings:\n`;

    const voyageIds = Object.keys(bookings);

    if (voyageIds.length === 0) {
      msg += "No active bookings.";
    } else {
      for (const id of voyageIds) {
        const b = bookings[id];

        const typeIcon = b.type === "cabin" ? "🏨 Cabin" : "💺 Seat";

        msg += `\n🚢 Voyage ${id}\n`;
        msg += `${typeIcon}: ${b.location}\n`;
        msg += `💰 Paid: $${b.paid}\n`;
      }
    }

    interaction.reply({
      content: msg,
      ephemeral: true
    });
  }
};
