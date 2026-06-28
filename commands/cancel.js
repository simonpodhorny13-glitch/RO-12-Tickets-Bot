const fs = require("fs");

module.exports = {
  name: "cancel",

  execute(message) {
    const filePath = "./data.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const userId = message.author.id;
    const user = data.users[userId];

    if (!user) {
      return message.reply("❌ You have nothing to cancel.");
    }

    let refund = (user.spent || 0) * 0.9;

    // refund
    user.balance += refund;

    // remove cabin
    if (user.cabin) {
      delete data.cabinMap[user.cabin];
      delete user.cabin;
    }

    // remove seat
    if (user.seat) {
      delete data.seatMap[user.seat];
      delete user.seat;
    }

    user.spent = 0;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    message.reply(`❌ Booking cancelled. 💰 Refund: ${refund.toFixed(2)}`);
  }
};
