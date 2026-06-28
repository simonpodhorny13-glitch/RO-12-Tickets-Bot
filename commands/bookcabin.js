const fs = require("fs");

module.exports = {
  name: "bookcabin",

  execute(message, args) {
    const cabin = args[0];

    if (!cabin) {
      return message.reply("❌ Usage: !bookcabin 1A");
    }

    const filePath = "./cabins.json";

    let data = {};
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    if (data[cabin]) {
      return message.reply("❌ That cabin is already booked!");
    }

    data[cabin] = true;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    message.reply(`✅ Cabin ${cabin} booked successfully! 🚢`);
  }
};
