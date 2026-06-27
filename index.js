const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const express = require("express");

/* ---------------- EXPRESS KEEP ALIVE ---------------- */

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("RO-12 bot is alive"));
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);

/* ---------------- DISCORD CLIENT ---------------- */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const TOKEN = process.env.TOKEN;

/* ---------------- DATA ---------------- */

let data = loadData();
let activeVoyage = null;
let voyageId = 1;

/* ---------------- FILE HANDLING ---------------- */

function loadData() {
  try {
    if (!fs.existsSync("data.json")) {
      return { users: {}, seatMap: {}, cabinMap: {} };
    }
    return JSON.parse(fs.readFileSync("data.json", "utf8"));
  } catch {
    return { users: {}, seatMap: {}, cabinMap: {} };
  }
}

function saveData() {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

/* ---------------- USER SYSTEM ---------------- */

function getUser(id) {
  if (!data.users[id]) {
    data.users[id] = { balance: 250, seat: null, cabin: null };
    saveData();
  }
  return data.users[id];
}

/* ---------------- UTIL ---------------- */

function isValidSeat(seat) {
  return /^([1-9]|1[0-9]|20)[A-F]$/.test(seat);
}

function getRouteData(code) {
  if (code === "1") return { name: "Short", multiplier: 1 };
  if (code === "2") return { name: "Medium", multiplier: 1.5 };
  if (code === "3") return { name: "Long", multiplier: 2 };
  return { name: "Unknown", multiplier: 1 };
}

function getBasePrice() {
  return 50 * (activeVoyage?.multiplier || 1);
}

/* ---------------- SAFETY HELPERS ---------------- */

function requireVoyage(msg) {
  if (!activeVoyage) {
    msg.reply("❌ No active voyage.");
    return false;
  }
  return true;
}

function requireSalesOpen(msg) {
  if (!activeVoyage?.salesOpen) {
    msg.reply("❌ Booking not open yet. Awaiting crew confirmation.");
    return false;
  }
  return true;
}

/* ---------------- EMBED ---------------- */

function sendVoyageEmbed(client) {
  if (!activeVoyage || activeVoyage.salesOpen) return;

  activeVoyage.salesOpen = true;

  const ch = client.channels.cache.find((c) => c.name === "voyages");
  if (!ch) return;

  ch.send({
    embeds: [
      {
        color: 0x0099ff,
        title: "🚢 NEW VOYAGE SALES OPEN",
        fields: [
          { name: "From", value: activeVoyage.from, inline: true },
          { name: "To", value: activeVoyage.to, inline: true },
          { name: "Ship", value: activeVoyage.ship, inline: true },

          {
            name: "Captain",
            value: activeVoyage.captain ? `<@${activeVoyage.captain}>` : "TBA",
            inline: true,
          },
          {
            name: "F/O",
            value: activeVoyage.fo ? `<@${activeVoyage.fo}>` : "TBA",
            inline: true,
          },
          {
            name: "GC",
            value: activeVoyage.gc ? `<@${activeVoyage.gc}>` : "None",
            inline: true,
          },

          { name: "Departure", value: activeVoyage.departure, inline: false },
          { name: "Route", value: activeVoyage.length, inline: true },
          { name: "Price", value: `$${getBasePrice()}`, inline: true },
        ],
      },
    ],
  });
}

/* ---------------- BOT READY ---------------- */

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ---------------- COMMANDS ---------------- */

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content;
  const channel = message.channel.name;
  const user = getUser(message.author.id);

  const hasPermission = message.member?.roles.cache.some((r) =>
    ["Owner", "Admin", "Captain"].includes(r.name)
  );

  /* ---------------- BALANCE ---------------- */

  if (content === "!balance") {
    return message.reply(`💰 Your balance: $${user.balance}`);
  }

  /* ---------------- CABIN MAP ---------------- */

  if (content === "!map cabins") {
    const isTaken = (id) => (data.cabinMap[id] ? "[X]" : "[ ]");

    return message.channel.send(
      `🛏️ **CABINS**\n\n` +
        `**ECONOMY**\n1A ${isTaken("1A")} 1B ${isTaken("1B")} 2A ${isTaken("2A")} 2B ${isTaken("2B")}\n\n` +
        `**FIRST**\n1C ${isTaken("1C")} 1D ${isTaken("1D")} 2C ${isTaken("2C")} 2D ${isTaken("2D")}\n\n` +
        `**DOUBLE**\n3A ${isTaken("3A")} 3B ${isTaken("3B")} 3C ${isTaken("3C")} 3D ${isTaken("3D")}`
    );
  }

  /* ---------------- SET VOYAGE ---------------- */

  if (content.startsWith("!setvoyage")) {
    if (channel !== "staff") return;

    const parts = content.split(" ");
    const from = parts[1];
    const to = parts[2];
    const routeCode = parts[3];

    if (!from || !to || !routeCode) {
      return message.reply("❌ Usage: !setvoyage A B 2 [time]");
    }

    const route = getRouteData(routeCode);

    activeVoyage = {
      id: voyageId++,
      from,
      to,
      length: route.name,
      multiplier: route.multiplier,
      ship: "RO-12",
      captain: null,
      fo: null,
      gc: null,
      departure: parts.slice(4).join(" ") || "TBA",
      salesOpen: false,
    };

    return message.channel.send(
      `🚢 VOYAGE CREATED: ${from} → ${to} (${route.name})`
    );
  }

  /* ---------------- CLAIM ---------------- */

  if (content.startsWith("!claim")) {
    if (!activeVoyage) return message.reply("❌ No active voyage.");

    const role = content.split(" ")[1];
    const roles = message.member?.roles.cache;

    if (role === "captain") {
      if (activeVoyage.captain)
        return message.reply("❌ Captain already assigned.");
      if (!roles.some((r) => r.name === "Captain"))
        return message.reply("❌ You are not a Captain.");
      activeVoyage.captain = message.author.id;
    }

    else if (role === "fo") {
      if (activeVoyage.fo)
        return message.reply("❌ First Officer already assigned.");
      if (!roles.some((r) => r.name === "First Officer"))
        return message.reply("❌ You are not a First Officer.");
      activeVoyage.fo = message.author.id;
    }

    else if (role === "gc") {
      if (activeVoyage.gc)
        return message.reply("❌ Ground Crew already assigned.");
      if (!roles.some((r) => r.name === "Ground Crew"))
        return message.reply("❌ You are not Ground Crew.");
      activeVoyage.gc = message.author.id;
    }

    else return message.reply("❌ Invalid role.");

    message.reply(`✅ ${role} assigned.`);

    if (
      activeVoyage.captain &&
      activeVoyage.fo &&
      activeVoyage.gc &&
      !activeVoyage.salesOpen
    ) {
      sendVoyageEmbed(client);
    }
  }

  /* ---------------- BOOKING ---------------- */

  if (content.startsWith("!bookcabin") || content.startsWith("!seat")) {
    if (!activeVoyage) return message.reply("❌ No active voyage.");
    if (!activeVoyage.salesOpen)
      return message.reply("❌ Booking not open yet.");

    const isCabin = content.startsWith("!bookcabin");
    const target = content.split(" ")[1];

    if (!target) return message.reply("❌ Missing input.");

    /* ---------------- CABIN ---------------- */

    if (isCabin) {
      if (data.cabinMap[target] || user.cabin)
        return message.reply("❌ Cabin already taken.");

      const price = ["1C", "1D", "2C", "2D"].includes(target)
        ? getBasePrice() * 3
        : getBasePrice();

      if (user.balance < price)
        return message.reply(`❌ Not enough money ($${price})`);

      user.balance -= price;
      data.cabinMap[target] = message.author.id;
      user.cabin = target;
    }

    /* ---------------- SEAT ---------------- */

    else {
      if (!isValidSeat(target))
        return message.reply("❌ Invalid seat (1A–20F)");

      if (data.seatMap[target] || user.seat)
        return message.reply("❌ Seat already taken.");

      const price = getBasePrice();

      if (user.balance < price)
        return message.reply(`❌ Not enough money ($${price})`);

      user.balance -= price;
      data.seatMap[target] = message.author.id;
      user.seat = target;
    }

    saveData();
    return message.reply(`✅ Booked ${target}!`);
  }

  /* ---------------- CANCEL BOOKING ---------------- */

  if (content === "!cancel") {
    if (!activeVoyage) return message.reply("❌ No active voyage.");
    if (!user.seat && !user.cabin)
      return message.reply("❌ Nothing to cancel.");

    let refund = 0;

    if (user.seat) {
      refund += Math.floor(getBasePrice() * 0.9);
      delete data.seatMap[user.seat];
      user.seat = null;
    }

    if (user.cabin) {
      const p = ["1C", "1D", "2C", "2D"].includes(user.cabin)
        ? getBasePrice() * 3
        : getBasePrice();

      refund += Math.floor(p * 0.9);
      delete data.cabinMap[user.cabin];
      user.cabin = null;
    }

    user.balance += refund;
    saveData();

    return message.reply(`✅ Cancelled. Refund: $${refund}`);
  }

  /* ---------------- CANCEL VOYAGE ---------------- */

  if (content.startsWith("!cancelvoyage")) {
    if (!hasPermission)
      return message.reply("❌ No permission.");

    if (!activeVoyage)
      return message.reply("❌ No active voyage.");

    activeVoyage = null;
    data.seatMap = {};
    data.cabinMap = {};

    for (let id in data.users) {
      data.users[id].seat = null;
      data.users[id].cabin = null;
    }

    saveData();
    return message.channel.send("🚫 VOYAGE CANCELLED");
  }
});

/* ---------------- LOGIN ---------------- */

client.login(TOKEN);
