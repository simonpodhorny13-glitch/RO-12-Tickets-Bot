const fs = require("fs");

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const OWNER_ROLE_ID = "1519408960803700948";
const ADMIN_ROLE_ID = "1519406529495961873";
const CAPTAIN_ROLE_ID = "1519409864185614467";
const SENIOR_CAPTAIN_ROLE_ID = "1521172459385126922";

const STAFF_CHANNEL_ID = "1519551586999730236";
const VOYAGES_CHANNEL_ID = "1519404986079903854";

module.exports = {
  name: "setvoyage",

  execute(message, args) {

    // 📍 CHANNEL LOCK
    if (message.channel.id !== STAFF_CHANNEL_ID) {
      return message.reply("❌ You can only use this command in #staff.");
    }

    if (args.length < 6) {
      return message.reply(
        "❌ Usage: !setvoyage <from> <to> <length 1/2/3> <ship> <date> <time>"
      );
    }

    let data = {};

    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch (err) {
      return message.reply("❌ Data file error.");
    }

    // 🧠 INIT SAFETY
    if (!data.settings) data.settings = { nextVoyageId: 1 };
    if (!data.voyages) data.voyages = {};
    if (!data.transactions) data.transactions = [];

    // 🔐 ROLE CHECK
    const member = message.member;

    const hasPermission =
      member.roles.cache.has(OWNER_ROLE_ID) ||
      member.roles.cache.has(ADMIN_ROLE_ID) ||
      member.roles.cache.has(CAPTAIN_ROLE_ID) ||
      member.roles.cache.has(SENIOR_CAPTAIN_ROLE_ID);

    if (!hasPermission) {
      return message.reply("❌ You don't have permission to create voyages.");
    }

    // 📦 INPUTS
    const from = args[0];
    const to = args[1];
    const length = parseInt(args[2]);
    const ship = args[3];
    const date = args[4];
    const time = args.slice(5).join(" ");

    if (![1, 2, 3].includes(length)) {
      return message.reply("❌ Length must be 1, 2, or 3.");
    }

    if (!date || !time) {
      return message.reply("❌ Missing date or time.");
    }

    // 🚢 ID
    let idNum = Number(data.settings.nextVoyageId || 1);
    const voyageId = idNum.toString().padStart(4, "0");

    if (data.voyages[voyageId]) {
      return message.reply("❌ Voyage ID collision. Try again.");
    }

    // 💰 PRICE
    const price = length === 1 ? 50 : length === 2 ? 75 : 100;

    // 🚢 CREATE VOYAGE
    data.voyages[voyageId] = {
      from,
      to,
      length,
      ship,
      date,
      time,
      basePrice: price,

      status: "scheduled",
      salesOpen: true,
      cancelled: false,

      crew: {
        captain: null,
        fo: null,
        gc: null
      },

      cabinMap: {},
      seatMap: {}
    };

    data.settings.nextVoyageId = idNum + 1;

    // 🧾 TRANSACTION LOG
    data.transactions.push({
      type: "voyage_create",
      voyageId,
      from,
      to,
      length,
      ship,
      basePrice: price,
      createdBy: message.author.id,
      timestamp: new Date().toISOString()
    });

    // 💾 SAVE
    try {
      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
    } catch (err) {
      return message.reply("❌ Failed to save voyage.");
    }

    // 👨‍✈️ CREW MENTIONS
    const voyage = data.voyages[voyageId];

    const captain = voyage.crew.captain
      ? `<@${voyage.crew.captain}>`
      : "N/A";

    const fo = voyage.crew.fo
      ? `<@${voyage.crew.fo}>`
      : "N/A";

    const gc = voyage.crew.gc
      ? `<@${voyage.crew.gc}>`
      : "N/A";

    // 🔘 BUTTON
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`how_book_${voyageId}`)
        .setLabel("🎟 How can I book?")
        .setStyle(ButtonStyle.Primary)
    );

    // 📢 EMBED MESSAGE (VOYAGES)
    const voyagesChannel = message.guild.channels.cache.get(VOYAGES_CHANNEL_ID);

    if (voyagesChannel) {
      voyagesChannel.send({
        embeds: [
          {
            title: `🚢 VOYAGE ${voyageId} SALES OPEN!`,
            description:
`📍 From: ${from}
🎯 To: ${to}
⏳ Length: ${length === 1 ? "Short" : length === 2 ? "Medium" : "Long"}
📅 Departing: ${date}, ${time}

👨‍✈️ Captain: ${captain}
🧑‍✈️ First Officer: ${fo}
👷 Ground Crew: ${gc}

💰 Base price: $${price}`,
            color: 0x00b0f4
          }
        ],
        components: [row]
      });
    }

    // 📢 STAFF MESSAGE
    const staffChannel = message.guild.channels.cache.get(STAFF_CHANNEL_ID);

    if (staffChannel) {
      staffChannel.send(
`🚨 VOYAGE ${voyageId} SALES OPEN

||<@&1519406529495961873> <@&1519409864185614467> <@&1521172459385126922> <@&1519408960803700948>||

📍 ${from} → ${to}
⏳ ${length === 1 ? "Short" : length === 2 ? "Medium" : "Long"}
📅 ${date}, ${time}

👤 Created by: ${message.author.username}`
      );
    }

    // 📢 CONFIRMATION
    message.channel.send(`✅ Voyage ${voyageId} successfully created and published.`);
  }
};
