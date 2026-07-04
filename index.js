const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const express = require("express");

// ===================== CONFIG =====================
const BOTS_CHANNEL_ID = "1518998081713213520";
const STAFF_CHANNEL_ID = "1519551586999730236";
const SENIOR_CAPTAIN_ROLE = "1521172459385126922";

// ===================== EXPRESS =====================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("RO-12 bot is live"));
app.listen(PORT, () => console.log("Server running"));

// ===================== CLIENT =====================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// ===================== DATA =====================
function loadData() {
  if (!fs.existsSync("data.json")) {
    return { users: {}, voyages: {}, voyageIdCounter: 1 };
  }
  return JSON.parse(fs.readFileSync("data.json", "utf8"));
}

let data = loadData();
let voyages = data.voyages || {};

function saveData() {
  data.voyages = voyages;
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

function getUser(id) {
  if (!data.users[id]) {
    data.users[id] = {
      balance: 250,
      firstSeen: Date.now(),
      seat: null,
      cabin: null,
      travelHistory: []
    };
    saveData();
  }
  return data.users[id];
}

// ===================== COMMAND LOADER =====================
try {
  const commandFiles = fs
    .readdirSync("./commands")
    .filter(f => f.endsWith(".js"));

  for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);

    if (!cmd.data || !cmd.execute) {
      console.log("Skipped:", file);
      continue;
    }

    client.commands.set(cmd.data.name, cmd);
  }

  console.log("Loaded commands:", [...client.commands.keys()]);
} catch (err) {
  console.error("Command loader error:", err);
}

// ===================== PREFIX =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.channel.id === BOTS_CHANNEL_ID) {
    if (message.content === "!ping") {
      return message.reply("🏓 Pong!");
    }

    if (message.content === "!balance") {
      const u = getUser(message.author.id);
      return message.reply(`💰 $${u.balance}`);
    }
  }
});

// ===================== SLASH =====================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      return interaction.reply({
        content: "❌ Command not found",
        ephemeral: true
      });
    }

    await command.execute(interaction, { data, voyages, getUser });

  } catch (err) {
    console.error(err);

    if (!interaction.replied) {
      await interaction.reply({
        content: "❌ Error executing command",
        ephemeral: true
      });
    }
  }
});

// ===================== LOGIN =====================
client.login(process.env.TOKEN);
