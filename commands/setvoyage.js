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

const ALLOWED_SHIPS = ["RO-12", "RO-11", "RO-13", "RO-21"];

module.exports = {
  name: "setvoyage",

  execute(message, args) {

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
    } catch {
      return message.reply("❌ Data file error.");
    }

    if (!data.settings) data.settings = { nextVoyageId: 1 };
    if (!data.voyages) data.voyages = {};
    if (!data.transactions) data.transactions = [];

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
    const ship = args[3].toUpperCase();
    const date = args[4];
    const time = args.slice(5).join(" ");

    // 🚢 SHIP VALIDATION
    if (!ALLOWED_SHIPS.includes(ship)) {
      return message.reply(
        `❌ Invalid ship. Allowed ships: ${ALLOWED_SHIPS.join(", ")}`
      );
    }

    if (![1, 2, 3].includes(length)) {
      return message.reply("❌ Length must be 1, 2, or 3.");
    }

    if (!date || !time) {
      return message.reply("❌ Missing date or time.");
    }

    // 🚫 DUPLICATE CHECK
    const duplicate = Object.values(data.voyages).find(v =>
      v.from === from &&
      v.to === to &&
      v.date === date &&
      v.time === time &&
      v.ship === ship
    );

    if (duplicate) {
      return message.reply("❌ This voyage already exists.");
    }

    // 🚢 ID
    const idNum = Number(data.settings.nextVoyageId || 1);
    const voyageId = idNum.toString().padStart(4, "0");

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
      salesOpen: false, // 🔥 FIX: must be opened manually
      cancelled: false,

      createdBy: message.author.id,
      createdAt: Date.now(),

      crew: {
        captain: null,
        fo: null,
        gc: null
      },

      cabinMap: {},
      seatMap: {},

      announcement: null,
      staffMessage: null
    };

    data.settings.nextVoyageId = idNum + 1;

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

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    const voyagesChannel = message.guild.channels.cache.get(VOYAGES_CHANNEL_ID);
    const staffChannel = message.guild.channels.cache.get(STAFF_CHANNEL_ID);

    // 🔘 FIXED BUTTON (IMPORTANT)
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`voyage_help_${voyageId}`)
        .setLabel("🎟 How to book")
        .setStyle(ButtonStyle.Primary)
    );

    // 📢 PUBLIC MESSAGE
    if (voyagesChannel) {
      voyagesChannel.send({
        embeds: [{
          title: `🚢 VOYAGE ${voyageId} CREATED`,
          description:
`📍 ${from} → ${to}
⏳ Length: ${length}
🚢 Ship: ${ship}
📅 ${date} ${time}

💰 Base price: $${price}`,
          color: 0x00b0f4
        }],
        components: [row]
      }).then(msg => {
        data.voyages[voyageId].announcement = {
          channelId: msg.channel.id,
          messageId: msg.id
        };
        fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
      });
    }

    // 📢 STAFF MESSAGE
    if (staffChannel) {
      staffChannel.send(
`🚨 VOYAGE ${voyageId} CREATED

||<@&1519406529495961873> <@&1519409864185614467> <@&1521172459385126922> <@&1519408960803700948>||

📍 ${from} → ${to}
🚢 Ship: ${ship}
⏳ ${length}
📅 ${date} ${time}

👤 ${message.author.username}`
      ).then(msg => {
        data.voyages[voyageId].staffMessage = {
          channelId: msg.channel.id,
          messageId: msg.id
        };
        fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));
      });
    }

    message.channel.send(`✅ Voyage ${voyageId} created successfully.`);
  }
};
