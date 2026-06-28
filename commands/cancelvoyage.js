const fs = require("fs");

module.exports = {
  name: "cancelvoyage",

  execute(message, args) {
    const filePath = "./data.json";
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const voyageId = args[0];
    const reason = args.slice(1).join(" ") || "No reason provided";

    if (!voyageId) {
      return message.reply("❌ Usage: !cancelvoyage <voyageId|all> [reason]");
    }

    // Helper: refund function
    const refundUser = (user, paid) => {
      const refund = paid * 0.9;
      user.balance = (user.balance || 0) + refund;
    };

    // =========================
    // ❌ CANCEL ALL VOYAGES
    // =========================
    if (voyageId.toLowerCase() === "all") {
      const voyages = data.voyages;

      let cancelledAny = false;

      for (const id in voyages) {
        const voyage = voyages[id];
        if (!voyage || voyage.cancelled) continue;

        voyage.salesOpen = false;
        voyage.cancelled = true;

        // refund all users
        for (const userId in data.users) {
          const user = data.users[userId];

          if (user.bookings && user.bookings[id]) {
            const booking = user.bookings[id];
            refundUser(user, booking.paid);

            delete user.bookings[id];
          }
        }

        cancelledAny = true;
      }

      if (!cancelledAny) {
        return message.reply("❌ No active voyages to cancel.");
      }

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      message.channel.send(
`🚫 ALL VOYAGES CANCELLED

Reason
${reason}`
      );

      return;
    }

    // =========================
    // ❌ CANCEL SINGLE VOYAGE
    // =========================
    const voyage = data.voyages[voyageId];

    if (!voyage || voyage.cancelled) {
      return message.reply("❌ No active voyage to cancel.");
    }

    voyage.salesOpen = false;
    voyage.cancelled = true;

    // refund only this voyage
    for (const userId in data.users) {
      const user = data.users[userId];

      if (user.bookings && user.bookings[voyageId]) {
        const booking = user.bookings[voyageId];
        refundUser(user, booking.paid);

        delete user.bookings[voyageId];
      }
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    message.channel.send(
`🚫 VOYAGE CANCELLED

Voyage ID
${voyageId}

Reason
${reason}`
    );
  }
};
