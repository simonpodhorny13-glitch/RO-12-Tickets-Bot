const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("View your voyage ticket")
    .addStringOption(option =>
      option.setName("voyage")
        .setDescription("Voyage ID")
        .setRequired(true)
    ),

  async execute(interaction) {
    const voyageId = interaction.options.getString("voyage");
    const userId = interaction.user.id;

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      return interaction.reply({
        content: "❌ Data system error.",
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

    const user = data.users?.[userId];

    if (!user || !user.bookings || !user.bookings[voyageId]) {
      return interaction.reply({
        content: "❌ You have no booking for this voyage.",
        ephemeral: true
      });
    }

    const booking = user.bookings[voyageId];

    // =========================
    // 🧠 SAFE DATA FALLBACKS
    // =========================
    const cabinMap = voyage.cabinMap || {};
    const seatMap = voyage.seatMap || {};
    const crew = voyage.crew || { captain: null, fo: null, gc: null };

    const captain = crew.captain ? "✅ Assigned" : "❌ Missing";
    const fo = crew.fo ? "✅ Assigned" : "❌ Missing";
    const gc = crew.gc ? "✅ Assigned" : "❌ Missing";

    // =========================
    // 🚢 STATUS LOGIC
    // =========================
    let status = "🟡 Preparing";

    if (voyage.cancelled) {
      status = "🔴 Cancelled";
    } else if (voyage.salesOpen) {
      status = "🟢 Sales Open";
    } else if (crew.captain && crew.fo && crew.gc) {
      status = "🟢 Fully Staffed";
    } else if (crew.captain && crew.fo) {
      status = "🟡 Awaiting Ground Crew";
    }

    // =========================
    // 📅 FIXED DEPARTURE FORMAT
    // =========================
    const departure = voyage.departure
      ? voyage.departure
      : `${voyage.date || "TBA"} ${voyage.time || ""}`;

    // =========================
    // 💺 BOOKING INFO
    // =========================
    let bookingInfo = "";

    if (booking.type === "cabin") {
      bookingInfo = `Cabin: ${booking.location}`;
    } else if (booking.type === "seat") {
      bookingInfo = `Seat: ${booking.location}`;
    }

    const paid = booking.paid || 0;

    // =========================
    // 🎟️ TICKET OUTPUT
    // =========================
    return interaction.reply({
      content:
`🎟️ RO-12 BOARDING PASS

Voyage ID
${voyageId}

Route
${voyage.from || "TBA"} → ${voyage.to || "TBA"}

Ship
${voyage.ship || "TBA"}

Departure
${departure}

Status
${status}

Crew Status
Captain: ${captain}
First Officer: ${fo}
Ground Crew: ${gc}

Your Booking
${bookingInfo}

Payment
💰 Paid: $${paid}
`,
      ephemeral: true
    });
  }
};
