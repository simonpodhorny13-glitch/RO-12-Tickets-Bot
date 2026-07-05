const fs = require("fs");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const STAFF_CHANNEL_ID = "1519551586999730236";
const VOYAGES_CHANNEL_ID = "1519404986079903854";

const ALLOWED_SHIPS = ["RO-12", "RO-11", "RO-13", "RO-21"];

module.exports = {
  name: "setvoyage",

  execute(message, args) {

    if (message.channel.id !== STAFF_CHANNEL_ID) {
      return message.reply("❌ Use this in #staff.");
    }

    if (args.length < 6) {
      return message.reply("❌ Usage: !setvoyage <from> <to> <length> <ship> <date> <time>");
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync("./data.json", "utf8"));
    } catch {
      return message.reply("❌ Data file error.");
    }

    if (!data.settings) data.settings = { nextVoyageId: 1 };
    if (!data.voyages) data.voyages = {};
    if (!data.transactions) data.transactions = [];

    const from = args[0];
    const to = args[1];
    const length = parseInt(args[2]);
    const ship = args[3].toUpperCase();
    const date = args[4];
    const time = args.slice(5).join(" ");

    if (!ALLOWED_SHIPS.includes(ship)) {
      return message.reply("❌ Invalid ship.");
    }

    if (![1, 2, 3].includes(length)) {
      return message.reply("❌ Length must be 1, 2, or 3.");
    }

    const normalize = (v) => String(v).trim().toLowerCase();

    const duplicate = Object.values(data.voyages).find(v =>
      normalize(v.from) === normalize(from) &&
      normalize(v.to) === normalize(to) &&
      normalize(v.date) === normalize(date) &&
      normalize(v.time) === normalize(time) &&
      normalize(v.ship) === normalize(ship)
    );

    if (duplicate) {
      return message.reply("❌ This voyage already exists.");
    }

    const id = String(data.settings.nextVoyageId++).padStart(4, "0");

    const price = length === 1 ? 50 : length === 2 ? 75 : 100;

    data.voyages[id] = {
      from,
      to,
      length,
      ship,
      date,
      time,
      basePrice: price,

      status: "draft",
      salesOpen: false,
      cancelled: false,

      createdBy: message.author.id,
      createdAt: Date.now(),

      crew: {
        captain: null,
        fo: null,
        seniorCaptain: null,
        gc: null
      },

      gcDeadline: null,

      cabinMap: {},
      seatMap: {}
    };

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    const channel = message.guild.channels.cache.get(VOYAGES_CHANNEL_ID);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`voyage_help_${id}`)
        .setLabel("🎟 How to book")
        .setStyle(ButtonStyle.Primary)
    );

    if (channel) {
      channel.send({
        embeds: [{
          title: `🚢 VOYAGE ${id} CREATED`,
          description:
`📍 ${from} → ${to}
⏳ Length: ${length}
🚢 Ship: ${ship}
📅 ${date} ${time}

💰 Base price: $${price}`,
          color: 0x00b0f4
        }],
        components: [row]
      });
    }

    message.channel.send(`✅ Voyage ${id} created.`);
  }
};
