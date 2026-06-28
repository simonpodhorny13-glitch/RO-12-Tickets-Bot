const fs = require("fs");

module.exports = {
  name: "bookseat",

  execute(message, args) {
    const seat = args[0];
    const filePath = "./data.json";

    if (!seat) {
      return message.reply("❌ Usage: !bookseat 12C");
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const userId = message.author.id;

    if (!data.users[userId]) {
      data.users[userId] = { balance: 0, spent: 0 };
    }

    if (data.users[userId].seat) {
      return message.reply("❌ You already have a seat!");
    }

    if (data.seatMap[seat]) {
      return message.reply("❌ That seat is taken!");
    }

    const voyageType = data.voyage?.type || "short";
    let price = 40;

    if (voyageType === "medium") price *= 1.5;
    if (voyageType === "long") price *= 2;

    if (data.users[userId].balance < price) {
      return message.reply("❌ Not enough balance!");
    }

    data.users[userId].balance -= price;
    data.users[userId].spent += price;

    data.users[userId].seat = seat;
    data.seatMap[seat] = userId;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    message.reply(`💺 Seat ${seat} booked! 💰-${price}`);
  }
};
