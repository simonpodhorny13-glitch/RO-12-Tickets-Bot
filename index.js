const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const express = require("express");

// ===================== CONFIG =====================
const BOTS_CHANNEL_ID = "1518998081713213520";
const STAFF_CHANNEL_ID = "1519551586999730236";

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
client.prefixCommands = new Collection();

// ===================== DATA HELPERS =====================
function loadData() {
  if (!fs.existsSync("data.json")) {
    const init = {
      users: {},
      voyages: {},
      settings: { nextVoyageId: 1 },
      transactions: []
    };
    fs.writeFileSync("data.json", JSON.stringify(init, null, 2));
    return init;
  }

  return JSON.parse(fs.readFileSync("data.json", "utf8"));
}

function saveData(data) {
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
}

// ALWAYS get fresh data
function getData() {
  return loadData();
}

// ===================== USER HANDLER =====================
function getUser(id) {
  const data = loadData();

  if (!data.users[id]) {
    data.users[id] = {
      balance: 250,
      firstSeen: Date.now(),
      bookings: {},
      travelHistory: []
    };

    saveData(data);
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

    if (cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
    }

    if (cmd.name && cmd.execute && !cmd.data) {
      client.prefixCommands.set(cmd.name, cmd);
    }
  }

  console.log("Slash commands:", [...client.commands.keys()]);
  console.log("Prefix commands:", [...client.prefixCommands.keys()]);

} catch (err) {
  console.error("Command loader error:", err);
}

// ===================== PREFIX COMMANDS =====================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith("!")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, {
      data: getData(),
      getUser
    });
  } catch (err) {
    console.error(err);
    message.reply("❌ Error executing command");
  }

  // legacy shortcuts
  if (message.channel.id === BOTS_CHANNEL_ID) {
    const data = getData();

    if (message.content === "!balance") {
      const u = getUser(message.author.id);
      return message.reply(`💰 $${u.balance}`);
    }

    if (message.content === "!ping") {
      return message.reply("🏓 Pong!");
    }
  }
});

// ===================== INTERACTIONS =====================
client.on("interactionCreate", async (interaction) => {

  // ================= SLASH COMMANDS =================
  if (interaction.isChatInputCommand()) {
    try {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          content: "❌ Command not found",
          ephemeral: true
        });
      }

      await command.execute(interaction, {
        data: getData(),
        getUser
      });

    } catch (err) {
      console.error(err);

      if (!interaction.replied) {
        await interaction.reply({
          content: "❌ Error executing command",
          ephemeral: true
        });
      }
    }
  }

  // ================= BUTTONS =================
  if (interaction.isButton()) {

    if (interaction.customId.startsWith("voyage_help_")) {
      return interaction.reply({
        content:
          "🛳 **How to book a voyage:**\n\n" +
          "1. Use `/bookseat` or `/bookcabin`\n" +
          "2. Enter Voyage ID\n" +
          "3. Choose your seat/cabin\n\n" +
          "💡 Example: `/bookseat voyage:0001 seat:3A`",
        ephemeral: true
      });
    }
  }
});

// ===================== LOGIN =====================
client.login(process.env.TOKEN);
