const fs = require("fs");

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

    let output = `🗺️ VOYAGE ${voyageId} ${type.toUpperCase()}\n\n`;

    if (isCabins) {
      output += `ECONOMY\n`;
      output += `1A [${map["1A"] ? "X" : " "}]\n`;
      output += `1B [${map["1B"] ? "X" : " "}]\n`;
      output += `2A [${map["2A"] ? "X" : " "}]\n`;
      output += `2B [${map["2B"] ? "X" : " "}]\n\n`;

      output += `FIRST CLASS\n`;
      output += `1C [${map["1C"] ? "X" : " "}]\n`;
      output += `1D [${map["1D"] ? "X" : " "}]\n`;
      output += `2C [${map["2C"] ? "X" : " "}]\n`;
      output += `2D [${map["2D"] ? "X" : " "}]\n\n`;

      output += `DOUBLE ECONOMY\n`;
      output += `3A [${map["3A"] ? "X" : " "}]\n`;
      output += `3B [${map["3B"] ? "X" : " "}]\n`;
      output += `3C [${map["3C"] ? "X" : " "}]\n`;
      output += `3D [${map["3D"] ? "X" : " "}]\n`;
    } else {
      output += `SEATS\n`;
      output += `(Simple layout)\n\n`;

      for (let row = 1; row <= 5; row++) {
        for (let col of ["A", "B", "C", "D", "E"]) {
          const seat = `${row}${col}`;
          output += `${seat} [${map[seat] ? "X" : " "}]\n`;
        }
      }
    }

    interaction.reply({
      content: output,
      ephemeral: true
    });
  }
};
