const fs = require("fs");

module.exports = {
  name: "claim",

  execute(message, args) {
    const role = args[0];
    const voyageId = args[1];

    if (!role || !voyageId) {
      return message.reply("❌ Usage: !claim <captain|fo|gc> <voyageId>");
    }

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const voyage = data.voyages[voyageId];

    if (!voyage) {
      return message.reply("❌ Voyage not found.");
    }

    if (!voyage.crew) {
      voyage.crew = { captain: null, fo: null, gc: null };
    }

    const userId = message.author.id;

    if (!["captain", "fo", "gc"].includes(role)) {
      return message.reply("❌ Role must be captain, fo, or gc.");
    }

    if (voyage.crew[role]) {
      return message.reply(`❌ ${role.toUpperCase()} already claimed.`);
    }

    voyage.crew[role] = userId;

    const crew = voyage.crew;

    if (crew.captain && crew.fo) {

      if (!crew.gc && !voyage.gcDeadline) {
        voyage.gcDeadline = Date.now() + 24 * 60 * 60 * 1000;

        message.channel.send(
`⏳ Ground Crew role unclaimed.
Sales will open automatically within 24 hours if not claimed.`
        );
      }

      if (crew.gc && voyage.gcDeadline) {
        voyage.gcDeadline = null;
      }

      if (crew.gc && !voyage.salesOpen) {
        voyage.salesOpen = true;

        message.channel.send(
`🚢 SALES NOW OPEN
Voyage ID: ${voyageId}`
        );
      }
    }

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    message.reply(`✅ ${role.toUpperCase()} claimed for voyage ${voyageId}.`);
  }
};
