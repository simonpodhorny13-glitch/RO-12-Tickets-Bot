const { Client, GatewayIntentBits, Collection } = require("discord.js");
const express = require("express");

// SQLite database
const db = require("./database");

// ===================== CONFIG =====================
const BOTS_CHANNEL_ID = "1518998081713213520";

// ===================== EXPRESS =====================
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("RO-12 bot is live");
});

app.listen(PORT, () => {
  console.log("Server running");
});

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

// ===================== COMMAND LOADER =====================
try {
  const fs = require("fs");

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

  const args = message.content
    .slice(1)
    .trim()
    .split(/ +/);

  const commandName = args.shift().toLowerCase();

  const command = client.prefixCommands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, {
      db
    });

  } catch (err) {
    console.error(err);
    message.reply("❌ Error executing command");
  }


  // legacy shortcut
  if (
    message.channel.id === BOTS_CHANNEL_ID &&
    message.content === "!balance"
  ) {
    const user = db.getUser(message.author.id);

    return message.reply(
      `💰 $${user.balance}`
    );
  }
});


// ===================== INTERACTIONS =====================
client.on("interactionCreate", async (interaction) => {

  // Slash commands
  if (interaction.isChatInputCommand()) {

    try {
      const command =
        client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({
          content: "❌ Command not found",
          ephemeral: true
        });
      }

      await command.execute(interaction, {
        db
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


  // Buttons
  if (interaction.isButton()) {

    if (
      interaction.customId.startsWith("voyage_help_")
    ) {

      return interaction.reply({
        content:
          "🛳 **How to book a voyage:**\n\n" +
          "1. Use `/bookseat` or `/bookcabin`\n" +
          "2. Enter Voyage ID\n" +
          "3. Choose your seat/cabin",
        ephemeral: true
      });
    }
  }
});


// ===================== LOGIN =====================
client.login(process.env.TOKEN);
