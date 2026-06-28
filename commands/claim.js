const fs = require("fs");

module.exports = {
  name: "claim",

  execute(message, args) {
    const role = args[0];
    const voyageId = args[1];

    if (!role || !voyageId) {
      return message.reply("❌ Usage: !claim <captain|fo|gc> <voyageId>");
    }

    const filePath = "./data.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const voyage = data.voyages[voyageId];

    if (!voyage) {
      return message.reply("❌ Voyage not found.");
    }

    if (!voyage.crew) {
      voyage.crew = {
        captain: null,
        fo: null,
        gc: null
      };
    }

    const userId = message.author.id;

    // validate role type
    if (!["captain", "fo", "gc"].includes(role)) {
      return message.reply("❌ Role must be captain, fo, or gc.");
    }

    // check if already taken
    if (voyage.crew[role]) {
      return message.reply(`❌ ${role.toUpperCase()} already claimed.`);
    }

    // assign role
    voyage.crew[role] = userId;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    message.reply(`✅ ${role.toUpperCase()} claimed for voyage ${voyageId}.`);
  }
};
