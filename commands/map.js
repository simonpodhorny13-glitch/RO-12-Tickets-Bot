const fs = require("fs");

module.exports = {
  name: "map",

  execute(message, args) {
    const type = args[0];

    const filePath = "./cabins.json";

    let cabins = {};
    if (fs.existsSync(filePath)) {
      cabins = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const isBooked = (c) => cabins[c] ? "X" : " ";

    if (!type || type === "cabins") {
      return message.reply(`
🛏️ **CABINS MAP**

ECONOMY
1A [${isBooked("1A")}]
1B [${isBooked("1B")}]
2A [${isBooked("2A")}]
2B [${isBooked("2B")}]

FIRST
1C [${isBooked("1C")}]
1D [${isBooked("1D")}]
2C [${isBooked("2C")}]
2D [${isBooked("2D")}]

DOUBLE
3A [${isBooked("3A")}]
3B [${isBooked("3B")}]
3C [${isBooked("3C")}]
3D [${isBooked("3D")}]
`);
    }

    return message.reply("❌ Use: !map cabins");
  }
};
