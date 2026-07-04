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
    .setDescription("View your RO-12 profile"),

  async execute(interaction, { data, voyages, getUser }) {
    const user = getUser(interaction.user.id);

    let recent = [];

    for (const [id, v] of Object.entries(voyages || {})) {
      if (v.cabinMap?.[interaction.user.id]) {
        recent.push(`🚢 Voyage #${id} → Cabin ${v.cabinMap[interaction.user.id]}`);
      }

      if (v.seatMap?.[interaction.user.id]) {
        recent.push(`🚢 Voyage #${id} → Seat ${v.seatMap[interaction.user.id]}`);
      }
    }

    recent = recent.slice(-5);

    return interaction.reply({
      embeds: [
        {
          title: "🪪 RO-12 Profile",
          color: 0x00aaff,
          fields: [
            { name: "👤 User", value: interaction.user.username, inline: true },
            { name: "💰 Balance", value: `${user.balance}`, inline: true },
            {
              name: "🎫 Bookings",
              value: recent.length ? recent.join("\n") : "None"
            }
          ]
        }
      ],
      ephemeral: true
    });
  }
};
