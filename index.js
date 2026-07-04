const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express");

// =====================
// CONFIG
// =====================
const VOYAGES_CHANNEL_ID = "1519404986079903854";
const BOTS_CHANNEL_ID = "1518998081713213520";
const STAFF_CHANNEL_ID = "1519551586999730236";
const SENIOR_CAPTAIN_ROLE = "1521172459385126922";

const ROLE_SALARIES = {
  groundCrew: "1520435967264292944",
  firstOfficer: "1519410229744504963",
  captain: "1519409864185614467",
  admin: "1519406529495961873",
  owner: "1519408960803700948"
};

// =====================
// EXPRESS SERVER
// =====================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("RO-12 bot is live"));

app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`)
);

// =====================
// DISCORD CLIENT
// =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================
// SLASH COMMAND LOADER (SAFE)
// =====================
client.commands = new Collection();

try {
  const commandsPath = path.join(__dirname, "commands");

  if (!fs.existsSync(commandsPath)) {
    console.log("❌ Commands folder not found");
  } else {
    const commandFiles = fs
      .readdirSync(commandsPath)
      .filter(file => file.endsWith(".js"));

    for (const file of commandFiles) {
      const command = require(path.join(commandsPath, file));

      if (!command.data || !command.execute) {
        console.log(`❌ Skipped invalid command: ${file}`);
        continue;
      }

      client.commands.set(command.data.name, command);
    }

    console.log("✅ Loaded commands:", [...client.commands.keys()]);
  }
} catch (err) {
  console.error("❌ Command loader crashed:", err);
}

// =====================
// DATA SYSTEM
// =====================
function loadData() {
  try {
    if (!fs.existsSync("data.json")) {
      return { users: {}, voyages: {}, voyageIdCounter: 1, lastSalaryRun: 0 };
    }
    return JSON.parse(fs.readFileSync("data.json", "utf8"));
  } catch {
    return { users: {}, voyages: {}, voyageIdCounter: 1, lastSalaryRun: 0 };
  }
}

let data = loadData();
let voyages = data.voyages || {};
let voyageIdCounter = data.voyageIdCounter || 1;

function saveData() {
  data.users = data.users || {};
  data.voyages = voyages;
  data.voyageIdCounter = voyageIdCounter;
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data.users[id]) {
    data.users[id] = {
      balance: 250,
      seat: null,
      cabin: null,
      travelHistory: []
    };
    saveData();
  }
  return data.users[id];
}

// =====================
// PREFIX COMMANDS (UNCHANGED)
// =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content;
  const member = message.member;
  const channelId = message.channel.id;

  const has = (id) => member?.roles?.cache?.has(id);

  if (channelId === BOTS_CHANNEL_ID) {
    if (content === "!ping") {
      const sent = await message.channel.send("🏓 Pong!");
      const latency = sent.createdTimestamp - message.createdTimestamp;
      return sent.edit(`🏓 Pong!\n⏱️ ${latency}ms`);
    }

    if (content === "!balance") {
      const u = getUser(message.author.id);
      return message.reply(`💰 Your balance: $${u.balance}`);
    }
  }

  if (channelId !== STAFF_CHANNEL_ID) return;

  if (content.startsWith("!setvoyage")) return;
  if (content.startsWith("!cancelvoyage")) return;

  if (content.startsWith("!claim")) {
    const args = content.split(" ");
    const type = args[1];
    const voyageId = args[2];

    const v = voyages[voyageId];
    if (!v) return message.reply("❌ Voyage not found.");

    if (!v.crew) v.crew = { captain: null, fo: null, gc: null };

    const isOwner = has("1519408960803700948");
    const isAdmin = has("1519406529495961873");
    const isSenior = has(SENIOR_CAPTAIN_ROLE);
    const isCaptain = has("1519409864185614467");
    const isGC = has("1520435967264292944");

    if (type === "captain") {
      if (!(isCaptain || isSenior || isAdmin || isOwner))
        return message.reply("❌ No permission.");
    }

    if (type === "fo") {
      if (!(isAdmin || isOwner))
        return message.reply("❌ No permission.");
    }

    if (type === "gc") {
      if (!(isGC || isAdmin || isOwner))
        return message.reply("❌ No permission.");
    }

    if (isSenior && (type === "fo" || type === "gc")) {
      return message.reply("❌ Senior Captain can only claim Captain.");
    }

    if (v.crew[type]) return message.reply("❌ Already claimed.");

    v.crew[type] = message.author.id;
    saveData();

    return message.reply(`✅ ${type} claimed.`);
  }
});

// =====================
// SLASH COMMAND HANDLER
// =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      return interaction.reply({
        content: "❌ Command not found in bot handler.",
        ephemeral: true
      });
    }

    await command.execute(interaction, { data, voyages });

  } catch (err) {
    console.error("Interaction error:", err);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Error executing command.",
        ephemeral: true
      });
    }
  }
});

// =====================
// LOGIN
// =====================
if (!process.env.TOKEN) {
  console.log("❌ TOKEN missing");
} else {
  client
    .login(process.env.TOKEN)
    .then(() => console.log("✅ Logged in"))
    .catch(console.error);
}
