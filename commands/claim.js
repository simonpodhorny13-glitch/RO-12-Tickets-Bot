const fs = require("fs");

const STAFF_CHANNEL_ID = "1519551586999730236";

module.exports = {
  name: "claim",

  execute(message, args) {

    // 📍 channel restriction
    if (message.channel.id !== STAFF_CHANNEL_ID) {
      return message.reply("❌ Use this command in #staff.");
    }

    const role = args[0];
    const voyageId = args[1];

    if (!role || !voyageId) {
      return message.reply("❌ Usage: !claim <captain|fo|gc> <voyageId>");
    }

    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    const voyage = data.voyages?.[voyageId];

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

    // ⏳ GC DEADLINE LOGIC
    if (voyage.crew.captain && voyage.crew.fo) {

      if (!voyage.crew.gc && !voyage.gcDeadline) {
        voyage.gcDeadline = Date.now() + 24 * 60 * 60 * 1000;

        message.channel.send(
`⏳ Ground Crew not claimed.
Sales will open automatically in 24h if unclaimed.`
        );
      }

      if (voyage.crew.gc && voyage.gcDeadline) {
        voyage.gcDeadline = null;
      }

      if (voyage.crew.gc && !voyage.salesOpen) {
        voyage.salesOpen = true;
        voyage.status = "sales_open";

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
