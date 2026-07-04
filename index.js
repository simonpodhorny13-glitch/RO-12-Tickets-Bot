const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
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

client.commands = new Collection();       // slash
client.prefixCommands = new Collection(); // prefix

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

// ===================== SLASH COMMAND LOADER =====================
try {
  const commandFiles = fs
    .readdirSync("./commands")
    .filter(f => f.endsWith(".js"));

  for (const file of commandFiles) {
    const cmd = require(`./commands/${file}`);

    // SLASH COMMAND
    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
    }

    // PREFIX COMMAND (NO data field)
    if (cmd.name && cmd.execute && !cmd.data) {
      client.prefixCommands.set(cmd.name, cmd);
    }
  }

  console.log("Slash commands:", [...client.commands.keys()]);
  console.log("Prefix commands:", [...client.prefixCommands.keys()]);

} catch (err) {
  console.error("Command loader error:", err);
}

// ===================== PREFIX COMMAND HANDLER =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, { data, voyages, getUser });
  } catch (err) {
    console.error(err);
    message.reply("❌ Error executing command");
  }

  // (optional legacy support still kept)
  if (message.channel.id === BOTS_CHANNEL_ID) {
    if (message.content === "!balance") {
      const u = getUser(message.author.id);
      return message.reply(`💰 $${u.balance}`);
    }

    if (message.content === "!ping") {
      return message.reply("🏓 Pong!");
    }
  }
});

// ===================== SLASH COMMAND HANDLER =====================
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
