const { SlashCommandBuilder } = require("discord.js");

function formatTime(ms) {
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const days = Math.floor(hr / 24);

  return `${days}d ${hr % 24}h ${min % 60}m`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your RO-12 passenger profile"),

  async execute(interaction, { data, voyages }) {
    const userId = interaction.user.id;
    const user = getUser(userId);

    if (!user) {
      return interaction.reply({
        content: "❓️ No profile found.",
        ephemeral: true
      });
    }

    user.balance = Number(user.balance || 0);
    const firstSeen = user.firstSeen || Date.now();

    const timeHere = formatTime(Date.now() - firstSeen);

    let recent = [];

    for (const [voyageId, v] of Object.entries(voyages || {})) {
      if (v.cabinMap?.[userId]) {
        recent.push(`🚢 Voyage #${voyageId} → Cabin ${v.cabinMap[userId]}`);
      }

      if (v.seatMap?.[userId]) {
        recent.push(`🚢 Voyage #${voyageId} → Seat ${v.seatMap[userId]}`);
      }
    }

    recent = recent.slice(-5);

    return interaction.reply({
      embeds: [
        {
          title: "🪪 RO-12 Passenger Profile",
          color: 0x00aaff,
          fields: [
            {
              name: "👤 Username",
              value: interaction.user.username,
              inline: true
            },
            {
              name: "🎭 Role",
              value: "Passenger",
              inline: true
            },
            {
              name: "💰 Balance",
              value: `${user.balance} credits`,
              inline: true
            },
            {
              name: "⏱️ In-server time",
              value: timeHere,
              inline: false
            },
            {
              name: "🎫 Recent bookings",
              value: recent.length
                ? recent.join("\n")
                : "No bookings yet",
              inline: false
            }
          ]
        }
      ],
      ephemeral: true
    });
  }
};
