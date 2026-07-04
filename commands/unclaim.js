const fs = require("fs");

const STAFF_CHANNEL_ID = "1519551586999730236";

module.exports = {
  name: "unclaim",

  execute(message, args) {

    if (message.channel.id !== STAFF_CHANNEL_ID) {
      return message.reply("❌ Use this command in #staff.");
    }

    const userId = message.author.id;

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      return message.reply("❌ Data system error.");
    }

    if (!data.voyages) {
      return message.reply("❌ No voyages found.");
    }

    let found = false;
    let removedFrom = [];

    for (const voyageId in data.voyages) {
      const voyage = data.voyages[voyageId];

      if (!voyage.crew) {
        voyage.crew = { captain: null, fo: null, gc: null };
      }

      const roles = ["captain", "fo", "gc"];

      for (const role of roles) {
        if (voyage.crew[role] === userId) {

          // 🚨 BLOCK if already open
          if (voyage.salesOpen) {
            continue; // don’t break whole system
          }

          voyage.crew[role] = null;
          found = true;
          removedFrom.push(`${voyageId} (${role.toUpperCase()})`);

          // reset GC timer if needed
          if (role === "gc") {
            voyage.gcDeadline = null;
          }
        }
      }

      // 🧠 optional: if crew becomes incomplete, close sales
      if (!voyage.crew.captain || !voyage.crew.fo) {
        voyage.salesOpen = false;
        voyage.status = "scheduled";
      }
    }

    if (!found) {
      return message.reply("❌ You have no claimed voyages.");
    }

    try {
      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    } catch (err) {
      return message.reply("❌ Failed to save changes.");
    }

    return message.reply(
      `✅ Role removed from voyage(s):\n${removedFrom.join("\n")}`
    );
  }
};
