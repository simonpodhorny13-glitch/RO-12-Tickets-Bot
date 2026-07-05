const fs = require("fs");

const STAFF_CHANNEL_ID = "1519551586999730236";

const ROLES = {
  captain: {
    id: "1519409864185614467",
    label: "Captain"
  },
  fo: {
    id: "1519410229744504963",
    label: "First Officer"
  },
  seniorcaptain: {
    id: "1521172459385126922",
    label: "Senior Captain"
  },
  gc: {
    id: "1520435967264292944",
    label: "Ground Crew"
  }
};

// check if role already taken in ANY voyage
function isRoleTaken(data, roleKey) {
  return Object.values(data.voyages || {}).some(v =>
    v.crew?.[roleKey]
  );
}

module.exports = {
  name: "claim",

  execute(message, args) {

    if (message.channel.id !== STAFF_CHANNEL_ID) {
      return message.reply("❌ Use this in #staff.");
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch {
      return message.reply("❌ Data file error.");
    }

    const raw = args[0]?.toLowerCase();
    const voyageId = args[1];

    const role = ROLES[raw];

    if (!role || !voyageId) {
      return message.reply("❌ Usage: !claim <captain|fo|seniorcaptain|gc> <voyageId>");
    }

    const voyage = data.voyages?.[voyageId];

    if (!voyage) {
      return message.reply("❌ Voyage not found.");
    }

    if (!voyage.crew) {
      voyage.crew = { captain: null, fo: null, seniorcaptain: null, gc: null };
    }

    const userId = message.author.id;

    // 🚫 already taken globally
    if (isRoleTaken(data, raw)) {
      return message.reply(`❌ ${role.label} already claimed in another voyage.`);
    }

    // 🚫 same voyage check
    if (voyage.crew[raw]) {
      return message.reply(`❌ ${role.label} already claimed for this voyage.`);
    }

    // 🚨 SENIOR CAPTAIN OVERRIDE LOGIC
    if (raw === "captain") {
      const captainTaken = voyage.crew.captain;

      if (captainTaken && !message.member.roles.cache.has(ROLES.seniorcaptain.id)) {
        return message.reply("❌ Captain already taken.");
      }
    }

    voyage.crew[raw] = userId;

    // ⏳ GC logic (unchanged but safer)
    if (voyage.crew.captain && voyage.crew.fo) {

      if (!voyage.crew.gc && !voyage.gcDeadline) {
        voyage.gcDeadline = Date.now() + 24 * 60 * 60 * 1000;

        message.channel.send("⏳ Ground Crew not claimed. Sales will open in 24h.");
      }

      if (voyage.crew.gc && voyage.gcDeadline) {
        voyage.gcDeadline = null;
      }

      if (voyage.crew.gc && !voyage.salesOpen) {
        voyage.salesOpen = true;
        voyage.status = "sales_open";

        message.channel.send(`🚢 SALES OPEN - Voyage ${voyageId}`);
      }
    }

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    message.reply(`✅ ${role.label} claimed for voyage ${voyageId}.`);
  }
};
