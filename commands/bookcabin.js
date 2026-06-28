const fs = require("fs");

module.exports = {
  name: "bookcabin",

  execute(message, args) {
    const cabin = args[0];
    const filePath = "./data.json";

    if (!cabin) {
      return message.reply("❌ Usage: !bookcabin 1A");
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    // check if cabin exists already
    if (data.cabinMap[cabin]) {
      return message.reply("❌ That cabin is already booked!");
    }

    const userId = message.author.id;

    // prevent double booking per user
    if (data.users[userId]?.cabin) {
      return message.reply("❌ You already booked a cabin!");
    }

    // save cabin ownership
    data.cabinMap[cabin] = userId;

    if (!data.users[userId]) data.users[userId] = {};
    data.users[userId].cabin = cabin;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    message.reply(`🛏️ Cabin **${cabin}** booked successfully! 🚢`);
  }
};
