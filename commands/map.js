const fs = require("fs");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "map",
  description: "View cabin or seat map for a voyage",

  async execute(interaction) {
    const voyageId = interaction.options.getString("voyage");
    const type = interaction.options.getString("type"); // cabins or seats

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const voyage = data.voyages[voyageId];

    if (!voyage) {
      return interaction.reply({
        content: "❌ Voyage not found.",
        ephemeral: true
      });
    }

    if (!type || (type !== "cabins" && type !== "seats")) {
      return interaction.reply({
        content: "❌ Type must be 'cabins' or 'seats'.",
        ephemeral: true
      });
    }

    const isCabins = type === "cabins";
    const map = isCabins ? voyage.cabinMap : voyage.seatMap;

    const isTaken = (id) => map?.[id] ? "❌ Taken" : "🟩 Free";

    const embed = new EmbedBuilder()
      .setTitle(`🗺️ RO-12 MAP • Voyage ${voyageId}`)
      .setDescription(
        `🚢 Route: **${voyage.from} → ${voyage.to}**\n` +
        `📦 View: **${type.toUpperCase()}**\n\n` +
        `🟩 Free | ❌ Taken`
      )
      .setColor(0x00bfff);

    if (isCabins) {
      embed.addFields(
        {
          name: "🛏️ Economy",
          value:
            `1A ${isTaken("1A")}  |  1B ${isTaken("1B")}\n` +
            `2A ${isTaken("2A")}  |  2B ${isTaken("2B")}`,
          inline: false
        },
        {
          name: "🛏️ First Class",
          value:
            `1C ${isTaken("1C")}  |  1D ${isTaken("1D")}\n` +
            `2C ${isTaken("2C")}  |  2D ${isTaken("2D")}`,
          inline: false
        },
        {
          name: "🛏️ Double Economy",
          value:
            `3A ${isTaken("3A")}  |  3B ${isTaken("3B")}\n` +
            `3C ${isTaken("3C")}  |  3D ${isTaken("3D")}`,
          inline: false
        }
      );
    } else {
      let seatGrid = "";

      for (let row = 1; row <= 5; row++) {
        let line = "";
        for (let col of ["A", "B", "C", "D", "E"]) {
          const seat = `${row}${col}`;
          line += `${seat}:${map?.[seat] ? "❌" : "🟩"}  `;
        }
        seatGrid += line + "\n";
      }

      embed.addFields({
        name: "💺 Seats Layout",
        value: seatGrid,
        inline: false
      });
    }

    embed.setFooter({ text: "RO-12 Cruise System • Live Map" });
    embed.setTimestamp();

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
