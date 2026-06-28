const fs = require("fs");

module.exports = {
  name: "cancelvoyage",

  execute(message, args) {
    const data = JSON.parse(fs.readFileSync("./data.json", "utf8"));

    const voyageId = args[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    if (!voyageId) {
      return message.reply("❌ Usage: !cancelvoyage <voyageId|all> [reason]");
    }

    const refundUser = (user, paid) => {
      const refund = paid * 0.9;
      user.balance = (user.balance || 0) + refund;
    };

    // =========================
    // 🚫 CANCEL ALL
    // =========================
    if (voyageId.toLowerCase() === "all") {

      let found = false;

      for (const id in data.voyages) {
        const v = data.voyages[id];
        if (!v || v.cancelled) continue;

        v.salesOpen = false;
        v.cancelled = true;

        for (const uid in data.users) {
          const user = data.users[uid];

          if (user.bookings && user.bookings[id]) {
            refundUser(user, user.bookings[id].paid);
            delete user.bookings[id];
          }
        }

        found = true;
      }

      if (!found) {
        return message.reply("❌ No active voyages to cancel.");
      }

      fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

      return message.channel.send(
`🚫 ALL VOYAGES CANCELLED

Reason
${reason}`
      );
    }

    // =========================
    // 🚫 CANCEL SINGLE VOYAGE
    // =========================
    const voyage = data.voyages[voyageId];

    if (!voyage || voyage.cancelled) {
      return message.reply("❌ No active voyage to cancel.");
    }

    voyage.salesOpen = false;
    voyage.cancelled = true;

    // refund passengers
    for (const uid in data.users) {
      const user = data.users[uid];

      if (user.bookings && user.bookings[voyageId]) {
        refundUser(user, user.bookings[voyageId].paid);
        delete user.bookings[voyageId];
      }
    }

    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    message.channel.send(
`🚫 VOYAGE CANCELLED

Voyage ID
${voyageId}

Reason
${reason}`
    );
  }
};
