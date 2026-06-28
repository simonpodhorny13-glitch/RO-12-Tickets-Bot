const fs = require("fs");

module.exports = {
  name: "ticket",
  description: "View your ticket for a voyage",

  async execute(interaction) {
    const voyageId = interaction.options.getString("voyage");

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const userId = interaction.user.id;

    const voyage = data.voyages[voyageId];

    if (!voyage) {
      return interaction.reply({
        content: "❌ Voyage not found.",
        ephemeral: true
      });
    }

    const user = data.users[userId];

    if (!user || !user.bookings || !user.bookings[voyageId]) {
      return interaction.reply({
        content: "❌ You don't have a ticket for this voyage.",
        ephemeral: true
      });
    }

    const b = user.bookings[voyageId];

    const status = voyage.cancelled
      ? "❌ Cancelled"
      : voyage.salesOpen
      ? "🟢 Active"
      : "🟡 Pending";

    const typeLabel = b.type === "cabin" ? "🏨 Cabin" : "💺 Seat";

    const message =
`🎟️ YOUR TICKET

Voyage ID
${voyageId}

From
${voyage.from}

To
${voyage.to}

Ship
${voyage.ship}

Departing
${voyage.date}, ${voyage.time}

Status
${status}

Booking
${typeLabel}: ${b.location}

💰 Paid: $${b.paid}`;

    interaction.reply({
      content: message,
      ephemeral: true
    });
  }
};
