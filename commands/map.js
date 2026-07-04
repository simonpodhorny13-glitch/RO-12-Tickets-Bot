const fs = require("fs");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("map")
    .setDescription("View cabin or seat map for a voyage")
    .addStringOption(option =>
      option.setName("voyage")
        .setDescription("Voyage ID")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("type")
        .setDescription("cabins or seats")
        .setRequired(true)
        .addChoices(
          { name: "cabins", value: "cabins" },
          { name: "seats", value: "seats" }
        )
    ),

  async execute(interaction) {
    const voyageId = interaction.options.getString("voyage");
    const type = interaction.options.getString("type");

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const voyage = data.voyages?.[voyageId];

    if (!voyage) {
      return interaction.reply({
        content: "❌ Voyage not found.",
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
        },
        {
          name: "🛏️ First Class",
          value:
            `1C ${isTaken("1C")}  |  1D ${isTaken("1D")}\n` +
            `2C ${isTaken("2C")}  |  2D ${isTaken("2D")}`,
        },
        {
          name: "🛏️ Double Economy",
          value:
            `3A ${isTaken("3A")}  |  3B ${isTaken("3B")}\n` +
            `3C ${isTaken("3C")}  |  3D ${isTaken("3D")}`,
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
        value: seatGrid
      });
    }

    return interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  }
};
